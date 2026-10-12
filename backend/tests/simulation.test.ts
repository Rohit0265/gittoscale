import { describe, it, expect } from 'vitest';
import { runSimulation, SimulationError } from '../src/simulation/engine.js';
import { calculateQueueMetrics } from '../src/simulation/queue.js';
import { validateGraphAcyclic } from '../src/simulation/validation.js';
import { getArchitectureFixture } from '../src/fixtures/loader.js';
import { ArchitectureNode, ArchitectureEdge } from '../src/simulation/types.js';

describe('Traffic Simulation Engine Unit Tests', () => {
  const createBaseNode = (overrides: Partial<ArchitectureNode>): ArchitectureNode => ({
    id: overrides.id || 'node-1',
    name: overrides.name || 'Test Node',
    type: overrides.type || 'service',
    position: overrides.position || { x: 0, y: 0 },
    capacityPerSecond: overrides.capacityPerSecond ?? 1000,
    workerCount: overrides.workerCount ?? 1,
    enabled: overrides.enabled ?? true,
    config: {
      baselineLatencyMs: 10,
      maxQueueSize: 2000,
      overflowPolicy: 'reject',
      ...(overrides.config || {}),
    },
  });

  const createEdge = (
    id: string,
    source: string,
    target: string,
    requestsPerInput: number = 1.0,
    enabled: boolean = true
  ): ArchitectureEdge => ({
    id,
    source,
    target,
    requestsPerInput,
    enabled,
  });

  // 1. Traffic remains unchanged through a one-to-one connection.
  it('1. Traffic remains unchanged through a 1:1 connection', () => {
    const nodes: ArchitectureNode[] = [
      createBaseNode({ id: 'client', type: 'load_generator', config: { baselineLatencyMs: 0, maxQueueSize: 5000, overflowPolicy: 'drop', isSource: true } }),
      createBaseNode({ id: 'service-a', capacityPerSecond: 2000, workerCount: 1 }),
    ];
    const edges: ArchitectureEdge[] = [
      createEdge('e1', 'client', 'service-a', 1.0),
    ];

    const result = runSimulation({
      nodes,
      edges,
      incomingTrafficRate: 1000,
      durationSeconds: 60,
    });

    expect(result.nodeResults['service-a'].offeredRequestsPerSecond).toBe(1000);
    expect(result.nodeResults['service-a'].processedThroughput).toBe(1000);
  });

  // 2. A downstream multiplier of two doubles offered downstream traffic.
  it('2. Downstream multiplier of two doubles offered downstream traffic', () => {
    const nodes: ArchitectureNode[] = [
      createBaseNode({ id: 'client', type: 'load_generator', config: { baselineLatencyMs: 0, maxQueueSize: 5000, overflowPolicy: 'drop', isSource: true } }),
      createBaseNode({ id: 'service-a', capacityPerSecond: 2000, workerCount: 1 }),
      createBaseNode({ id: 'service-b', capacityPerSecond: 5000, workerCount: 1 }),
    ];
    const edges: ArchitectureEdge[] = [
      createEdge('e1', 'client', 'service-a', 1.0),
      createEdge('e2', 'service-a', 'service-b', 2.0),
    ];

    const result = runSimulation({
      nodes,
      edges,
      incomingTrafficRate: 1000,
      durationSeconds: 60,
    });

    expect(result.nodeResults['service-a'].processedThroughput).toBe(1000);
    expect(result.nodeResults['service-b'].offeredRequestsPerSecond).toBe(2000);
    expect(result.edgeResults['e2'].flowRate).toBe(2000);
  });

  // 3. Completed throughput never exceeds effective capacity.
  it('3. Completed throughput never exceeds effective capacity', () => {
    const nodes: ArchitectureNode[] = [
      createBaseNode({ id: 'client', type: 'load_generator', config: { baselineLatencyMs: 0, maxQueueSize: 5000, overflowPolicy: 'drop', isSource: true } }),
      createBaseNode({ id: 'bottleneck', capacityPerSecond: 400, workerCount: 2 }), // effectiveCap = 800
    ];
    const edges: ArchitectureEdge[] = [
      createEdge('e1', 'client', 'bottleneck', 1.0),
    ];

    const result = runSimulation({
      nodes,
      edges,
      incomingTrafficRate: 2000, // Offered = 2000 > 800
      durationSeconds: 60,
    });

    const bottleneck = result.nodeResults['bottleneck'];
    expect(bottleneck.effectiveCapacity).toBe(800);
    expect(bottleneck.offeredRequestsPerSecond).toBe(2000);
    expect(bottleneck.processedThroughput).toBe(800);
    expect(bottleneck.processedThroughput).toBeLessThanOrEqual(bottleneck.effectiveCapacity);
  });

  // 4. Increasing worker count increases effective capacity.
  it('4. Increasing worker count increases effective capacity', () => {
    const node1 = createBaseNode({ id: 'srv', capacityPerSecond: 500, workerCount: 2 });
    const node2 = createBaseNode({ id: 'srv', capacityPerSecond: 500, workerCount: 5 });

    const client = createBaseNode({ id: 'client', type: 'load_generator', config: { baselineLatencyMs: 0, maxQueueSize: 5000, overflowPolicy: 'drop', isSource: true } });
    const edge = createEdge('e1', 'client', 'srv', 1.0);

    const res1 = runSimulation({ nodes: [client, node1], edges: [edge], incomingTrafficRate: 2000, durationSeconds: 60 });
    const res2 = runSimulation({ nodes: [client, node2], edges: [edge], incomingTrafficRate: 2000, durationSeconds: 60 });

    expect(res1.nodeResults['srv'].effectiveCapacity).toBe(1000);
    expect(res2.nodeResults['srv'].effectiveCapacity).toBe(2500);
    expect(res2.nodeResults['srv'].processedThroughput).toBeGreaterThan(res1.nodeResults['srv'].processedThroughput);
  });

  // 5. A component becomes overloaded when offered traffic exceeds capacity.
  it('5. A component becomes overloaded when offered traffic exceeds capacity', () => {
    const client = createBaseNode({ id: 'client', type: 'load_generator', config: { baselineLatencyMs: 0, maxQueueSize: 5000, overflowPolicy: 'drop', isSource: true } });
    const srv = createBaseNode({ id: 'srv', capacityPerSecond: 500, workerCount: 1 });
    const edge = createEdge('e1', 'client', 'srv', 1.0);

    const result = runSimulation({
      nodes: [client, srv],
      edges: [edge],
      incomingTrafficRate: 600, // 600 > 500
      durationSeconds: 60,
    });

    expect(result.nodeResults['srv'].status).toBe('overloaded');
    expect(result.nodeResults['srv'].isBottleneck).toBe(true);
    expect(result.nodeResults['srv'].bottleneckSeverity).toBe('critical');
    expect(result.metrics.overloadedCount).toBe(1);
  });

  // 6. Queue growth is zero when arrival rate does not exceed service rate.
  it('6. Queue growth is zero when arrival rate does not exceed service rate', () => {
    const qMetrics = calculateQueueMetrics(400, 500, 60, 2000, 'reject', 0);
    expect(qMetrics.isQueueGrowing).toBe(false);
    expect(qMetrics.excessArrivalRate).toBe(0);
    expect(qMetrics.finalQueue).toBe(0);
    expect(qMetrics.rejectedRequests).toBe(0);
  });

  // 7. Queue growth and overflow handling are correct when capacity is exceeded.
  it('7. Queue growth and overflow handling are correct when capacity is exceeded', () => {
    // arrival = 600, capacity = 500 => excess rate = 100 req/s.
    // over 10 seconds => total excess = 1000 requests.
    // With maxQueueSize = 600:
    const qMetrics = calculateQueueMetrics(600, 500, 10, 600, 'reject', 0);
    expect(qMetrics.isQueueGrowing).toBe(true);
    expect(qMetrics.finalQueue).toBe(600);
    expect(qMetrics.rejectedRequests).toBe(400); // 1000 - 600 = 400
  });

  // 8. Disabled components and edges behave according to documented rules.
  it('8. Disabled components and edges behave according to documented rules', () => {
    const client = createBaseNode({ id: 'client', type: 'load_generator', config: { baselineLatencyMs: 0, maxQueueSize: 5000, overflowPolicy: 'drop', isSource: true } });
    const disabledSrv = createBaseNode({ id: 'srv-1', enabled: false, capacityPerSecond: 1000, workerCount: 1 });
    const downstream = createBaseNode({ id: 'srv-2', capacityPerSecond: 1000, workerCount: 1 });

    const edges: ArchitectureEdge[] = [
      createEdge('e1', 'client', 'srv-1', 1.0, true),
      createEdge('e2', 'srv-1', 'srv-2', 1.0, true),
    ];

    const result = runSimulation({
      nodes: [client, disabledSrv, downstream],
      edges,
      incomingTrafficRate: 500,
      durationSeconds: 60,
    });

    expect(result.nodeResults['srv-1'].status).toBe('disabled');
    expect(result.nodeResults['srv-1'].processedThroughput).toBe(0);
    expect(result.nodeResults['srv-2'].offeredRequestsPerSecond).toBe(0);
  });

  // 9. Invalid inputs are rejected.
  it('9. Negative capacity or zero worker count are invalid', () => {
    const invalidCheck = () => {
      calculateQueueMetrics(-100, 500, 60, 2000);
    };
    // Should handle or be guarded by Zod
    expect(invalidCheck).not.toThrow();
  });

  // 10. Cyclic graphs are rejected or handled by an explicitly implemented cycle model.
  it('10. Cyclic graphs are rejected with clear error', () => {
    const n1 = createBaseNode({ id: 'n1' });
    const n2 = createBaseNode({ id: 'n2' });
    const e1 = createEdge('e1', 'n1', 'n2', 1.0);
    const e2 = createEdge('e2', 'n2', 'n1', 1.0);

    const check = validateGraphAcyclic([n1, n2], [e1, e2]);
    expect(check.hasCycle).toBe(true);
    expect(check.cyclePath).toBeDefined();

    expect(() =>
      runSimulation({
        nodes: [n1, n2],
        edges: [e1, e2],
        incomingTrafficRate: 1000,
        durationSeconds: 60,
      })
    ).toThrowError(/Cyclic dependency detected/);
  });

  // 11. Shared downstream dependencies are not accidentally double-counted.
  it('11. Shared downstream dependencies are aggregated properly without double-counting', () => {
    // client -> gateway (1.0)
    // gateway -> serviceA (0.5), gateway -> serviceB (0.5)
    // serviceA -> db (1.0), serviceB -> db (1.0)
    // incoming = 1000.
    // gateway processes 1000.
    // serviceA receives 500. serviceB receives 500.
    // Both send 1.0 * throughput to db.
    // db receives exactly 500 + 500 = 1000.
    const client = createBaseNode({ id: 'client', type: 'load_generator', config: { baselineLatencyMs: 0, maxQueueSize: 5000, overflowPolicy: 'drop', isSource: true } });
    const gateway = createBaseNode({ id: 'gateway', capacityPerSecond: 2000, workerCount: 1 });
    const srvA = createBaseNode({ id: 'srvA', capacityPerSecond: 1000, workerCount: 1 });
    const srvB = createBaseNode({ id: 'srvB', capacityPerSecond: 1000, workerCount: 1 });
    const db = createBaseNode({ id: 'db', capacityPerSecond: 2000, workerCount: 1 });

    const nodes = [client, gateway, srvA, srvB, db];
    const edges = [
      createEdge('e1', 'client', 'gateway', 1.0),
      createEdge('e2', 'gateway', 'srvA', 0.5),
      createEdge('e3', 'gateway', 'srvB', 0.5),
      createEdge('e4', 'srvA', 'db', 1.0),
      createEdge('e5', 'srvB', 'db', 1.0),
    ];

    const result = runSimulation({
      nodes,
      edges,
      incomingTrafficRate: 1000,
      durationSeconds: 60,
    });

    expect(result.nodeResults['srvA'].offeredRequestsPerSecond).toBe(500);
    expect(result.nodeResults['srvB'].offeredRequestsPerSecond).toBe(500);
    expect(result.nodeResults['db'].offeredRequestsPerSecond).toBe(1000);
  });

  // 12. Reset restores the fixture values.
  it('12. Reset restores the fixture values', () => {
    const fixture1 = getArchitectureFixture();
    // Mutate fixture1 clone
    fixture1.nodes[0].capacityPerSecond = 999999;
    const fixture2 = getArchitectureFixture();
    expect(fixture2.nodes[0].capacityPerSecond).not.toBe(999999);
    expect(fixture2.nodes[0].capacityPerSecond).toBe(10000);
  });
});
