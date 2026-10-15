import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  PanelRightClose,
} from 'lucide-react';
import {
  SimulationResult,
  ArchitectureNode,
} from '../types';
import { TimeSeriesChart } from './TimeSeriesChart';

interface BottleneckListProps {
  simulationResult: SimulationResult | null;
  nodes: ArchitectureNode[];
  onSelectNode: (nodeId: string) => void;
  selectedNodeId: string | null;
  onToggleCollapse?: () => void;
}

export const BottleneckList: React.FC<BottleneckListProps> = ({
  simulationResult,
  nodes,
  onSelectNode,
  selectedNodeId,
  onToggleCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<'bottlenecks' | 'charts' | 'utilization'>(
    'bottlenecks'
  );

  if (!simulationResult) {
    return (
      <div className="flex flex-col h-full text-xs bg-white dark:bg-[#0A0A0A]">
        <div className="p-3 border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#0A0A0A] flex items-center justify-between">
          <span className="font-bold text-slate-800 dark:text-neutral-100 text-xs uppercase tracking-wider">
            Analysis & Bottlenecks
          </span>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-200/70 dark:hover:bg-neutral-800 rounded transition-colors cursor-pointer"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="p-6 text-center text-slate-400 dark:text-neutral-500 text-xs">
          Run simulation to see performance bottlenecks.
        </div>
      </div>
    );
  }

  const { bottlenecks, mostConstrainedComponent, timeSeries } =
    simulationResult;

  return (
    <div className="flex flex-col h-full text-xs bg-white dark:bg-[#0A0A0A]">
      {/* Header & Tabs */}
      <div className="p-3 border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#0A0A0A] shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <span className="font-bold text-slate-800 dark:text-neutral-100 text-xs uppercase tracking-wider">
            Analysis & Bottlenecks
          </span>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-3 gap-1 bg-slate-200/70 dark:bg-neutral-900 p-1 rounded-lg text-[11px] font-medium text-slate-600 dark:text-neutral-400 border border-transparent dark:border-neutral-800">
          <button
            onClick={() => setActiveTab('bottlenecks')}
            className={`py-1 rounded text-center transition-all ${
              activeTab === 'bottlenecks'
                ? 'bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-100 shadow-xs font-semibold'
                : 'hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            Bottlenecks ({bottlenecks.length})
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`py-1 rounded text-center transition-all ${
              activeTab === 'charts'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs font-semibold'
                : 'hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Dynamics
          </button>
          <button
            onClick={() => setActiveTab('utilization')}
            className={`py-1 rounded text-center transition-all ${
              activeTab === 'utilization'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs font-semibold'
                : 'hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Utilization
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {activeTab === 'bottlenecks' && (
          <div className="space-y-3">
            {/* Most Constrained Banner */}
            {mostConstrainedComponent && (
              <div className="p-3 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30">
                <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 font-bold mb-1 text-[11px]">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Primary Constrained Service</span>
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
                  {mostConstrainedComponent.nodeName} ({mostConstrainedComponent.utilization.toFixed(1)}% util)
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {mostConstrainedComponent.reason}
                </p>
              </div>
            )}

            {/* Bottlenecks List */}
            {bottlenecks.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-700 dark:text-slate-200">No Bottlenecks Detected</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  All components have sufficient throughput and zero queue build-up under current traffic load.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                  Ranked Bottlenecks ({bottlenecks.length})
                </span>
                {bottlenecks.map((b, idx) => (
                  <div
                    key={b.nodeId}
                    onClick={() => onSelectNode(b.nodeId)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedNodeId === b.nodeId
                        ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/40'
                        : b.severity === 'critical'
                        ? 'border-red-200 bg-red-50/30 hover:border-red-300 dark:border-red-900/40 dark:bg-red-950/20 dark:hover:border-red-800/60'
                        : 'border-amber-200 bg-amber-50/30 hover:border-amber-300 dark:border-amber-900/40 dark:bg-amber-950/20 dark:hover:border-amber-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-slate-400 font-bold">
                          #{idx + 1}
                        </span>
                        {b.severity === 'critical' ? (
                          <AlertOctagon className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                          {b.nodeName}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          b.severity === 'critical'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {b.utilization.toFixed(0)}% util
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                      {b.reason}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/80 pt-1.5">
                      <span>Offered: {Math.round(b.offeredLoad)} r/s</span>
                      <span>Cap: {Math.round(b.effectiveCapacity)} r/s</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-0.5">
                        Inspect <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Charts Tab */}
        {activeTab === 'charts' && (
          <div>
            <TimeSeriesChart data={timeSeries} />
          </div>
        )}

        {/* Utilization Breakdown Tab */}
        {activeTab === 'utilization' && (
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
              Component Utilization Breakdown
            </span>
            <div className="space-y-2.5">
              {nodes
                .filter((n) => n.enabled && n.type !== 'load_generator')
                .map((node) => {
                  const res = simulationResult.nodeResults[node.id];
                  const util = res?.offeredUtilization ?? 0;
                  const cap = res?.effectiveCapacity ?? 1;

                  return (
                    <div
                      key={node.id}
                      onClick={() => onSelectNode(node.id)}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {node.name}
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            util > 100
                              ? 'text-red-600 dark:text-red-400'
                              : util >= 80
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {util.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            util > 100
                              ? 'bg-red-500'
                              : util >= 80
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, util)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-400 mt-1 font-mono">
                        <span>Load: {Math.round(res?.offeredRequestsPerSecond ?? 0)} req/s</span>
                        <span>Capacity: {Math.round(cap)} req/s</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
