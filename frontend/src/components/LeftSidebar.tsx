import React, { useState, useEffect } from 'react';
import {
  Plus,
  Server,
  Globe,
  Database,
  Layers,
  Trash2,
  Power,
  MoreVertical,
  Pencil,
  Info,
  Monitor,
  Cloud,
  Shield,
  Bot,
  CreditCard,
  MessageSquare,
  BarChart3,
  Columns2,
  X,
  HelpCircle,
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
  onRestoreOriginal?: () => void;
  onOpenImportRepo?: () => void;
  onToggleCollapse?: () => void;
  onUpdateNode?: (node: ArchitectureNode) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  incomingTrafficRate,
  onChangeTrafficRate,
  nodes,
  edges,
  nodeResults,
  selectedNodeId,
  onSelectNode,
  onAddNode,
  onDeleteNode,
  onToggleNode,
  onToggleCollapse,
  onUpdateNode,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [openMenuNodeId, setOpenMenuNodeId] = useState<string | null>(null);
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    const handleDocumentClick = () => {
      setOpenMenuNodeId(null);
    };
    if (openMenuNodeId) {
      document.addEventListener('click', handleDocumentClick);
      return () => document.removeEventListener('click', handleDocumentClick);
    }
  }, [openMenuNodeId]);

  const handleSaveRename = (nodeId: string) => {
    const trimmed = renameValue.trim();
    if (trimmed && onUpdateNode) {
      const target = nodes.find((n) => n.id === nodeId);
      if (target && target.name !== trimmed) {
        onUpdateNode({ ...target, name: trimmed });
      }
    }
    setRenamingNodeId(null);
  };

  const getStatusDot = (nodeId: string, enabled: boolean) => {
    if (!enabled) {
      return 'bg-slate-500 opacity-60';
    }
    const res = nodeResults[nodeId];
    if (res?.status === 'overloaded') {
      return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse';
    }
    if (res?.status === 'warning') {
      return 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]';
    }
    return 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.85)]';
  };

  const getComponentVisual = (node: ArchitectureNode) => {
    const nameLower = node.name.toLowerCase();
    const idLower = node.id.toLowerCase();
    const type = node.type;

    if (type === 'load_generator' || nameLower.includes('frontend') || idLower.includes('client')) {
      return {
        icon: Monitor,
        containerClass: 'bg-blue-600/15 border-blue-500/30 text-blue-400',
      };
    }
    if (type === 'gateway' || nameLower.includes('gateway') || idLower.includes('gateway')) {
      return {
        icon: Cloud,
        containerClass: 'bg-purple-600/15 border-purple-500/30 text-purple-400',
      };
    }
    if (nameLower.includes('auth') || idLower.includes('auth')) {
      return {
        icon: Shield,
        containerClass: 'bg-emerald-600/15 border-emerald-500/30 text-emerald-400',
      };
    }
    if (nameLower.includes('agent') || idLower.includes('agent') || nameLower.includes('bot')) {
      return {
        icon: Bot,
        containerClass: 'bg-orange-600/15 border-orange-500/30 text-orange-400',
      };
    }
    if (nameLower.includes('billing') || nameLower.includes('payment') || idLower.includes('billing')) {
      return {
        icon: CreditCard,
        containerClass: 'bg-amber-600/15 border-amber-500/30 text-amber-400',
      };
    }
    if (type === 'cache' || nameLower.includes('cache') || nameLower.includes('redis')) {
      return {
        icon: Database,
        containerClass: 'bg-sky-600/15 border-sky-500/30 text-sky-400',
      };
    }
    if (nameLower.includes('chat') || idLower.includes('chat') || nameLower.includes('message')) {
      return {
        icon: MessageSquare,
        containerClass: 'bg-fuchsia-600/15 border-fuchsia-500/30 text-fuchsia-400',
      };
    }
    if (type === 'database') {
      return {
        icon: Database,
        containerClass: 'bg-emerald-600/15 border-emerald-500/30 text-emerald-400',
      };
    }
    return {
      icon: Server,
      containerClass: 'bg-indigo-600/15 border-indigo-500/30 text-indigo-400',
    };
  };

  const sliderPercent = Math.min(100, Math.max(0, ((incomingTrafficRate - 100) / (5000 - 100)) * 100));
  const activeConnectionsCount = edges.filter((e) => e.enabled).length;

  return (
    <aside className="w-full h-full flex flex-col justify-between items-center py-4 px-3 bg-slate-50 dark:bg-[#0A0A0A] select-none text-xs overflow-hidden transition-colors">
      {/* Centered Rectangle Box */}
      <div className="my-auto w-full max-w-[344px] rounded-2xl bg-[#0B0E17] border border-[#1b2236] shadow-2xl p-3.5 flex flex-col space-y-3.5 text-slate-200">
        {/* 1. Arrival Rate Section */}
        <div className="bg-[#101524]/75 border border-[#1d263d] rounded-xl p-3 space-y-2.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-200">
              <span>Arrival Rate (λ)</span>
              <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
            </div>
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
              className="w-16 text-center font-mono font-bold text-xs px-2 py-0.5 rounded-md border border-indigo-500/30 bg-[#13192b] text-indigo-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Slider */}
          <div className="space-y-1.5">
            <input
              type="range"
              min={100}
              max={5000}
              step={50}
              value={incomingTrafficRate}
              onChange={(e) => onChangeTrafficRate(Number(e.target.value))}
              style={{
                background: `linear-gradient(to right, #818cf8 0%, #6366f1 ${sliderPercent}%, #1e2538 ${sliderPercent}%, #1e2538 100%)`,
              }}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#818cf8]"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>100 r/s</span>
              <span>2,500 r/s</span>
              <span>5,000 r/s</span>
            </div>
          </div>
        </div>

        {/* 2. Components Header */}
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
            COMPONENTS ({nodes.length})
          </span>
          <div className="flex items-center gap-1.5">
            {/* Add Component Menu */}
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#5542f6] hover:bg-[#4836e4] text-white font-medium text-xs transition-all shadow-sm cursor-pointer"
                title="Add component to architecture"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
              {showAddMenu && (
                <div className="absolute right-0 mt-1.5 w-44 bg-[#0B0E17] border border-[#1b2236] rounded-xl shadow-2xl p-1 z-30 space-y-0.5 text-slate-200">
                  <button
                    onClick={() => {
                      onAddNode('service', `Custom Service ${nodes.length + 1}`);
                      setShowAddMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-left text-xs cursor-pointer"
                  >
                    <Server className="w-3.5 h-3.5 text-blue-400" />
                    Service
                  </button>
                  <button
                    onClick={() => {
                      onAddNode('cache', `Redis Cache ${nodes.length + 1}`);
                      setShowAddMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-left text-xs cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    Cache
                  </button>
                  <button
                    onClick={() => {
                      onAddNode('database', `Database ${nodes.length + 1}`);
                      setShowAddMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-left text-xs cursor-pointer"
                  >
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    Database
                  </button>
                  <button
                    onClick={() => {
                      onAddNode('gateway', `API Gateway ${nodes.length + 1}`);
                      setShowAddMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-left text-xs cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5 text-purple-400" />
                    Gateway
                  </button>
                </div>
              )}
            </div>

            {/* Collapse / Panel Toggle */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                title="Collapse left sidebar"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <Columns2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 3. Component List */}
        <div className="space-y-2 overflow-y-auto max-h-[50vh] pr-0.5">
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isSource = node.type === 'load_generator';
            const isMenuOpen = openMenuNodeId === node.id;
            const isRenaming = renamingNodeId === node.id;
            const visual = getComponentVisual(node);
            const Icon = visual.icon;

            return (
              <div
                key={node.id}
                onClick={() => onSelectNode(node.id)}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#151c31] border-indigo-500/60 ring-1 ring-indigo-500/30'
                    : 'bg-[#101524]/60 hover:bg-[#141b2e] border-[#1c243a] hover:border-indigo-500/30'
                }`}
              >
                {/* Left side: status dot + badge + name/subtitle */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${getStatusDot(node.id, node.enabled)}`} />

                  {/* Icon badge */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${visual.containerClass}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Text details */}
                  <div className="truncate flex-1">
                    {isRenaming ? (
                      <input
                        type="text"
                        value={renameValue}
                        autoFocus
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(node.id);
                          if (e.key === 'Escape') setRenamingNodeId(null);
                        }}
                        onBlur={() => handleSaveRename(node.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full font-semibold text-slate-100 text-xs px-1.5 py-0.5 rounded border border-indigo-500 bg-[#0B0E17] shadow-xs focus:outline-none"
                      />
                    ) : (
                      <span className="font-medium text-slate-200 text-xs block truncate">{node.name}</span>
                    )}
                    <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                      {node.workerCount}w • {node.capacityPerSecond} r/s
                    </span>
                  </div>
                </div>

                {/* Right side: three dots menu */}
                <div
                  className="relative shrink-0"
                  onMouseEnter={() => setOpenMenuNodeId(node.id)}
                  onMouseLeave={() => setOpenMenuNodeId(null)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuNodeId(isMenuOpen ? null : node.id);
                    }}
                    className={`p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ${
                      isMenuOpen ? 'bg-white/10 text-white' : ''
                    }`}
                    title="Component options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-full mt-1 w-36 bg-[#0B0E17] border border-[#1b2236] rounded-xl shadow-2xl py-1 z-30 text-left text-slate-200"
                    >
                      <button
                        onClick={() => {
                          setRenamingNodeId(node.id);
                          setRenameValue(node.name);
                          setOpenMenuNodeId(null);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/5 transition-colors text-left cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Rename</span>
                      </button>

                      {!isSource && (
                        <button
                          onClick={() => {
                            onToggleNode(node.id);
                            setOpenMenuNodeId(null);
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs transition-colors text-left cursor-pointer ${
                            node.enabled
                              ? 'text-amber-400 hover:bg-amber-950/30'
                              : 'text-emerald-400 hover:bg-emerald-950/30'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{node.enabled ? 'Power Off' : 'Power On'}</span>
                        </button>
                      )}

                      {!isSource && (
                        <button
                          onClick={() => {
                            onDeleteNode(node.id);
                            setOpenMenuNodeId(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-950/30 transition-colors text-left cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. Footer Information inside the box */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-[#1b2236] px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            <span>Connections: {activeConnectionsCount} active</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>DAG Analytical</span>
          </div>
        </div>
      </div>

      {/* Outside the box at the bottom of the left side: small ? written help */}
      <div className="w-full max-w-[344px] flex justify-start pt-2 pb-1">
        <button
          onClick={() => setShowHelpModal(true)}
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0B0E17]/90 hover:bg-[#13192b] border border-[#1b2236] hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-all shadow-sm cursor-pointer"
          title="Architecture & Simulation Guide"
        >
          <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">
            ?
          </span>
          <span className="text-[11px] font-medium">Help</span>
        </button>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#0B0E17] border border-[#1b2236] rounded-2xl shadow-2xl max-w-md w-full p-5 text-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#1b2236]">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">Architecture & Simulation Guide</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="space-y-1">
                <p className="font-semibold text-indigo-300">⚡ Arrival Rate (λ)</p>
                <p className="text-slate-400">
                  Controls incoming user request velocity into the Frontend. Increase to stress test system capacity and spot cascading bottlenecks.
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-indigo-300">🧩 Components</p>
                <p className="text-slate-400">
                  Select any component to inspect utilization, queues, and latency. Adjust worker counts and capacity to resolve overloaded nodes.
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-indigo-300">🔗 Traffic Flow & Bottlenecks</p>
                <p className="text-slate-400">
                  Animated packets travel along active edges. When a component enters an overloaded state, incoming packets turn red and debounce to depict backpressure.
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-indigo-300">▶️ Simulation Control</p>
                <p className="text-slate-400">
                  Toggle the Play / Pause button in the top header at any time to pause or resume traffic animation.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors cursor-pointer shadow-sm"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
