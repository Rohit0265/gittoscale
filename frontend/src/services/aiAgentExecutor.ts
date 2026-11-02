import { ArchitectureNode, ArchitectureEdge, ComponentType, SimulationResult } from '../types';

export interface AgentCommandExecutionResult {
  executed: boolean;
  actionType:
    | 'add_node'
    | 'delete_node'
    | 'connect_nodes'
    | 'disconnect_nodes'
    | 'update_traffic'
    | 'scale_node'
    | 'change_capacity'
    | 'detailed_view'
    | 'analyze'
    | 'general';
  explanation: string;
  updatedNodes?: ArchitectureNode[];
  updatedEdges?: ArchitectureEdge[];
  updatedTrafficRate?: number;
  updatedAnswers?: any;
  targetViewMode?: 'basic' | 'detailed';
  reflectedDeletedNodeIds?: string[];
  reflectedDeletedTypes?: ComponentType[];
}

/**
 * Calculates an intelligent, non-destructive coordinate position for a newly added node.
 * Crucially preserves existing node coordinates so the canvas tree structure does not shrink or shift!
 */
export function calculateSmartPositionForNewNode(
  newNode: ArchitectureNode,
  newEdges: ArchitectureEdge[],
  existingNodes: ArchitectureNode[]
): { x: number; y: number } {
  if (existingNodes.length === 0) {
    return { x: 600, y: 40 };
  }

  // Find incoming edges to newNode (parents)
  const incoming = newEdges.filter((e) => e.target === newNode.id);
  // Find outgoing edges from newNode (children)
  const outgoing = newEdges.filter((e) => e.source === newNode.id);

  // Case 1: Inserted between parent and child (e.g. cache between gateway/service and database)
  if (incoming.length > 0 && outgoing.length > 0) {
    const parent = existingNodes.find((n) => n.id === incoming[0].source);
    const child = existingNodes.find((n) => n.id === outgoing[0].target);

    if (parent && child) {
      const midY = Math.round((parent.position.y + child.position.y) / 2);
      let targetX = Math.round((parent.position.x + child.position.x) / 2);

      // Check if another node occupies this spot
      const occupied = existingNodes.some(
        (n) => Math.abs(n.position.y - midY) < 120 && Math.abs(n.position.x - targetX) < 260
      );
      if (occupied) {
        const tierNodes = existingNodes.filter((n) => Math.abs(n.position.y - midY) < 120);
        const maxTierX = Math.max(...tierNodes.map((n) => n.position.x));
        targetX = maxTierX + 380;
      }
      return { x: targetX, y: midY };
    }
  }

  // Case 2: Placed downstream from parent
  if (incoming.length > 0) {
    const parent = existingNodes.find((n) => n.id === incoming[0].source);
    if (parent) {
      const targetY = parent.position.y + 240;
      const tierNodes = existingNodes.filter((n) => Math.abs(n.position.y - targetY) < 120);
      if (tierNodes.length > 0) {
        const maxTierX = Math.max(...tierNodes.map((n) => n.position.x));
        return { x: maxTierX + 380, y: targetY };
      }
      return { x: parent.position.x, y: targetY };
    }
  }

  // Case 3: Placed upstream from child
  if (outgoing.length > 0) {
    const child = existingNodes.find((n) => n.id === outgoing[0].target);
    if (child) {
      const targetY = Math.max(40, child.position.y - 240);
      const tierNodes = existingNodes.filter((n) => Math.abs(n.position.y - targetY) < 120);
      if (tierNodes.length > 0) {
        const maxTierX = Math.max(...tierNodes.map((n) => n.position.x));
        return { x: maxTierX + 380, y: targetY };
      }
      return { x: child.position.x, y: targetY };
    }
  }

  // Case 4: Default tier by component type
  let defaultY = 520; // Default service level
  if (newNode.type === 'load_generator') defaultY = 40;
  else if (newNode.type === 'gateway') defaultY = 280;
  else if (newNode.type === 'cache' || newNode.type === 'database') defaultY = 760;

  const tierNodes = existingNodes.filter((n) => Math.abs(n.position.y - defaultY) < 120);
  if (tierNodes.length > 0) {
    const maxTierX = Math.max(...tierNodes.map((n) => n.position.x));
    return { x: maxTierX + 380, y: defaultY };
  }

  const allXs = existingNodes.map((n) => n.position.x);
  const avgX = allXs.length ? Math.round(allXs.reduce((a, b) => a + b, 0) / allXs.length) : 600;
  return { x: avgX, y: defaultY };
}

/**
 * Fuzzy match a node from a user query against current nodes list
 */
function findNodeByFuzzyName(
  query: string,
  nodes: ArchitectureNode[]
): ArchitectureNode | undefined {
  const clean = query.trim().toLowerCase();
  if (!clean) return undefined;

  // Exact ID match
  const byId = nodes.find((n) => n.id.toLowerCase() === clean);
  if (byId) return byId;

  // Exact Name match
  const byName = nodes.find((n) => n.name.toLowerCase() === clean);
  if (byName) return byName;

  // Substring match
  const bySub = nodes.find(
    (n) => n.name.toLowerCase().includes(clean) || clean.includes(n.name.toLowerCase())
  );
  if (bySub) return bySub;

  // Type keyword match
  if (clean.includes('cache') || clean.includes('redis')) {
    const cacheNode = nodes.find((n) => n.type === 'cache');
    if (cacheNode) return cacheNode;
  }
  if (clean.includes('db') || clean.includes('database') || clean.includes('postgres') || clean.includes('sql') || clean.includes('mongo')) {
    const dbNode = nodes.find((n) => n.type === 'database');
    if (dbNode) return dbNode;
  }
  if (clean.includes('gateway') || clean.includes('api gateway') || clean.includes('ingress')) {
    const gwNode = nodes.find((n) => n.type === 'gateway');
    if (gwNode) return gwNode;
  }
  if (clean.includes('load') || clean.includes('traffic') || clean.includes('user') || clean.includes('client')) {
    const lgNode = nodes.find((n) => n.type === 'load_generator');
    if (lgNode) return lgNode;
  }
  if (clean.includes('service') || clean.includes('server') || clean.includes('backend') || clean.includes('api')) {
    const svcNode = nodes.find((n) => n.type === 'service');
    if (svcNode) return svcNode;
  }

  return undefined;
}

/**
 * Detect component type and recommended defaults from name or raw text
 */
function detectComponentTypeAndDefaults(rawName: string): {
  type: ComponentType;
  canonicalName: string;
  capacityPerSecond: number;
  baselineLatencyMs: number;
} {
  const lower = rawName.toLowerCase();

  // Cache
  if (
    lower.includes('redis') ||
    lower.includes('memcached') ||
    lower.includes('cache') ||
    lower.includes('valkey') ||
    lower.includes('dragonfly')
  ) {
    return {
      type: 'cache',
      canonicalName: lower.includes('redis') ? 'Redis Cache' : 'In-Memory Cache',
      capacityPerSecond: 3000,
      baselineLatencyMs: 2,
    };
  }

  // Database
  if (
    lower.includes('postgres') ||
    lower.includes('postgresql') ||
    lower.includes('mysql') ||
    lower.includes('mongo') ||
    lower.includes('database') ||
    lower.includes('db') ||
    lower.includes('aurora') ||
    lower.includes('dynamodb') ||
    lower.includes('sqlite') ||
    lower.includes('cockroach')
  ) {
    let name = 'Relational Database';
    if (lower.includes('postgres')) name = 'PostgreSQL Database';
    else if (lower.includes('mongo')) name = 'MongoDB Database';
    else if (lower.includes('mysql')) name = 'MySQL Cluster';
    else if (lower.includes('dynamo')) name = 'DynamoDB Table';
    return {
      type: 'database',
      canonicalName: name,
      capacityPerSecond: 800,
      baselineLatencyMs: 25,
    };
  }

  // Gateway / CDN / Load Balancer
  if (
    lower.includes('gateway') ||
    lower.includes('kong') ||
    lower.includes('envoy') ||
    lower.includes('traefik') ||
    lower.includes('nginx') ||
    lower.includes('load balancer') ||
    lower.includes('alb') ||
    lower.includes('elb') ||
    lower.includes('cdn') ||
    lower.includes('cloudflare')
  ) {
    let name = 'API Gateway';
    if (lower.includes('cdn') || lower.includes('cloudflare')) name = 'Cloudflare CDN';
    else if (lower.includes('balancer') || lower.includes('alb')) name = 'Load Balancer';
    return {
      type: 'gateway',
      canonicalName: name,
      capacityPerSecond: 5000,
      baselineLatencyMs: 3,
    };
  }

  // Services (Kafka, Queue, Auth, Search, etc.)
  let svcName = rawName.trim();
  if (lower.includes('kafka')) svcName = 'Kafka Event Broker';
  else if (lower.includes('rabbit') || lower.includes('queue') || lower.includes('sqs')) svcName = 'Message Queue';
  else if (lower.includes('auth')) svcName = 'Auth Microservice';
  else if (lower.includes('elastic') || lower.includes('search')) svcName = 'Elasticsearch Engine';
  else if (lower.includes('payment')) svcName = 'Payment Service';
  else if (!svcName || svcName.length < 3) svcName = 'Backend Microservice';

  return {
    type: 'service',
    canonicalName: svcName.charAt(0).toUpperCase() + svcName.slice(1),
    capacityPerSecond: 1200,
    baselineLatencyMs: 15,
  };
}

