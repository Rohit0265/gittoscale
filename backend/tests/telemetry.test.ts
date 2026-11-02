import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { clearTelemetryStats } from '../src/middleware/telemetry.js';

describe('Backend Request Telemetry & Slow Request Tracing', () => {
  const app = createApp();

  beforeEach(() => {
    clearTelemetryStats();
  });

  it('injects X-Trace-Id and Server-Timing headers on all requests', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.headers['x-trace-id']).toBeDefined();
    expect(res.headers['x-trace-id']).toMatch(/^trace_/);
    expect(res.headers['server-timing']).toBeDefined();
    expect(res.headers['server-timing']).toMatch(/total;dur=\d+(\.\d+)?/);
  });

  it('respects client-provided x-trace-id for distributed trace correlation', async () => {
    const customTrace = 'trace_client_correlation_999';
    const res = await request(app)
      .get('/api/health')
      .set('X-Trace-Id', customTrace);

    expect(res.status).toBe(200);
    expect(res.headers['x-trace-id']).toBe(customTrace);
  });

  it('tracks request metrics in /api/telemetry/stats', async () => {
    await request(app).get('/api/health');
    await request(app).get('/api/scenarios');

    const res = await request(app).get('/api/telemetry/stats');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stats.totalRequests).toBeGreaterThanOrEqual(2);
    expect(res.body.stats.p50Ms).toBeGreaterThanOrEqual(0);
    expect(res.body.stats.slowestEndpoints.length).toBeGreaterThan(0);
  });

  it('captures slow requests and their child spans in /api/telemetry/slow-traces', async () => {
    // POST /api/telemetry/test-slow simulates a slow request with child spans
    const res = await request(app)
      .post('/api/telemetry/test-slow')
      .send({ delayMs: 1100 }); // Exceeds default 1000ms threshold

    expect(res.status).toBe(200);
    expect(res.body.traceId).toBeDefined();

    // Verify slow trace record
    const tracesRes = await request(app).get('/api/telemetry/slow-traces');
    expect(tracesRes.status).toBe(200);
    expect(tracesRes.body.success).toBe(true);
    expect(tracesRes.body.totalSlow).toBeGreaterThanOrEqual(1);

    const slowTrace = tracesRes.body.traces.find((t: any) => t.traceId === res.body.traceId);
    expect(slowTrace).toBeDefined();
    expect(slowTrace.durationMs).toBeGreaterThanOrEqual(1000);
    expect(slowTrace.method).toBe('POST');
    expect(slowTrace.path).toContain('/api/telemetry/test-slow');

    // Child spans verification
    expect(slowTrace.spans.length).toBe(2);
    expect(slowTrace.spans[0].name).toBe('simulated-database-query');
    expect(slowTrace.spans[0].durationMs).toBeGreaterThan(0);
    expect(slowTrace.spans[1].name).toBe('simulated-heavy-computation');
    expect(slowTrace.spans[1].durationMs).toBeGreaterThan(0);
  });

  it('clears telemetry history when DELETE /api/telemetry/slow-traces is called', async () => {
    await request(app).post('/api/telemetry/test-slow').send({ delayMs: 1100 });
    const beforeRes = await request(app).get('/api/telemetry/slow-traces');
    expect(beforeRes.body.totalSlow).toBeGreaterThan(0);

    const deleteRes = await request(app).delete('/api/telemetry/slow-traces');
    expect(deleteRes.status).toBe(200);

    const afterRes = await request(app).get('/api/telemetry/slow-traces');
    expect(afterRes.body.totalSlow).toBe(0);
    expect(afterRes.body.traces).toHaveLength(0);
  });
});
