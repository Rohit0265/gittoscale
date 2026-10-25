import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Auth API Endpoints (Mock / No DB)', () => {
  const app = createApp();

  it('POST /api/auth/login logs in a user with valid email without DB', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'developer@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('developer@example.com');
  });

  it('POST /api/auth/login rejects invalid email with 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'invalid-email' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/signup creates a mock user registration', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Alex Rivera', email: 'alex@example.com' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.name).toBe('Alex Rivera');
    expect(res.body.user.email).toBe('alex@example.com');
  });

  it('GET /api/auth/me returns current mock session', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
  });
});

