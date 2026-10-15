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
  Monitor,
  Cloud,
  Shield,
  Bot,
  CreditCard,
  MessageSquare,
  PanelLeft,
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
  edges: _edges,
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
      return 'bg-slate-600 opacity-40';
    }
    const res = nodeResults[nodeId];
    if (res?.status === 'overloaded') {
      return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.95)] animate-pulse';
    }
    if (res?.status === 'warning') {
      return 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.85)]';
    }
    return 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]';
  };

  const getComponentVisual = (node: ArchitectureNode) => {
    const nameLower = node.name.toLowerCase();
    const idLower = node.id.toLowerCase();
    const type = node.type;

    if (type === 'load_generator' || nameLower.includes('frontend') || idLower.includes('client')) {
      return {
        icon: Monitor,
        containerStyle: 'bg-[#0E172A] border-[#1E293B] text-sky-400',
      };
    }
    if (type === 'gateway' || nameLower.includes('gateway') || idLower.includes('gateway')) {
      return {
        icon: Cloud,
        containerStyle: 'bg-[#1D132D] border-[#2E1D47] text-purple-400',
      };
    }
    if (nameLower.includes('auth') || idLower.includes('auth')) {
      return {
        icon: Shield,
        containerStyle: 'bg-[#0B1E17] border-[#16382B] text-emerald-400',
      };
    }
    if (nameLower.includes('agent') || idLower.includes('agent') || nameLower.includes('bot')) {
      return {
        icon: Bot,
        containerStyle: 'bg-[#26150D] border-[#3F2316] text-orange-400',
      };
    }
    if (nameLower.includes('billing') || nameLower.includes('payment') || idLower.includes('billing')) {
      return {
        icon: CreditCard,
        containerStyle: 'bg-[#241C09] border-[#3D3010] text-amber-400',
      };
    }
    if (type === 'cache' || nameLower.includes('cache') || nameLower.includes('redis')) {
      return {
        icon: Database,
        containerStyle: 'bg-[#0A1A28] border-[#132E47] text-cyan-400',
      };
    }
    if (nameLower.includes('chat') || idLower.includes('chat') || nameLower.includes('message')) {
      return {
        icon: MessageSquare,
        containerStyle: 'bg-[#220F2B] border-[#3A1B49] text-fuchsia-400',
      };
    }
    if (type === 'database') {
      return {
        icon: Database,
        containerStyle: 'bg-[#0B1E17] border-[#16382B] text-emerald-400',
      };
    }
    return {
      icon: Server,
      containerStyle: 'bg-[#131728] border-[#222944] text-indigo-400',
    };
  };

  const splitNodeName = (rawName: string) => {
    const match = rawName.match(/^(.*?)(?:\s*\[(.*?)\])?$/);
    if (!match) return { title: rawName, fileTag: null };
    return {
      title: match[1]?.trim() || rawName,
      fileTag: match[2]?.trim() ? `[${match[2].trim()}]` : null,
    };
  };

  const sliderPercent = Math.min(100, Math.max(0, ((incomingTrafficRate - 100) / (5000 - 100)) * 100));

  return (
    <aside className="w-full h-full flex flex-col justify-between items-center py-4 px-3 bg-transparent select-none text-xs overflow-hidden transition-colors">
      {/* Centered Architecture Card */}
      <div className="my-auto w-full max-w-[340px] rounded-2xl bg-[#080B13] border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.7)] p-3.5 flex flex-col space-y-3.5 text-slate-200">
        {/* 1. Arrival Rate Control Card */}
        <div className="bg-[#0E1320] border border-white/[0.06] rounded-xl p-3 space-y-2.5 shadow-inner">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-200">
              <span className="tracking-tight">Request/Sec</span>
              {/* <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200 transition-colors cursor-help" /> */}
            </div>
            <div className="relative">
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
                className="w-16 text-center font-mono font-bold text-xs px-2 py-0.5 rounded-lg border border-indigo-500/30 bg-[#13192B] text-indigo-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs"
              />
            </div>
          </div>

          {/* Precision Gradient Range Slider */}
          <div className="space-y-1.5">
            <input
              type="range"
              min={100}
              max={5000}
              step={50}
              value={incomingTrafficRate}
              onChange={(e) => onChangeTrafficRate(Number(e.target.value))}
              style={{
                background: `linear-gradient(to right, #818CF8 0%, #6366F1 ${sliderPercent}%, #1E2538 ${sliderPercent}%, #1E2538 100%)`,
              }}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#818CF8]"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono tracking-tight">
              <span>100 r/s</span>
              <span>2,500 r/s</span>
              <span>5,000 r/s</span>
            </div>
          </div>
        </div>

        {/* 2. Components Header Row */}
        <div className="flex items-center justify-between px-0.5 pt-0.5">
          <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase">
            COMPONENTS ({nodes.length})
          </span>
          <div className="flex items-center gap-1.5">
            {/* Add Component Menu */}
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#5542F6] hover:bg-[#4836E4] active:scale-95 text-white font-medium text-xs transition-all shadow-sm cursor-pointer"
                title="Add component to architecture"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
              {showAddMenu && (
                <div className="absolute right-0 mt-1.5 w-44 bg-[#0E1320] border border-white/[0.08] rounded-xl shadow-2xl p-1 z-30 space-y-0.5 text-slate-200">
                  <button
                    onClick={() => {
                      onAddNode('service', `Custom Service ${nodes.length + 1}`);
                      setShowAddMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left text-xs cursor-pointer text-slate-200 transition-colors"
                  >
                    <Server className="w-3.5 h-3.5 text-sky-400" />
                    Service
                  </button>
                  <button
                    onClick={() => {
                      onAddNode('cache', `Redis Cache ${nodes.length + 1}`);
                      setShowAddMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left text-xs cursor-pointer text-slate-200 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    Cache
                  </button>
                  <button
                    onClick={() => {
                      onAddNode('database', `Database ${nodes.length + 1}`);
                      setShowAddMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left text-xs cursor-pointer text-slate-200 transition-colors"
                  >
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    Database
                  </button>
                  <button
                    onClick={() => {
                      onAddNode('gateway', `API Gateway ${nodes.length + 1}`);
                      setShowAddMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] text-left text-xs cursor-pointer text-slate-200 transition-colors"
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
                className="p-1.5 rounded-lg bg-[#111726] hover:bg-[#161E31] border border-white/[0.06] text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 3. Component Cards Stack */}
        <div className="space-y-2 overflow-y-auto max-h-[50vh] pr-0.5">
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isSource = node.type === 'load_generator';
            const isMenuOpen = openMenuNodeId === node.id;
            const isRenaming = renamingNodeId === node.id;
            const visual = getComponentVisual(node);
            const Icon = visual.icon;
            const { title, fileTag } = splitNodeName(node.name);

            return (
              <div
                key={node.id}
                onClick={() => onSelectNode(node.id)}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#12192B] border-indigo-500/50 shadow-sm ring-1 ring-indigo-500/25'
                    : 'bg-[#0E1320]/75 hover:bg-[#121829] border-white/[0.06] hover:border-white/10'
                }`}
              >
                {/* Left side: status dot + icon badge + structured text */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${getStatusDot(node.id, node.enabled)}`} />

                  {/* Icon badge */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${visual.containerStyle}`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
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
                        className="w-full font-semibold text-slate-100 text-xs px-1.5 py-0.5 rounded border border-indigo-500 bg-[#080B13] shadow-xs focus:outline-none"
                      />
                    ) : (
                      <div className="flex items-center truncate">
                        <span className="font-medium text-slate-100 text-[13px] tracking-tight truncate">
                          {title}
                        </span>
                        {fileTag && (
                          <span className="text-slate-400 font-mono text-[11px] ml-1.5 shrink-0 opacity-90">
                            {fileTag}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5 tracking-tight">
                      <span>{node.workerCount}w</span>
                      <span className="text-slate-600">•</span>
                      <span>{node.capacityPerSecond.toLocaleString()} r/s</span>
                    </div>
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
                    className={`p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-colors cursor-pointer ${
                      isMenuOpen ? 'bg-white/[0.08] text-white' : ''
                    }`}
                    title="Component options"
                  >
                    <MoreVertical className="w-4 h-4" strokeWidth={1.75} />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-full mt-1 w-36 bg-[#0E1320] border border-white/[0.08] rounded-xl shadow-2xl py-1 z-30 text-left text-slate-200"
                    >
                      <button
                        onClick={() => {
                          setRenamingNodeId(node.id);
                          setRenameValue(node.name);
                          setOpenMenuNodeId(null);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/[0.06] transition-colors text-left cursor-pointer"
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
        {/* <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-white/[0.06] px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            <span>Connections: {activeConnectionsCount} active</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <BarChart3 className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
            <span className="font-mono text-[10px] tracking-tight">DAG Analytical</span>
          </div>
        </div> */}
      </div>

      {/* Outside the box at the bottom of the left side: small ? written help */}
      <div className="w-full max-w-[340px] flex justify-start pt-2 pb-1">
        <button
          onClick={() => setShowHelpModal(true)}
          className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0E1320] hover:bg-[#13192B] border border-white/[0.08] hover:border-white/20 text-slate-400 hover:text-slate-100 text-xs transition-all shadow-md cursor-pointer"
          title="Architecture & Simulation Guide"
        >
          <span className="w-3.5 h-3.5 rounded-full border border-slate-500 group-hover:border-slate-300 flex items-center justify-center text-[10px] font-bold">
            ?
          </span>
          <span className="text-[11px] font-medium tracking-wide">Help</span>
        </button>
      </div>

      {/* High-Craft Help & Simulation Guide Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-[#080B13] border border-white/[0.08] rounded-2xl shadow-2xl max-w-md w-full p-5 text-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" strokeWidth={1.75} />
                <h3 className="font-bold text-sm text-white tracking-tight">System Design Simulation Guide</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="space-y-1 bg-[#0E1320] p-3 rounded-xl border border-white/[0.06]">
                <p className="font-semibold text-indigo-300">⚡ Arrival Rate (λ)</p>
                <p className="text-slate-400 leading-relaxed">
                  Controls incoming user request velocity into the Frontend entrypoint. Increase it to simulate traffic surges and uncover queue backpressure thresholds.
                </p>
              </div>
              <div className="space-y-1 bg-[#0E1320] p-3 rounded-xl border border-white/[0.06]">
                <p className="font-semibold text-indigo-300">🧩 Component Scaling</p>
                <p className="text-slate-400 leading-relaxed">
                  Click any service or cache to inspect analytical utilization ($M/M/m/K$). Scale workers or capacity to relieve overloaded nodes.
                </p>
              </div>
              <div className="space-y-1 bg-[#0E1320] p-3 rounded-xl border border-white/[0.06]">
                <p className="font-semibold text-indigo-300">🌊 Backpressure & Flow Packets</p>
                <p className="text-slate-400 leading-relaxed">
                  Edge packets represent active requests. Overloaded targets turn packets red with debounced recoil to model network congestion.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-1.5 rounded-lg bg-[#5542F6] hover:bg-[#4836E4] text-white font-medium text-xs transition-colors cursor-pointer shadow-sm"
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
