import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';
import { createApp } from '../src/app.js';
import {
  inMemSubscriptions,
  inMemUsage,
  activateSubscription,
} from '../src/services/subscriptionService.js';

describe('Polar Payment & Usage Restrictions API', () => {
  const app = createApp();
  const testUserId = 'usr_payment_test_1';
  const testUserToken = `mock_jwt_${Buffer.from(JSON.stringify({ id: testUserId, email: 'paidtest@example.com' })).toString('base64')}`;

  beforeEach(() => {
    inMemSubscriptions.clear();
    inMemUsage.clear();
  });

  it('automatically grants Free plan to users and reports default limits', async () => {
    const res = await request(app)
      .get('/api/payment/status')
      .set('Authorization', `Bearer ${testUserToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.plan).toBe('free');
    expect(res.body.subscriptionStatus).toBe('active');
    expect(res.body.limits.aiGenerations.limit).toBe(3);
    expect(res.body.limits.aiGenerations.used).toBe(0);
    expect(res.body.limits.meetings.limit).toBe(3);
    expect(res.body.limits.meetings.used).toBe(0);
    expect(res.body.limits.manualEditing.unlimited).toBe(true);
  });

  it('enforces 3 AI generation limit on recommendations and returns exact message', async () => {
    // 3 allowed generations
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post('/api/recommend')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          projectDescription: `High scale real-time chat architecture variation ${i}`,
        });
      expect(res.status).toBe(200);
    }

    // 4th request must be rejected with 403 and the required message
    const blockedRes = await request(app)
      .post('/api/recommend')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        projectDescription: 'Another AI request beyond limit',
      });

    expect(blockedRes.status).toBe(403);
    expect(blockedRes.body.error).toBe('PLAN_LIMIT_REACHED');
    expect(blockedRes.body.message).toBe(
      'You have reached your free plan limit. Upgrade your plan to continue using AI-powered architecture generation.'
    );
    expect(blockedRes.body.upgradeUrl).toBe('/payment');
  });

  it('enforces AI limit across AI Architect chat', async () => {
    // Fill up 3 AI calls
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post('/api/recommend')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          projectDescription: `AI design test ${i}`,
        });
      expect(res.status).toBe(200);
    }

    // Now call AI Architect chat message
    const chatRes = await request(app)
      .post('/api/chat/message')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        message: 'How should I partition this database?',
      });

    expect(chatRes.status).toBe(403);
    expect(chatRes.body.error).toBe('PLAN_LIMIT_REACHED');
    expect(chatRes.body.message).toBe(
      'You have reached your free plan limit. Upgrade your plan to continue using AI-powered architecture generation.'
    );
  });

  it('enforces 3 meeting creation limit for free users while allowing joins', async () => {
    let meetingIds: string[] = [];

    // Create 3 meetings
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          title: `Collaborative Design Room ${i + 1}`,
        });
      expect(res.status).toBe(201);
      meetingIds.push(res.body.meeting.id);
    }

    // 4th meeting creation must be rejected
    const blockedRes = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        title: 'Meeting 4 over limit',
      });

    expect(blockedRes.status).toBe(403);
    expect(blockedRes.body.error).toBe('PLAN_LIMIT_REACHED');
    expect(blockedRes.body.upgradeUrl).toBe('/payment');

    // Free users can still join existing meetings!
    const participantToken = `mock_jwt_${Buffer.from(JSON.stringify({ id: 'usr_joiner_1', email: 'joiner@example.com' })).toString('base64')}`;
    const joinRes = await request(app)
      .post(`/api/meetings/${meetingIds[0]}/join`)
      .set('Authorization', `Bearer ${participantToken}`)
      .send({
        userName: 'Joiner User',
      });
    expect(joinRes.status).toBe(200);
    expect(joinRes.body.success).toBe(true);
  });

  it('rejects checkout creation for unauthenticated users with redirect notice', async () => {
    const res = await request(app)
      .post('/api/payment/create-checkout')
      .send({});

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('AUTHENTICATION_REQUIRED');
    expect(res.body.redirect).toContain('/login?redirect=/payment');
  });

  it('creates checkout session for authenticated user', async () => {
    const res = await request(app)
      .post('/api/payment/create-checkout')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.url).toBeDefined();
  });

  it('rejects webhooks with invalid signatures', async () => {
    const res = await request(app)
      .post('/api/payment/webhook')
      .send({
        type: 'subscription.active',
        data: { id: 'sub_123' },
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid webhook signature');
  });

  it('activates Pro subscription upon receiving valid webhook event', async () => {
    const secret = 'test_webhook_secret_key';
    process.env.POLAR_WEBHOOK_SECRET = secret;

    const payload = JSON.stringify({
      type: 'subscription.active',
      data: {
        id: 'sub_polar_999',
        customer_id: 'cust_polar_888',
        metadata: {
          userId: testUserId,
        },
        current_period_end: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      },
    });

    // Generate valid HMAC SHA-256 direct signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(Buffer.from(payload));
    const signature = hmac.digest('hex');

    const res = await request(app)
      .post('/api/payment/webhook')
      .set('x-polar-signature', signature)
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    expect(res.body.processed).toBe(true);

    // Verify user is now Pro and has unlimited AI & meeting access
    const statusRes = await request(app)
      .get('/api/payment/status')
      .set('Authorization', `Bearer ${testUserToken}`);

    expect(statusRes.body.plan).toBe('pro');
    expect(statusRes.body.subscriptionStatus).toBe('active');
    expect(statusRes.body.limits.aiGenerations.limit).toBeNull();
    expect(statusRes.body.limits.meetings.limit).toBeNull();

    // Verify user can now perform AI generation beyond the original limit of 3
    const aiRes = await request(app)
      .post('/api/recommend')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        projectDescription: 'Pro unlimited AI architecture request',
      });
    expect(aiRes.status).toBe(200);
  });
});
