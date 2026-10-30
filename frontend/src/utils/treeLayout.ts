import { ArchitectureNode, ArchitectureEdge } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Vertical Tree Auto-Layout
// Computes top-to-bottom BFS-level positions so the canvas renders with clean,
// generous spacing without shrinking or cramming nodes into narrow columns.
// Node card on canvas is w-64 (256px wide) with ~100-140px height.
// ─────────────────────────────────────────────────────────────────────────────
const NODE_W = 260; // Card width representation
const NODE_H = 100; // Card base height
const H_GAP  = 160; // Horizontal gap between sibling nodes (center-to-center = 420px)
const V_GAP  = 140; // Vertical gap between levels (level step = NODE_H + V_GAP = 240px)

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

  // Determine anchor center X and start Y from existing node positions
  const validXs = nodes
    .map((n) => n.position?.x)
    .filter((x): x is number => typeof x === 'number' && !isNaN(x) && x > 0);
  const minX = validXs.length ? Math.min(...validXs) : 100;
  const maxX = validXs.length ? Math.max(...validXs) : 1100;
  const anchorCenterX = validXs.length ? Math.round((minX + maxX) / 2) : 600;
  const startY = 40;

  // Assign x,y positions centred around anchorCenterX and starting at startY (step = 240px)
  const posMap = new Map<string, { x: number; y: number }>();
  byLevel.forEach((levelNodes, lvl) => {
    const totalW = levelNodes.length * NODE_W + (levelNodes.length - 1) * H_GAP;
    const startX = Math.round(anchorCenterX - totalW / 2);
    levelNodes.forEach((id, i) => {
      posMap.set(id, {
        x: startX + i * (NODE_W + H_GAP),
        y: startY + lvl * (NODE_H + V_GAP),
      });
    });
  });

  return nodes.map((n) => ({
    ...n,
    position: posMap.get(n.id) ?? n.position,
  }));
}
