import React from 'react';
import {
  X,
  Power,
  Users,
  Cpu,
  ArrowRight,
  Clock,
  Layers,
  AlertOctagon,
  AlertTriangle,
  Trash2,
  PanelRight,
} from 'lucide-react';
import { ArchitectureNode, ArchitectureEdge, NodeSimulationResult } from '../types';

interface ComponentInspectorProps {
  node: ArchitectureNode;
  result?: NodeSimulationResult;
  edges: ArchitectureEdge[];
  onClose: () => void;
  onUpdateNode: (updatedNode: ArchitectureNode) => void;
  onUpdateEdgeMultiplier: (edgeId: string, multiplier: number) => void;
  onDeleteEdge?: (edgeId: string) => void;
  onChangeIncomingTrafficRate?: (rate: number) => void;
  incomingTrafficRate?: number;
  onNavigateToParent?: (parentId: string) => void;
  viewMode?: 'basic' | 'detailed';
  allNodes?: ArchitectureNode[];
  onToggleCollapse?: () => void;
}

export const ComponentInspector: React.FC<ComponentInspectorProps> = ({
  node,
  result,
  edges,
  onClose,
  onUpdateNode,
  onUpdateEdgeMultiplier,
  onDeleteEdge,
  onChangeIncomingTrafficRate,
  incomingTrafficRate,
  onNavigateToParent,
  viewMode,
  allNodes = [],
  onToggleCollapse,
}) => {
  const isSource = node.type === 'load_generator';
  const outgoingEdges = edges.filter((e) => e.source === node.id);
  const incomingEdges = edges.filter((e) => e.target === node.id);

  const handleCapacityChange = (val: number) => {
    onUpdateNode({
      ...node,
      capacityPerSecond: Math.max(0, val),
    });
  };

  const handleWorkersChange = (val: number) => {
    onUpdateNode({
      ...node,
      workerCount: Math.max(1, Math.round(val)),
    });
  };

  const handleToggleEnabled = () => {
    onUpdateNode({
      ...node,
      enabled: !node.enabled,
    });
  };

  const handleLatencyChange = (val: number) => {
    onUpdateNode({
      ...node,
      config: {
        ...node.config,
        baselineLatencyMs: Math.max(0, val),
      },
    });
  };

  const handleQueueLimitChange = (val: number) => {
    onUpdateNode({
      ...node,
      config: {
        ...node.config,
        maxQueueSize: Math.max(0, val),
      },
    });
  };

  const handlePolicyChange = (policy: 'drop' | 'reject') => {
    onUpdateNode({
      ...node,
      config: {
        ...node.config,
        overflowPolicy: policy,
      },
    });
  };

  const parentNode = node.parentId ? allNodes.find((n) => n.id === node.parentId) : undefined;
  const parentDisplayName = parentNode?.name || node.parentId;

  return (
    <div className="my-auto w-full max-w-[340px] rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800 shadow-none p-3.5 flex flex-col space-y-3.5 text-slate-800 dark:text-slate-200 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-0.5 pt-0.5">
        <div className="min-w-0 flex-1 mr-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            INSPECTOR {viewMode ? `• ${viewMode === 'detailed' ? 'Detailed' : 'Basic'}` : ''}
          </span>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight truncate">{node.name}</h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title="Collapse right sidebar"
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#141414] dark:hover:bg-[#1A1A1A] border border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <PanelRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            title="Close inspector"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#141414] dark:hover:bg-[#1A1A1A] border border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[52vh] pr-0.5">
        {/* Component State Toggle */}
        {/* <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#141414]">
          <div className="flex items-center gap-2">
            <Power
              className={`w-4 h-4 ${node.enabled ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400'}`}
            />
            <span className="font-medium text-slate-700 dark:text-slate-200 text-xs">Component State</span>
          </div>
          <button
            onClick={handleToggleEnabled}
            className={`px-3 py-1 rounded-lg font-medium text-xs transition-colors cursor-pointer ${
              node.enabled
                ? 'bg-emerald-50 dark:bg-emerald-600/20 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08]'
            }`}
          >
            {node.enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div> */}

        {/* Component Role Selector */}
        <div className="p-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#141414] space-y-1.5">
          <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block">
            Component Role
          </label>
          <select
            value={node.type}
            onChange={(e) =>
              onUpdateNode({
                ...node,
                type: e.target.value as any,
              })
            }
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] font-medium text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="gateway">API Gateway / Ingress</option>
            <option value="service">Backend Microservice</option>
            <option value="database">Database (SQL / NoSQL)</option>
            <option value="cache">In-Memory Cache (Redis)</option>
            <option value="load_generator">Client Load Generator</option>
          </select>
        </div>

        {/* Parent Link if present */}
        {Boolean(node.parentId) && (
          <div className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-700 dark:text-indigo-300 text-[10px] uppercase tracking-wider">
                Parent Service
              </span>
              <span
                className="text-[10px] font-mono text-indigo-700 dark:text-indigo-200 bg-white dark:bg-[#0A0A0A] px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/30 truncate max-w-[140px]"
                title={parentDisplayName}
              >
                {parentDisplayName}
              </span>
            </div>
            {onNavigateToParent && (
              <button
                onClick={() => onNavigateToParent(node.parentId!)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors shadow-none cursor-pointer"
              >
                <span>View in Basic View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Configured Settings */}
        <div className="p-3 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#141414] space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-1.5">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
              Configuration
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Editable</span>
          </div>

          {/* Traffic Rate if Load Generator */}
          {isSource && onChangeIncomingTrafficRate && (
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600 dark:text-slate-300 flex justify-between">
                <span>Injected Traffic Rate</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-300">
                  {incomingTrafficRate?.toLocaleString()} req/s
                </span>
              </label>
              <input
                type="number"
                min={0}
                max={50000}
                value={incomingTrafficRate}
                onChange={(e) => onChangeIncomingTrafficRate(Math.max(0, Number(e.target.value)))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-slate-800 dark:text-slate-200 font-mono text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Worker Count */}
          {!isSource && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  Worker Count
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {node.workerCount} workers
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={node.workerCount}
                  onChange={(e) => handleWorkersChange(Number(e.target.value))}
                  className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400 bg-slate-200 dark:bg-neutral-800"
                />
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={node.workerCount}
                  onChange={(e) => handleWorkersChange(Number(e.target.value))}
                  className="w-14 text-center px-1 py-1 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-slate-800 dark:text-slate-200 font-mono text-xs"
                />
              </div>
            </div>
          )}

          {/* Capacity per Worker */}
          {!isSource && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  Capacity per Worker
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {node.capacityPerSecond.toLocaleString()} req/s
                </span>
              </div>
              <input
                type="number"
                min={0}
                step={50}
                value={node.capacityPerSecond}
                onChange={(e) => handleCapacityChange(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-slate-800 dark:text-slate-200 font-mono text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Baseline Latency */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Baseline Latency
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {node.config.baselineLatencyMs} ms
              </span>
            </div>
            <input
              type="number"
              min={0}
              step={1}
              value={node.config.baselineLatencyMs}
              onChange={(e) => handleLatencyChange(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-slate-800 dark:text-slate-200 font-mono text-xs focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Queue Capacity */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                Queue Capacity
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {node.config.maxQueueSize.toLocaleString()}
              </span>
            </div>
            <input
              type="number"
              min={0}
              step={100}
              value={node.config.maxQueueSize}
              onChange={(e) => handleQueueLimitChange(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-slate-800 dark:text-slate-200 font-mono text-xs focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Overflow Policy */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-600 dark:text-slate-300 block">Queue Overflow Policy</label>
            <div className="grid grid-cols-2 gap-2">
              {(['reject', 'drop'] as const).map((pol) => (
                <button
                  key={pol}
                  onClick={() => handlePolicyChange(pol)}
                  className={`py-1.5 rounded-lg text-center font-medium capitalize text-xs transition-colors cursor-pointer ${
                    node.config.overflowPolicy === pol
                      ? 'bg-indigo-600 text-white shadow-none'
                      : 'border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {pol} (503)
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Inbound Callers if present */}
        {incomingEdges.length > 0 && (
          <div className="p-3 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#141414] space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider block">
              Inbound Callers ({incomingEdges.length})
            </span>
            <div className="space-y-1.5">
              {incomingEdges.map((edge) => (
                <div
                  key={edge.id}
                  className="p-2 rounded-lg border border-slate-200 dark:border-neutral-800/80 bg-white dark:bg-[#0A0A0A] text-[11px] flex items-center justify-between"
                >
                  <span className="text-slate-500 dark:text-slate-400">
                    From: <strong className="text-slate-800 dark:text-slate-200 font-mono">{edge.source}</strong>
                  </span>
                  {onDeleteEdge && (
                    <button
                      type="button"
                      onClick={() => onDeleteEdge(edge.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                      title={`Delete connection from ${edge.source}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Downstream Multipliers if present */}
        {outgoingEdges.length > 0 && (
          <div className="p-3 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#141414] space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider block">
              Downstream Multipliers
            </span>
            <div className="space-y-1.5">
              {outgoingEdges.map((edge) => (
                <div
                  key={edge.id}
                  className="p-2 rounded-lg border border-slate-200 dark:border-neutral-800/80 bg-white dark:bg-[#0A0A0A] flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span>{edge.target}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-mono">×</span>
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      max={20}
                      value={edge.requestsPerInput}
                      onChange={(e) =>
                        onUpdateEdgeMultiplier(edge.id, Math.max(0, Number(e.target.value)))
                      }
                      className="w-14 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#141414] text-slate-800 dark:text-slate-200 font-mono text-right text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calculated Simulation Metrics */}
        {result && (
          <div className="p-3 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#141414] space-y-2.5">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider block">
              Simulation Metrics
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800/80">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Offered Load</span>
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                  {Math.round(result.offeredRequestsPerSecond).toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 block">req/s</span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800/80">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Capacity</span>
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                  {Math.round(result.effectiveCapacity).toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 block">req/s</span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800/80">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Throughput</span>
                <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {Math.round(result.processedThroughput).toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 block">req/s</span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800/80">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Utilization</span>
                <span
                  className={`text-sm font-bold font-mono ${
                    result.offeredUtilization > 100
                      ? 'text-rose-600 dark:text-rose-400'
                      : result.offeredUtilization >= 80
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {result.offeredUtilization.toFixed(1)}%
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 block">util</span>
              </div>
            </div>

            {/* Queue & Latency summary */}
            <div className="p-2.5 rounded-lg bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800/80 space-y-1 text-[11px]">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Queue Depth:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {result.queueLength.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Latency:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  ~{result.estimatedLatencyMs} ms
                </span>
              </div>
            </div>

            {/* Bottleneck Warning */}
            {result.isBottleneck && result.bottleneckReason && (
              <div
                className={`p-2.5 rounded-lg border text-[11px] leading-relaxed ${
                  result.status === 'overloaded'
                    ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300'
                    : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  {result.status === 'overloaded' ? (
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span>Bottleneck Diagnosis</span>
                </div>
                {result.bottleneckReason}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
