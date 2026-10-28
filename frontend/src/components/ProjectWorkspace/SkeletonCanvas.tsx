import React from 'react';

export interface SkeletonCanvasProps {
  activePrompt?: string;
  viewMode?: 'basic' | 'detailed';
  isDark?: boolean;
}

interface SkeletonNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  bar1W: number; // title bar width %
  bar2W: number; // subtitle bar width %
}

interface SkeletonEdge {
  from: string;
  to: string;
}

// ─── BASIC: 6-node top-to-bottom tree ────────────────────────────────────────
//
//              [ingress]
//                  │
//              [gateway]
//             ╱         ╲
//         [svc1]       [svc2]
//           │               │
//        [cache]          [db]
//
const BASIC_W = 560;
const BASIC_H = 440;

const BASIC_NODES: SkeletonNode[] = [
  { id: 'ingress', x: 215, y: 20,  w: 130, h: 56, bar1W: 70, bar2W: 50 },
  { id: 'gateway', x: 215, y: 128, w: 130, h: 56, bar1W: 80, bar2W: 55 },
  { id: 'svc1',    x: 60,  y: 240, w: 120, h: 52, bar1W: 65, bar2W: 45 },
  { id: 'svc2',    x: 380, y: 240, w: 120, h: 52, bar1W: 60, bar2W: 42 },
  { id: 'cache',   x: 20,  y: 352, w: 110, h: 52, bar1W: 55, bar2W: 36 },
  { id: 'db',      x: 430, y: 352, w: 110, h: 52, bar1W: 72, bar2W: 50 },
];

const BASIC_EDGES: SkeletonEdge[] = [
  { from: 'ingress', to: 'gateway' },
  { from: 'gateway', to: 'svc1' },
  { from: 'gateway', to: 'svc2' },
  { from: 'svc1',   to: 'cache' },
  { from: 'svc2',   to: 'db' },
];

// ─── DETAILED: 11-node deep vertical tree ────────────────────────────────────
//
//          [cdn]               [lb]
//              ╲              ╱
//                  [gateway]
//          ╱       │      │       ╲
//      [auth]   [svc1] [svc2]  [queue]
//         │       │      │        │
//      [cache]  [db1]  [db2]  [worker]
//                    ╲ ╱
//                 [monitor]
//
const DETAIL_W = 640;
const DETAIL_H = 520;

const DETAIL_NODES: SkeletonNode[] = [
  { id: 'cdn',     x: 50,  y: 20,  w: 105, h: 48, bar1W: 55, bar2W: 36 },
  { id: 'lb',      x: 485, y: 20,  w: 105, h: 48, bar1W: 45, bar2W: 30 },
  { id: 'gateway', x: 215, y: 124, w: 130, h: 52, bar1W: 78, bar2W: 52 },
  { id: 'auth',    x: 30,  y: 242, w: 105, h: 48, bar1W: 60, bar2W: 38 },
  { id: 'svc1',    x: 160, y: 242, w: 105, h: 48, bar1W: 65, bar2W: 44 },
  { id: 'svc2',    x: 375, y: 242, w: 105, h: 48, bar1W: 58, bar2W: 38 },
  { id: 'queue',   x: 505, y: 242, w: 105, h: 48, bar1W: 68, bar2W: 46 },
  { id: 'cache',   x: 30,  y: 354, w: 100, h: 48, bar1W: 54, bar2W: 34 },
  { id: 'db1',     x: 158, y: 354, w: 100, h: 48, bar1W: 66, bar2W: 42 },
  { id: 'db2',     x: 377, y: 354, w: 100, h: 48, bar1W: 60, bar2W: 40 },
  { id: 'worker',  x: 507, y: 354, w: 100, h: 48, bar1W: 56, bar2W: 36 },
  { id: 'monitor', x: 245, y: 456, w: 110, h: 48, bar1W: 64, bar2W: 42 },
];

const DETAIL_EDGES: SkeletonEdge[] = [
  { from: 'cdn',     to: 'gateway' },
  { from: 'lb',      to: 'gateway' },
  { from: 'gateway', to: 'auth' },
  { from: 'gateway', to: 'svc1' },
  { from: 'gateway', to: 'svc2' },
  { from: 'gateway', to: 'queue' },
  { from: 'auth',    to: 'cache' },
  { from: 'svc1',    to: 'db1' },
  { from: 'svc2',    to: 'db2' },
  { from: 'queue',   to: 'worker' },
  { from: 'db1',     to: 'monitor' },
  { from: 'db2',     to: 'monitor' },
];

