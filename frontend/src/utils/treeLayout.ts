import { ArchitectureNode, ArchitectureEdge } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Vertical Tree Auto-Layout
// Takes a flat list of nodes + directed edges and computes top-to-bottom
// BFS-level positions so the canvas renders as a proper tree (root → leaves).
// NODE_W / NODE_H approximate the ReactFlow custom node size.
// ─────────────────────────────────────────────────────────────────────────────
const NODE_W = 220;
const NODE_H = 80;
const H_GAP  = 40;  // horizontal gap between sibling nodes
const V_GAP  = 80;  // vertical gap between levels

export function toVerticalTree(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): ArchitectureNode[] {
  if (nodes.length === 0) return nodes;

  // Build adjacency maps
  const children = new Map<string, string[]>();
  const parentCount = new Map<string, number>();
  nodes.forEach((n) => { children.set(n.id, []); parentCount.set(n.id, 0); });
  edges.forEach((e) => {
    if (children.has(e.source) && parentCount.has(e.target)) {
      children.get(e.source)!.push(e.target);
      parentCount.set(e.target, (parentCount.get(e.target) ?? 0) + 1);
    }
  });

  // Find roots (nodes with no incoming edges)
  let roots = nodes.filter((n) => (parentCount.get(n.id) ?? 0) === 0).map((n) => n.id);
  // Fallback: if no roots (cycle), pick first node
  if (roots.length === 0) roots = [nodes[0].id];

  // BFS to assign levels
  const levelOf = new Map<string, number>();
  const queue: string[] = [...roots];
  roots.forEach((r) => levelOf.set(r, 0));
  const visited = new Set<string>(roots);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const lvl = levelOf.get(curr) ?? 0;
    for (const child of (children.get(curr) ?? [])) {
      // Take the maximum level (longest path from any root)
      const existing = levelOf.get(child) ?? -1;
      if (lvl + 1 > existing) levelOf.set(child, lvl + 1);
      if (!visited.has(child)) {
        visited.add(child);
        queue.push(child);
      }
    }
  }

  // Group nodes by level
  const maxLevel = Math.max(...Array.from(levelOf.values()));
  const byLevel: string[][] = Array.from({ length: maxLevel + 1 }, () => []);
  // Nodes not visited (disconnected) go to last level
  nodes.forEach((n) => {
    const lvl = levelOf.get(n.id) ?? maxLevel;
    byLevel[lvl].push(n.id);
  });

  // Assign x,y positions centred around x=0
  const posMap = new Map<string, { x: number; y: number }>();
  byLevel.forEach((levelNodes, lvl) => {
    const totalW = levelNodes.length * NODE_W + (levelNodes.length - 1) * H_GAP;
    const startX = -totalW / 2;
    levelNodes.forEach((id, i) => {
      posMap.set(id, {
        x: startX + i * (NODE_W + H_GAP),
        y: lvl * (NODE_H + V_GAP),
      });
    });
  });

  return nodes.map((n) => ({
    ...n,
    position: posMap.get(n.id) ?? n.position,
  }));
}

