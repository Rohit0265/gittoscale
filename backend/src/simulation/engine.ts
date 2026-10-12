import {
  ArchitectureNode,
  ArchitectureEdge,
  SimulationParams,
  SimulationResult,
  NodeSimulationResult,
  EdgeSimulationResult,
  BottleneckSummary,
  MostConstrainedComponent,
  TimeSeriesSample,
} from './types.js';
import { validateGraphAcyclic } from './validation.js';
import { calculateQueueMetrics } from './queue.js';
import { estimateLatency } from './latency.js';

export class SimulationError extends Error {
  constructor(message: string, public code: string = 'SIMULATION_ERROR') {
    super(message);
    this.name = 'SimulationError';
  }
}

/**
 * Executes analytical traffic propagation, queue calculation, latency estimation,
 * and bottleneck identification across the architecture graph.
 */
export function runSimulation(params: SimulationParams): SimulationResult {
  const { nodes, edges, incomingTrafficRate, durationSeconds } = params;

  // 1. Validate DAG (Detect cycles among enabled nodes and edges)
  const cycleCheck = validateGraphAcyclic(nodes, edges);
  if (cycleCheck.hasCycle) {
    throw new SimulationError(
      `Cyclic dependency detected: [${cycleCheck.cyclePath?.join(' -> ')}]. The simulation engine requires a Directed Acyclic Graph (DAG) for deterministic analytical propagation.`,
      'CYCLE_DETECTED'
    );
  }

  const nodeMap = new Map<string, ArchitectureNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // Find incoming and outgoing edges for each node
  const inEdges = new Map<string, ArchitectureEdge[]>();
  const outEdges = new Map<string, ArchitectureEdge[]>();

  for (const node of nodes) {
    inEdges.set(node.id, []);
    outEdges.set(node.id, []);
  }

  for (const edge of edges) {
    if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
      outEdges.get(edge.source)?.push(edge);
      inEdges.get(edge.target)?.push(edge);
    }
  }

  // 2. Compute topological order (Kahn's Algorithm on enabled nodes and edges)
  const inDegree = new Map<string, number>();
  const enabledNodes = nodes.filter(n => n.enabled);
  const enabledNodeIds = new Set(enabledNodes.map(n => n.id));

  for (const node of enabledNodes) {
    const activeInEdges = (inEdges.get(node.id) || []).filter(
      e => e.enabled && enabledNodeIds.has(e.source)
    );
    inDegree.set(node.id, activeInEdges.length);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) {
      queue.push(id);
    }
  }

  const topoOrder: string[] = [];
  while (queue.length > 0) {
    const u = queue.shift()!;
    topoOrder.push(u);

    const activeOutEdges = (outEdges.get(u) || []).filter(
      e => e.enabled && enabledNodeIds.has(e.target)
    );

    for (const edge of activeOutEdges) {
      const v = edge.target;
      const currentDeg = inDegree.get(v) || 0;
      inDegree.set(v, currentDeg - 1);
      if (currentDeg - 1 === 0) {
        queue.push(v);
      }
    }
  }

  // 3. Traffic propagation state
  const nodeResults: Record<string, NodeSimulationResult> = {};
  const edgeResults: Record<string, EdgeSimulationResult> = {};

  // Initialize edge results
  for (const edge of edges) {
    edgeResults[edge.id] = {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      enabled: edge.enabled,
      flowRate: 0,
    };
  }

  // Initialize disabled nodes
  for (const node of nodes) {
    if (!node.enabled) {
      const effectiveCap = node.capacityPerSecond * node.workerCount;
      nodeResults[node.id] = {
        id: node.id,
        name: node.name,
        type: node.type,
        enabled: false,
        offeredRequestsPerSecond: 0,
        effectiveCapacity: effectiveCap,
        processedThroughput: 0,
        offeredUtilization: 0,
        effectiveUtilization: 0,
        status: 'disabled',
        queueLength: 0,
        rejectedRequests: 0,
        overflowPolicy: node.config.overflowPolicy || 'reject',
        estimatedLatencyMs: 0,
        latencyStatus: 'ok',
        isBottleneck: false,
        bottleneckSeverity: 'none',
        bottleneckReason: 'Component is disabled and excluded from traffic routing.',
      };
    }
  }

  // Determine source nodes (e.g. load_generator or isSource)
  const sourceNodeIds = new Set(
    nodes.filter(n => n.enabled && (n.type === 'load_generator' || n.config.isSource)).map(n => n.id)
  );

  // If no explicit source node, treat all inDegree=0 enabled nodes as entry points
  if (sourceNodeIds.size === 0 && topoOrder.length > 0) {
    sourceNodeIds.add(topoOrder[0]);
  }

  // Propagate traffic in topological order
  for (const nodeId of topoOrder) {
    const node = nodeMap.get(nodeId)!;
    let offeredRequestsPerSecond = 0;
    let processedThroughput: number;
    let effectiveCapacity = node.capacityPerSecond * node.workerCount;

    if (sourceNodeIds.has(nodeId)) {
      offeredRequestsPerSecond = incomingTrafficRate;
      effectiveCapacity = Math.max(effectiveCapacity, incomingTrafficRate);
      processedThroughput = offeredRequestsPerSecond;
    } else {
      // Sum incoming traffic from all enabled incoming edges from enabled upstream nodes
      const activeInEdges = (inEdges.get(nodeId) || []).filter(
        e => e.enabled && enabledNodeIds.has(e.source)
      );

      for (const edge of activeInEdges) {
        const upstreamResult = nodeResults[edge.source];
        if (upstreamResult && upstreamResult.enabled) {
          const flow = upstreamResult.processedThroughput * edge.requestsPerInput;
          offeredRequestsPerSecond += flow;
          edgeResults[edge.id].flowRate = Math.round(flow * 100) / 100;
        }
      }

      processedThroughput = Math.min(offeredRequestsPerSecond, effectiveCapacity);
    }

    // Offered utilization vs effective capacity
    const offeredUtilization =
      effectiveCapacity > 0
        ? Math.round((offeredRequestsPerSecond / effectiveCapacity) * 1000) / 10
        : offeredRequestsPerSecond > 0
        ? 999
        : 0;

    const effectiveUtilization =
      effectiveCapacity > 0
        ? Math.round((processedThroughput / effectiveCapacity) * 1000) / 10
        : 0;

    const isOverloaded = offeredRequestsPerSecond > effectiveCapacity;

    // Deterministic Queue Model
    const queueMetrics = calculateQueueMetrics(
      offeredRequestsPerSecond,
      effectiveCapacity,
      durationSeconds,
      node.config.maxQueueSize ?? 2000,
      node.config.overflowPolicy ?? 'reject',
      0
    );

    // Latency estimate
    const avgQueue = (queueMetrics.initialQueue + queueMetrics.finalQueue) / 2;
    const latencyEstimate = estimateLatency(
      node.config.baselineLatencyMs ?? 10,
      offeredRequestsPerSecond,
      effectiveCapacity,
      avgQueue,
      isOverloaded
    );

    // Node Status
    let status: 'normal' | 'warning' | 'overloaded' = 'normal';
    let bottleneckSeverity: 'none' | 'warning' | 'critical' = 'none';
    let bottleneckReason = '';

    if (isOverloaded) {
      status = 'overloaded';
      bottleneckSeverity = 'critical';
      bottleneckReason = `${node.name} is overloaded: offered load (${Math.round(offeredRequestsPerSecond)} req/s) exceeds effective capacity (${Math.round(effectiveCapacity)} req/s = ${node.workerCount} workers × ${node.capacityPerSecond} req/s). Queue reaches ${Math.round(queueMetrics.finalQueue)} items with ${Math.round(queueMetrics.rejectedRequests)} ${queueMetrics.overflowPolicy}ed requests.`;
    } else if (offeredUtilization >= 80) {
      status = 'warning';
      bottleneckSeverity = 'warning';
      bottleneckReason = `${node.name} is approaching capacity at ${offeredUtilization.toFixed(1)}% utilization (${Math.round(offeredRequestsPerSecond)} req/s / ${Math.round(effectiveCapacity)} req/s). Queuing and latency degradation may occur during minor traffic spikes.`;
    }

    nodeResults[node.id] = {
      id: node.id,
      name: node.name,
      type: node.type,
      enabled: true,
      offeredRequestsPerSecond: Math.round(offeredRequestsPerSecond * 100) / 100,
      effectiveCapacity,
      processedThroughput: Math.round(processedThroughput * 100) / 100,
      offeredUtilization,
      effectiveUtilization,
      status,
      queueLength: Math.round(queueMetrics.finalQueue),
      rejectedRequests: Math.round(queueMetrics.rejectedRequests),
      overflowPolicy: queueMetrics.overflowPolicy,
      estimatedLatencyMs: latencyEstimate.estimatedLatencyMs,
      latencyStatus: latencyEstimate.latencyStatus,
      isBottleneck: bottleneckSeverity !== 'none',
      bottleneckSeverity,
      bottleneckReason: bottleneckReason || undefined,
    };

    // Propagate downstream flow rates on outgoing edges
    const activeOutEdges = (outEdges.get(nodeId) || []).filter(
      e => e.enabled && enabledNodeIds.has(e.target)
    );
    for (const edge of activeOutEdges) {
      edgeResults[edge.id].flowRate =
        Math.round(processedThroughput * edge.requestsPerInput * 100) / 100;
    }
  }

  // 4. Bottlenecks summary & Most Constrained Component
  const bottlenecks: BottleneckSummary[] = [];
  let mostConstrained: MostConstrainedComponent | undefined;
  let maxUtilizationFound = -1;

  for (const node of enabledNodes) {
    const res = nodeResults[node.id];
    if (res && res.isBottleneck) {
      bottlenecks.push({
        nodeId: res.id,
        nodeName: res.name,
        nodeType: res.type,
        severity: res.bottleneckSeverity as 'warning' | 'critical',
        offeredLoad: res.offeredRequestsPerSecond,
        effectiveCapacity: res.effectiveCapacity,
        utilization: res.offeredUtilization,
        queueLength: res.queueLength,
        rejectedRequests: res.rejectedRequests,
        reason: res.bottleneckReason || '',
      });
    }

    if (res && res.offeredUtilization > maxUtilizationFound) {
      maxUtilizationFound = res.offeredUtilization;
      mostConstrained = {
        nodeId: res.id,
        nodeName: res.name,
        utilization: res.offeredUtilization,
        reason: res.isBottleneck
          ? (res.bottleneckReason || `${res.name} has the highest utilization (${res.offeredUtilization}%).`)
          : `${res.name} is operating at ${res.offeredUtilization}% utilization.`,
      };
    }
  }

  // Sort bottlenecks: critical first, then highest utilization descending
  bottlenecks.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (a.severity !== 'critical' && b.severity === 'critical') return 1;
    return b.utilization - a.utilization;
  });

  // 5. System-wide metrics
  const overloadedCount = bottlenecks.filter(b => b.severity === 'critical').length;
  const totalDroppedRequests = Object.values(nodeResults).reduce(
    (sum, n) => sum + n.rejectedRequests,
    0
  );
  const totalQueueLength = Object.values(nodeResults).reduce(
    (sum, n) => sum + n.queueLength,
    0
  );

  // Completed Throughput calculation:
  // Find the primary entry point (Gateway or Load Generator's target).
  // If downstream nodes drop traffic, end-to-end throughput is attenuated by the lowest completion ratio.
  let primaryEntryThroughput = incomingTrafficRate;
  const gatewayNode = nodes.find(n => n.type === 'gateway' && n.enabled);
  if (gatewayNode && nodeResults[gatewayNode.id]) {
    primaryEntryThroughput = nodeResults[gatewayNode.id].processedThroughput;
  } else {
    const firstNode = topoOrder[0];
    if (firstNode && nodeResults[firstNode]) {
      primaryEntryThroughput = nodeResults[firstNode].processedThroughput;
    }
  }

  // Calculate worst downstream success ratio across all enabled processing nodes
  let minCompletionRatio = 1.0;
  for (const node of enabledNodes) {
    if (node.type === 'load_generator') continue;
    const res = nodeResults[node.id];
    if (res && res.offeredRequestsPerSecond > 0) {
      const ratio = res.processedThroughput / res.offeredRequestsPerSecond;
      if (ratio < minCompletionRatio) {
        minCompletionRatio = ratio;
      }
    }
  }

  const completedThroughput = Math.round(primaryEntryThroughput * minCompletionRatio * 100) / 100;

  // 6. Deterministic Time Series Generation
  const timeSeries: TimeSeriesSample[] = [];
  const steps = 12; // Sample points across duration
  const dt = durationSeconds / steps;

  for (let i = 0; i <= steps; i++) {
    const t = Math.round(i * dt);
    let sampleQueue = 0;
    let sampleDropped = 0;

    for (const node of enabledNodes) {
      const res = nodeResults[node.id];
      if (res && res.offeredRequestsPerSecond > res.effectiveCapacity) {
        const excessRate = res.offeredRequestsPerSecond - res.effectiveCapacity;
        const potentialQ = excessRate * t;
        const maxQ = node.config.maxQueueSize ?? 2000;
        sampleQueue += Math.min(maxQ, potentialQ);
        sampleDropped += Math.max(0, potentialQ - maxQ);
      }
    }

    timeSeries.push({
      time: t,
      offeredThroughput: incomingTrafficRate,
      completedThroughput,
      totalQueueLength: Math.round(sampleQueue),
      cumulativeDropped: Math.round(sampleDropped),
    });
  }

  return {
    metrics: {
      totalOfferedTraffic: incomingTrafficRate,
      completedThroughput,
      overloadedCount,
      maxUtilization: maxUtilizationFound >= 0 ? maxUtilizationFound : 0,
      totalDroppedRequests,
      totalQueueLength,
    },
    nodeResults,
    edgeResults,
    bottlenecks,
    mostConstrainedComponent: mostConstrained,
    timeSeries,
    durationSeconds,
    assumptions: [
      'Deterministic rate-based analytical propagation with topological graph traversal.',
      'Component capacity modeled as capacityPerSecond multiplied by active workerCount.',
      'Queue growth modeled as max(0, lambda - mu) * durationSeconds bounded by maxQueueSize.',
      'Latency calculated as baseline plus queuing delay approximation.',
      'Synthetic model intended for capacity planning and architectural exploration, not discrete event simulation.',
    ],
  };
}