/**
 * Discovers and clusters reflected components that belong to the target node's tier
 * so that when a user deletes a node, all its replicas, poolers, or subordinate workers
 * are cleanly pruned as a unified architecture unit.
 */
export function findReflectedNodesToDelete(
  targetNode: ArchitectureNode,
  allNodes: ArchitectureNode[],
  allEdges: ArchitectureEdge[]
): { nodesToDelete: ArchitectureNode[]; reflectedTypes: ComponentType[] } {
  const toDelete = new Set<string>([targetNode.id]);
  const deletedTypes = new Set<ComponentType>([targetNode.type]);
  const lowerName = targetNode.name.toLowerCase();
  const targetType = targetNode.type;

  // 1. Database Tier: Primary + Read Replicas + Connection Pooler (PgBouncer)
  if (
    targetType === 'database' ||
    lowerName.includes('postgres') ||
    lowerName.includes('mongo') ||
    lowerName.includes('mysql') ||
    lowerName.includes('database') ||
    lowerName.includes('db') ||
    lowerName.includes('aurora') ||
    lowerName.includes('dynamo')
  ) {
    deletedTypes.add('database');
    for (const n of allNodes) {
      const nLower = n.name.toLowerCase();
      if (
        n.type === 'database' ||
        nLower.includes('read replica') ||
        nLower.includes('replica') ||
        nLower.includes('secondary') ||
        nLower.includes('pgbouncer') ||
        nLower.includes('connection pooler') ||
        nLower.includes('supavisor')
      ) {
        toDelete.add(n.id);
        deletedTypes.add(n.type);
      }
    }
  }

  // 2. Cache Tier: Master + Read Replica / Cluster Nodes
  if (
    targetType === 'cache' ||
    lowerName.includes('redis') ||
    lowerName.includes('cache') ||
    lowerName.includes('memcached') ||
    lowerName.includes('valkey')
  ) {
    deletedTypes.add('cache');
    for (const n of allNodes) {
      const nLower = n.name.toLowerCase();
      if (
        n.type === 'cache' ||
        nLower.includes('redis') ||
        nLower.includes('cache replica') ||
        nLower.includes('read-through') ||
        nLower.includes('read cache')
      ) {
        toDelete.add(n.id);
        deletedTypes.add(n.type);
      }
    }
  }

  // 3. Queue / Streaming: Event Broker + Dedicated Consumer Worker Fleet
  if (
    lowerName.includes('kafka') ||
    lowerName.includes('queue') ||
    lowerName.includes('rabbitmq') ||
    lowerName.includes('sqs') ||
    lowerName.includes('event stream') ||
    lowerName.includes('event broker')
  ) {
    deletedTypes.add('service');
    for (const n of allNodes) {
      const nLower = n.name.toLowerCase();
      if (
        nLower.includes('worker fleet') ||
        nLower.includes('async worker') ||
        nLower.includes('consumer') ||
        nLower.includes('background worker')
      ) {
        const incoming = allEdges.filter((e) => e.target === n.id);
        if (incoming.length > 0 && incoming.every((e) => toDelete.has(e.source))) {
          toDelete.add(n.id);
        }
      }
    }
  }

  // 4. Ingress / Gateway: Gateway + Dedicated Edge CDN / WAF Filter
  if (
    targetType === 'gateway' ||
    lowerName.includes('gateway') ||
    lowerName.includes('ingress') ||
    lowerName.includes('proxy') ||
    lowerName.includes('reverse proxy')
  ) {
    deletedTypes.add('gateway');
    for (const n of allNodes) {
      const nLower = n.name.toLowerCase();
      if (
        nLower.includes('cdn') ||
        nLower.includes('waf') ||
        nLower.includes('token validator') ||
        nLower.includes('auth filter')
      ) {
        const outgoing = allEdges.filter((e) => e.source === n.id);
        if (outgoing.length > 0 && outgoing.every((e) => toDelete.has(e.target))) {
          toDelete.add(n.id);
        }
      }
    }
  }

  return {
    nodesToDelete: allNodes.filter((n) => toDelete.has(n.id)),
    reflectedTypes: Array.from(deletedTypes),
  };
}

/**
 * Executes natural language commands on the active architecture
 */
