import { ArchitectureNode, ArchitectureEdge } from '../simulation/types.js';
import { LLMAnalysisResult } from './repoAnalysisTypes.js';

/**
 * Converts validated LLM analysis results into React Flow compatible nodes & edges
 * with automatic horizontal multi-layer layout:
 * Left: Entry/Traffic & Gateways
 * Center: Backend microservices & Workers
 * Right: Caches, Databases & Queues
 */
export function convertAnalysisToArchitecture(analysis: LLMAnalysisResult): {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
} {
  const { components, connections } = analysis;

  // 1. Separate components into logical architectural tiers
  // Tier 1: User / Clients
  const colUser = components.filter((c) => c.type === 'load_generator');
  // Tier 2: Frontend & API Gateways
  const colGateway = components.filter((c) => c.type === 'gateway' || c.category === 'Chat interface');
  // Tier 3: Core backend microservices & workflows
  const colServices = components.filter(
    (c) =>
      c.type === 'service' &&
      c.category !== 'Chat interface' &&
      c.category !== 'External Services'
  );
  // Tier 4: Databases, Caches & Queues
  const colData = components.filter((c) => c.type === 'cache' || c.type === 'database');
  // Tier 5: External Providers (Firebase, Razorpay, LLMs)
  const colExternal = components.filter((c) => c.category === 'External Services');

  const nodes: ArchitectureNode[] = [];

  const layoutColumn = (
    list: typeof components,
    baseX: number,
    baseY: number,
    spacingY: number
  ) => {
    list.forEach((comp, idx) => {
      nodes.push({
        id: comp.id,
        name: comp.name,
        type: comp.type,
        position: {
          x: baseX,
          y: baseY + idx * spacingY,
        },
        capacityPerSecond: comp.estimatedCapacity || (comp.type === 'database' ? 3000 : 1500),
        workerCount: comp.defaultWorkers || (comp.type === 'gateway' ? 4 : 2),
        enabled: true,
        config: {
          baselineLatencyMs: comp.type === 'database' ? 15 : comp.type === 'cache' ? 2 : 10,
          maxQueueSize: comp.type === 'database' ? 4000 : 2000,
          overflowPolicy: 'reject',
          isSource: comp.type === 'load_generator',
          defaultTrafficRate: comp.type === 'load_generator' ? 1000 : undefined,
          // Evidence attributes for inspector panel
          category: comp.category,
          group: comp.group,
          entryPoint: comp.entryPoint,
          startupCommand: comp.startupCommand,
          sourceFiles: comp.sourceFiles,
          confidence: comp.confidence,
          reason: comp.reason,
        },
      });
    });
  };

  layoutColumn(colUser, 40, 180, 160);
  layoutColumn(colGateway, 320, 100, 160);
  layoutColumn(colServices, 620, 60, 160);
  layoutColumn(colData, 920, 100, 160);
  layoutColumn(colExternal, 1220, 120, 160);

  // 2. Generate initial edges from analysis connections
  const validNodeIds = new Set(nodes.map((n) => n.id));
  const rawEdges: ArchitectureEdge[] = connections
    .filter((conn) => validNodeIds.has(conn.source) && validNodeIds.has(conn.target) && conn.source !== conn.target)
    .map((conn, idx) => ({
      id: `edge-${idx + 1}-${conn.source}-${conn.target}`,
      source: conn.source,
      target: conn.target,
      requestsPerInput: conn.requestsPerInput ?? 1.0,
      enabled: true,
      isBidirectional: conn.isBidirectional ?? (conn.communicationType === 'http' || conn.communicationType === 'db' || conn.communicationType === 'cache'),
      label: conn.reference,
      dataFlowDescription: conn.dataFlowDescription || `${conn.communicationType.toUpperCase()} flow between ${conn.source} and ${conn.target}`,
    }));

  // 3. Auto-heal any orphaned or unlinked nodes to guarantee a cohesive, complete flow
  const edges = autoHealArchitectureFlow(nodes, rawEdges);

  return { nodes, edges };
}

/**
 * Ensures all nodes in the architecture have proper inbound/outbound connectivity.
 * If any node is stranded or disconnected from upstream/downstream flow, auto-connects
 * it to the appropriate gateway, service, or datastore according to architectural roles.
 */
