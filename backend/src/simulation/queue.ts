import { OverflowPolicy } from './types.js';

export interface QueueSimulationResult {
  initialQueue: number;
  finalQueue: number;
  rejectedRequests: number;
  overflowPolicy: OverflowPolicy;
  isQueueGrowing: boolean;
  excessArrivalRate: number;
}

/**
 * Calculates deterministic queue growth and rejected requests over the simulation duration.
 *
 * Model:
 *  - lambda: arrival rate (offered requests/second)
 *  - mu: effective service rate (effective capacity / second)
 *  - excessRate = max(0, lambda - mu)
 *  - totalExcess = excessRate * durationSeconds
 *  - queueCapacity = maxQueueSize
 *  - finalQueue = min(queueCapacity, initialQueue + totalExcess)
 *  - rejected = max(0, (initialQueue + totalExcess) - queueCapacity)
 */
export function calculateQueueMetrics(
  arrivalRate: number,
  serviceRate: number,
  durationSeconds: number,
  maxQueueSize: number,
  overflowPolicy: OverflowPolicy = 'reject',
  initialQueue: number = 0
): QueueSimulationResult {
  const excessArrivalRate = Math.max(0, arrivalRate - serviceRate);
  const totalExcess = excessArrivalRate * durationSeconds;
  const potentialTotalQueue = initialQueue + totalExcess;

  const finalQueue = Math.min(maxQueueSize, potentialTotalQueue);
  const rejectedRequests = Math.max(0, potentialTotalQueue - maxQueueSize);

  return {
    initialQueue,
    finalQueue,
    rejectedRequests,
    overflowPolicy,
    isQueueGrowing: excessArrivalRate > 0,
    excessArrivalRate,
  };
}
