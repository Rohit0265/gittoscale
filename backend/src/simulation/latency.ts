import { LatencyStatus } from './types.js';

export interface LatencyEstimateResult {
  estimatedLatencyMs: number;
  latencyStatus: LatencyStatus;
  baselineLatencyMs: number;
  queueDelayMs: number;
  explanation: string;
}

/**
 * Analytical latency estimation combining baseline processing latency
 * and queuing delay approximation.
 *
 * Model:
 *  - rho = lambda / mu (offered utilization)
 *  - Under normal load (rho < 0.8):
 *      queueDelayMs ≈ (rho / (1 - rho)) * (baselineLatencyMs / 2) [M/M/1-derived approximation]
 *      status: 'ok'
 *  - Under high load (0.8 <= rho <= 1.0):
 *      queueDelay increases sharply as utilization approaches saturation
 *      status: 'degraded'
 *  - Overloaded (rho > 1.0):
 *      arrival exceeds processing capacity; queue accumulates
 *      average queue delay during duration = (avgQueueSize / mu) * 1000 ms
 *      status: 'unbounded' (requests experience severe queueing and eventual rejection)
 */
export function estimateLatency(
  baselineLatencyMs: number,
  arrivalRate: number,
  serviceRate: number,
  averageQueueSize: number,
  isOverloaded: boolean
): LatencyEstimateResult {
  if (serviceRate <= 0) {
    return {
      estimatedLatencyMs: baselineLatencyMs,
      latencyStatus: 'unbounded',
      baselineLatencyMs,
      queueDelayMs: 0,
      explanation: 'Component has 0 effective capacity; requests cannot be serviced.',
    };
  }

  const rho = arrivalRate / serviceRate;

  if (isOverloaded || rho > 1.0) {
    const queueDelayMs = (averageQueueSize / serviceRate) * 1000;
    const estimatedLatencyMs = Math.round(baselineLatencyMs + queueDelayMs);

    return {
      estimatedLatencyMs,
      latencyStatus: 'unbounded',
      baselineLatencyMs,
      queueDelayMs: Math.round(queueDelayMs),
      explanation: `Arrival rate (${Math.round(arrivalRate)} req/s) exceeds capacity (${Math.round(serviceRate)} req/s). Queues are accumulating; requests suffer long wait times or rejection.`,
    };
  }

  if (rho >= 0.8) {
    // Saturated zone
    const clampedRho = Math.min(rho, 0.95);
    const queueDelayMs = (clampedRho / (1 - clampedRho)) * (baselineLatencyMs * 0.3);
    const estimatedLatencyMs = Math.round(baselineLatencyMs + queueDelayMs);

    return {
      estimatedLatencyMs,
      latencyStatus: 'degraded',
      baselineLatencyMs,
      queueDelayMs: Math.round(queueDelayMs),
      explanation: `High utilization (${(rho * 100).toFixed(1)}%). Queuing delays cause degraded response times.`,
    };
  }

  // Normal zone
  const queueDelayMs = rho > 0 ? (rho / (1 - Math.max(0.01, rho))) * (baselineLatencyMs * 0.1) : 0;
  const estimatedLatencyMs = Math.round(baselineLatencyMs + queueDelayMs);

  return {
    estimatedLatencyMs,
    latencyStatus: 'ok',
    baselineLatencyMs,
    queueDelayMs: Math.round(queueDelayMs),
    explanation: `Operating normally with low queuing delay at ${(rho * 100).toFixed(1)}% utilization.`,
  };
}