/**
 * Vertical cubic-bezier edge path.
 * Source: bottom-center of `from` node → Target: top-center of `to` node.
 */
function vEdgePath(nodes: SkeletonNode[], from: string, to: string): string {
  const s = nodes.find((n) => n.id === from);
  const t = nodes.find((n) => n.id === to);
  if (!s || !t) return '';

  const x1 = s.x + s.w / 2;
  const y1 = s.y + s.h;
  const x2 = t.x + t.w / 2;
  const y2 = t.y;
  const cy = (y1 + y2) / 2;

  return `M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`;
}

export const SkeletonCanvas: React.FC<SkeletonCanvasProps> = ({
  activePrompt,
  viewMode = 'basic',
}) => {
  const nodes  = viewMode === 'detailed' ? DETAIL_NODES  : BASIC_NODES;
  const edges  = viewMode === 'detailed' ? DETAIL_EDGES  : BASIC_EDGES;
  const vbW    = viewMode === 'detailed' ? DETAIL_W      : BASIC_W;
  const vbH    = viewMode === 'detailed' ? DETAIL_H      : BASIC_H;

  return (
    <div className="relative w-full h-full bg-slate-50 dark:bg-[#07080B] flex flex-col items-center justify-between select-none overflow-hidden">

      {/* Subtle dot-grid background */}
      <div
        className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:22px_22px] opacity-25 pointer-events-none"
        aria-hidden="true"
      />

      {/* Top progress shimmer bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden z-20">
        <div className="h-full w-2/5 skeleton-shimmer-layer bg-neutral-300 dark:bg-neutral-700" />
      </div>

      {/* ── Main SVG Tree ── */}
      <div className="relative flex-1 w-full flex items-center justify-center px-4 py-6 overflow-hidden">
        <svg
          viewBox={`0 0 ${vbW} ${vbH}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full max-h-[520px]"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* ── Edges (draw first, behind nodes) ── */}
          {edges.map((e) => (
            <path
              key={`${e.from}-${e.to}`}
              d={vEdgePath(nodes, e.from, e.to)}
              fill="none"
              strokeWidth="1.5"
              strokeDasharray="5 4"
              className="stroke-slate-300 dark:stroke-neutral-700"
              opacity="0.8"
            />
          ))}

          {/* ── Nodes ── */}
          {nodes.map((n) => (
            <g key={n.id}>
              {/* Card background rect */}
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

              {/* Shimmer sweep via foreignObject */}
              <foreignObject x={n.x} y={n.y} width={n.w} height={n.h}>
                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                {/* @ts-ignore */}
                <div xmlns="http://www.w3.org/1999/xhtml" className="w-full h-full rounded-lg overflow-hidden">
                  <div className="skeleton-shimmer-layer w-full h-full" />
                </div>
              </foreignObject>

              {/* Title shimmer bar */}
              <rect
                x={n.x + 12}
                y={n.y + 14}
                width={(n.w - 24) * (n.bar1W / 100)}
                height="10"
                rx="4"
                className="fill-slate-300 dark:fill-neutral-700"
              />

              {/* Subtitle shimmer bar */}
              <rect
                x={n.x + 12}
                y={n.y + 30}
                width={(n.w - 24) * (n.bar2W / 100)}
                height="8"
                rx="4"
                className="fill-slate-200 dark:fill-neutral-600/70"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* ── Bottom prompt strip ── */}
      {activePrompt && (
        <div className="relative z-10 w-full px-5 py-2.5 border-t border-slate-200/70 dark:border-neutral-800/70 flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-500 bg-slate-50/90 dark:bg-[#07080B]/90 backdrop-blur-sm shrink-0">
          <span className="font-medium text-slate-700 dark:text-neutral-300 shrink-0">
            Active Prompt:
          </span>
          <span className="truncate italic">"{activePrompt}"</span>
          {/* Animated loading dots */}
          <span className="shrink-0 flex items-center gap-[3px] ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-neutral-500 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-neutral-500 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-neutral-500 animate-bounce [animation-delay:300ms]" />
          </span>
        </div>
      )}
    </div>
  );
};

export default SkeletonCanvas;
