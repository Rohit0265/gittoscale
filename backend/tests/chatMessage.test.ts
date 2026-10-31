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

  it('seamlessly transfers to Groq in background when Gemini hits 429 rate limit', async () => {
    const originalFetch = global.fetch;

    global.fetch = async (url: any, opts: any) => {
      const urlStr = String(url);
      if (urlStr.includes('generativelanguage.googleapis.com')) {
        return new Response(JSON.stringify({ error: { message: 'RESOURCE_EXHAUSTED: Quota exceeded' } }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (urlStr.includes('api.groq.com')) {
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: 'Groq successfully handled request in background.' } }],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      return originalFetch(url, opts);
    };

    try {
      const res = await request(app)
        .post('/api/chat/message')
        .send({
          message: 'How should I optimize database read queries?',
          llmConfig: {
            provider: 'gemini',
            apiKey: 'mock-gemini-key',
            groqApiKey: 'mock-groq-key',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.reply).toBe('Groq successfully handled request in background.');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('displays "Traffic is more than expected. Please retry later." when both Gemini and Groq fail', async () => {
    const originalFetch = global.fetch;

    global.fetch = async (url: any, opts: any) => {
      const urlStr = String(url);
      if (urlStr.includes('generativelanguage.googleapis.com')) {
        return new Response(JSON.stringify({ error: { message: 'Quota exceeded 429' } }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (urlStr.includes('api.groq.com')) {
        return new Response(JSON.stringify({ error: { message: 'Groq rate limit 429' } }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return originalFetch(url, opts);
    };

    try {
      const res = await request(app)
        .post('/api/chat/message')
        .send({
          message: 'Can you scale the Kafka workers?',
          llmConfig: {
            provider: 'gemini',
            apiKey: 'mock-gemini-key',
            groqApiKey: 'mock-groq-key',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.reply).toBe('Traffic is more than expected. Please retry later.');
    } finally {
      global.fetch = originalFetch;
    }
  });
});

