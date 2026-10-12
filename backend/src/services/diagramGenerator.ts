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

  // 2. Generate directed edges
  const edges: ArchitectureEdge[] = connections.map((conn, idx) => ({
    id: `edge-${idx + 1}-${conn.source}-${conn.target}`,
    source: conn.source,
    target: conn.target,
    requestsPerInput: conn.requestsPerInput ?? 1.0,
    enabled: true,
  }));

  return { nodes, edges };
}

