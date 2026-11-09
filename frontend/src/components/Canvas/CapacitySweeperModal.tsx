import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  X,
  AlertTriangle,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Server,
  Layers,
} from 'lucide-react';
import { ArchitectureNode, ArchitectureEdge } from '../../types';
import { runCapacitySweep, SweepDataPoint } from '../../utils/capacitySweeper';

interface CapacitySweeperModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  currentTrafficRps?: number;
  onApplyScaling: (updatedNodes: ArchitectureNode[]) => void;
  isDark?: boolean;
}

export const CapacitySweeperModal: React.FC<CapacitySweeperModalProps> = ({
  isOpen,
  onClose,
  nodes,
  edges,
  currentTrafficRps = 1000,
  onApplyScaling,
  isDark = true,
}) => {
  const [slaTargetMs, setSlaTargetMs] = useState<number>(100);
  const [targetScaleRps, setTargetScaleRps] = useState<number>(() => Math.max(2500, currentTrafficRps * 2));
  const [hoveredPoint, setHoveredPoint] = useState<SweepDataPoint | null>(null);
  const [isApplied, setIsApplied] = useState(false);

  const report = useMemo(() => {
    return runCapacitySweep(nodes, edges, slaTargetMs, targetScaleRps, currentTrafficRps);
  }, [nodes, edges, slaTargetMs, targetScaleRps, currentTrafficRps]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (report.recommendations.length === 0) return;
    const recommendationMap = new Map(report.recommendations.map((r) => [r.nodeId, r.recommendedWorkers]));
    const updated = nodes.map((node) => {
      const rec = recommendationMap.get(node.id);
      if (rec !== undefined) {
        return {
          ...node,
          workerCount: rec,
        };
      }
      return node;
    });

    onApplyScaling(updated);
    setIsApplied(true);
    setTimeout(() => {
      setIsApplied(false);
      onClose();
    }, 900);
  };

  // SVG Chart Dimensions
  const chartWidth = 560;
  const chartHeight = 220;
  const padding = { top: 20, right: 30, bottom: 35, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const maxRps = 12000;
  const maxLatency = Math.max(slaTargetMs * 1.8, Math.max(...report.dataPoints.map((d) => d.p99LatencyMs), 150));

  const getX = (rps: number) => padding.left + (rps / maxRps) * innerWidth;
  const getY = (lat: number) => padding.top + innerHeight - (Math.min(lat, maxLatency) / maxLatency) * innerHeight;

  // Build SVG path points
  const points = report.dataPoints.map((d) => ({
    x: getX(d.rps),
    y: getY(d.p99LatencyMs),
    raw: d,
  }));

  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`;

  const slaY = getY(slaTargetMs);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="capacity-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-xl shadow-2xl p-5 sm:p-6 text-slate-800 dark:text-neutral-200 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 id="capacity-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Capacity Sweeper & Breaking Point Analyzer
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Deterministic mathematical saturation curve and safe SLA limits
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-3 gap-2.5 my-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/70 dark:border-neutral-800">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-neutral-400 block mb-0.5">
              Saturation Cliff
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black font-mono text-rose-600 dark:text-rose-400">
                {report.breakingPointRps.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-mono">req/s</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-neutral-400 truncate block mt-0.5" title={report.firstFailingNodeName}>
              Choke: <strong className="text-slate-700 dark:text-neutral-200">{report.firstFailingNodeName}</strong>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/40">
            <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-600 dark:text-indigo-400 block mb-0.5">
              Safe Capacity (SLA &lt; {slaTargetMs}ms)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
                {report.maxSafeSlaRps.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-mono">req/s</span>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
              {report.headroomPercentage >= 0 ? `+${report.headroomPercentage}% headroom` : `${report.headroomPercentage}% deficit`}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/70 dark:border-neutral-800">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-neutral-400 block mb-0.5">
              Current Operating Load
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                {report.currentRps.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-mono">req/s</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-neutral-400 block mt-0.5">
              Current P99: <span className="font-mono font-semibold text-slate-800 dark:text-neutral-200">{report.currentP99Ms}ms</span>
            </span>
          </div>
        </div>

        {/* SLA Target Selector */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900/40 border border-slate-200/60 dark:border-neutral-800 mb-3">
          <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
            Target P99 Latency SLA Budget:
          </span>
          <div className="flex items-center gap-1.5">
            {[50, 100, 200].map((sla) => (
              <button
                key={sla}
                type="button"
                onClick={() => setSlaTargetMs(sla)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  slaTargetMs === sla
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-neutral-700'
                }`}
              >
                {sla}ms
              </button>
            ))}
          </div>
        </div>

        {/* Authored SVG Hockey Stick Saturation Curve */}
        <div className="relative rounded-xl border border-slate-200/80 dark:border-neutral-800 bg-white dark:bg-[#070709] p-2 mb-4">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-44 overflow-visible"
          >
            <defs>
              <linearGradient id="indigoAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            {[0.25, 0.5, 0.75, 1.0].map((ratio) => {
              const y = padding.top + innerHeight * (1 - ratio);
              const val = Math.round(maxLatency * ratio);
              return (
                <g key={ratio}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + innerWidth}
                    y2={y}
                    stroke={isDark ? '#222' : '#e2e8f0'}
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[9px] fill-slate-400 dark:fill-neutral-500 font-mono"
                  >
                    {val}ms
                  </text>
                </g>
              );
            })}

            {/* X-Axis labels */}
            {[2000, 4000, 6000, 8000, 10000, 12000].map((rpsVal) => {
              const x = getX(rpsVal);
              return (
                <g key={rpsVal}>
                  <line
                    x1={x}
                    y1={padding.top + innerHeight}
                    x2={x}
                    y2={padding.top + innerHeight + 4}
                    stroke={isDark ? '#444' : '#cbd5e1'}
                  />
                  <text
                    x={x}
                    y={padding.top + innerHeight + 16}
                    textAnchor="middle"
                    className="text-[9px] fill-slate-400 dark:fill-neutral-500 font-mono"
                  >
                    {rpsVal / 1000}k
                  </text>
                </g>
              );
            })}

            {/* SLA Budget Threshold Line */}
            {slaY >= padding.top && slaY <= padding.top + innerHeight && (
              <g>
                <line
                  x1={padding.left}
                  y1={slaY}
                  x2={padding.left + innerWidth}
                  y2={slaY}
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left + innerWidth - 6}
                  y={slaY - 4}
                  textAnchor="end"
                  className="text-[9px] fill-amber-500 font-mono font-bold"
                >
                  SLA Target ({slaTargetMs}ms)
                </text>
              </g>
            )}

            {/* Area & Line */}
            <path d={areaD} fill="url(#indigoAreaGradient)" />
            <path
              d={pathD}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {points.map((p, idx) => {
              const isHovered = hoveredPoint?.rps === p.raw.rps;
              const isViolated = p.raw.isSlaViolated;
              return (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 5.5 : isViolated ? 3.5 : 2.5}
                  fill={isViolated ? '#ef4444' : '#6366f1'}
                  stroke={isDark ? '#0c0c0e' : '#ffffff'}
                  strokeWidth={1.5}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredPoint(p.raw)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            })}
          </svg>

          {/* Hover Tooltip Overlay */}
          {hoveredPoint && (
            <div className="absolute top-2 right-2 p-2 rounded-lg bg-slate-900/90 dark:bg-neutral-800/90 backdrop-blur-md border border-slate-700/80 text-[11px] text-white shadow-xl pointer-events-none">
              <div className="font-mono font-bold text-indigo-300">
                {hoveredPoint.rps.toLocaleString()} req/s
              </div>
              <div className="text-slate-300">
                P99 Latency: <span className="font-mono font-bold text-white">{hoveredPoint.p99LatencyMs}ms</span>
              </div>
              <div className="text-slate-400 text-[10px]">
                Bottleneck: {hoveredPoint.bottleneckNodeName} ({hoveredPoint.utilization}% util)
              </div>
            </div>
          )}
        </div>

        {/* Auto-Scale Sizing Recommender */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              <span>Target Sizing Calculator</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 dark:text-neutral-400 text-[11px]">Sustain Traffic:</span>
              <input
                type="number"
                step="500"
                min="1000"
                max="20000"
                value={targetScaleRps}
                onChange={(e) => setTargetScaleRps(Math.max(500, Number(e.target.value) || 1000))}
                className="w-20 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono text-xs text-slate-900 dark:text-white text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="font-mono text-[11px] text-slate-500">req/s</span>
            </div>
          </div>

          {report.recommendations.length > 0 ? (
            <div className="space-y-1.5 mb-3">
              {report.recommendations.map((rec) => (
                <div
                  key={rec.nodeId}
                  className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800/60 border border-slate-200/60 dark:border-neutral-700/60"
                >
                  <span className="font-medium text-slate-800 dark:text-neutral-200">
                    {rec.nodeName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 line-through font-mono">{rec.currentWorkers}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {rec.recommendedWorkers} workers (+{rec.diff})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 py-1 mb-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Architecture is already adequately sized to sustain {targetScaleRps.toLocaleString()} req/s!</span>
            </div>
          )}

          {report.recommendations.length > 0 && (
            <button
              type="button"
              onClick={handleApply}
              disabled={isApplied}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md active:scale-[0.99] transition-all cursor-pointer disabled:opacity-70"
            >
              {isApplied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 animate-bounce" />
                  <span>Sizing Applied to Live Architecture!</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Apply Auto-Sizing to Architecture Canvas</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
