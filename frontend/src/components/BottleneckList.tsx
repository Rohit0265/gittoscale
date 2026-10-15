import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  PanelRight,
  BarChart3,
} from 'lucide-react';
import {
  SimulationResult,
  ArchitectureNode,
} from '../types';

interface BottleneckListProps {
  simulationResult: SimulationResult | null;
  nodes: ArchitectureNode[];
  onSelectNode: (nodeId: string) => void;
  selectedNodeId: string | null;
  onToggleCollapse?: () => void;
}

export const BottleneckList: React.FC<BottleneckListProps> = ({
  simulationResult,
  onSelectNode,
  selectedNodeId,
  onToggleCollapse,
}) => {
  if (!simulationResult) {
    return (
      <div className="my-auto w-full max-w-[340px] rounded-2xl bg-[#080B13] border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.7)] p-3.5 flex flex-col space-y-3.5 text-slate-200 select-none">
        <div className="flex items-center justify-between px-0.5 pt-0.5">
          <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase">
            ANALYSIS & BOTTLENECKS
          </span>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title="Collapse right sidebar"
              className="p-1.5 rounded-lg bg-[#111726] hover:bg-[#161E31] border border-white/[0.06] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <PanelRight className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="bg-[#0E1320] border border-white/[0.06] rounded-xl p-6 text-center text-slate-400 text-xs">
          Run simulation to analyze performance bottlenecks.
        </div>
      </div>
    );
  }

  const { bottlenecks, mostConstrainedComponent } = simulationResult;

  return (
    <div className="my-auto w-full max-w-[340px] rounded-2xl border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.7)] p-3.5 flex flex-col space-y-3.5 text-slate-200 select-none">
      {/* 1. Header Row */}
      <div className="flex items-center justify-between px-0.5 pt-0.5">
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title="Collapse right sidebar"
            className="p-1.5 rounded-lg bg-[#111726] hover:bg-[#161E31] border border-white/[0.06] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <PanelRight className="w-4 h-4" />
          </button>
        )}
        <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase">
          ANALYSIS & BOTTLENECKS ({bottlenecks.length})
        </span>
      </div>

      {/* 2. Most Constrained Component Banner (if present) */}
      {mostConstrainedComponent && (
        <div className=" border border-indigo-500/25 rounded-xl p-3 space-y-1 shadow-inner">
          <div className="flex items-center gap-1.5 text-indigo-400 font-semibold text-xs">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="tracking-tight">Primary Constrained Service</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-100 text-[13px] tracking-tight">
              {mostConstrainedComponent.nodeName}
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-200">
              {mostConstrainedComponent.utilization.toFixed(0)}% util
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed pt-0.5">
            {mostConstrainedComponent.reason}
          </p>
        </div>
      )}

      {/* 3. Bottlenecks List */}
      <div className="space-y-2 overflow-y-auto max-h-[50vh] pr-0.5">
        {bottlenecks.length === 0 ? (
          <div className="bg-[#0E1320]/75 border border-white/[0.06] rounded-xl p-6 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="font-semibold text-slate-100 text-xs">No Bottlenecks Detected</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              All services have sufficient throughput and zero queue build-up under current traffic load.
            </p>
          </div>
        ) : (
          bottlenecks.map((b, idx) => {
            const isSelected = selectedNodeId === b.nodeId;
            const isCritical = b.severity === 'critical';

            return (
              <div
                key={b.nodeId}
                onClick={() => onSelectNode(b.nodeId)}
                className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-[#12192B] border-indigo-500/50 shadow-sm ring-1 ring-indigo-500/25'
                    : 'bg-[#0E1320]/75 hover:bg-[#121829] border-white/[0.06] hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                    <span className="font-mono text-[10px] text-slate-500 font-bold shrink-0">
                      #{idx + 1}
                    </span>
                    {isCritical ? (
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-pulse" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className="font-medium text-slate-100 text-[13px] tracking-tight truncate">
                      {b.nodeName}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md shrink-0 border ${
                      isCritical
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                        : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    {b.utilization.toFixed(0)}% util
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
                  {b.reason}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-white/[0.06] pt-2">
                  <span>Load: {Math.round(b.offeredLoad)} r/s</span>
                  <span>Cap: {Math.round(b.effectiveCapacity)} r/s</span>
                  <span className="text-indigo-400 group-hover:text-indigo-300 font-sans font-medium flex items-center gap-0.5 transition-colors">
                    Inspect <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Footer Information inside the box */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-white/[0.06] px-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              bottlenecks.length === 0
                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                : 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
            }`}
          />
          <span>{bottlenecks.length === 0 ? 'Optimal System Health' : `${bottlenecks.length} Constraint${bottlenecks.length > 1 ? 's' : ''}`}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <BarChart3 className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
          <span className="font-mono text-[10px] tracking-tight">M/M/m/K Model</span>
        </div>
      </div>
    </div>
  );
};
