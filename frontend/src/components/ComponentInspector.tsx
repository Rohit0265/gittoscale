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
  PanelRightClose,
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
    <div className="flex flex-col h-full text-xs bg-white dark:bg-[#0A0A0A] text-slate-800 dark:text-neutral-100 transition-colors">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between bg-slate-50 dark:bg-[#0A0A0A]">
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider block">
            Inspector {viewMode ? `• ${viewMode === 'detailed' ? 'Detailed View' : 'Basic View'}` : ''}
          </span>
          <h3 className="font-bold text-sm text-slate-800 dark:text-neutral-100">{node.name}</h3>
        </div>
        <div className="flex items-center gap-1">
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            title="Close inspector"
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* State Toggle */}
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Power
              className={`w-4 h-4 ${node.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}
            />
            <span className="font-medium text-slate-700 dark:text-slate-200">Component State</span>
          </div>
          <button
            onClick={handleToggleEnabled}
            className={`px-2.5 py-1 rounded font-semibold text-xs transition-colors cursor-pointer ${
              node.enabled
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {node.enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Component Type Selector */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
            Component Role / Type
          </label>
          <select
            value={node.type}
            onChange={(e) =>
              onUpdateNode({
                ...node,
                type: e.target.value as any,
              })
            }
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="gateway">API Gateway / Frontend Entry</option>
            <option value="service">Backend Microservice / Worker</option>
            <option value="database">Database (SQL / NoSQL)</option>
            <option value="cache">In-Memory Cache (Redis / Memcached)</option>
            <option value="load_generator">Client Load Generator</option>
          </select>
        </div>

        {/* Parent Service & Hierarchy Link */}
        {Boolean(node.parentId) && (
          <div className="p-3 rounded-lg border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-900 dark:text-indigo-300 text-[10px] uppercase tracking-wider">
                Parent Runtime Service
              </span>
              <span
                className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 truncate max-w-[140px]"
                title={parentDisplayName}
              >
                {parentDisplayName}
              </span>
            </div>
            {onNavigateToParent && (
              <button
                onClick={() => onNavigateToParent(node.parentId!)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold transition-all shadow-xs cursor-pointer"
              >
                <span>View Parent in Basic View</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Submodule Role Badge */}
        {Boolean(node.submoduleType) && (
          <div className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-[11px]">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Submodule Role:</span>
            <span className="font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider text-[10px] bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded">
              {node.submoduleType?.replace('_', ' ')}
            </span>
          </div>
        )}

        {/* SECTION: REPOSITORY EVIDENCE & EXPLANATION */}
        {Boolean(node.config.reason || node.config.entryPoint || node.config.sourceFiles) && (
          <div className="space-y-2 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30">
            <div className="flex items-center justify-between border-b border-indigo-100/60 dark:border-indigo-900/40 pb-1">
              <span className="font-bold text-indigo-900 dark:text-indigo-300 text-[10px] uppercase tracking-wider">
                Repository Evidence
              </span>
              {typeof node.config.confidence === 'number' && (
                <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.5 rounded">
                  {(Number(node.config.confidence) * 100).toFixed(0)}% confidence
                </span>
              )}
            </div>

            {Boolean(node.config.reason) && (
              <p className="text-[11px] text-indigo-900 dark:text-indigo-200 leading-relaxed">
                {String(node.config.reason)}
              </p>
            )}

            {Boolean(node.config.entryPoint) && (
              <div className="text-[10px] text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Entrypoint: </span>
                <code className="bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-indigo-100 dark:border-indigo-800 font-mono text-[10px] text-slate-800 dark:text-slate-200">
                  {String(node.config.entryPoint)}
                </code>
              </div>
            )}

            {Boolean(node.config.startupCommand) && (
              <div className="text-[10px] text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Startup: </span>
                <code className="bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-indigo-100 dark:border-indigo-800 font-mono text-[10px] text-slate-800 dark:text-slate-200">
                  {String(node.config.startupCommand)}
                </code>
              </div>
            )}

            {Array.isArray(node.config.sourceFiles) && node.config.sourceFiles.length > 0 && (
              <div className="text-[10px] text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Source Evidence: </span>
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  {node.config.sourceFiles.join(', ')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* SECTION 1: CONFIGURED SETTINGS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
              1. Configured Settings
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Editable</span>
          </div>

          {/* Load generator traffic rate */}
          {isSource && onChangeIncomingTrafficRate && (
            <div className="space-y-1">
              <label className="text-[11px] text-slate-600 dark:text-slate-400 flex justify-between">
                <span>Injected Traffic Rate</span>
                <span className="font-mono font-semibold text-indigo-700 dark:text-indigo-400">
                  {incomingTrafficRate?.toLocaleString()} req/s
                </span>
              </label>
              <input
                type="number"
                min={0}
                max={50000}
                value={incomingTrafficRate}
                onChange={(e) => onChangeIncomingTrafficRate(Math.max(0, Number(e.target.value)))}
                className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Worker Count */}
          {!isSource && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  Worker Count
                </span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
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
                  className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={node.workerCount}
                  onChange={(e) => handleWorkersChange(Number(e.target.value))}
                  className="w-14 text-center px-1 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono text-xs"
                />
              </div>
            </div>
          )}

          {/* Processing Capacity per Second */}
          {!isSource && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  Capacity per Worker
                </span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {node.capacityPerSecond.toLocaleString()} req/s
                </span>
              </div>
              <input
                type="number"
                min={0}
                step={50}
                value={node.capacityPerSecond}
                onChange={(e) => handleCapacityChange(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Baseline Latency */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Baseline Processing Latency
              </span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {node.config.baselineLatencyMs} ms
              </span>
            </div>
            <input
              type="number"
              min={0}
              step={1}
              value={node.config.baselineLatencyMs}
              onChange={(e) => handleLatencyChange(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono text-xs focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Max Queue Size */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                Queue Capacity
              </span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {node.config.maxQueueSize.toLocaleString()}
              </span>
            </div>
            <input
              type="number"
              min={0}
              step={100}
              value={node.config.maxQueueSize}
              onChange={(e) => handleQueueLimitChange(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono text-xs focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Overflow Policy */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600 dark:text-slate-400 block">Queue Overflow Policy</label>
            <div className="grid grid-cols-2 gap-2">
              {(['reject', 'drop'] as const).map((pol) => (
                <button
                  key={pol}
                  onClick={() => handlePolicyChange(pol)}
                  className={`py-1 rounded text-center font-medium capitalize text-xs transition-colors cursor-pointer ${
                    node.config.overflowPolicy === pol
                      ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-xs'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {pol} (503)
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Inbound Request Flow */}
        {incomingEdges.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider block">
              Inbound Callers ({incomingEdges.length})
            </span>
            <div className="space-y-1.5">
              {incomingEdges.map((edge) => (
                <div
                  key={edge.id}
                  className="p-2 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] space-y-1"
                >
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium">
                    <span className="text-slate-600 dark:text-slate-400">
                      From: <strong className="text-slate-800 dark:text-slate-100">{edge.source}</strong>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {edge.label && (
                        <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded font-medium">
                          {edge.label}
                        </span>
                      )}
                      {onDeleteEdge && (
                        <button
                          type="button"
                          onClick={() => onDeleteEdge(edge.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                          title={`Delete connection from ${edge.source}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  {edge.dataFlowDescription && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono italic">
                      {edge.dataFlowDescription}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outgoing Request Multipliers */}
        {outgoingEdges.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider block">
              Downstream Multipliers
            </span>
            <div className="space-y-2">
              {outgoingEdges.map((edge) => (
                <div
                  key={edge.id}
                  className="p-2 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
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
                      className="w-16 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono text-right text-xs"
                    />
                    {onDeleteEdge && (
                      <button
                        type="button"
                        onClick={() => onDeleteEdge(edge.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors ml-0.5 cursor-pointer"
                        title={`Delete connection to ${edge.target}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: CALCULATED SIMULATION METRICS */}
        {result && (
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
              <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
                2. Calculated Metrics
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                Simulation Output
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Offered Load (λ)</span>
                <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100">
                  {Math.round(result.offeredRequestsPerSecond).toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 block">req/s</span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Effective Capacity (μ)</span>
                <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100">
                  {Math.round(result.effectiveCapacity).toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 block">req/s</span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Throughput</span>
                <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400">
                  {Math.round(result.processedThroughput).toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 block">req/s processed</span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Utilization</span>
                <span
                  className={`text-sm font-bold font-mono ${
                    result.offeredUtilization > 100
                      ? 'text-red-600 dark:text-red-400'
                      : result.offeredUtilization >= 80
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-800 dark:text-slate-100'
                  }`}
                >
                  {result.offeredUtilization.toFixed(1)}%
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 block">of capacity</span>
              </div>
            </div>

            {/* Queue & Drops */}
            <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Current Queue Length:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {result.queueLength.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Dropped / Rejected:</span>
                <span
                  className={`font-mono font-bold ${
                    result.rejectedRequests > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {result.rejectedRequests.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Estimated Latency:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  ~{result.estimatedLatencyMs} ms
                </span>
              </div>
            </div>

            {/* Bottleneck Reason if flagged */}
            {result.isBottleneck && result.bottleneckReason && (
              <div
                className={`p-3 rounded-lg border text-[11px] leading-relaxed ${
                  result.status === 'overloaded'
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  {result.status === 'overloaded' ? (
                    <AlertOctagon className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
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
