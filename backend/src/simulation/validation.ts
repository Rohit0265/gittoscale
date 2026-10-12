import { z } from 'zod';

export const nodeConfigSchema = z.object({
  baselineLatencyMs: z.number().min(0).default(10),
  maxQueueSize: z.number().min(0).default(2000),
  overflowPolicy: z.enum(['drop', 'reject']).default('reject'),
  isSource: z.boolean().optional(),
  defaultTrafficRate: z.number().min(0).optional(),
}).passthrough();

export const architectureNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['load_generator', 'gateway', 'service', 'cache', 'database']),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  capacityPerSecond: z.number().min(0),
  workerCount: z.number().int().min(1),
  enabled: z.boolean().default(true),
  config: nodeConfigSchema,
});

export const architectureEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  requestsPerInput: z.number().min(0).max(100),
  enabled: z.boolean().default(true),
  isBidirectional: z.boolean().optional(),
  label: z.string().optional(),
  dataFlowDescription: z.string().optional(),
});

export const simulationInputSchema = z.object({
  architectureId: z.string().optional(),
  nodes: z.array(architectureNodeSchema).min(1).max(100),
  edges: z.array(architectureEdgeSchema).max(200),
  incomingTrafficRate: z.number().min(0).max(1000000).default(1000),
  durationSeconds: z.number().int().min(1).max(3600).default(60),
  scenarioId: z.string().optional(),
});

export type SimulationInput = z.infer<typeof simulationInputSchema>;

/**
 * Validates graph structure and detects cycles among enabled nodes and edges.
 * Uses Tarjan's or DFS color marking (WHITE=0, GRAY=1, BLACK=2) to detect cycles.
 */
export function validateGraphAcyclic(
  nodes: Array<{ id: string; enabled: boolean }>,
  edges: Array<{ source: string; target: string; enabled: boolean }>
): { hasCycle: boolean; cyclePath?: string[] } {
  const enabledNodes = new Set(nodes.filter(n => n.enabled).map(n => n.id));
  const adj = new Map<string, string[]>();

  for (const n of enabledNodes) {
    adj.set(n, []);
  }

  for (const edge of edges) {
    if (edge.enabled && enabledNodes.has(edge.source) && enabledNodes.has(edge.target)) {
      adj.get(edge.source)?.push(edge.target);
    }
  }

  const visited = new Map<string, 0 | 1 | 2>(); // 0: unvisited, 1: visiting, 2: finished
  for (const n of enabledNodes) {
    visited.set(n, 0);
  }

  const path: string[] = [];
  let cycleFound: string[] | null = null;

  function dfs(u: string): boolean {
    visited.set(u, 1);
    path.push(u);

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      const state = visited.get(v);
      if (state === 1) {
        // Cycle detected
        const cycleStartIndex = path.indexOf(v);
        cycleFound = path.slice(cycleStartIndex).concat(v);
        return true;
      }
      if (state === 0) {
        if (dfs(v)) return true;
      }
    }

    path.pop();
    visited.set(u, 2);
    return false;
  }

  for (const n of enabledNodes) {
    if (visited.get(n) === 0) {
      if (dfs(n)) {
        return { hasCycle: true, cyclePath: cycleFound || [] };
      }
    }
  }

  return { hasCycle: false };
}

