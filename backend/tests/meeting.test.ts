import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Meeting API Endpoints (/api/meetings)', () => {
  const app = createApp();

  const hostToken = `mock_jwt_${Buffer.from(
    JSON.stringify({ id: 'usr_host_1', email: 'host@gittoscale.tech', name: 'Alice Host' })
  ).toString('base64')}`;

  const participantToken = `mock_jwt_${Buffer.from(
    JSON.stringify({ id: 'usr_part_2', email: 'part@gittoscale.tech', name: 'Bob Participant' })
  ).toString('base64')}`;

  let createdMeetingId = '';

  it('rejects unauthenticated meeting creation with 401', async () => {
    const res = await request(app).post('/api/meetings').send({ title: 'Unauthorized Session' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('allows authenticated host to create a collaborative meeting', async () => {
    const res = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({
        title: 'Distributed Video Transcoder Architecture',
        initialArchitecture: {
          nodes: [{ id: 'gw-1', name: 'API Gateway', type: 'gateway' }],
          edges: [],
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.meeting).toBeDefined();
    expect(res.body.meeting.title).toBe('Distributed Video Transcoder Architecture');
    expect(res.body.meeting.host_id).toBe('usr_host_1');
    expect(res.body.meeting.status).toBe('active');

    createdMeetingId = res.body.meeting.id;
  });

  it('retrieves meeting details by id', async () => {
    const res = await request(app).get(`/api/meetings/${createdMeetingId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meeting.id).toBe(createdMeetingId);
    expect(res.body.participantCount).toBeGreaterThanOrEqual(1);
  });

  it('allows an authenticated user to join the meeting', async () => {
    const res = await request(app)
      .post(`/api/meetings/${createdMeetingId}/join`)
      .set('Authorization', `Bearer ${participantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.role).toBe('editor');
  });

  it('retrieves participants of the meeting', async () => {
    const res = await request(app).get(`/api/meetings/${createdMeetingId}/participants`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.participants.some((p: any) => p.user_id === 'usr_host_1')).toBe(true);
    expect(res.body.participants.some((p: any) => p.user_id === 'usr_part_2')).toBe(true);
  });

  it('allows host to change participant role to viewer', async () => {
    const res = await request(app)
      .put(`/api/meetings/${createdMeetingId}/participants/usr_part_2/role`)
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ role: 'viewer' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.participant.role).toBe('viewer');
  });

  it('rejects non-host from changing participant roles with 403', async () => {
    const res = await request(app)
      .put(`/api/meetings/${createdMeetingId}/participants/usr_part_2/role`)
      .set('Authorization', `Bearer ${participantToken}`)
      .send({ role: 'editor' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('allows host to lock the architecture canvas', async () => {
    const res = await request(app)
      .put(`/api/meetings/${createdMeetingId}/lock`)
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ isLocked: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meeting.is_locked).toBe(true);
  });

  it('rejects non-host from locking the canvas with 403', async () => {
    const res = await request(app)
      .put(`/api/meetings/${createdMeetingId}/lock`)
      .set('Authorization', `Bearer ${participantToken}`)
      .send({ isLocked: false });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('allows host to end the meeting', async () => {
    const res = await request(app)
      .post(`/api/meetings/${createdMeetingId}/end`)
      .set('Authorization', `Bearer ${hostToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meeting.status).toBe('ended');
  });
});
