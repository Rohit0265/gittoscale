import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';

export interface TraceSpan {
  name: string;
  startMs: number;
  endMs?: number;
  durationMs?: number;
  details?: Record<string, any>;
}

export interface SlowRequestTrace {
  traceId: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  timestamp: string;
  ip?: string;
  userAgent?: string;
  query?: Record<string, any>;
  spans: TraceSpan[];
  thresholdMs: number;
}

export interface TelemetryStats {
  totalRequests: number;
  slowRequestsCount: number;
  errorRequestsCount: number;
  avgDurationMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxDurationMs: number;
  recentSlowTraces: SlowRequestTrace[];
  slowestEndpoints: Array<{ endpoint: string; count: number; avgDurationMs: number }>;
}

// Global telemetry state
const MAX_SLOW_TRACES = 100;
const MAX_LATENCY_SAMPLES = 5000;
const latencySamples: number[] = [];
const slowTraces: SlowRequestTrace[] = [];
const endpointStats = new Map<string, { totalMs: number; count: number }>();
let totalRequests = 0;
let errorRequestsCount = 0;

// Configurable slow request threshold (default 1000ms / 1.0s)
export function getSlowThresholdMs(): number {
  const envVal = Number(process.env.SLOW_REQUEST_THRESHOLD_MS);
  return !isNaN(envVal) && envVal > 0 ? envVal : 1000;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      traceId?: string;
      traceStartTime?: bigint;
      traceSpans?: TraceSpan[];
      startSpan?: (name: string, details?: Record<string, any>) => { end: (endDetails?: Record<string, any>) => void };
    }
  }
}

/**
 * Express middleware for request tracing, latency telemetry, and slow request detection
 */
export function telemetryMiddleware(req: Request, res: Response, next: NextFunction) {
  // 1. Generate or forward trace ID
  const incomingTraceId = (req.headers['x-trace-id'] || req.headers['traceparent'] || '') as string;
  const traceId = incomingTraceId || `trace_${crypto.randomUUID()}`;
  req.traceId = traceId;
  res.setHeader('X-Trace-Id', traceId);

  // 2. High-resolution start timer
  const startTime = process.hrtime.bigint();
  req.traceStartTime = startTime;
  req.traceSpans = [];

  // 3. Child span tracing helper
  req.startSpan = (name: string, details?: Record<string, any>) => {
    const spanStart = Number(process.hrtime.bigint() - startTime) / 1e6;
    const span: TraceSpan = {
      name,
      startMs: Math.round(spanStart * 100) / 100,
      details: details || {},
    };
    req.traceSpans!.push(span);

    return {
      end: (endDetails?: Record<string, any>) => {
        const spanEnd = Number(process.hrtime.bigint() - startTime) / 1e6;
        span.endMs = Math.round(spanEnd * 100) / 100;
        span.durationMs = Math.round((spanEnd - spanStart) * 100) / 100;
        if (endDetails) {
          span.details = { ...span.details, ...endDetails };
        }
      },
    };
  };

  // 4. Capture request completion
  res.on('finish', () => {
    const elapsedNs = process.hrtime.bigint() - startTime;
    const durationMs = Math.round(Number(elapsedNs) / 1e4) / 100; // 2 decimal precision

    totalRequests++;
    if (res.statusCode >= 400) {
      errorRequestsCount++;
    }

    // Add Server-Timing header for downstream browser/DevTools inspection
    try {
      if (!res.headersSent) {
        res.setHeader('Server-Timing', `total;dur=${durationMs}`);
      }
    } catch {}

    // Track latency sample
    if (latencySamples.length >= MAX_LATENCY_SAMPLES) {
      latencySamples.shift();
    }
    latencySamples.push(durationMs);

    // Track endpoint averages (grouping parameterized API routes)
    const normalizedPath = req.baseUrl || req.path || req.originalUrl?.split('?')[0] || '/';
    const methodPath = `${req.method} ${normalizedPath}`;
    const curr = endpointStats.get(methodPath) || { totalMs: 0, count: 0 };
    endpointStats.set(methodPath, {
      totalMs: curr.totalMs + durationMs,
      count: curr.count + 1,
    });

    const threshold = getSlowThresholdMs();

    // 5. Detect and trace slow request or unhandled 5xx server error
    if (durationMs >= threshold || res.statusCode >= 500) {
      const traceRecord: SlowRequestTrace = {
        traceId,
        method: req.method,
        path: req.originalUrl || req.url,
        status: res.statusCode,
        durationMs,
        timestamp: new Date().toISOString(),
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        query: Object.keys(req.query || {}).length > 0 ? (req.query as Record<string, any>) : undefined,
        spans: req.traceSpans || [],
        thresholdMs: threshold,
      };

      if (slowTraces.length >= MAX_SLOW_TRACES) {
        slowTraces.shift();
      }
      slowTraces.push(traceRecord);

      const spanBreakdown = traceRecord.spans.length > 0
        ? ` | Spans: ${traceRecord.spans.map((s) => `${s.name}=${s.durationMs ?? 0}ms`).join(', ')}`
        : '';

      console.warn(
        `⚡ [TELEMETRY][SLOW REQUEST] traceId=${traceId} ${req.method} ${req.originalUrl} - ${durationMs}ms (status: ${res.statusCode}, threshold: ${threshold}ms)${spanBreakdown}`
      );
    }
  });

  next();
}

/**
 * Calculates current telemetry statistics & percentiles (p50, p95, p99)
 */
export function getTelemetryStats(): TelemetryStats {
  const sorted = [...latencySamples].sort((a, b) => a - b);
  const count = sorted.length;

  const p50 = count > 0 ? sorted[Math.floor(count * 0.5)] : 0;
  const p95 = count > 0 ? sorted[Math.floor(count * 0.95)] : 0;
  const p99 = count > 0 ? sorted[Math.floor(count * 0.99)] : 0;
  const max = count > 0 ? sorted[count - 1] : 0;
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const avg = count > 0 ? Math.round((sum / count) * 100) / 100 : 0;

  const slowestEndpoints = Array.from(endpointStats.entries())
    .map(([endpoint, data]) => ({
      endpoint,
      count: data.count,
      avgDurationMs: Math.round((data.totalMs / data.count) * 100) / 100,
    }))
    .sort((a, b) => b.avgDurationMs - a.avgDurationMs)
    .slice(0, 10);

  return {
    totalRequests,
    slowRequestsCount: slowTraces.length,
    errorRequestsCount,
    avgDurationMs: avg,
    p50Ms: Math.round(p50 * 100) / 100,
    p95Ms: Math.round(p95 * 100) / 100,
    p99Ms: Math.round(p99 * 100) / 100,
    maxDurationMs: Math.round(max * 100) / 100,
    recentSlowTraces: [...slowTraces].reverse().slice(0, 50),
    slowestEndpoints,
  };
}

/**
 * Clears telemetry state (primarily for test isolation)
 */
export function clearTelemetryStats(): void {
  latencySamples.length = 0;
  slowTraces.length = 0;
  endpointStats.clear();
  totalRequests = 0;
  errorRequestsCount = 0;
}
