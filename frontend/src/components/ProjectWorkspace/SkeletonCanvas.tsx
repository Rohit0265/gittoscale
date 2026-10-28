import React from 'react';

export interface SkeletonCanvasProps {
  activePrompt?: string;
  viewMode?: 'basic' | 'detailed';
  isDark?: boolean;
}

// Node descriptor for the shimmer tree
interface SkeletonNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  bar1W: number; // title shimmer bar width %
  bar2W: number; // subtitle shimmer bar width %
}

// Edge (connector) between two nodes
interface SkeletonEdge {
  from: string;
  to: string;
}

// ─── Basic topology: ingress → gateway → [svc1, svc2] → [cache, db] ─────────
const BASIC_NODES: SkeletonNode[] = [
  { id: 'ingress',  x: 40,  y: 210, w: 130, h: 64, bar1W: 70, bar2W: 50 },
  { id: 'gateway',  x: 230, y: 210, w: 130, h: 64, bar1W: 80, bar2W: 55 },
  { id: 'svc1',     x: 420, y: 145, w: 120, h: 60, bar1W: 65, bar2W: 45 },
  { id: 'svc2',     x: 420, y: 275, w: 120, h: 60, bar1W: 60, bar2W: 40 },
  { id: 'cache',    x: 600, y: 145, w: 120, h: 60, bar1W: 55, bar2W: 35 },
  { id: 'db',       x: 600, y: 275, w: 120, h: 60, bar1W: 75, bar2W: 50 },
];

const BASIC_EDGES: SkeletonEdge[] = [
  { from: 'ingress', to: 'gateway' },
  { from: 'gateway', to: 'svc1' },
  { from: 'gateway', to: 'svc2' },
  { from: 'svc1',   to: 'cache' },
  { from: 'svc2',   to: 'db' },
];

// ─── Detailed topology: wider, denser tree ────────────────────────────────────
const DETAILED_NODES: SkeletonNode[] = [
  { id: 'cdn',      x: 20,  y: 195, w: 100, h: 52, bar1W: 55, bar2W: 35 },
  { id: 'lb',       x: 20,  y: 285, w: 100, h: 52, bar1W: 45, bar2W: 30 },
  { id: 'gw',       x: 180, y: 235, w: 110, h: 56, bar1W: 70, bar2W: 45 },
  { id: 'auth',     x: 350, y: 145, w: 110, h: 52, bar1W: 60, bar2W: 38 },
  { id: 'svc1',     x: 350, y: 220, w: 110, h: 52, bar1W: 65, bar2W: 42 },
  { id: 'svc2',     x: 350, y: 295, w: 110, h: 52, bar1W: 58, bar2W: 36 },
  { id: 'queue',    x: 350, y: 370, w: 110, h: 52, bar1W: 70, bar2W: 48 },
  { id: 'cache',    x: 525, y: 145, w: 105, h: 52, bar1W: 55, bar2W: 35 },
  { id: 'db1',      x: 525, y: 225, w: 105, h: 52, bar1W: 68, bar2W: 44 },
  { id: 'db2',      x: 525, y: 305, w: 105, h: 52, bar1W: 62, bar2W: 40 },
  { id: 'worker',   x: 525, y: 385, w: 105, h: 52, bar1W: 58, bar2W: 36 },
  { id: 'monitor',  x: 690, y: 255, w: 100, h: 52, bar1W: 65, bar2W: 42 },
];

const DETAILED_EDGES: SkeletonEdge[] = [
  { from: 'cdn',    to: 'gw' },
  { from: 'lb',     to: 'gw' },
  { from: 'gw',     to: 'auth' },
  { from: 'gw',     to: 'svc1' },
  { from: 'gw',     to: 'svc2' },
  { from: 'gw',     to: 'queue' },
  { from: 'svc1',   to: 'cache' },
  { from: 'svc1',   to: 'db1' },
  { from: 'svc2',   to: 'db2' },
  { from: 'queue',  to: 'worker' },
  { from: 'db1',    to: 'monitor' },
  { from: 'db2',    to: 'monitor' },
];

