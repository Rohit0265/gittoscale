import { ArchitectureNode, ArchitectureEdge, ComponentType, SimulationResult } from '../types';
import { toVerticalTree } from '../utils/treeLayout';

export interface AgentCommandExecutionResult {
  executed: boolean;
  actionType:
    | 'add_node'
    | 'delete_node'
    | 'connect_nodes'
    | 'disconnect_nodes'
    | 'update_traffic'
    | 'scale_node'
    | 'analyze'
    | 'general';
  explanation: string;
  updatedNodes?: ArchitectureNode[];
  updatedEdges?: ArchitectureEdge[];
  updatedTrafficRate?: number;
  updatedAnswers?: any;
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
 * Executes natural language commands on the active architecture
 */
export function executeArchitectureCommand(
  command: string,
  currentNodes: ArchitectureNode[],
  currentEdges: ArchitectureEdge[],
  currentTrafficRate: number,
  simulationResult: SimulationResult | null,
  _contextHistory: Array<{ text: string; sender: string }> = []
): AgentCommandExecutionResult {
  const text = command.trim();
  const lower = text.toLowerCase();

  // ───────────────────────────────────────────────────────────────────────────
  // 0. REQUIREMENT INTAKE ("add more requirement", "add requirement", "new requirement", "requirement: ...")
  // ───────────────────────────────────────────────────────────────────────────
  const reqMatch = lower.match(/(?:add\s+(?:more\s+)?requirements?|new\s+requirements?|requirements?\s*:?)\s*(.*)/i);
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
        updatedNodes.push(payNode);
        addedItems.push('💳 **Payment Service**: Integrated transactional payment gateway processing');
      }
    }

    if (addedItems.length > 0) {
      const reorderedNodes = toVerticalTree(updatedNodes, updatedEdges);
      return {
        executed: true,
        actionType: 'add_node',
        updatedNodes: reorderedNodes,
        updatedEdges,
        updatedTrafficRate: updatedTraffic,
        explanation: `🎯 **New Requirements Attached to Playground**:\n\n${addedItems.join('\n')}\n\n• Canvas re-aligned top-to-bottom and live simulation recalculated for ${updatedTraffic.toLocaleString()} req/s.`,
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
  const addMatch = lower.match(
    /(?:add|create|insert|attach|put)\s+(?:a\s+|an\s+|the\s+)?(?:new\s+)?(?:components?|nodes?|services?|cache|database|queue)?\s*([a-z0-9_\-\s]+?)(?:\s+(?:between|after|before|in front of|to|connected to)\s+.*)?$/i
  );

  if (addMatch && !lower.startsWith('scale') && !lower.startsWith('delete') && !lower.startsWith('remove')) {
    // Extract component name candidate
    let rawCompName = addMatch[1]?.trim() || '';

    // Check for "between X and Y"
    const betweenMatch = lower.match(/between\s+([a-z0-9_\-\s]+?)\s+and\s+([a-z0-9_\-\s]+)/i);
    // Check for "after X"
    const afterMatch = lower.match(/after\s+([a-z0-9_\-\s]+)/i);
    // Check for "before X" or "in front of X"
    const beforeMatch = lower.match(/(?:before|in front of)\s+([a-z0-9_\-\s]+)/i);

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

      const allNodes = [...currentNodes, newNode];
      const reorderedNodes = toVerticalTree(allNodes, newEdges);

      return {
        executed: true,
        actionType: 'add_node',
        updatedNodes: reorderedNodes,
        updatedEdges: newEdges,
        explanation: `✅ **Added Component: ${newNode.name}**\n\n• **Type**: \`${newNode.type}\` (${newNode.capacityPerSecond.toLocaleString()} req/s nominal capacity, ${newNode.config.baselineLatencyMs}ms baseline latency)\n• **Connections**: ${placementExplanation || 'Integrated into canvas topology.'}\n• Auto-aligned architecture hierarchy and queued live simulation refresh.`,
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
  const deleteMatch = lower.match(/(?:delete|remove|drop|destroy)\s+(?:node|component)?\s*([a-z0-9_\-\s]+)/i);
  if (deleteMatch && !lower.includes('edge') && !lower.includes('connection')) {
    const targetQuery = deleteMatch[1].trim();
    const targetNode = findNodeByFuzzyName(targetQuery, currentNodes);

    if (targetNode) {
      if (currentNodes.length <= 1) {
        return {
          executed: false,
          actionType: 'delete_node',
          explanation: `⚠️ Cannot remove **${targetNode.name}** because the architecture requires at least one active component.`,
        };
      }

      const updatedNodes = currentNodes.filter((n) => n.id !== targetNode.id);
      const updatedEdges = currentEdges.filter(
        (e) => e.source !== targetNode.id && e.target !== targetNode.id
      );
      const reorderedNodes = toVerticalTree(updatedNodes, updatedEdges);

      return {
        executed: true,
        actionType: 'delete_node',
        updatedNodes: reorderedNodes,
        updatedEdges: updatedEdges,
        explanation: `🗑️ **Removed Component: ${targetNode.name}** (\`${targetNode.id}\`)\n\n• Removed component from architecture topology\n• Pruned connected edges\n• Topology updated and re-simulated.`,
      };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. CONNECT NODES
  // Pattern: "connect A to B"
  // ───────────────────────────────────────────────────────────────────────────
  const connectMatch = lower.match(/connect\s+([a-z0-9_\-\s]+?)\s+to\s+([a-z0-9_\-\s]+)/i);
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
      const reorderedNodes = toVerticalTree(currentNodes, updatedEdges);

      return {
        executed: true,
        actionType: 'connect_nodes',
        updatedNodes: reorderedNodes,
        updatedEdges: updatedEdges,
        explanation: `🔗 **Connected: ${srcNode.name} → ${dstNode.name}**\n\n• Established active data route\n• Re-balanced graph layout and re-evaluated traffic distribution.`,
      };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. UPDATE TRAFFIC / LOAD RATE
  // Patterns:
  // - "set traffic to 5000"
  // - "increase traffic to 10k"
  // - "simulate 2500 req/s"
  // ───────────────────────────────────────────────────────────────────────────
  const trafficMatch = lower.match(
    /(?:set|increase|change|scale|simulate|run)\s+(?:incoming\s+)?(?:traffic|load|rate|rps|requests)?\s*(?:to|at)?\s*([0-9]+(?:\.[0-9]+)?)\s*(k|m)?\s*(?:rps|req\/s|requests)?/i
  );

  if (trafficMatch && (lower.includes('traffic') || lower.includes('load') || lower.includes('rps') || lower.includes('req/s'))) {
    let val = parseFloat(trafficMatch[1]);
    const unit = (trafficMatch[2] || '').toLowerCase();
    if (unit === 'k') val *= 1000;
    else if (unit === 'm') val *= 1000000;

    if (!isNaN(val) && val > 0) {
      const clamped = Math.min(Math.max(Math.round(val), 10), 100000);
      return {
        executed: true,
        actionType: 'update_traffic',
        updatedTrafficRate: clamped,
        explanation: `⚡ **Traffic Scaled: ${clamped.toLocaleString()} req/s**\n\n• Updated incoming request simulation rate\n• Live metrics recalculating throughput, p99 latency, and bottleneck flags.`,
      };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. SCALE NODE WORKERS / INSTANCES
  // Pattern: "scale backend to 5 instances" or "set database workers to 4"
  // ───────────────────────────────────────────────────────────────────────────
  const scaleMatch = lower.match(
    /(?:scale|set)\s+([a-z0-9_\-\s]+?)\s+(?:to|at)?\s*([0-9]+)\s*(?:instances|workers|pods|replicas)?/i
  );

  if (scaleMatch) {
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
  // 7. GENERAL QUERY / ADVICE
  // ───────────────────────────────────────────────────────────────────────────
  return {
    executed: false,
    actionType: 'general',
    explanation: `I've analyzed your instruction: "${text}".\n\nYou can give me live system actions such as:\n• **"add redis cache between API Gateway and Database"**\n• **"add PostgreSQL database"**\n• **"remove Redis"**\n• **"connect API Gateway to Service"**\n• **"scale Backend Service to 5 instances"**\n• **"set incoming traffic to 5000 req/s"**\n• **"what are the bottlenecks?"**\n\nWhat change would you like me to execute?`,
  };
}
