import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('AI Chat Message API (/api/chat/message)', () => {
  const app = createApp();

  it('rejects empty messages with 400', async () => {
    const res = await request(app)
      .post('/api/chat/message')
      .send({ message: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('handles random gibberish politely without canned predefined template', async () => {
    const res = await request(app)
      .post('/api/chat/message')
      .send({ message: 'hkuhjkjkh' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reply).toBeDefined();
    // Must NOT contain the old canned robotic phrase
    expect(res.body.reply).not.toContain("I've analyzed your instruction");
    expect(res.body.reply).not.toContain("What change would you like me to execute?");
    expect(res.body.reply.toLowerCase()).toContain("clarify");
  });

  it('provides genuine architectural insights for technical questions', async () => {
    const res = await request(app)
      .post('/api/chat/message')
      .send({
        message: 'What caching strategy should I use for Redis?',
        architectureContext: {
          nodes: [{ id: 'api-gw', name: 'API Gateway', type: 'gateway' }],
          trafficRate: 3500,
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reply).toBeDefined();
    expect(res.body.reply).not.toContain("I've analyzed your instruction");
    expect(res.body.reply.toLowerCase()).toContain("cache");
  });
});