export function autoHealArchitectureFlow(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): ArchitectureEdge[] {
  const edgeList = [...edges];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();
  for (const n of nodes) {
    inDegree.set(n.id, 0);
    outDegree.set(n.id, 0);
  }

  for (const e of edgeList) {
    if (inDegree.has(e.target)) inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    if (outDegree.has(e.source)) outDegree.set(e.source, (outDegree.get(e.source) || 0) + 1);
  }

  const userNode = nodes.find((n) => n.type === 'load_generator');
  const gatewayNodes = nodes.filter((n) => n.type === 'gateway');
  const frontendNodes = nodes.filter(
    (n) => n.config?.category === 'Chat interface' || n.name.toLowerCase().includes('frontend') || n.name.toLowerCase().includes('client')
  );
  const coreServices = nodes.filter(
    (n) =>
      n.type === 'service' &&
      n.config?.category !== 'Chat interface' &&
      n.config?.category !== 'External Services'
  );
  const dataStores = nodes.filter((n) => n.type === 'database' || n.type === 'cache');
  const externalServices = nodes.filter((n) => n.config?.category === 'External Services');

  const primaryEntry =
    frontendNodes[0] || gatewayNodes[0] || coreServices[0];

  // 1. Connect user load generator to primary entrypoint if unlinked
  if (userNode && primaryEntry && (outDegree.get(userNode.id) || 0) === 0) {
    edgeList.unshift({
      id: `auto-edge-${userNode.id}-${primaryEntry.id}`,
      source: userNode.id,
      target: primaryEntry.id,
      requestsPerInput: 1.0,
      enabled: true,
      isBidirectional: true,
      label: 'Traffic Inflow',
      dataFlowDescription: 'User traffic and requests to primary interface',
    });
    outDegree.set(userNode.id, 1);
    inDegree.set(primaryEntry.id, (inDegree.get(primaryEntry.id) || 0) + 1);
  }

  // 2. Connect frontend to gateway if gateway exists and not already connected
  if (frontendNodes.length > 0 && gatewayNodes.length > 0) {
    const fNode = frontendNodes[0];
    const gNode = gatewayNodes[0];
    if (!edgeList.some((e) => e.source === fNode.id && e.target === gNode.id)) {
      edgeList.push({
        id: `auto-edge-${fNode.id}-${gNode.id}`,
        source: fNode.id,
        target: gNode.id,
        requestsPerInput: 1.0,
        enabled: true,
        isBidirectional: true,
        label: 'API Proxy',
        dataFlowDescription: 'Frontend client proxies API calls through API Gateway',
      });
      outDegree.set(fNode.id, (outDegree.get(fNode.id) || 0) + 1);
      inDegree.set(gNode.id, (inDegree.get(gNode.id) || 0) + 1);
    }
  }

  // 3. For any core service with 0 inbound connections, route from primary gateway / entry
  const hubNode = gatewayNodes[0] || frontendNodes[0];
  if (hubNode) {
    for (const s of coreServices) {
      if ((inDegree.get(s.id) || 0) === 0 && s.id !== hubNode.id) {
        edgeList.push({
          id: `auto-edge-${hubNode.id}-${s.id}`,
          source: hubNode.id,
          target: s.id,
          requestsPerInput: 1.0,
          enabled: true,
          isBidirectional: true,
          label: 'Route Request',
          dataFlowDescription: `Gateway routes authenticated calls to ${s.name}`,
        });
        outDegree.set(hubNode.id, (outDegree.get(hubNode.id) || 0) + 1);
        inDegree.set(s.id, 1);
      }
    }
  }

  // 4. For any datastore with 0 inbound connections, connect to relevant service or nearest backend service
  for (const ds of dataStores) {
    if ((inDegree.get(ds.id) || 0) === 0) {
      const lowerDsName = ds.name.toLowerCase();
      // Match by service topic if applicable
      const matchedService =
        coreServices.find((s) => {
          const sName = s.name.toLowerCase();
          if (lowerDsName.includes('redis') || lowerDsName.includes('session')) {
            return sName.includes('auth') || sName.includes('gateway');
          }
          if (lowerDsName.includes('user')) return sName.includes('auth');
          if (lowerDsName.includes('chat') || lowerDsName.includes('message')) return sName.includes('chat');
          if (lowerDsName.includes('billing') || lowerDsName.includes('payment')) return sName.includes('billing');
          return false;
        }) || coreServices[0] || hubNode;

      if (matchedService && matchedService.id !== ds.id) {
        edgeList.push({
          id: `auto-edge-${matchedService.id}-${ds.id}`,
          source: matchedService.id,
          target: ds.id,
          requestsPerInput: 1.0,
          enabled: true,
          isBidirectional: true,
          label: 'Data Persistence',
          dataFlowDescription: `${matchedService.name} queries and updates records in ${ds.name}`,
        });
        outDegree.set(matchedService.id, (outDegree.get(matchedService.id) || 0) + 1);
        inDegree.set(ds.id, 1);
      }
    }
  }

  // 5. For any external provider (Firebase, Razorpay, LLMs) with 0 inbound connections
  for (const ext of externalServices) {
    if ((inDegree.get(ext.id) || 0) === 0) {
      const lowerExt = ext.name.toLowerCase();
      const matchedService =
        coreServices.find((s) => {
          const sName = s.name.toLowerCase();
          if (lowerExt.includes('firebase') || lowerExt.includes('auth')) return sName.includes('auth');
          if (lowerExt.includes('llm') || lowerExt.includes('ai') || lowerExt.includes('openai')) return sName.includes('agent') || sName.includes('chat');
          if (lowerExt.includes('razorpay') || lowerExt.includes('payment') || lowerExt.includes('stripe')) return sName.includes('billing');
          return false;
        }) || coreServices[0];

      if (matchedService && matchedService.id !== ext.id) {
        edgeList.push({
          id: `auto-edge-${matchedService.id}-${ext.id}`,
          source: matchedService.id,
          target: ext.id,
          requestsPerInput: 1.0,
          enabled: true,
          isBidirectional: true,
          label: 'Third-Party Integration',
          dataFlowDescription: `${matchedService.name} connects to external API ${ext.name}`,
        });
        outDegree.set(matchedService.id, (outDegree.get(matchedService.id) || 0) + 1);
        inDegree.set(ext.id, 1);
      }
    }
  }

  return edgeList;
}

