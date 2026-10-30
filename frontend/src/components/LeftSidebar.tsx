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
  Zap,
  Cpu,
  Activity,
  Sparkles,
  Send,
} from 'lucide-react';
import { ArchitectureNode, ArchitectureEdge, NodeSimulationResult, ComponentType } from '../types';

interface LeftSidebarProps {
  incomingTrafficRate?: number;
  onChangeTrafficRate?: (val: number) => void;
  durationSeconds?: number;
  onChangeDuration?: (val: number) => void;
  activePrompt?: string;
  onRefinePrompt?: (refinement: string) => void;
  isGenerating?: boolean;
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
  activePrompt,
  onRefinePrompt,
  isGenerating = false,
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
  const [refineInput, setRefineInput] = useState('');

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
      return 'bg-slate-400 dark:bg-slate-600 opacity-50';
    }
    const res = nodeResults[nodeId];
    if (res?.status === 'overloaded') {
      return 'bg-rose-500 ring-2 ring-rose-500/20';
    }
    if (res?.status === 'warning') {
      return 'bg-amber-500 ring-2 ring-amber-500/20';
    }
    return 'bg-emerald-500 ring-2 ring-emerald-500/20';
  };

  const getComponentVisual = (node: ArchitectureNode) => {
    const nameLower = node.name.toLowerCase();
    const idLower = node.id.toLowerCase();
    const type = node.type;
    const neutralContainerStyle = 'bg-slate-100 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300';

    if (type === 'load_generator' || nameLower.includes('frontend') || idLower.includes('client')) {
      return {
        icon: Monitor,
        containerStyle: neutralContainerStyle,
      };
    }
    if (type === 'gateway' || nameLower.includes('gateway') || idLower.includes('gateway')) {
      return {
        icon: Cloud,
        containerStyle: neutralContainerStyle,
      };
    }
    if (nameLower.includes('auth') || idLower.includes('auth')) {
      return {
        icon: Shield,
        containerStyle: neutralContainerStyle,
      };
    }
    if (nameLower.includes('agent') || idLower.includes('agent') || nameLower.includes('bot')) {
      return {
        icon: Bot,
        containerStyle: neutralContainerStyle,
      };
    }
    if (nameLower.includes('billing') || nameLower.includes('payment') || idLower.includes('billing')) {
      return {
        icon: CreditCard,
        containerStyle: neutralContainerStyle,
      };
    }
    if (type === 'cache' || nameLower.includes('cache') || nameLower.includes('redis')) {
      return {
        icon: Database,
        containerStyle: neutralContainerStyle,
      };
    }
    if (nameLower.includes('chat') || idLower.includes('chat') || nameLower.includes('message')) {
      return {
        icon: MessageSquare,
        containerStyle: neutralContainerStyle,
      };
    }
    if (type === 'database') {
      return {
        icon: Database,
        containerStyle: neutralContainerStyle,
      };
    }
    return {
      icon: Server,
      containerStyle: neutralContainerStyle,
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

  const handleRefineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (refineInput.trim() && onRefinePrompt) {
      onRefinePrompt(refineInput.trim());
      setRefineInput('');
    }
  };

  return (
    <aside className="w-full h-full flex flex-col justify-center items-center py-2 sm:py-4 px-2 sm:px-3 bg-transparent select-none text-xs overflow-hidden transition-colors">
      {/* Centered Architecture Card - No box-shadow, subtle 1px border */}
      <div className="my-auto w-full max-w-[340px] max-h-[calc(100vh-80px)] overflow-y-auto rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800 shadow-none p-3 sm:p-3.5 flex flex-col space-y-3 sm:space-y-3.5 text-slate-800 dark:text-slate-200">
        {/* 1. System Requirements Card */}
        <div className="bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-neutral-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-slate-600 dark:text-neutral-400" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-700 dark:text-slate-200">
                System Requirements
              </span>
            </div>
            {isGenerating && (
              <span className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-neutral-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-neutral-400 animate-ping" />
                Refining...
              </span>
            )}
          </div>

          <div className="p-2 rounded-lg bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800">
            <p className="text-[11px] text-slate-600 dark:text-neutral-300 line-clamp-3 leading-relaxed italic">
              &ldquo;{activePrompt || 'Default distributed cloud architecture'}&rdquo;
            </p>
          </div>

          {onRefinePrompt && (
            <form onSubmit={handleRefineSubmit} className="flex items-center gap-1.5 pt-0.5">
              <input
                type="text"
                placeholder="Ask AI or refine architecture..."
                value={refineInput}
                onChange={(e) => setRefineInput(e.target.value)}
                disabled={isGenerating}
                className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!refineInput.trim() || isGenerating}
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors cursor-pointer"
                title="Send refinement to AI"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* 2. Components Header Row */}
        <div className="flex items-center justify-between px-0.5 pt-0.5">
          <span className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
            COMPONENTS ({nodes.length})
          </span>
          <div className="flex items-center gap-1.5">
            {/* Add Component Menu */}
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-medium text-xs transition-colors shadow-none cursor-pointer"
                title="Add component to architecture"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
              {showAddMenu && (
                <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800 rounded-xl shadow-lg p-1 z-30 space-y-0.5 text-slate-700 dark:text-slate-200">
                  <button
                    onClick={() => {
                      onAddNode('service', `Custom Service ${nodes.length + 1}`);
                      setShowAddMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#141414] text-left text-xs cursor-pointer text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <Server className="w-3.5 h-3.5 text-slate-600 dark:text-neutral-400" />
                    Service
                  </button>
                  <button
                    onClick={() => {
                      onAddNode('cache', `Redis Cache ${nodes.length + 1}`);
                      setShowAddMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#141414] text-left text-xs cursor-pointer text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5 text-slate-600 dark:text-neutral-400" />
                    Cache
                  </button>
                  <button
                    onClick={() => {
                      onAddNode('database', `Database ${nodes.length + 1}`);
                      setShowAddMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#141414] text-left text-xs cursor-pointer text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <Database className="w-3.5 h-3.5 text-slate-600 dark:text-neutral-400" />
                    Database
                  </button>
                  <button
                    onClick={() => {
                      onAddNode('gateway', `API Gateway ${nodes.length + 1}`);
                      setShowAddMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#141414] text-left text-xs cursor-pointer text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-slate-600 dark:text-neutral-400" />
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
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#141414] dark:hover:bg-[#1A1A1A] border border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
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
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-500/50 shadow-none ring-1 ring-indigo-400/30'
                    : 'bg-white dark:bg-[#141414]/75 hover:bg-slate-50 dark:hover:bg-[#141414] border-slate-200 dark:border-neutral-800 shadow-none'
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
                        className="w-full font-semibold text-slate-900 dark:text-slate-100 text-xs px-1.5 py-0.5 rounded border border-indigo-500 bg-white dark:bg-[#0A0A0A] focus:outline-none"
                      />
                    ) : (
                      <div className="flex items-center truncate">
                        <span className="font-medium text-slate-900 dark:text-slate-100 text-[13px] tracking-tight truncate">
                          {title}
                        </span>
                        {fileTag && (
                          <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] ml-1.5 shrink-0 opacity-90">
                            {fileTag}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 tracking-tight">
                      <span>{node.workerCount}w</span>
                      <span className="text-slate-400 dark:text-slate-600">•</span>
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
                    className={`p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer ${
                      isMenuOpen ? 'bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white' : ''
                    }`}
                    title="Component options"
                  >
                    <MoreVertical className="w-4 h-4" strokeWidth={1.75} />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800 rounded-xl shadow-lg py-1 z-30 text-left text-slate-700 dark:text-slate-200"
                    >
                      <button
                        onClick={() => {
                          setRenamingNodeId(node.id);
                          setRenameValue(node.name);
                          setOpenMenuNodeId(null);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#141414] transition-colors text-left cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-600 dark:text-neutral-400" />
                        <span>Rename</span>
                      </button>

                      {!isSource && (
                        <button
                          onClick={() => {
                            onToggleNode(node.id);
                            setOpenMenuNodeId(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#141414] transition-colors text-left cursor-pointer"
                        >
                          <Power className="w-3.5 h-3.5 text-slate-600 dark:text-neutral-400" />
                          <span>{node.enabled ? 'Power Off' : 'Power On'}</span>
                        </button>
                      )}

                      {!isSource && (
                        <button
                          onClick={() => {
                            onDeleteNode(node.id);
                            setOpenMenuNodeId(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#141414] transition-colors text-left cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-slate-600 dark:text-neutral-400" />
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
      </div>

      {/* Outside the box at the bottom of the left side: small ? written help */}
      <div className="w-full max-w-[340px] flex justify-start pt-2 pb-1">
        <button
          onClick={() => setShowHelpModal(true)}
          className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#0A0A0A] hover:bg-slate-50 dark:hover:bg-[#141414] border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-xs transition-colors shadow-none cursor-pointer"
          title="Architecture & Simulation Guide"
        >
          <span className="w-3.5 h-3.5 rounded-full border border-slate-400 dark:border-slate-500 group-hover:border-slate-600 dark:group-hover:border-slate-300 flex items-center justify-center text-[10px] font-bold">
            ?
          </span>
          <span className="text-[11px] font-medium tracking-wide">Help</span>
        </button>
      </div>

      {/* High-Craft Help & Simulation Guide Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-xl max-w-md w-full p-5 text-slate-800 dark:text-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-slate-700 dark:text-neutral-300" strokeWidth={1.75} />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">System Design Simulation Guide</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="space-y-1 bg-slate-50 dark:bg-[#141414] p-3 rounded-xl border border-slate-200 dark:border-neutral-800">
                <p className="font-semibold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-slate-600 dark:text-neutral-400" />
                  <span>Arrival Rate (λ)</span>
                </p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Controls incoming user request velocity into the Frontend entrypoint. Increase it to simulate traffic surges and uncover queue backpressure thresholds.
                </p>
              </div>
              <div className="space-y-1 bg-slate-50 dark:bg-[#141414] p-3 rounded-xl border border-slate-200 dark:border-neutral-800">
                <p className="font-semibold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-slate-600 dark:text-neutral-400" />
                  <span>Component Scaling</span>
                </p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Click any service or cache to inspect analytical utilization ($M/M/m/K$). Scale workers or capacity to relieve overloaded nodes.
                </p>
              </div>
              <div className="space-y-1 bg-slate-50 dark:bg-[#141414] p-3 rounded-xl border border-slate-200 dark:border-neutral-800">
                <p className="font-semibold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-600 dark:text-neutral-400" />
                  <span>Backpressure & Flow Packets</span>
                </p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Edge packets represent active requests. Overloaded targets turn packets red with debounced recoil to model network congestion.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors cursor-pointer shadow-none"
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