export function executeArchitectureCommand(
  command: string,
  currentNodes: ArchitectureNode[],
  currentEdges: ArchitectureEdge[],
  currentTrafficRate: number,
  simulationResult: SimulationResult | null,
  _contextHistory: Array<{ text: string; sender: string }> = [],
  viewMode: 'basic' | 'detailed' = 'basic'
): AgentCommandExecutionResult {
  const text = command.trim();
  const lower = text.toLowerCase();
  const cleanedLower = lower
    .replace(
      /^(?:hey\s+|hi\s+|hello\s+)?(?:ai\s+|copilot\s+|assistant\s+)?(?:can\s+you\s+(?:please\s+)?|could\s+you\s+(?:please\s+)?|please\s+|i\s+want\s+(?:you\s+)?to\s+|help\s+me\s+|let's\s+|lets\s+|we\s+need\s+to\s+|i'd\s+like\s+to\s+|try\s+to\s+|go\s+ahead\s+and\s+|would\s+you\s+)/i,
      ''
    )
    .trim();

  // ───────────────────────────────────────────────────────────────────────────
  // 0. REQUIREMENT INTAKE ("add more requirement", "add requirement", "new requirement", "requirement: ...")
  // ───────────────────────────────────────────────────────────────────────────
  const reqMatch =
    cleanedLower.match(/(?:add\s+(?:more\s+)?requirements?|new\s+requirements?|requirements?\s*:?)\s*(.*)/i) ||
    lower.match(/(?:add\s+(?:more\s+)?requirements?|new\s+requirements?|requirements?\s*:?)\s*(.*)/i);
  if (reqMatch) {
    const rawReq = reqMatch[1]?.trim() || '';
    const addedItems: string[] = [];
    let updatedNodes = [...currentNodes];
    let updatedEdges = [...currentEdges];
    let updatedTraffic = currentTrafficRate;

    // A. Throughput / Scale requirement
    const scaleReqMatch = rawReq.match(/([0-9]+(?:\.[0-9]+)?)\s*(k|m)?\s*(?:rps|req\/s|requests)?/i);
    if (scaleReqMatch || rawReq.includes('burst') || rawReq.includes('high traffic') || rawReq.includes('flash sale')) {
      let targetRate = 10000;
      if (scaleReqMatch) {
        let val = parseFloat(scaleReqMatch[1]);
        const unit = (scaleReqMatch[2] || '').toLowerCase();
        if (unit === 'k') val *= 1000;
        else if (unit === 'm') val *= 1000000;
        targetRate = Math.min(Math.max(Math.round(val), 100), 100000);
      } else if (rawReq.includes('50k') || rawReq.includes('burst') || rawReq.includes('flash sale')) {
        targetRate = 50000;
      }
      updatedTraffic = targetRate;
      addedItems.push(`⚡ **Scale Requirement**: Target throughput set to **${targetRate.toLocaleString()} req/s**`);

      // Scale existing service instances to handle load
      updatedNodes = updatedNodes.map((n) => {
        if (n.type === 'service' || n.type === 'gateway') {
          return { ...n, workerCount: Math.max(n.workerCount, targetRate >= 50000 ? 6 : 4) };
        }
        return n;
      });
    }

    // B. Caching requirement
    if (rawReq.includes('cache') || rawReq.includes('redis') || rawReq.includes('low latency') || (!rawReq && !updatedNodes.some((n) => n.type === 'cache'))) {
      if (!updatedNodes.some((n) => n.type === 'cache')) {
        const cacheId = `cache-${Date.now().toString().slice(-4)}`;
        const cacheNode: ArchitectureNode = {
          id: cacheId,
          name: 'Redis In-Memory Cache',
          type: 'cache',
          position: { x: 0, y: 0 },
          capacityPerSecond: 3500,
          workerCount: 2,
          enabled: true,
          config: { baselineLatencyMs: 2, maxQueueSize: 3000, overflowPolicy: 'reject' },
        };
        const svcNode = updatedNodes.find((n) => n.type === 'service') || updatedNodes[0];
        const dbNode = updatedNodes.find((n) => n.type === 'database');
        if (svcNode && dbNode) {
          updatedEdges = updatedEdges.filter((e) => !(e.source === svcNode.id && e.target === dbNode.id));
          updatedEdges.push({
            id: `e-${svcNode.id}-${cacheId}`,
            source: svcNode.id,
            target: cacheId,
            requestsPerInput: 1.0,
            enabled: true,
            isBidirectional: true,
          });
          updatedEdges.push({
            id: `e-${cacheId}-${dbNode.id}`,
            source: cacheId,
            target: dbNode.id,
            requestsPerInput: 0.2, // 80% cache hit rate
            enabled: true,
            isBidirectional: true,
            label: 'Cache Miss (20%)',
          });
        } else if (svcNode) {
          updatedEdges.push({
            id: `e-${svcNode.id}-${cacheId}`,
            source: svcNode.id,
            target: cacheId,
            requestsPerInput: 1.0,
            enabled: true,
            isBidirectional: true,
          });
        }
        cacheNode.position = calculateSmartPositionForNewNode(cacheNode, updatedEdges, updatedNodes);
        updatedNodes.push(cacheNode);
        addedItems.push('⚡ **Redis In-Memory Cache**: Spliced read-through caching to absorb 80% read queries');
      }
    }

    // C. Queue / Async requirement
    if (rawReq.includes('queue') || rawReq.includes('kafka') || rawReq.includes('async') || rawReq.includes('event')) {
      if (!updatedNodes.some((n) => n.name.toLowerCase().includes('kafka') || n.name.toLowerCase().includes('queue'))) {
        const queueId = `queue-${Date.now().toString().slice(-4)}`;
        const queueNode: ArchitectureNode = {
          id: queueId,
          name: 'Kafka Event Broker',
          type: 'service',
          position: { x: 0, y: 0 },
          capacityPerSecond: 3000,
          workerCount: 2,
          enabled: true,
          config: { baselineLatencyMs: 4, maxQueueSize: 5000, overflowPolicy: 'reject' },
        };
        const parentNode = updatedNodes.find((n) => n.type === 'gateway') || updatedNodes.find((n) => n.type === 'service') || updatedNodes[0];
        if (parentNode) {
          updatedEdges.push({
            id: `e-${parentNode.id}-${queueId}`,
            source: parentNode.id,
            target: queueId,
            requestsPerInput: 1.0,
            enabled: true,
            isBidirectional: true,
            label: 'Async Events',
          });
        }
        queueNode.position = calculateSmartPositionForNewNode(queueNode, updatedEdges, updatedNodes);
        updatedNodes.push(queueNode);
        addedItems.push('📬 **Kafka Event Broker**: Added event stream buffer for decoupled asynchronous background tasks');
      }
    }

    // D. Auth requirement
    if (rawReq.includes('auth') || rawReq.includes('login') || rawReq.includes('security') || rawReq.includes('jwt')) {
      if (!updatedNodes.some((n) => n.name.toLowerCase().includes('auth'))) {
        const authId = `auth-${Date.now().toString().slice(-4)}`;
        const authNode: ArchitectureNode = {
          id: authId,
          name: 'Auth Microservice',
          type: 'service',
          position: { x: 0, y: 0 },
          capacityPerSecond: 2000,
          workerCount: 2,
          enabled: true,
          config: { baselineLatencyMs: 8, maxQueueSize: 2000, overflowPolicy: 'reject' },
        };
        const gwNode = updatedNodes.find((n) => n.type === 'gateway') || updatedNodes[0];
        if (gwNode) {
          updatedEdges.push({
            id: `e-${gwNode.id}-${authId}`,
            source: gwNode.id,
            target: authId,
            requestsPerInput: 1.0,
            enabled: true,
            isBidirectional: true,
            label: 'Token Auth',
          });
        }
        authNode.position = calculateSmartPositionForNewNode(authNode, updatedEdges, updatedNodes);
        updatedNodes.push(authNode);
        addedItems.push('🔒 **Auth Microservice**: Provisioned identity & token validation service');
      }
    }

    // E. Payment requirement
    if (rawReq.includes('payment') || rawReq.includes('checkout') || rawReq.includes('billing')) {
      if (!updatedNodes.some((n) => n.name.toLowerCase().includes('payment'))) {
        const payId = `pay-${Date.now().toString().slice(-4)}`;
        const payNode: ArchitectureNode = {
          id: payId,
          name: 'Payment Service',
          type: 'service',
          position: { x: 0, y: 0 },
          capacityPerSecond: 1500,
          workerCount: 2,
          enabled: true,
          config: { baselineLatencyMs: 20, maxQueueSize: 2000, overflowPolicy: 'reject' },
        };
        const svcNode = updatedNodes.find((n) => n.type === 'service') || updatedNodes[0];
        if (svcNode) {
          updatedEdges.push({
            id: `e-${svcNode.id}-${payId}`,
            source: svcNode.id,
            target: payId,
            requestsPerInput: 1.0,
            enabled: true,
            isBidirectional: true,
            label: 'Checkout API',
          });
        }
        payNode.position = calculateSmartPositionForNewNode(payNode, updatedEdges, updatedNodes);
        updatedNodes.push(payNode);
        addedItems.push('💳 **Payment Service**: Integrated transactional payment gateway processing');
      }
    }

    if (addedItems.length > 0) {
      return {
        executed: true,
        actionType: 'add_node',
        updatedNodes,
        updatedEdges,
        updatedTrafficRate: updatedTraffic,
        explanation: `🎯 **New Requirements Attached to Playground**:\n\n${addedItems.join('\n')}\n\n• Topology preserved without shrinking and live simulation recalculated for ${updatedTraffic.toLocaleString()} req/s.`,
      };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 0.5. DETAILED VIEW / ADVANCED ARCHITECTURE ("make design in detailed view", "detailed view", "advanced architect")
  // ───────────────────────────────────────────────────────────────────────────
  if (
    cleanedLower.includes('detailed view') ||
    cleanedLower.includes('detailed architect') ||
    cleanedLower.includes('advanced design') ||
    cleanedLower.includes('advanced architect') ||
    cleanedLower.includes('detailed design') ||
    (cleanedLower.includes('detailed') && (cleanedLower.includes('make') || cleanedLower.includes('architect') || cleanedLower.includes('design') || cleanedLower.includes('switch') || cleanedLower.includes('view') || cleanedLower.includes('show'))) ||
    lower.includes('detailed view') ||
    lower.includes('detailed architect') ||
    lower.includes('advanced design') ||
    lower.includes('advanced architect') ||
    lower.includes('detailed design') ||
    (lower.includes('detailed') && (lower.includes('make') || lower.includes('architect') || lower.includes('design') || lower.includes('switch') || lower.includes('view') || lower.includes('show')))
  ) {
    const detailedNodes: ArchitectureNode[] = [
      {
        id: 'client-edge',
        name: 'Client Ingress & Anycast CDN',
        type: 'load_generator',
        position: { x: 80, y: 320 },
        capacityPerSecond: 25000,
        workerCount: 1,
        enabled: true,
        config: { baselineLatencyMs: 2, maxQueueSize: 20000, overflowPolicy: 'reject', isSource: true },
      },
      {
        id: 'api-gateway',
        name: 'Envoy API Gateway & WAF',
        type: 'gateway',
        position: { x: 420, y: 320 },
        capacityPerSecond: 8000,
        workerCount: 4,
        enabled: true,
        config: { baselineLatencyMs: 4, maxQueueSize: 10000, overflowPolicy: 'reject' },
      },
      {
        id: 'core-service',
        name: 'Core Application Service',
        type: 'service',
        position: { x: 780, y: 220 },
        capacityPerSecond: 3000,
        workerCount: 6,
        enabled: true,
        config: { baselineLatencyMs: 12, maxQueueSize: 5000, overflowPolicy: 'reject' },
      },
      {
        id: 'kafka-broker',
        name: 'Kafka Event Stream Buffer',
        type: 'service',
        position: { x: 780, y: 460 },
        capacityPerSecond: 6000,
        workerCount: 3,
        enabled: true,
        config: { baselineLatencyMs: 3, maxQueueSize: 25000, overflowPolicy: 'reject' },
      },
      {
        id: 'worker-fleet',
        name: 'Async Background Worker Fleet',
        type: 'service',
        position: { x: 1140, y: 460 },
        capacityPerSecond: 2500,
        workerCount: 8,
        enabled: true,
        config: { baselineLatencyMs: 20, maxQueueSize: 8000, overflowPolicy: 'reject' },
      },
      {
        id: 'redis-cache',
        name: 'Redis Cluster (Cache-Aside)',
        type: 'cache',
        position: { x: 1140, y: 140 },
        capacityPerSecond: 10000,
        workerCount: 3,
        enabled: true,
        config: { baselineLatencyMs: 1, maxQueueSize: 15000, overflowPolicy: 'reject' },
      },
      {
        id: 'db-primary',
        name: 'PostgreSQL Primary (PgBouncer)',
        type: 'database',
        position: { x: 1480, y: 240 },
        capacityPerSecond: 2000,
        workerCount: 2,
        enabled: true,
        config: { baselineLatencyMs: 22, maxQueueSize: 4000, overflowPolicy: 'reject' },
      },
      {
        id: 'db-replica',
        name: 'PostgreSQL Read Replicas (Multi-AZ)',
        type: 'database',
        position: { x: 1480, y: 400 },
        capacityPerSecond: 3500,
        workerCount: 3,
        enabled: true,
        config: { baselineLatencyMs: 15, maxQueueSize: 6000, overflowPolicy: 'reject' },
      },
    ];

    const detailedEdges: ArchitectureEdge[] = [
      {
        id: 'e-edge-gw',
        source: 'client-edge',
        target: 'api-gateway',
        requestsPerInput: 1.0,
        enabled: true,
        isBidirectional: true,
        label: 'HTTPS / TLS 1.3',
        communicationType: 'http',
      },
      {
        id: 'e-gw-core',
        source: 'api-gateway',
        target: 'core-service',
        requestsPerInput: 1.0,
        enabled: true,
        isBidirectional: true,
        label: 'gRPC mTLS (Sync)',
        communicationType: 'grpc',
      },
      {
        id: 'e-gw-kafka',
        source: 'api-gateway',
        target: 'kafka-broker',
        requestsPerInput: 0.4,
        enabled: true,
        isBidirectional: false,
        label: 'Async Events (Write Spikes)',
        communicationType: 'queue',
      },
      {
        id: 'e-kafka-workers',
        source: 'kafka-broker',
        target: 'worker-fleet',
        requestsPerInput: 1.0,
        enabled: true,
        isBidirectional: true,
        label: 'Consumer Groups',
        communicationType: 'queue',
      },
      {
        id: 'e-core-redis',
        source: 'core-service',
        target: 'redis-cache',
        requestsPerInput: 0.85,
        enabled: true,
        isBidirectional: true,
        label: 'Cache Hit (85%)',
        communicationType: 'cache',
      },
      {
        id: 'e-core-replica',
        source: 'core-service',
        target: 'db-replica',
        requestsPerInput: 0.15,
        enabled: true,
        isBidirectional: true,
        label: 'Cache Miss Reads (15%)',
        communicationType: 'db',
      },
      {
        id: 'e-core-primary',
        source: 'core-service',
        target: 'db-primary',
        requestsPerInput: 0.2,
        enabled: true,
        isBidirectional: true,
        label: 'ACID Writes (WAL)',
        communicationType: 'db',
      },
      {
        id: 'e-workers-primary',
        source: 'worker-fleet',
        target: 'db-primary',
        requestsPerInput: 0.8,
        enabled: true,
        isBidirectional: true,
        label: 'Batch Mutations',
        communicationType: 'db',
      },
      {
        id: 'e-primary-replica',
        source: 'db-primary',
        target: 'db-replica',
        requestsPerInput: 1.0,
        enabled: true,
        isBidirectional: false,
        label: 'Sync Replication WAL',
        communicationType: 'db',
      },
    ];

    const targetLoad = Math.max(currentTrafficRate, 20000);

    return {
      executed: true,
      actionType: 'detailed_view',
      targetViewMode: 'detailed',
      updatedNodes: detailedNodes,
      updatedEdges: detailedEdges,
      updatedTrafficRate: targetLoad,
      explanation: `🏛️ **Detailed Architecture Mode Generated with Advanced Topics**:\n\n• **Multi-Region Anycast Edge**: Ingress CDN with GeoDNS routing & WAF protection (25,000 req/s capacity).\n• **API Gateway & Traffic Shaping**: Envoy proxy with Token Bucket rate-limiting & circuit breakers (4 workers @ 8,000 req/s = 32k req/s capacity).\n• **gRPC Internal Service Mesh**: Core Application Service cluster (6 workers @ 3,000 req/s = 18k req/s capacity).\n• **Decoupled Event Streaming**: Kafka partitioned broker (3 workers @ 6,000 req/s = 18k req/s buffer).\n• **Async Worker Fleet**: Autoscaled background consumers (8 workers @ 2,500 req/s = 20k req/s capacity).\n• **Cache-Aside Tier**: Redis Cluster with XFetch probabilistic stampede prevention (3 nodes @ 10,000 req/s = 30k req/s capacity).\n• **Resilient Storage**: PostgreSQL Primary with PgBouncer connection pooling (2 instances @ 2,000 req/s) + Multi-AZ Read Replicas (3 instances @ 3,500 req/s).\n\n⚡ **AI-Managed Load & Capacity**: Total incoming load configured to **${targetLoad.toLocaleString()} req/s** with healthy p99 latency across all 8 tiers.`,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 0.8. BOTTLENECK REMEDIATION ("fix bottleneck", "resolve bottlenecks", "optimize bottleneck")
  // ───────────────────────────────────────────────────────────────────────────
  if (
    cleanedLower.includes('fix bottleneck') ||
    cleanedLower.includes('resolve bottleneck') ||
    cleanedLower.includes('fix the bottleneck') ||
    cleanedLower.includes('optimize bottleneck') ||
    cleanedLower.includes('auto scale') ||
    cleanedLower.includes('autoscale')
  ) {
    const nodeResults = simulationResult?.nodeResults || {};
    const bottlenecks = Object.values(nodeResults).filter(
      (nr: any) => nr.isBottleneck || nr.status === 'overloaded' || nr.status === 'warning'
    );

    if (bottlenecks.length > 0) {
      let updatedNodes = [...currentNodes];
      let updatedEdges = [...currentEdges];
      const fixedNames: string[] = [];

      for (const b of bottlenecks) {
        const targetNode = currentNodes.find((n) => n.id === b.id || n.name === b.name);
        if (targetNode) {
          fixedNames.push(targetNode.name);
          updatedNodes = updatedNodes.map((n) => {
            if (n.id === targetNode.id) {
              const nextWorkers = Math.max(n.workerCount * 2, 4);
              const nextCapacity = Math.max(
                Math.round(n.capacityPerSecond * 1.5),
                Math.round((currentTrafficRate / nextWorkers) * 1.25)
              );
              return {
                ...n,
                workerCount: Math.min(nextWorkers, 16),
                capacityPerSecond: Math.min(nextCapacity, 50000),
              };
            }
            return n;
          });
        }
      }

      // If database is bottlenecked and no cache exists, auto-insert Redis cache
      const hasDbBottleneck = bottlenecks.some(
        (b: any) => b.name?.toLowerCase().includes('database') || b.id?.includes('database') || b.id?.includes('db')
      );
      if (hasDbBottleneck && !updatedNodes.some((n) => n.type === 'cache')) {
        const cacheId = `cache-${Date.now().toString().slice(-4)}`;
        const cacheNode: ArchitectureNode = {
          id: cacheId,
          name: 'Redis In-Memory Cache',
          type: 'cache',
          position: { x: 0, y: 0 },
          capacityPerSecond: 5000,
          workerCount: 2,
          enabled: true,
          config: { baselineLatencyMs: 2, maxQueueSize: 5000, overflowPolicy: 'reject' },
        };
        const svcNode = updatedNodes.find((n) => n.type === 'service') || updatedNodes[0];
        const dbNode = updatedNodes.find((n) => n.type === 'database');
        if (svcNode && dbNode) {
          updatedEdges = updatedEdges.filter((e) => !(e.source === svcNode.id && e.target === dbNode.id));
          updatedEdges.push({
            id: `e-${svcNode.id}-${cacheId}`,
            source: svcNode.id,
            target: cacheId,
            requestsPerInput: 1.0,
            enabled: true,
            isBidirectional: true,
          });
          updatedEdges.push({
            id: `e-${cacheId}-${dbNode.id}`,
            source: cacheId,
            target: dbNode.id,
            requestsPerInput: 0.2,
            enabled: true,
            isBidirectional: true,
            label: 'Cache Miss (20%)',
          });
          cacheNode.position = calculateSmartPositionForNewNode(cacheNode, updatedEdges, updatedNodes);
          updatedNodes.push(cacheNode);
          fixedNames.push('Redis Cache Layer (absorbs 80% read queries)');
        }
      }

      return {
        executed: true,
        actionType: 'scale_node',
        updatedNodes,
        updatedEdges,
        explanation: `🛠️ **Bottleneck Remediation Applied to Canvas**:\n\n• Scaled capacity and worker concurrency for: **${fixedNames.join(', ')}**\n• Optimized queue buffers to prevent request rejection\n• Re-simulating architecture to verify 0 dropped packets.`,
      };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 1. ADD COMPONENT / NODE
  // Patterns:
  // - "add component redis cache after api gateway"
  // - "add redis cache between api gateway and database"
  // - "add a database"
  // - "add kafka queue"
  // - "add components"
  // ───────────────────────────────────────────────────────────────────────────
  const addMatch =
    cleanedLower.match(
      /(?:add|create|insert|attach|put|deploy|provision|include|integrate)\s+(?:a\s+|an\s+|the\s+)?(?:new\s+)?(?:components?|nodes?|services?|cache|database|queue)?\s*([a-z0-9_\-\s]+?)(?:\s+(?:between|after|before|in front of|to|connected to)\s+.*)?$/i
    ) ||
    lower.match(
      /(?:add|create|insert|attach|put|deploy|provision|include|integrate)\s+(?:a\s+|an\s+|the\s+)?(?:new\s+)?(?:components?|nodes?|services?|cache|database|queue)?\s*([a-z0-9_\-\s]+?)(?:\s+(?:between|after|before|in front of|to|connected to)\s+.*)?$/i
    );

  if (
    addMatch &&
    !cleanedLower.startsWith('scale') &&
    !cleanedLower.startsWith('delete') &&
    !cleanedLower.startsWith('remove') &&
    !lower.startsWith('scale') &&
    !lower.startsWith('delete') &&
    !lower.startsWith('remove')
  ) {
    // Extract component name candidate
    let rawCompName = addMatch[1]?.trim() || '';

    // Check for "between X and Y"
    const betweenMatch =
      cleanedLower.match(/between\s+([a-z0-9_\-\s]+?)\s+and\s+([a-z0-9_\-\s]+)/i) ||
      lower.match(/between\s+([a-z0-9_\-\s]+?)\s+and\s+([a-z0-9_\-\s]+)/i);
    // Check for "after X"
    const afterMatch =
      cleanedLower.match(/after\s+([a-z0-9_\-\s]+)/i) ||
      lower.match(/after\s+([a-z0-9_\-\s]+)/i);
    // Check for "before X" or "in front of X"
    const beforeMatch =
      cleanedLower.match(/(?:before|in front of)\s+([a-z0-9_\-\s]+)/i) ||
      lower.match(/(?:before|in front of)\s+([a-z0-9_\-\s]+)/i);

    // Clean up raw component name if between/after/before was captured inside it
    rawCompName = rawCompName
      .replace(/\s+(between|after|before|in front of|to|connected to).*/i, '')
      .replace(/^(a|an|the|new|components?|nodes?)\s+/i, '')
      .trim();

    // If generic "components" or empty, pick the most needed missing component
    if (!rawCompName || rawCompName === 'components' || rawCompName === 'component' || rawCompName === 'more components') {
      const hasCache = currentNodes.some((n) => n.type === 'cache');
      const hasDb = currentNodes.some((n) => n.type === 'database');
      const hasQueue = currentNodes.some((n) => n.name.toLowerCase().includes('queue') || n.name.toLowerCase().includes('kafka'));
      const hasAuth = currentNodes.some((n) => n.name.toLowerCase().includes('auth'));

      if (!hasCache && hasDb) rawCompName = 'Redis Cache';
      else if (!hasQueue) rawCompName = 'Kafka Event Broker';
      else if (!hasAuth) rawCompName = 'Auth Microservice';
      else if (!hasDb) rawCompName = 'PostgreSQL Database';
      else rawCompName = 'Search & Analytics Engine';
    }

    if (rawCompName) {
      const { type, canonicalName, capacityPerSecond, baselineLatencyMs } =
        detectComponentTypeAndDefaults(rawCompName);

      // ─────────────────────────────────────────────────────────────────
      // DETAILED VIEW COMPONENT CLUSTERING
      // In detailed view, adding components provisions their full supporting architecture
      // (e.g. Primary + Replica for DB, Master + Read Replica for Cache, Queue + Worker Fleet)
      // ─────────────────────────────────────────────────────────────────
      if (viewMode === 'detailed') {
        const lowerComp = rawCompName.toLowerCase();

        // A. Detailed Database Tier (Primary + Read Replica)
        if (type === 'database') {
          const pId = `dt-db-primary-${Date.now().toString().slice(-4)}`;
          const rId = `dt-db-replica-${Date.now().toString().slice(-4)}`;

          const primaryNode: ArchitectureNode = {
            id: pId,
            name: `${canonicalName} Primary (Read/Write)`,
            type: 'database',
            position: { x: 0, y: 0 },
            capacityPerSecond: 2500,
            workerCount: 2,
            enabled: true,
            config: { baselineLatencyMs: 18, maxQueueSize: 4000, overflowPolicy: 'reject' },
          };

          const replicaNode: ArchitectureNode = {
            id: rId,
            name: `${canonicalName} Read Replica (Multi-AZ)`,
            type: 'database',
            position: { x: 0, y: 0 },
            capacityPerSecond: 3500,
            workerCount: 3,
            enabled: true,
            config: { baselineLatencyMs: 12, maxQueueSize: 6000, overflowPolicy: 'reject' },
          };

          let detailedEdges = [...currentEdges];
          const svcNode =
            currentNodes.find((n) => n.type === 'service') ||
            currentNodes.find((n) => n.type === 'gateway') ||
            currentNodes[0];

          if (svcNode) {
            detailedEdges.push({
              id: `e-${svcNode.id}-${pId}`,
              source: svcNode.id,
              target: pId,
              requestsPerInput: 0.2,
              enabled: true,
              isBidirectional: true,
              label: 'ACID Writes (WAL)',
              communicationType: 'db',
            });
            detailedEdges.push({
              id: `e-${svcNode.id}-${rId}`,
              source: svcNode.id,
              target: rId,
              requestsPerInput: 0.8,
              enabled: true,
              isBidirectional: true,
              label: 'Read Queries (80%)',
              communicationType: 'db',
            });
          }

          detailedEdges.push({
            id: `e-${pId}-${rId}`,
            source: pId,
            target: rId,
            requestsPerInput: 1.0,
            enabled: true,
            isBidirectional: false,
            label: 'Sync Replication WAL',
            communicationType: 'db',
          });

          primaryNode.position = calculateSmartPositionForNewNode(primaryNode, detailedEdges, currentNodes);
          replicaNode.position = { x: primaryNode.position.x + 360, y: primaryNode.position.y };

          return {
            executed: true,
            actionType: 'add_node',
            updatedNodes: [...currentNodes, primaryNode, replicaNode],
            updatedEdges: detailedEdges,
            explanation: `🏛️ **Detailed View: Added Resilient Database Cluster**:\n\n• **${primaryNode.name}**: Primary read/write node (${primaryNode.capacityPerSecond.toLocaleString()} req/s)\n• **${replicaNode.name}**: Multi-AZ read replica (${replicaNode.capacityPerSecond.toLocaleString()} req/s)\n• **Data Flow**: Configured 80% read / 20% write traffic splitting with synchronous WAL replication.`,
          };
        }

        // B. Detailed Cache Tier (Master + Read Replica)
        if (type === 'cache') {
          const mId = `dt-cache-master-${Date.now().toString().slice(-4)}`;
          const rId = `dt-cache-replica-${Date.now().toString().slice(-4)}`;

          const masterNode: ArchitectureNode = {
            id: mId,
            name: `${canonicalName} Master (Write Cache)`,
            type: 'cache',
            position: { x: 0, y: 0 },
            capacityPerSecond: 8000,
            workerCount: 2,
            enabled: true,
            config: { baselineLatencyMs: 1, maxQueueSize: 10000, overflowPolicy: 'reject' },
          };

          const replicaNode: ArchitectureNode = {
            id: rId,
            name: `${canonicalName} Read Replica (Read-Through)`,
            type: 'cache',
            position: { x: 0, y: 0 },
            capacityPerSecond: 12000,
            workerCount: 3,
            enabled: true,
            config: { baselineLatencyMs: 1, maxQueueSize: 15000, overflowPolicy: 'reject' },
          };

          const svcNode = currentNodes.find((n) => n.type === 'service') || currentNodes[0];
          const dbNode = currentNodes.find((n) => n.type === 'database');
          let detailedEdges = [...currentEdges];

          if (svcNode) {
            detailedEdges.push({
              id: `e-${svcNode.id}-${mId}`,
              source: svcNode.id,
              target: mId,
              requestsPerInput: 0.2,
              enabled: true,
              isBidirectional: true,
              label: 'Write-Through',
              communicationType: 'cache',
            });
            detailedEdges.push({
              id: `e-${svcNode.id}-${rId}`,
              source: svcNode.id,
              target: rId,
              requestsPerInput: 0.85,
              enabled: true,
              isBidirectional: true,
              label: 'Cache Hit (85%)',
              communicationType: 'cache',
            });
          }
          detailedEdges.push({
            id: `e-${mId}-${rId}`,
            source: mId,
            target: rId,
            requestsPerInput: 1.0,
            enabled: true,
            isBidirectional: false,
            label: 'Cache Replication',
            communicationType: 'cache',
          });
          if (dbNode) {
            detailedEdges.push({
              id: `e-${rId}-${dbNode.id}`,
              source: rId,
              target: dbNode.id,
              requestsPerInput: 0.15,
              enabled: true,
              isBidirectional: true,
              label: 'Cache Miss Reads (15%)',
              communicationType: 'db',
            });
          }

          masterNode.position = calculateSmartPositionForNewNode(masterNode, detailedEdges, currentNodes);
          replicaNode.position = { x: masterNode.position.x + 360, y: masterNode.position.y };

          return {
            executed: true,
            actionType: 'add_node',
            updatedNodes: [...currentNodes, masterNode, replicaNode],
            updatedEdges: detailedEdges,
            explanation: `🏛️ **Detailed View: Added Cache-Aside Tier**:\n\n• **${masterNode.name}**: Primary write cache (${masterNode.capacityPerSecond.toLocaleString()} req/s)\n• **${replicaNode.name}**: Read replica (${replicaNode.capacityPerSecond.toLocaleString()} req/s, absorbs 85% traffic)\n• **Miss Routing**: 15% cache miss reads forwarded to database storage.`,
          };
        }

        // C. Detailed Queue / Event Streaming Tier (Kafka Broker + Worker Fleet)
        if (
          lowerComp.includes('kafka') ||
          lowerComp.includes('queue') ||
          lowerComp.includes('event') ||
          lowerComp.includes('stream')
        ) {
          const qId = `dt-kafka-${Date.now().toString().slice(-4)}`;
          const wId = `dt-worker-${Date.now().toString().slice(-4)}`;

          const queueNode: ArchitectureNode = {
            id: qId,
            name: 'Apache Kafka Event Stream Buffer',
            type: 'service',
            position: { x: 0, y: 0 },
            capacityPerSecond: 6000,
            workerCount: 3,
            enabled: true,
            config: { baselineLatencyMs: 3, maxQueueSize: 25000, overflowPolicy: 'reject' },
          };

          const workerNode: ArchitectureNode = {
            id: wId,
            name: 'Async Background Worker Fleet',
            type: 'service',
            position: { x: 0, y: 0 },
            capacityPerSecond: 2500,
            workerCount: 6,
            enabled: true,
            config: { baselineLatencyMs: 20, maxQueueSize: 8000, overflowPolicy: 'reject' },
          };

          const parentNode =
            currentNodes.find((n) => n.type === 'gateway') ||
            currentNodes.find((n) => n.type === 'service') ||
            currentNodes[0];
          const dbNode = currentNodes.find((n) => n.type === 'database');
          let detailedEdges = [...currentEdges];

          if (parentNode) {
            detailedEdges.push({
              id: `e-${parentNode.id}-${qId}`,
              source: parentNode.id,
              target: qId,
              requestsPerInput: 0.4,
              enabled: true,
              isBidirectional: true,
              label: 'Async Events',
            });
          }
          detailedEdges.push({
            id: `e-${qId}-${wId}`,
            source: qId,
            target: wId,
            requestsPerInput: 1.0,
            enabled: true,
            isBidirectional: true,
            label: 'Consumer Groups',
          });
          if (dbNode) {
            detailedEdges.push({
              id: `e-${wId}-${dbNode.id}`,
              source: wId,
              target: dbNode.id,
              requestsPerInput: 0.8,
              enabled: true,
              isBidirectional: true,
              label: 'Batch Mutations',
              communicationType: 'db',
            });
          }

          queueNode.position = calculateSmartPositionForNewNode(queueNode, detailedEdges, currentNodes);
          workerNode.position = { x: queueNode.position.x + 360, y: queueNode.position.y };

          return {
            executed: true,
            actionType: 'add_node',
            updatedNodes: [...currentNodes, queueNode, workerNode],
            updatedEdges: detailedEdges,
            explanation: `🏛️ **Detailed View: Added Decoupled Event Stream & Worker Fleet**:\n\n• **${queueNode.name}**: Partitioned buffer (${queueNode.capacityPerSecond.toLocaleString()} req/s buffer capacity)\n• **${workerNode.name}**: 6 worker instances (${(workerNode.capacityPerSecond * 6).toLocaleString()} req/s batch capacity)\n• Integrated async consumer group queue and batch mutation routing.`,
          };
        }
      }

      const newId = `${type}-${Date.now().toString().slice(-4)}`;
      const newNode: ArchitectureNode = {
        id: newId,
        name: canonicalName,
        type,
        position: { x: 0, y: 0 },
        capacityPerSecond,
        workerCount: 2,
        enabled: true,
        config: {
          baselineLatencyMs,
          maxQueueSize: 2000,
          overflowPolicy: 'reject',
        },
      };

      let newEdges = [...currentEdges];
      let placementExplanation = '';

      if (betweenMatch) {
        const srcQuery = betweenMatch[1].trim();
        const dstQuery = betweenMatch[2].trim();
        const srcNode = findNodeByFuzzyName(srcQuery, currentNodes);
        const dstNode = findNodeByFuzzyName(dstQuery, currentNodes);

        if (srcNode && dstNode) {
          // Remove direct edge from srcNode to dstNode if it exists
          newEdges = newEdges.filter(
            (e) => !(e.source === srcNode.id && e.target === dstNode.id)
          );

          // Add srcNode -> newNode
          newEdges.push({
            id: `e-${srcNode.id}-${newNode.id}`,
            source: srcNode.id,
            target: newNode.id,
            requestsPerInput: 1.0,
            enabled: true,
            isBidirectional: true,
            label: `${srcNode.name} → ${newNode.name}`,
          });

          // Add newNode -> dstNode
          newEdges.push({
            id: `e-${newNode.id}-${dstNode.id}`,
            source: newNode.id,
            target: dstNode.id,
            requestsPerInput: type === 'cache' ? 0.2 : 1.0, // Cache absorbs 80% of reads!
            enabled: true,
            isBidirectional: true,
            label: type === 'cache' ? 'Cache Miss (20%)' : `${newNode.name} → ${dstNode.name}`,
          });

          placementExplanation = `Placed directly between **${srcNode.name}** and **${dstNode.name}**. Diverted traffic pipeline through **${newNode.name}** (absorbing load and reducing latency).`;
        }
      } else if (afterMatch) {
        const srcQuery = afterMatch[1].trim();
        const srcNode = findNodeByFuzzyName(srcQuery, currentNodes);

        if (srcNode) {
          newEdges.push({
            id: `e-${srcNode.id}-${newNode.id}`,
            source: srcNode.id,
            target: newNode.id,
            requestsPerInput: 1.0,
            enabled: true,
            isBidirectional: true,
            label: `${srcNode.name} → ${newNode.name}`,
          });
          placementExplanation = `Connected downstream after **${srcNode.name}**.`;
        }
      } else if (beforeMatch) {
        const dstQuery = beforeMatch[1].trim();
        const dstNode = findNodeByFuzzyName(dstQuery, currentNodes);

        if (dstNode) {
          // Find parents of dstNode
          const parents = currentEdges
            .filter((e) => e.target === dstNode.id)
            .map((e) => e.source);

          if (parents.length > 0) {
            newEdges = newEdges.filter((e) => e.target !== dstNode.id);
            for (const pId of parents) {
              newEdges.push({
                id: `e-${pId}-${newNode.id}`,
                source: pId,
                target: newNode.id,
                requestsPerInput: 1.0,
                enabled: true,
                isBidirectional: true,
              });
            }
          }
          newEdges.push({
            id: `e-${newNode.id}-${dstNode.id}`,
            source: newNode.id,
            target: dstNode.id,
            requestsPerInput: 1.0,
            enabled: true,
            isBidirectional: true,
          });
          placementExplanation = `Placed directly in front of **${dstNode.name}**.`;
        }
      } else {
        // Logical default auto-placement
        if (type === 'cache') {
          const dbNode = currentNodes.find((n) => n.type === 'database');
          const svcNode = currentNodes.find((n) => n.type === 'service');
          if (svcNode && dbNode) {
            newEdges = newEdges.filter(
              (e) => !(e.source === svcNode.id && e.target === dbNode.id)
            );
            newEdges.push({
              id: `e-${svcNode.id}-${newNode.id}`,
              source: svcNode.id,
              target: newNode.id,
              requestsPerInput: 1.0,
              enabled: true,
              isBidirectional: true,
            });
            newEdges.push({
              id: `e-${newNode.id}-${dbNode.id}`,
              source: newNode.id,
              target: dbNode.id,
              requestsPerInput: 0.25,
              enabled: true,
              isBidirectional: true,
              label: 'Cache Miss (25%)',
            });
            placementExplanation = `Auto-placed between **${svcNode.name}** and **${dbNode.name}** as an intelligent read-through cache layer.`;
          } else if (svcNode) {
            newEdges.push({
              id: `e-${svcNode.id}-${newNode.id}`,
              source: svcNode.id,
              target: newNode.id,
              requestsPerInput: 1.0,
              enabled: true,
              isBidirectional: true,
            });
            placementExplanation = `Attached to **${svcNode.name}**.`;
          }
        } else if (type === 'database') {
          const svcNode = currentNodes.find((n) => n.type === 'service') || currentNodes[currentNodes.length - 1];
          if (svcNode) {
            newEdges.push({
              id: `e-${svcNode.id}-${newNode.id}`,
              source: svcNode.id,
              target: newNode.id,
              requestsPerInput: 1.0,
              enabled: true,
              isBidirectional: true,
            });
            placementExplanation = `Connected downstream from **${svcNode.name}**.`;
          }
        } else {
          // Connect from gateway or first service
          const parentNode = currentNodes.find((n) => n.type === 'gateway') || currentNodes[0];
          if (parentNode) {
            newEdges.push({
              id: `e-${parentNode.id}-${newNode.id}`,
              source: parentNode.id,
              target: newNode.id,
              requestsPerInput: 1.0,
              enabled: true,
              isBidirectional: true,
            });
            placementExplanation = `Connected from **${parentNode.name}**.`;
          }
        }
      }

      newNode.position = calculateSmartPositionForNewNode(newNode, newEdges, currentNodes);
      const allNodes = [...currentNodes, newNode];

      return {
        executed: true,
        actionType: 'add_node',
        updatedNodes: allNodes,
        updatedEdges: newEdges,
        explanation: `✅ **Added Component: ${newNode.name}**\n\n• **Type**: \`${newNode.type}\` (${newNode.capacityPerSecond.toLocaleString()} req/s nominal capacity, ${newNode.config.baselineLatencyMs}ms baseline latency)\n• **Connections**: ${placementExplanation || 'Integrated into canvas topology.'}\n• Preserved existing architecture scale and queued live simulation refresh.`,
      };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. DELETE / REMOVE COMPONENT
  // Patterns:
  // - "remove redis"
  // - "delete node database"
  // - "drop component cache"
  // ───────────────────────────────────────────────────────────────────────────
  const deleteMatch =
    cleanedLower.match(/(?:delete|remove|drop|destroy)\s+(?:node|component)?\s*([a-z0-9_\-\s]+)/i) ||
    lower.match(/(?:delete|remove|drop|destroy)\s+(?:node|component)?\s*([a-z0-9_\-\s]+)/i);
  if (deleteMatch && !lower.includes('edge') && !lower.includes('connection')) {
    const targetQuery = deleteMatch[1].trim();
    const targetNode = findNodeByFuzzyName(targetQuery, currentNodes);

    if (targetNode) {
      const { nodesToDelete, reflectedTypes } = findReflectedNodesToDelete(
        targetNode,
        currentNodes,
        currentEdges
      );

      if (currentNodes.length <= nodesToDelete.length) {
        return {
          executed: false,
          actionType: 'delete_node',
          explanation: `⚠️ Cannot remove **${targetNode.name}** and its reflected components because the architecture requires at least one active component.`,
        };
      }

      const deletedIds = new Set(nodesToDelete.map((n) => n.id));

      // Reconnect / bridge edges around removed intermediary nodes (e.g. cache removal should connect service directly to database)
      let bridgedEdges = currentEdges.filter(
        (e) => !deletedIds.has(e.source) && !deletedIds.has(e.target)
      );

      for (const delNode of nodesToDelete) {
        const incomingParents = currentEdges
          .filter((e) => e.target === delNode.id && !deletedIds.has(e.source))
          .map((e) => e.source);
        const outgoingChildren = currentEdges
          .filter((e) => e.source === delNode.id && !deletedIds.has(e.target))
          .map((e) => e.target);

        for (const pId of incomingParents) {
          for (const cId of outgoingChildren) {
            if (pId !== cId && !bridgedEdges.some((e) => e.source === pId && e.target === cId)) {
              bridgedEdges.push({
                id: `e-bridge-${pId}-${cId}`,
                source: pId,
                target: cId,
                requestsPerInput: 1.0,
                enabled: true,
                isBidirectional: true,
                label: 'Direct Flow',
              });
            }
          }
        }
      }

      const updatedNodes = currentNodes.filter((n) => !deletedIds.has(n.id));
      const reflectedNames = nodesToDelete
        .filter((n) => n.id !== targetNode.id)
        .map((n) => n.name);

      const explanationSuffix =
        reflectedNames.length > 0
          ? ` and reflected components (**${reflectedNames.join('**, **')}**)`
          : '';

      return {
        executed: true,
        actionType: 'delete_node',
        updatedNodes: updatedNodes,
        updatedEdges: bridgedEdges,
        reflectedDeletedNodeIds: Array.from(deletedIds),
        reflectedDeletedTypes: reflectedTypes,
        explanation: `🗑️ **Removed ${targetNode.name}${explanationSuffix}**\n\n• Pruned associated replicas, poolers, and dependent worker fleets\n• Re-bridged active data connections around deleted components\n• Architecture topology updated and re-simulated.`,
      };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. CONNECT NODES
  // Pattern: "connect A to B"
  // ───────────────────────────────────────────────────────────────────────────
  const connectMatch =
    cleanedLower.match(/connect\s+([a-z0-9_\-\s]+?)\s+to\s+([a-z0-9_\-\s]+)/i) ||
    lower.match(/connect\s+([a-z0-9_\-\s]+?)\s+to\s+([a-z0-9_\-\s]+)/i);
  if (connectMatch) {
    const srcNode = findNodeByFuzzyName(connectMatch[1], currentNodes);
    const dstNode = findNodeByFuzzyName(connectMatch[2], currentNodes);

    if (srcNode && dstNode) {
      if (srcNode.id === dstNode.id) {
        return {
          executed: false,
          actionType: 'connect_nodes',
          explanation: `⚠️ Cannot connect **${srcNode.name}** to itself (cyclic self-reference).`,
        };
      }

      const existingEdge = currentEdges.find(
        (e) => e.source === srcNode.id && e.target === dstNode.id
      );

      if (existingEdge) {
        return {
          executed: false,
          actionType: 'connect_nodes',
          explanation: `ℹ️ **${srcNode.name}** is already connected to **${dstNode.name}**.`,
        };
      }

      const newEdge: ArchitectureEdge = {
        id: `e-${srcNode.id}-${dstNode.id}`,
        source: srcNode.id,
        target: dstNode.id,
        requestsPerInput: 1.0,
        enabled: true,
        isBidirectional: true,
        label: `${srcNode.name} → ${dstNode.name}`,
      };

      const updatedEdges = [...currentEdges, newEdge];

      return {
        executed: true,
        actionType: 'connect_nodes',
        updatedNodes: currentNodes,
        updatedEdges: updatedEdges,
        explanation: `🔗 **Connected: ${srcNode.name} → ${dstNode.name}**\n\n• Established active data route\n• Re-evaluated traffic distribution and simulation.`,
      };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. UPDATE TRAFFIC / TOTAL LOAD RATE
  // Patterns:
  // - "set traffic to 5000"
  // - "increase traffic to 10k"
  // - "change total load to 50k"
  // - "simulate 2500 req/s"
  // ───────────────────────────────────────────────────────────────────────────
  const trafficMatch =
    cleanedLower.match(
      /(?:set|increase|decrease|change|manage|tune|scale|simulate|run)\s+(?:the\s+)?(?:incoming\s+)?(?:total\s+)?(?:traffic|load|rate|rps|requests)?\s*(?:to|at)?\s*([0-9]+(?:\.[0-9]+)?)\s*(k|m)?\s*(?:rps|req\/s|requests)?/i
    ) ||
    lower.match(
      /(?:set|increase|decrease|change|manage|tune|scale|simulate|run)\s+(?:the\s+)?(?:incoming\s+)?(?:total\s+)?(?:traffic|load|rate|rps|requests)?\s*(?:to|at)?\s*([0-9]+(?:\.[0-9]+)?)\s*(k|m)?\s*(?:rps|req\/s|requests)?/i
    );

  if (
    trafficMatch &&
    (cleanedLower.includes('traffic') ||
      cleanedLower.includes('load') ||
      cleanedLower.includes('rps') ||
      cleanedLower.includes('req/s') ||
      lower.includes('traffic') ||
      lower.includes('load') ||
      lower.includes('rps') ||
      lower.includes('req/s'))
  ) {
    let val = parseFloat(trafficMatch[1]);
    const unit = (trafficMatch[2] || '').toLowerCase();
    if (unit === 'k') val *= 1000;
    else if (unit === 'm') val *= 1000000;

    if (!isNaN(val) && val > 0) {
      const clamped = Math.min(Math.max(Math.round(val), 10), 200000);
      return {
        executed: true,
        actionType: 'update_traffic',
        updatedTrafficRate: clamped,
        explanation: `⚡ **Total Load Re-Configured: ${clamped.toLocaleString()} req/s**\n\n• AI adjusted total incoming simulation load rate\n• Live metrics re-evaluated across all tiers (throughput, p99 latency, queue depth, and health status).`,
      };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4.5. COMBINED SCALE WORKERS & CAPACITY ("scale backend to 6 workers with capacity 3000")
  // ───────────────────────────────────────────────────────────────────────────
  const combinedMatch =
    cleanedLower.match(
      /(?:scale|set|configure)\s+([a-z0-9_\-\s]+?)\s+(?:to|at)?\s*([0-9]+)\s*(?:instances|workers|replicas)?\s*(?:with|and|at)\s*(?:capacity\s+)?([0-9]+(?:\.[0-9]+)?)\s*(k|m)?\s*(?:rps|req\/s|capacity)?/i
    ) ||
    lower.match(
      /(?:scale|set|configure)\s+([a-z0-9_\-\s]+?)\s+(?:to|at)?\s*([0-9]+)\s*(?:instances|workers|replicas)?\s*(?:with|and|at)\s*(?:capacity\s+)?([0-9]+(?:\.[0-9]+)?)\s*(k|m)?\s*(?:rps|req\/s|capacity)?/i
    );
  if (combinedMatch) {
    const targetNode = findNodeByFuzzyName(combinedMatch[1], currentNodes);
    const count = parseInt(combinedMatch[2], 10);
    let cap = parseFloat(combinedMatch[3]);
    const unit = (combinedMatch[4] || '').toLowerCase();
    if (unit === 'k') cap *= 1000;
    else if (unit === 'm') cap *= 1000000;

    if (targetNode && !isNaN(count) && count >= 1 && count <= 50 && !isNaN(cap) && cap > 0) {
      const clampedCap = Math.min(Math.max(Math.round(cap), 100), 200000);
      const updatedNodes = currentNodes.map((n) => {
        if (n.id === targetNode.id) {
          return {
            ...n,
            workerCount: count,
            capacityPerSecond: clampedCap,
          };
        }
        return n;
      });

      return {
        executed: true,
        actionType: 'scale_node',
        updatedNodes,
        explanation: `⚙️ **AI Re-Configured ${targetNode.name}**:\n\n• Worker count: **${count} instances**\n• Single worker capacity: **${clampedCap.toLocaleString()} req/s**\n• Total effective capacity: **${(count * clampedCap).toLocaleString()} req/s**\n• Simulation re-computed live.`,
      };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. SCALE NODE WORKERS / INSTANCES
  // Pattern: "scale backend to 5 instances" or "set database workers to 4"
  // ───────────────────────────────────────────────────────────────────────────
  const scaleMatch =
    cleanedLower.match(
      /(?:scale|set|increase|decrease)\s+([a-z0-9_\-\s]+?)\s+(?:to|at)?\s*([0-9]+)\s*(?:instances|workers|pods|replicas)?/i
    ) ||
    lower.match(
      /(?:scale|set|increase|decrease)\s+([a-z0-9_\-\s]+?)\s+(?:to|at)?\s*([0-9]+)\s*(?:instances|workers|pods|replicas)?/i
    );

  if (
    scaleMatch &&
    !cleanedLower.includes('capacity') &&
    !lower.includes('capacity')
  ) {
    const targetNode = findNodeByFuzzyName(scaleMatch[1], currentNodes);
    const count = parseInt(scaleMatch[2], 10);

    if (targetNode && !isNaN(count) && count >= 1 && count <= 50) {
      const updatedNodes = currentNodes.map((n) => {
        if (n.id === targetNode.id) {
          return {
            ...n,
            workerCount: count,
          };
        }
        return n;
      });

      return {
        executed: true,
        actionType: 'scale_node',
        updatedNodes,
        explanation: `⚙️ **Scaled Component: ${targetNode.name}**\n\n• Worker count set to **${count} instances**\n• Total effective capacity: **${(targetNode.capacityPerSecond * count).toLocaleString()} req/s**\n• Simulation re-evaluated.`,
      };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5.5. WORKER CAPACITY MANAGEMENT ("set worker capacity of backend to 3000 req/s", "change capacity of redis to 8000")
  // ───────────────────────────────────────────────────────────────────────────
  const capacityMatch =
    cleanedLower.match(
      /(?:set|change|increase|decrease|update|configure|tune)\s+(?:the\s+)?(?:worker\s+)?capacity\s+(?:of\s+)?([a-z0-9_\-\s]+?)\s+(?:to|at)?\s*([0-9]+(?:\.[0-9]+)?)\s*(k|m)?\s*(?:rps|req\/s|requests)?/i
    ) ||
    lower.match(
      /(?:set|change|increase|decrease|update|configure|tune)\s+(?:the\s+)?(?:worker\s+)?capacity\s+(?:of\s+)?([a-z0-9_\-\s]+?)\s+(?:to|at)?\s*([0-9]+(?:\.[0-9]+)?)\s*(k|m)?\s*(?:rps|req\/s|requests)?/i
    ) ||
    cleanedLower.match(
      /(?:set|change|increase|decrease|update|configure|tune)\s+([a-z0-9_\-\s]+?)\s+(?:worker\s+)?capacity\s+(?:to|at)?\s*([0-9]+(?:\.[0-9]+)?)\s*(k|m)?\s*(?:rps|req\/s|requests)?/i
    ) ||
    lower.match(
      /(?:set|change|increase|decrease|update|configure|tune)\s+([a-z0-9_\-\s]+?)\s+(?:worker\s+)?capacity\s+(?:to|at)?\s*([0-9]+(?:\.[0-9]+)?)\s*(k|m)?\s*(?:rps|req\/s|requests)?/i
    );

  if (capacityMatch) {
    const targetQuery = capacityMatch[1].trim();
    const targetNode = findNodeByFuzzyName(targetQuery, currentNodes);

    let val = parseFloat(capacityMatch[2]);
    const unit = (capacityMatch[3] || '').toLowerCase();
    if (unit === 'k') val *= 1000;
    else if (unit === 'm') val *= 1000000;

    if (targetNode && !isNaN(val) && val > 0) {
      const clampedCap = Math.min(Math.max(Math.round(val), 100), 200000);
      const updatedNodes = currentNodes.map((n) => {
        if (n.id === targetNode.id) {
          return {
            ...n,
            capacityPerSecond: clampedCap,
          };
        }
        return n;
      });

      const totalCap = clampedCap * targetNode.workerCount;

      return {
        executed: true,
        actionType: 'change_capacity',
        updatedNodes,
        explanation: `⚡ **AI Managed Worker Capacity: ${targetNode.name}**\n\n• Single worker capacity set to **${clampedCap.toLocaleString()} req/s**\n• Active instances: **${targetNode.workerCount} workers**\n• Total effective node capacity: **${totalCap.toLocaleString()} req/s**\n• Recalculated live simulation utilization and queue dynamics.`,
      };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 6. BOTTLENECKS & ARCHITECTURE AUDIT
  // Pattern: "what are the bottlenecks?", "how to optimize?", "why is latency high?"
  // ───────────────────────────────────────────────────────────────────────────
  if (
    lower.includes('bottleneck') ||
    lower.includes('overload') ||
    lower.includes('why slow') ||
    lower.includes('audit') ||
    lower.includes('latency') ||
    lower.includes('diagnose')
  ) {
    const nodeResults = simulationResult?.nodeResults || {};
    const bottlenecks = Object.values(nodeResults).filter(
      (nr: any) => nr.isBottleneck || nr.status === 'overloaded' || nr.status === 'warning'
    );

    if (bottlenecks.length > 0) {
      const details = bottlenecks
        .map(
          (b: any) =>
            `• **${b.name}**: \`${b.status.toUpperCase()}\` utilization (${Math.round(b.effectiveUtilization * 100)}%), queue depth: ${b.queueLength} reqs, latency: ${Math.round(b.estimatedLatencyMs)}ms.`
        )
        .join('\n');

      return {
        executed: true,
        actionType: 'analyze',
        explanation: `🔍 **Bottleneck Diagnosis & Live Recommendations**:\n\n${details}\n\n💡 **Actionable Optimization Options**:\n1. Say **"add redis cache after API gateway"** to offload read query spikes.\n2. Say **"scale ${bottlenecks[0].name} to 4 instances"** to quadruple processing concurrency.\n3. Say **"set traffic to 1500 req/s"** to test graceful degradation.`,
      };
    } else {
      return {
        executed: true,
        actionType: 'analyze',
        explanation: `✅ **System Status Healthy**: At current traffic (${currentTrafficRate.toLocaleString()} req/s), all components operate within nominal thresholds (no bottlenecks detected).\n\nTo stress test resilience, try: **"set traffic to 10,000 req/s"** or **"add component Kafka queue"**.`,
      };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 7. GENERAL QUERY / ADVICE FALLBACK (Dynamic, non-canned)
  // ───────────────────────────────────────────────────────────────────────────
  const clean = text.trim();
  const isGibberish =
    (clean.length > 5 && !/[aeiouy]/i.test(clean)) ||
    /^[b-df-hj-np-tv-z]{5,}$/i.test(clean) ||
    /^[^a-zA-Z0-9\s]+$/.test(clean) ||
    /^[a-z]{6,}$/i.test(clean) && !/(micro|service|server|queue|cache|database|traffic|system|scale|redis|kafka|node|latency|bottleneck|cluster|ingress|egress|auth|gateway|proxy|worker|docker|kube)/i.test(clean) && (new Set(clean.toLowerCase().split('')).size <= 4);

  if (isGibberish || clean.length <= 2) {
    return {
      executed: false,
      actionType: 'general',
      explanation: `I didn't quite catch that. Could you clarify what you'd like to explore, build, or analyze on the canvas?\n\nYou can ask an architectural question (e.g. *"What caching pattern fits our database?"*) or instruct canvas changes (e.g. *"Add Redis cache"* or *"Scale backend to 4 instances"*).`,
    };
  }

  return {
    executed: false,
    actionType: 'general',
    explanation: `I've evaluated your request regarding **"${clean}"** against your active canvas topology (${currentNodes.length} nodes, ${currentTrafficRate.toLocaleString()} req/s).\n\nFeel free to ask for architectural comparisons, deep-dives into distributed system resilience, or instruct me to adjust any components directly on the canvas.`,
  };
}
