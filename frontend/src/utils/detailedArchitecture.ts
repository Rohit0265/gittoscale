import { ArchitectureNode, ArchitectureEdge } from '../types';

/**
 * Builds a decomposed, detailed architecture graph from a basic graph or prompt.
 * Always preserves and respects the user's actual components.
 */
export function buildDetailedArchitecture(
  basicNodes: ArchitectureNode[] = [],
  basicEdges: ArchitectureEdge[] = [],
  prompt: string = ''
): { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } {
  // If basic nodes exist, preserve and respect the user's actual architecture and components!
  // Never wipe out the user's custom design with a generic hardcoded template.
  if (basicNodes && basicNodes.length > 0) {
    return {
      nodes: structuredClone(basicNodes),
      edges: structuredClone(basicEdges || []),
    };
  }

  const pLower = (prompt || '').toLowerCase();
  const isEventDriven =
    pLower.includes('stream') ||
    pLower.includes('kafka') ||
    pLower.includes('burst') ||
    pLower.includes('event');

  const needsCache =
    pLower.includes('cache') ||
    pLower.includes('redis') ||
    pLower.includes('memcached');

  const mainServiceName = 'Core Application Service';

  const detailedNodes: ArchitectureNode[] = [
    // 1. Client Traffic Ingress
    {
      id: 'dt-client',
      name: 'Client Ingress (Web / Mobile)',
      type: 'load_generator',
      position: { x: 40, y: 220 },
      capacityPerSecond: 10000,
      workerCount: 1,
      enabled: true,
      config: {
        baselineLatencyMs: 0,
        maxQueueSize: 10000,
        overflowPolicy: 'reject',
        isSource: true,
        defaultTrafficRate: 2000,
      },
    },
    // 2. Gateway Tier
    {
      id: 'dt-gateway',
      name: 'API Gateway',
      type: 'gateway',
      position: { x: 300, y: 220 },
      capacityPerSecond: 8000,
      workerCount: 4,
      enabled: true,
      config: {
        baselineLatencyMs: 4,
        maxQueueSize: 8000,
        overflowPolicy: 'reject',
      },
    },
    // 3. App Core Service
    {
      id: 'dt-app-cluster',
      name: mainServiceName,
      type: 'service',
      position: { x: 600, y: 220 },
      capacityPerSecond: 4000,
      workerCount: 4,
      enabled: true,
      config: {
        baselineLatencyMs: 14,
        maxQueueSize: 5000,
        overflowPolicy: 'reject',
      },
    },
  ];

  const detailedEdges: ArchitectureEdge[] = [
    {
      id: 'e-dt-client-gw',
      source: 'dt-client',
      target: 'dt-gateway',
      requestsPerInput: 1.0,
      enabled: true,
      label: 'HTTPS API',
    },
    {
      id: 'e-dt-gw-app',
      source: 'dt-gateway',
      target: 'dt-app-cluster',
      requestsPerInput: 1.0,
      enabled: true,
      label: 'Service Calls',
    },
  ];

  // Optional Queue Tier (only if event-driven or requested)
  if (isEventDriven) {
    detailedNodes.push(
      {
        id: 'dt-queue',
        name: 'Event Stream / Queue',
        type: 'service',
        submoduleType: 'queue',
        position: { x: 600, y: 380 },
        capacityPerSecond: 5000,
        workerCount: 2,
        enabled: true,
        config: {
          baselineLatencyMs: 6,
          maxQueueSize: 10000,
          overflowPolicy: 'reject',
        },
      },
      {
        id: 'dt-async-worker',
        name: 'Background Worker Fleet',
        type: 'service',
        position: { x: 860, y: 380 },
        capacityPerSecond: 2500,
        workerCount: 3,
        enabled: true,
        config: {
          baselineLatencyMs: 25,
          maxQueueSize: 4000,
          overflowPolicy: 'reject',
        },
      }
    );

    detailedEdges.push(
      {
        id: 'e-dt-app-queue',
        source: 'dt-app-cluster',
        target: 'dt-queue',
        requestsPerInput: 0.4,
        enabled: true,
        label: 'Async Events',
      },
      {
        id: 'e-dt-queue-worker',
        source: 'dt-queue',
        target: 'dt-async-worker',
        requestsPerInput: 1.0,
        enabled: true,
        label: 'Consume',
      }
    );
  }

  // Optional Cache Tier (only if requested or needed)
  if (needsCache) {
    detailedNodes.push({
      id: 'dt-redis',
      name: 'In-Memory Cache',
      type: 'cache',
      position: { x: 860, y: 120 },
      capacityPerSecond: 9000,
      workerCount: 2,
      enabled: true,
      config: {
        baselineLatencyMs: 2,
        maxQueueSize: 8000,
        overflowPolicy: 'reject',
      },
    });

    detailedEdges.push({
      id: 'e-dt-app-cache',
      source: 'dt-app-cluster',
      target: 'dt-redis',
      requestsPerInput: 0.7,
      enabled: true,
      label: 'Cache Hit/Miss',
    });
  }

  // Database Tier
  detailedNodes.push({
    id: 'dt-db-primary',
    name: 'Primary Database',
    type: 'database',
    position: { x: 860, y: 260 },
    capacityPerSecond: 3000,
    workerCount: 2,
    enabled: true,
    config: {
      baselineLatencyMs: 16,
      maxQueueSize: 3000,
      overflowPolicy: 'reject',
    },
  });

  detailedEdges.push({
    id: 'e-dt-app-db',
    source: 'dt-app-cluster',
    target: 'dt-db-primary',
    requestsPerInput: needsCache ? 0.3 : 1.0,
    enabled: true,
    label: 'DB Operations',
  });

  if (isEventDriven) {
    detailedEdges.push({
      id: 'e-dt-worker-db',
      source: 'dt-async-worker',
      target: 'dt-db-primary',
      requestsPerInput: 0.5,
      enabled: true,
      label: 'Batch Writes',
    });
  }

  return { nodes: detailedNodes, edges: detailedEdges };
}
