import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Backend API Integration Tests', () => {
  const app = createApp();

  it('GET /api/health returns 200 OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.version).toBe('1.0.0');
  });

  it('GET /api/architecture returns default architecture fixture', async () => {
    const res = await request(app).get('/api/architecture');
    expect(res.status).toBe(200);
    expect(res.body.nodes).toBeDefined();
    expect(res.body.edges).toBeDefined();
    expect(Array.isArray(res.body.nodes)).toBe(true);
    expect(res.body.nodes.length).toBeGreaterThan(0);
  });

  it('GET /api/scenarios returns predefined scenarios fixture', async () => {
    const res = await request(app).get('/api/scenarios');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(5);
  });

  it('POST /api/simulate executes simulation successfully', async () => {
    const res = await request(app)
      .post('/api/simulate')
      .send({
        incomingTrafficRate: 1200,
        durationSeconds: 60,
      });

    expect(res.status).toBe(200);
    expect(res.body.metrics).toBeDefined();
    expect(res.body.metrics.totalOfferedTraffic).toBe(1200);
    expect(res.body.nodeResults).toBeDefined();
    expect(res.body.timeSeries).toBeDefined();
  });

  it('POST /api/simulate rejects invalid input with 400', async () => {
    const res = await request(app)
      .post('/api/simulate')
      .send({
        incomingTrafficRate: -500, // Invalid negative rate
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });

  it('POST /api/simulate returns 400 if graph has a cycle', async () => {
    const res = await request(app)
      .post('/api/simulate')
      .send({
        nodes: [
          {
            id: 'a',
            name: 'A',
            type: 'service',
            position: { x: 0, y: 0 },
            capacityPerSecond: 1000,
            workerCount: 1,
            enabled: true,
            config: { baselineLatencyMs: 10, maxQueueSize: 2000, overflowPolicy: 'reject' },
          },
          {
            id: 'b',
            name: 'B',
            type: 'service',
            position: { x: 100, y: 0 },
            capacityPerSecond: 1000,
            workerCount: 1,
            enabled: true,
            config: { baselineLatencyMs: 10, maxQueueSize: 2000, overflowPolicy: 'reject' },
          },
        ],
        edges: [
          { id: 'e1', source: 'a', target: 'b', requestsPerInput: 1, enabled: true },
          { id: 'e2', source: 'b', target: 'a', requestsPerInput: 1, enabled: true },
        ],
        incomingTrafficRate: 1000,
        durationSeconds: 60,
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('CYCLE_DETECTED');
  });
});

