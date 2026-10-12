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

  // 1. Separate components into columns
  const colLeft = components.filter(
    (c) => c.type === 'load_generator' || c.type === 'gateway'
  );
  const colCenter = components.filter((c) => c.type === 'service');
  const colRight = components.filter(
    (c) => c.type === 'cache' || c.type === 'database'
  );

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
          entryPoint: comp.entryPoint,
          startupCommand: comp.startupCommand,
          sourceFiles: comp.sourceFiles,
          confidence: comp.confidence,
          reason: comp.reason,
        },
      });
    });
  };

  layoutColumn(colLeft, 50, 100, 160);
  layoutColumn(colCenter, 420, 80, 160);
  layoutColumn(colRight, 800, 100, 160);

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

