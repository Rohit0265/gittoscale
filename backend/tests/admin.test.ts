import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { inMemAdminUsers } from '../src/services/adminService.js';

describe('Admin & Moderation API (/api/admin)', () => {
  const app = createApp();

  const superAdminToken =
    'mock_jwt_' +
    Buffer.from(
      JSON.stringify({
        id: 'usr_superadmin',
        email: 'rohitmathur00981@gmail.com',
        name: 'Super Admin',
      })
    ).toString('base64');

  const regularUserToken =
    'mock_jwt_' +
    Buffer.from(
      JSON.stringify({
        id: 'usr_regular',
        email: 'regular@example.com',
        name: 'Regular User',
      })
    ).toString('base64');

  const targetUser = {
    id: 'usr_violator',
    full_name: 'Bad Actor',
    username: 'badactor',
    email: 'badactor@example.com',
    is_admin: false,
    role: 'user',
    is_suspended: false,
    warning_count: 0,
    warnings: [],
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    // Reset in-memory store before each test
    for (const key of Object.keys(inMemAdminUsers)) {
      delete inMemAdminUsers[key];
    }
    inMemAdminUsers['usr_violator'] = { ...targetUser, warnings: [] };
  });

  it('GET /api/admin/check verifies admin status for configured admin email', async () => {
    const res = await request(app)
      .get('/api/admin/check')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.isAdmin).toBe(true);
  });

  it('GET /api/admin/check returns isAdmin=false for regular users', async () => {
    const res = await request(app)
      .get('/api/admin/check')
      .set('Authorization', `Bearer ${regularUserToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.isAdmin).toBe(false);
  });

  it('blocks regular users from accessing /api/admin/users with 403', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${regularUserToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('FORBIDDEN');
  });

  it('allows superuser to fetch users list and search by username', async () => {
    const res = await request(app)
      .get('/api/admin/users?search=badactor')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.users)).toBe(true);
    expect(res.body.data.users.some((u: any) => u.username === 'badactor')).toBe(true);
  });

  it('enforces 3-warning escalation leading to automatic account suspension', async () => {
    // Warning 1
    const w1 = await request(app)
      .post('/api/admin/users/usr_violator/warn')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ reason: 'NSFW / Adult content warning 1' });

    expect(w1.status).toBe(200);
    expect(w1.body.data.warningCount).toBe(1);
    expect(w1.body.data.isSuspended).toBe(false);

    // Warning 2
    const w2 = await request(app)
      .post('/api/admin/users/usr_violator/warn')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ reason: 'NSFW / Adult content warning 2' });

    expect(w2.status).toBe(200);
    expect(w2.body.data.warningCount).toBe(2);
    expect(w2.body.data.isSuspended).toBe(false);

    // Warning 3 -> Must auto-suspend
    const w3 = await request(app)
      .post('/api/admin/users/usr_violator/warn')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ reason: 'NSFW / Adult content warning 3' });

    expect(w3.status).toBe(200);
    expect(w3.body.data.warningCount).toBe(3);
    expect(w3.body.data.isSuspended).toBe(true);
  });

  it('allows direct suspension and subsequent unsuspension', async () => {
    const suspendRes = await request(app)
      .post('/api/admin/users/usr_violator/suspend')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ reason: 'Immediate ban for adult content distribution' });

    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.success).toBe(true);

    const unsuspendRes = await request(app)
      .post('/api/admin/users/usr_violator/unsuspend')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(unsuspendRes.status).toBe(200);
    expect(unsuspendRes.body.success).toBe(true);
  });

  it('allows resetting warnings count to 0', async () => {
    await request(app)
      .post('/api/admin/users/usr_violator/warn')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ reason: 'Warning 1' });

    const resetRes = await request(app)
      .post('/api/admin/users/usr_violator/reset-warnings')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);
  });

  it('blocks suspended users from publishing new posts with 403', async () => {
    // Create suspended user token
    const suspendedToken =
      'mock_jwt_' +
      Buffer.from(
        JSON.stringify({
          id: 'usr_violator',
          email: 'badactor@example.com',
          name: 'Bad Actor',
        })
      ).toString('base64');

    // Suspend user
    inMemAdminUsers['usr_violator'].is_suspended = true;
    inMemAdminUsers['usr_violator'].suspension_reason = 'Adult content policy violation';

    const postRes = await request(app)
      .post('/api/feed/posts')
      .set('Authorization', `Bearer ${suspendedToken}`)
      .send({ content: 'Attempting to post while suspended' });

    expect(postRes.status).toBe(403);
    expect(postRes.body.error).toBe('ACCOUNT_SUSPENDED');
  });
});
