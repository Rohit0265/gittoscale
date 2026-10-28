import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('History API Endpoints', () => {
  const app = createApp();
  const mockToken = `mock_jwt_${Buffer.from(JSON.stringify({ id: 'usr_test_1', email: 'test1@gittoscale.tech' })).toString('base64')}`;
  const otherUserToken = `mock_jwt_${Buffer.from(JSON.stringify({ id: 'usr_test_2', email: 'test2@gittoscale.tech' })).toString('base64')}`;

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/history/architectures');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('allows saving and retrieving architecture history for authenticated user', async () => {
    // 1. Post new architecture
    const createRes = await request(app)
      .post('/api/history/architectures')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({
        title: 'E-commerce microservices',
        prompt: 'Build a high throughput e-commerce microservices platform',
        generationConfig: { scale: '10000 req/s' },
        architectureData: { nodes: [{ id: 'api_gw' }], edges: [] },
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.prompt).toBe('Build a high throughput e-commerce microservices platform');
    const createdId = createRes.body.data.id;

    // 2. Fetch list
    const listRes = await request(app)
      .get('/api/history/architectures')
      .set('Authorization', `Bearer ${mockToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);

    // 3. User isolation: other user cannot see user 1's architecture
    const otherListRes = await request(app)
      .get('/api/history/architectures')
      .set('Authorization', `Bearer ${otherUserToken}`);
    expect(otherListRes.body.data.find((item: any) => item.id === createdId)).toBeUndefined();
  });

  it('allows saving and retrieving repository history for authenticated user', async () => {
    const createRes = await request(app)
      .post('/api/history/repositories')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({
        repositoryUrl: 'https://github.com/facebook/react',
        repositoryName: 'react',
        repositoryOwner: 'facebook',
        scanResult: { language: 'TypeScript' },
        architectureData: { nodes: [], edges: [] },
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.repository_name).toBe('react');

    const listRes = await request(app)
      .get('/api/history/repositories')
      .set('Authorization', `Bearer ${mockToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
  });
});

