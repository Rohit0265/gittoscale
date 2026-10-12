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
} from 'lucide-react';
import { ArchitectureNode, ArchitectureEdge, NodeSimulationResult } from '../types';

interface ComponentInspectorProps {
  node: ArchitectureNode;
  result?: NodeSimulationResult;
  edges: ArchitectureEdge[];
  onClose: () => void;
  onUpdateNode: (updatedNode: ArchitectureNode) => void;
  onUpdateEdgeMultiplier: (edgeId: string, multiplier: number) => void;
  onChangeIncomingTrafficRate?: (rate: number) => void;
  incomingTrafficRate?: number;
}

export const ComponentInspector: React.FC<ComponentInspectorProps> = ({
  node,
  result,
  edges,
  onClose,
  onUpdateNode,
  onUpdateEdgeMultiplier,
  onChangeIncomingTrafficRate,
  incomingTrafficRate,
}) => {
  const isSource = node.type === 'load_generator';
  const outgoingEdges = edges.filter((e) => e.source === node.id);

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

  return (
    <div className="flex flex-col h-full text-xs bg-white">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Inspector
          </span>
          <h3 className="font-bold text-sm text-slate-800">{node.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* State Toggle */}
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Power
              className={`w-4 h-4 ${node.enabled ? 'text-emerald-600' : 'text-slate-400'}`}
            />
            <span className="font-medium text-slate-700">Component State</span>
          </div>
          <button
            onClick={handleToggleEnabled}
            className={`px-2.5 py-1 rounded font-semibold text-xs transition-colors ${
              node.enabled
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            {node.enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* SECTION 1: CONFIGURED SETTINGS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1">
            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
              1. Configured Settings
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Editable</span>
          </div>

          {/* Load generator traffic rate */}
          {isSource && onChangeIncomingTrafficRate && (
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600 flex justify-between">
                <span>Injected Traffic Rate</span>
                <span className="font-mono font-semibold text-indigo-700">
                  {incomingTrafficRate?.toLocaleString()} req/s
                </span>
              </label>
              <input
                type="number"
                min={0}
                max={50000}
                value={incomingTrafficRate}
                onChange={(e) => onChangeIncomingTrafficRate(Math.max(0, Number(e.target.value)))}
                className="w-full px-2.5 py-1.5 rounded border border-slate-200 font-mono text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Worker Count */}
          {!isSource && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  Worker Count
                </span>
                <span className="font-mono font-semibold text-slate-800">
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
                  className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={node.workerCount}
                  onChange={(e) => handleWorkersChange(Number(e.target.value))}
                  className="w-14 text-center px-1 py-1 rounded border border-slate-200 font-mono text-xs"
                />
              </div>
            </div>
          )}

          {/* Processing Capacity per Second */}
          {!isSource && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  Capacity per Worker
                </span>
                <span className="font-mono font-semibold text-slate-800">
                  {node.capacityPerSecond.toLocaleString()} req/s
                </span>
              </div>
              <input
                type="number"
                min={0}
                step={50}
                value={node.capacityPerSecond}
                onChange={(e) => handleCapacityChange(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded border border-slate-200 font-mono text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Baseline Latency */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Baseline Processing Latency
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {node.config.baselineLatencyMs} ms
              </span>
            </div>
            <input
              type="number"
              min={0}
              step={1}
              value={node.config.baselineLatencyMs}
              onChange={(e) => handleLatencyChange(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded border border-slate-200 font-mono text-xs focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Max Queue Size */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                Queue Capacity
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {node.config.maxQueueSize.toLocaleString()}
              </span>
            </div>
            <input
              type="number"
              min={0}
              step={100}
              value={node.config.maxQueueSize}
              onChange={(e) => handleQueueLimitChange(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded border border-slate-200 font-mono text-xs focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Overflow Policy */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600 block">Queue Overflow Policy</label>
            <div className="grid grid-cols-2 gap-2">
              {(['reject', 'drop'] as const).map((pol) => (
                <button
                  key={pol}
                  onClick={() => handlePolicyChange(pol)}
                  className={`py-1 rounded text-center font-medium capitalize text-xs transition-colors ${
                    node.config.overflowPolicy === pol
                      ? 'bg-slate-800 text-white'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pol} (503)
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Outgoing Request Multipliers */}
        {outgoingEdges.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">
              Downstream Multipliers
            </span>
            <div className="space-y-2">
              {outgoingEdges.map((edge) => (
                <div
                  key={edge.id}
                  className="p-2 rounded border border-slate-200 bg-slate-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span>To: {edge.target}</span>
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
                      className="w-16 px-1.5 py-0.5 rounded border border-slate-200 bg-white font-mono text-right text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: CALCULATED SIMULATION METRICS */}
        {result && (
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                2. Calculated Metrics
              </span>
              <span className="text-[10px] text-indigo-600 font-mono font-medium">
                Simulation Output
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <span className="text-[10px] text-slate-500 block">Offered Load (λ)</span>
                <span className="text-sm font-bold font-mono text-slate-800">
                  {Math.round(result.offeredRequestsPerSecond).toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400 block">req/s</span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <span className="text-[10px] text-slate-500 block">Effective Capacity (μ)</span>
                <span className="text-sm font-bold font-mono text-slate-800">
                  {Math.round(result.effectiveCapacity).toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400 block">req/s</span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <span className="text-[10px] text-slate-500 block">Throughput</span>
                <span className="text-sm font-bold font-mono text-emerald-700">
                  {Math.round(result.processedThroughput).toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400 block">req/s processed</span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                <span className="text-[10px] text-slate-500 block">Utilization</span>
                <span
                  className={`text-sm font-bold font-mono ${
                    result.offeredUtilization > 100
                      ? 'text-red-600'
                      : result.offeredUtilization >= 80
                      ? 'text-amber-600'
                      : 'text-slate-800'
                  }`}
                >
                  {result.offeredUtilization.toFixed(1)}%
                </span>
                <span className="text-[9px] text-slate-400 block">of capacity</span>
              </div>
            </div>

            {/* Queue & Drops */}
            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Current Queue Length:</span>
                <span className="font-mono font-bold text-slate-800">
                  {result.queueLength.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Dropped / Rejected:</span>
                <span
                  className={`font-mono font-bold ${
                    result.rejectedRequests > 0 ? 'text-red-600' : 'text-slate-500'
                  }`}
                >
                  {result.rejectedRequests.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Estimated Latency:</span>
                <span className="font-mono font-bold text-slate-800">
                  ~{result.estimatedLatencyMs} ms
                </span>
              </div>
            </div>

            {/* Bottleneck Reason if flagged */}
            {result.isBottleneck && result.bottleneckReason && (
              <div
                className={`p-3 rounded-lg border text-[11px] leading-relaxed ${
                  result.status === 'overloaded'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  {result.status === 'overloaded' ? (
                    <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
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
