import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Collab Meeting API Endpoints', () => {
  const app = createApp();

  const hostToken = `mock_jwt_${Buffer.from(
    JSON.stringify({ id: 'usr_host_1', email: 'host@gittoscale.tech', name: 'Alice Host' })
  ).toString('base64')}`;

  const participantToken = `mock_jwt_${Buffer.from(
    JSON.stringify({ id: 'usr_part_2', email: 'part@gittoscale.tech', name: 'Bob Participant' })
  ).toString('base64')}`;

  const strangerToken = `mock_jwt_${Buffer.from(
    JSON.stringify({ id: 'usr_stranger_3', email: 'stranger@gittoscale.tech', name: 'Charlie Stranger' })
  ).toString('base64')}`;

  let createdMeetingId = '';
  let createdJoinCode = '';

  it('rejects unauthenticated meeting creation with 401', async () => {
    const res = await request(app).post('/api/collab/meetings').send({ title: 'Unauthorized Session' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('allows authenticated host to create a collaborative meeting', async () => {
    const res = await request(app)
      .post('/api/collab/meetings')
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
    expect(res.body.meeting.host_user_id).toBe('usr_host_1');
    expect(res.body.meeting.status).toBe('active');
    expect(res.body.meeting.join_code).toBeDefined();

    createdMeetingId = res.body.meeting.id;
    createdJoinCode = res.body.meeting.join_code;
  });

  it('validates a meeting code successfully', async () => {
    const res = await request(app)
      .post('/api/collab/meetings/validate')
      .send({ joinCode: createdJoinCode });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meetingId).toBe(createdMeetingId);
    expect(res.body.status).toBe('active');
  });

  it('rejects an invalid meeting code with 404', async () => {
    const res = await request(app)
      .post('/api/collab/meetings/validate')
      .send({ joinCode: 'INVALID-999' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('allows an authenticated user to join the meeting', async () => {
    const res = await request(app)
      .post(`/api/collab/meetings/${createdMeetingId}/join`)
      .set('Authorization', `Bearer ${participantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.participant.user_id).toBe('usr_part_2');
    expect(res.body.participant.role).toBe('participant');
    expect(res.body.participants.length).toBeGreaterThanOrEqual(2);
  });

  it('retrieves participants of the meeting', async () => {
    const res = await request(app).get(`/api/collab/meetings/${createdMeetingId}/participants`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.participants.some((p: any) => p.user_id === 'usr_host_1')).toBe(true);
    expect(res.body.participants.some((p: any) => p.user_id === 'usr_part_2')).toBe(true);
  });

  it('allows host to change permission mode to controlled', async () => {
    const res = await request(app)
      .put(`/api/collab/meetings/${createdMeetingId}/permissions`)
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ permissionMode: 'controlled' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meeting.permission_mode).toBe('controlled');
  });

  it('rejects non-host from changing permission mode with 403', async () => {
    const res = await request(app)
      .put(`/api/collab/meetings/${createdMeetingId}/permissions`)
      .set('Authorization', `Bearer ${participantToken}`)
      .send({ permissionMode: 'host_only' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('allows host to toggle edit permissions for individual participant', async () => {
    const res = await request(app)
      .put(`/api/collab/meetings/${createdMeetingId}/participants/usr_part_2/permission`)
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ canEdit: false });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.participant.can_edit).toBe(false);
  });

  it('allows host to end the meeting', async () => {
    const res = await request(app)
      .post(`/api/collab/meetings/${createdMeetingId}/end`)
      .set('Authorization', `Bearer ${hostToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meeting.status).toBe('ended');
  });

  it('rejects joining an ended meeting with 410 Gone', async () => {
    const res = await request(app)
      .post(`/api/collab/meetings/${createdMeetingId}/join`)
      .set('Authorization', `Bearer ${strangerToken}`);

    expect(res.status).toBe(410);
    expect(res.body.success).toBe(false);
  });
});
