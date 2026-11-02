import { ArchitectureNode, ArchitectureEdge } from '../types';

/**
 * Builds a decomposed, production-grade Detailed Architecture Graph
 * from high-level basic nodes, expanding gateways into edge CDN + reverse proxies,
 * clusters into domain worker pools, queues into brokers, and DBs into connection poolers & replicas.
 */
export function buildDetailedArchitecture(
  basicNodes: ArchitectureNode[] = [],
  _basicEdges: ArchitectureEdge[] = [],
  prompt: string = ''
): { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } {
  const pLower = (prompt || '').toLowerCase();
  const isEventDriven =
    pLower.includes('stream') ||
    pLower.includes('kafka') ||
    pLower.includes('burst') ||
    pLower.includes('event') ||
    basicNodes.some((n) => n.name.toLowerCase().includes('kafka') || n.name.toLowerCase().includes('queue'));

  // Detect domain services from basicNodes if present
  const domainServices = basicNodes.filter(
    (n) => n.type === 'service' && !n.name.toLowerCase().includes('worker') && !n.name.toLowerCase().includes('auth')
  );

  const mainServiceName = domainServices[0]?.name
    ? `${domainServices[0].name} (Cluster)`
    : 'Core Application Service (Cluster)';

  const detailedNodes: ArchitectureNode[] = [
    // 1. Ingress & Edge
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
    {
      id: 'dt-cdn',
      name: 'Cloudflare Edge CDN / WAF',
      type: 'gateway',
      position: { x: 240, y: 220 },
      capacityPerSecond: 8000,
      workerCount: 4,
      enabled: true,
      config: {
        baselineLatencyMs: 3,
        maxQueueSize: 8000,
        overflowPolicy: 'reject',
      },
    },

    // 2. Gateway Tier
    {
      id: 'dt-gateway',
      name: 'Kong / Nginx Reverse Proxy',
      type: 'gateway',
      position: { x: 460, y: 150 },
      capacityPerSecond: 6000,
      workerCount: 3,
      enabled: true,
      config: {
        baselineLatencyMs: 5,
        maxQueueSize: 6000,
        overflowPolicy: 'reject',
      },
    },
    {
      id: 'dt-auth-filter',
      name: 'OAuth2 / JWT Token Validator',
      type: 'service',
      position: { x: 460, y: 290 },
      capacityPerSecond: 4500,
      workerCount: 2,
      enabled: true,
      config: {
        baselineLatencyMs: 8,
        maxQueueSize: 4000,
        overflowPolicy: 'reject',
      },
    },

    // 3. App Core Cluster & Worker Fleet
    {
      id: 'dt-app-cluster',
      name: mainServiceName,
      type: 'service',
      position: { x: 690, y: 130 },
      capacityPerSecond: 3500,
      workerCount: 4,
      enabled: true,
      config: {
        baselineLatencyMs: 15,
        maxQueueSize: 5000,
        overflowPolicy: 'reject',
      },
    },
    {
      id: 'dt-queue',
      name: isEventDriven ? 'Apache Kafka Event Broker' : 'RabbitMQ Task Queue',
      type: 'service',
      submoduleType: 'queue',
      position: { x: 690, y: 310 },
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
      name: 'Background Async Worker Fleet',
      type: 'service',
      position: { x: 890, y: 310 },
      capacityPerSecond: 2500,
      workerCount: 3,
      enabled: true,
      config: {
        baselineLatencyMs: 25,
        maxQueueSize: 4000,
        overflowPolicy: 'reject',
      },
    },

    // 4. Cache Tier
    {
      id: 'dt-redis-primary',
      name: 'Redis 7 Master (Write Cache)',
      type: 'cache',
      position: { x: 920, y: 70 },
      capacityPerSecond: 9000,
      workerCount: 2,
      enabled: true,
      config: {
        baselineLatencyMs: 2,
        maxQueueSize: 9000,
        overflowPolicy: 'reject',
      },
    },
    {
      id: 'dt-redis-replica',
      name: 'Redis 7 Read Replica (Read-Through)',
      type: 'cache',
      position: { x: 1120, y: 70 },
      capacityPerSecond: 12000,
      workerCount: 3,
      enabled: true,
      config: {
        baselineLatencyMs: 1,
        maxQueueSize: 12000,
        overflowPolicy: 'reject',
      },
    },

    // 5. Database Tier with Connection Pooling & Read Replicas
    {
      id: 'dt-pgbouncer',
      name: 'PgBouncer Connection Pooler',
      type: 'gateway',
      position: { x: 920, y: 190 },
      capacityPerSecond: 4000,
      workerCount: 2,
      enabled: true,
      config: {
        baselineLatencyMs: 3,
        maxQueueSize: 4000,
        overflowPolicy: 'reject',
      },
    },
    {
      id: 'dt-db-primary',
      name: 'PostgreSQL 16 Primary (Read/Write)',
      type: 'database',
      position: { x: 1130, y: 190 },
      capacityPerSecond: 2500,
      workerCount: 2,
      enabled: true,
      config: {
        baselineLatencyMs: 18,
        maxQueueSize: 3000,
        overflowPolicy: 'reject',
      },
    },
    {
      id: 'dt-db-replica',
      name: 'PostgreSQL 16 Read Replica (Read-Only)',
      type: 'database',
      position: { x: 1130, y: 310 },
      capacityPerSecond: 3500,
      workerCount: 2,
      enabled: true,
      config: {
        baselineLatencyMs: 12,
        maxQueueSize: 3500,
        overflowPolicy: 'reject',
      },
    },
  ];

  const detailedEdges: ArchitectureEdge[] = [
    {
      id: 'e-dt-client-cdn',
      source: 'dt-client',
      target: 'dt-cdn',
      requestsPerInput: 1.0,
      enabled: true,
    },
    {
      id: 'e-dt-cdn-gw',
      source: 'dt-cdn',
      target: 'dt-gateway',
      requestsPerInput: 0.95,
      enabled: true,
    },
    {
      id: 'e-dt-gw-auth',
      source: 'dt-gateway',
      target: 'dt-auth-filter',
      requestsPerInput: 0.8,
      enabled: true,
    },
    {
      id: 'e-dt-auth-app',
      source: 'dt-auth-filter',
      target: 'dt-app-cluster',
      requestsPerInput: 0.9,
      enabled: true,
    },
    {
      id: 'e-dt-gw-app',
      source: 'dt-gateway',
      target: 'dt-app-cluster',
      requestsPerInput: 0.2,
      enabled: true,
    },
    {
      id: 'e-dt-app-cache-r',
      source: 'dt-app-cluster',
      target: 'dt-redis-replica',
      requestsPerInput: 0.65,
      enabled: true,
    },
    {
      id: 'e-dt-app-cache-w',
      source: 'dt-app-cluster',
      target: 'dt-redis-primary',
      requestsPerInput: 0.2,
      enabled: true,
    },
    {
      id: 'e-dt-redis-sync',
      source: 'dt-redis-primary',
      target: 'dt-redis-replica',
      requestsPerInput: 0.2,
      enabled: true,
    },
    {
      id: 'e-dt-app-queue',
      source: 'dt-app-cluster',
      target: 'dt-queue',
      requestsPerInput: 0.35,
      enabled: true,
    },
    {
      id: 'e-dt-queue-worker',
      source: 'dt-queue',
      target: 'dt-async-worker',
      requestsPerInput: 1.0,
      enabled: true,
    },
    {
      id: 'e-dt-app-pgbouncer',
      source: 'dt-app-cluster',
      target: 'dt-pgbouncer',
      requestsPerInput: 0.5,
      enabled: true,
    },
    {
      id: 'e-dt-worker-pgbouncer',
      source: 'dt-async-worker',
      target: 'dt-pgbouncer',
      requestsPerInput: 0.4,
      enabled: true,
    },
    {
      id: 'e-dt-pgb-db-pri',
      source: 'dt-pgbouncer',
      target: 'dt-db-primary',
      requestsPerInput: 0.4,
      enabled: true,
    },
    {
      id: 'e-dt-pgb-db-rep',
      source: 'dt-pgbouncer',
      target: 'dt-db-replica',
      requestsPerInput: 0.6,
      enabled: true,
    },
    {
      id: 'e-dt-db-replication',
      source: 'dt-db-primary',
      target: 'dt-db-replica',
      requestsPerInput: 0.4,
      enabled: true,
    },
  ];

  return { nodes: detailedNodes, edges: detailedEdges };
}

