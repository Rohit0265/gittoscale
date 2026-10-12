import React, { useState } from 'react';
import {
  Sliders,
  Plus,
  RotateCcw,
  Clock,
  Server,
  Globe,
  Database,
  Layers,
  Trash2,
  Power,
} from 'lucide-react';
import { ArchitectureNode, ArchitectureEdge, NodeSimulationResult, ComponentType } from '../types';

interface LeftSidebarProps {
  incomingTrafficRate: number;
  onChangeTrafficRate: (val: number) => void;
  durationSeconds: number;
  onChangeDuration: (val: number) => void;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  nodeResults: Record<string, NodeSimulationResult>;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onAddNode: (type: ComponentType, name: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onToggleNode: (nodeId: string) => void;
  onRestoreOriginal: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  incomingTrafficRate,
  onChangeTrafficRate,
  durationSeconds,
  onChangeDuration,
  nodes,
  edges,
  nodeResults,
  selectedNodeId,
  onSelectNode,
  onAddNode,
  onDeleteNode,
  onToggleNode,
  onRestoreOriginal,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const getStatusColor = (nodeId: string, enabled: boolean) => {
    if (!enabled) return 'bg-slate-300';
    const res = nodeResults[nodeId];
    if (res?.status === 'overloaded') return 'bg-red-500 animate-pulse';
    if (res?.status === 'warning') return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 select-none z-10 text-xs overflow-hidden">
      {/* Simulation Controls Section */}
      <div className="p-3.5 border-b border-slate-200 space-y-4 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            Traffic Generator
          </span>
          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-xs">
            {incomingTrafficRate.toLocaleString()} req/s
          </span>
        </div>

        {/* Traffic Rate Slider & Input */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[11px] text-slate-500">
            <span>Arrival Rate (λ)</span>
            <input
              type="number"
              min={100}
              max={5000}
              step={50}
              value={incomingTrafficRate}
              onChange={(e) => {
                const val = Math.max(0, parseInt(e.target.value) || 0);
                onChangeTrafficRate(val);
              }}
              className="w-20 text-right font-mono font-semibold px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
            />
          </div>
          <input
            type="range"
            min={100}
            max={5000}
            step={50}
            value={incomingTrafficRate}
            onChange={(e) => onChangeTrafficRate(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>100 r/s</span>
            <span>2,500 r/s</span>
            <span>5,000 r/s</span>
          </div>
        </div>

        {/* Duration Selector */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              Window Duration
            </span>
            <span className="font-mono text-slate-700 font-semibold">{durationSeconds}s</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[10, 30, 60, 120].map((sec) => (
              <button
                key={sec}
                onClick={() => onChangeDuration(sec)}
                className={`py-1 rounded text-center text-[11px] font-mono font-medium transition-all ${
                  durationSeconds === sec
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Component & Architecture Tools */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
          <span>COMPONENTS ({nodes.length})</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Add Component Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium text-[11px] transition-all"
              title="Add component to architecture"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
            {showAddMenu && (
              <div className="absolute left-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-xl p-1 z-30 space-y-0.5">
                <button
                  onClick={() => {
                    onAddNode('service', `Custom Service ${nodes.length + 1}`);
                    setShowAddMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-100 text-left text-xs text-slate-700"
                >
                  <Server className="w-3.5 h-3.5 text-blue-500" />
                  Service
                </button>
                <button
                  onClick={() => {
                    onAddNode('cache', `Redis Cache ${nodes.length + 1}`);
                    setShowAddMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-100 text-left text-xs text-slate-700"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  Cache
                </button>
                <button
                  onClick={() => {
                    onAddNode('database', `Database ${nodes.length + 1}`);
                    setShowAddMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-100 text-left text-xs text-slate-700"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-500" />
                  Database
                </button>
                <button
                  onClick={() => {
                    onAddNode('gateway', `API Gateway ${nodes.length + 1}`);
                    setShowAddMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-100 text-left text-xs text-slate-700"
                >
                  <Globe className="w-3.5 h-3.5 text-sky-500" />
                  Gateway
                </button>
              </div>
            )}
          </div>

          {/* Restore Architecture Button */}
          <button
            onClick={onRestoreOriginal}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            title="Restore original architecture"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const res = nodeResults[node.id];
          const isSource = node.type === 'load_generator';

          return (
            <div
              key={node.id}
              onClick={() => onSelectNode(node.id)}
              className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-indigo-50/70 border-l-2 border-indigo-600'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(
                    node.id,
                    node.enabled
                  )}`}
                />
                <div className="truncate">
                  <span className="font-semibold text-slate-800 text-xs block truncate">
                    {node.name}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    {node.workerCount}w · {node.capacityPerSecond} r/s
                  </span>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {res && (
                  <span className="font-mono text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                    {res.offeredUtilization.toFixed(0)}%
                  </span>
                )}
                {!isSource && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleNode(node.id);
                      }}
                      className={`p-1 rounded transition-colors ${
                        node.enabled
                          ? 'text-slate-400 hover:text-slate-600'
                          : 'text-red-500 hover:text-red-700'
                      }`}
                      title={node.enabled ? 'Disable component' : 'Enable component'}
                    >
                      <Power className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNode(node.id);
                      }}
                      className="p-1 rounded text-slate-300 hover:text-red-600 transition-colors"
                      title="Delete component"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-500 flex justify-between items-center">
        <span>Connections: {edges.filter((e) => e.enabled).length} active</span>
        <span className="font-mono text-slate-400">DAG Analytical</span>
      </div>
    </aside>
  );
};
