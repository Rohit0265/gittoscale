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

  it('transfers full project goal and past conversation history to Groq upon failover', async () => {
    const originalFetch = global.fetch;
    let groqPayload: any = null;

    global.fetch = async (url: any, opts: any) => {
      const urlStr = String(url);
      if (urlStr.includes('generativelanguage.googleapis.com')) {
        return new Response(JSON.stringify({ error: { message: 'RESOURCE_EXHAUSTED' } }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (urlStr.includes('api.groq.com')) {
        groqPayload = JSON.parse(opts.body);
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: 'Groq context validated successfully.' } }],
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
          message: 'What should we do about database connection pooling?',
          history: [
            { sender: 'user', text: 'We are building a real-time ride-sharing dispatch backend' },
            { sender: 'ai', text: 'Understood. We need high-throughput geospatial caching and async queuing.' },
          ],
          architectureContext: {
            projectDescription: 'Real-time Ride-Sharing Platform with 100k GPS pings/sec',
            nodes: [
              { id: 'api-gw', name: 'API Gateway', type: 'gateway' },
              { id: 'redis-cache', name: 'Redis Cache', type: 'cache' },
            ],
            trafficRate: 50000,
          },
          llmConfig: {
            provider: 'gemini',
            apiKey: 'mock-gemini-key',
            groqApiKey: 'mock-groq-key',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(groqPayload).not.toBeNull();
      // Verify system prompt received what they are building
      const systemContent = groqPayload.messages.find((m: any) => m.role === 'system')?.content || '';
      expect(systemContent).toContain('Real-time Ride-Sharing Platform with 100k GPS pings/sec');
      expect(systemContent).toContain('API Gateway');
      expect(systemContent).toContain('Redis Cache');

      // Verify Groq received previous conversation turns
      const userHistoryMsg = groqPayload.messages.find(
        (m: any) => m.role === 'user' && m.content.includes('ride-sharing dispatch')
      );
      expect(userHistoryMsg).toBeDefined();
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