// Helper: compute edge midpoints for SVG path (right edge → left edge of target)
function edgePath(
  nodes: SkeletonNode[],
  from: string,
  to: string
): string {
  const s = nodes.find((n) => n.id === from);
  const t = nodes.find((n) => n.id === to);
  if (!s || !t) return '';
  const x1 = s.x + s.w;
  const y1 = s.y + s.h / 2;
  const x2 = t.x;
  const y2 = t.y + t.h / 2;
  const cx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
}

const CANVAS_W = 810;
const CANVAS_H = 490;

export const SkeletonCanvas: React.FC<SkeletonCanvasProps> = ({
  activePrompt,
  viewMode = 'basic',
}) => {
  const nodes  = viewMode === 'detailed' ? DETAILED_NODES  : BASIC_NODES;
  const edges  = viewMode === 'detailed' ? DETAILED_EDGES  : BASIC_EDGES;

  return (
    <div className="relative w-full h-full bg-slate-50 dark:bg-[#07080B] flex flex-col items-center justify-center select-none overflow-hidden">
      {/* Subtle dot-grid background */}
      <div
        className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:22px_22px] opacity-30 pointer-events-none"
        aria-hidden="true"
      />

      {/* Top progress bar shimmer */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-neutral-900 overflow-hidden z-20">
        <div className="h-full w-2/5 skeleton-shimmer-layer bg-neutral-300 dark:bg-neutral-700" />
      </div>

      {/* Main canvas area */}
      <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">

        {/* SVG tree + shimmer nodes */}
        <div className="relative flex-1 flex items-center justify-center px-4">
          <svg
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            className="w-full h-full max-h-[480px]"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* ── Edges ── */}
            {edges.map((e) => (
              <path
                key={`${e.from}-${e.to}`}
                d={edgePath(nodes, e.from, e.to)}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="5 4"
                className="text-slate-300 dark:text-neutral-700"
                opacity="0.7"
              />
            ))}

            {/* ── Nodes ── */}
            {nodes.map((n) => (
              <g key={n.id}>
                {/* Card background */}
                <rect
                  x={n.x}
                  y={n.y}
                  width={n.w}
                  height={n.h}
                  rx="8"
                  ry="8"
                  className="fill-slate-200 dark:fill-neutral-800 stroke-slate-300 dark:stroke-neutral-700"
                  strokeWidth="1"
                />

                {/* Shimmer sweep overlay — rendered as a foreignObject for CSS animation */}
                <foreignObject x={n.x} y={n.y} width={n.w} height={n.h}>
                  <div
                    // @ts-expect-error xmlns on div is fine inside foreignObject
                    xmlns="http://www.w3.org/1999/xhtml"
                    className="w-full h-full rounded-lg overflow-hidden"
                  >
                    <div className="skeleton-shimmer-layer w-full h-full" />
                  </div>
                </foreignObject>

                {/* Title bar shimmer */}
                <rect
                  x={n.x + 12}
                  y={n.y + 16}
                  width={(n.w - 24) * (n.bar1W / 100)}
                  height="10"
                  rx="4"
                  className="fill-slate-300 dark:fill-neutral-700"
                />
                {/* Subtitle bar shimmer */}
                <rect
                  x={n.x + 12}
                  y={n.y + 33}
                  width={(n.w - 24) * (n.bar2W / 100)}
                  height="8"
                  rx="4"
                  className="fill-slate-200 dark:fill-neutral-700/60"
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Bottom prompt strip */}
        {activePrompt && (
          <div className="relative z-10 px-5 py-3 border-t border-slate-200/70 dark:border-neutral-800/70 flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-500 bg-slate-50/80 dark:bg-[#07080B]/80 backdrop-blur-sm">
            <span className="font-medium text-slate-700 dark:text-neutral-300 shrink-0">Active Prompt:</span>
            <span className="truncate italic">"{activePrompt}"</span>
            {/* Animated loading dots */}
            <span className="shrink-0 flex items-center gap-[3px] ml-1">
              <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-neutral-500 animate-bounce [animation-delay:0ms]" />
              <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-neutral-500 animate-bounce [animation-delay:150ms]" />
              <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-neutral-500 animate-bounce [animation-delay:300ms]" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkeletonCanvas;
