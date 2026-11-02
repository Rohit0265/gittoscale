import { Router, Request, Response } from 'express';
import { getTelemetryStats, clearTelemetryStats, getSlowThresholdMs } from '../middleware/telemetry.js';

const router = Router();

/**
 * GET /api/telemetry/stats
 * Returns overall latency percentiles (p50, p95, p99), error rates, and slowest endpoints
 */
router.get('/stats', (_req: Request, res: Response) => {
  const stats = getTelemetryStats();
  res.json({
    success: true,
    thresholdMs: getSlowThresholdMs(),
    stats,
  });
});

/**
 * GET /api/telemetry/slow-traces
 * Returns historical list of detected slow requests with their child execution spans
 */
router.get('/slow-traces', (req: Request, res: Response) => {
  const stats = getTelemetryStats();
  const limit = Math.min(Number(req.query.limit) || 20, 50);

  res.json({
    success: true,
    thresholdMs: getSlowThresholdMs(),
    totalSlow: stats.slowRequestsCount,
    traces: stats.recentSlowTraces.slice(0, limit),
  });
});

/**
 * DELETE /api/telemetry/slow-traces
 * Clears telemetry slow trace records
 */
router.delete('/slow-traces', (_req: Request, res: Response) => {
  clearTelemetryStats();
  res.json({ success: true, message: 'Telemetry stats and slow traces cleared' });
});

/**
 * POST /api/telemetry/test-slow
 * Test endpoint to simulate a slow request and demonstrate telemetry tracing with child spans
 */
router.post('/test-slow', async (req: Request, res: Response) => {
  const delayMs = Math.max(Number(req.body.delayMs) || 1100, 100);

  const dbSpan = req.startSpan?.('simulated-database-query', { query: 'SELECT * FROM test' });
  await new Promise((r) => setTimeout(r, Math.floor(delayMs / 2)));
  dbSpan?.end({ rowsCount: 50 });

  const computeSpan = req.startSpan?.('simulated-heavy-computation');
  await new Promise((r) => setTimeout(r, Math.floor(delayMs / 2)));
  computeSpan?.end({ status: 'completed' });

  res.json({
    success: true,
    message: `Completed test request with simulated delay of ${delayMs}ms`,
    traceId: req.traceId,
  });
});

export default router;

