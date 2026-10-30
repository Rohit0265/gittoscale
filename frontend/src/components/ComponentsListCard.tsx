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
  RotateCcw,
} from 'lucide-react';
import { ArchitectureNode, NodeSimulationResult, ComponentType } from '../types';

interface ComponentsListCardProps {
  nodes: ArchitectureNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onAddNode: (type: ComponentType, name: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onToggleNode: (nodeId: string) => void;
  onUpdateNode?: (node: ArchitectureNode) => void;
  onRestoreOriginal?: () => void;
  nodeResults: Record<string, NodeSimulationResult>;
  embedded?: boolean;
}

export const ComponentsListCard: React.FC<ComponentsListCardProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  onAddNode,
  onDeleteNode,
  onToggleNode,
  onUpdateNode,
  onRestoreOriginal,
  nodeResults,
  embedded = false,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [openMenuNodeId, setOpenMenuNodeId] = useState<string | null>(null);
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');

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
        hoverColor: 'group-hover:text-sky-500',
      };
    }
    if (type === 'gateway' || nameLower.includes('gateway') || idLower.includes('gateway')) {
      return {
        icon: Cloud,
        containerStyle: neutralContainerStyle,
        hoverColor: 'group-hover:text-purple-500',
      };
    }
    if (nameLower.includes('auth') || idLower.includes('auth')) {
      return {
        icon: Shield,
        containerStyle: neutralContainerStyle,
        hoverColor: 'group-hover:text-emerald-500',
      };
    }
    if (nameLower.includes('agent') || idLower.includes('agent') || nameLower.includes('bot')) {
      return {
        icon: Bot,
        containerStyle: neutralContainerStyle,
        hoverColor: 'group-hover:text-orange-500',
      };
    }
    if (nameLower.includes('billing') || nameLower.includes('payment') || idLower.includes('billing')) {
      return {
        icon: CreditCard,
        containerStyle: neutralContainerStyle,
        hoverColor: 'group-hover:text-amber-500',
      };
    }
    if (type === 'cache' || nameLower.includes('cache') || nameLower.includes('redis')) {
      return {
        icon: Database,
        containerStyle: neutralContainerStyle,
        hoverColor: 'group-hover:text-cyan-500',
      };
    }
    if (nameLower.includes('chat') || idLower.includes('chat') || nameLower.includes('message')) {
      return {
        icon: MessageSquare,
        containerStyle: neutralContainerStyle,
        hoverColor: 'group-hover:text-fuchsia-500',
      };
    }
    if (type === 'database') {
      return {
        icon: Database,
        containerStyle: neutralContainerStyle,
        hoverColor: 'group-hover:text-emerald-500',
      };
    }
    return {
      icon: Server,
      containerStyle: neutralContainerStyle,
      hoverColor: 'group-hover:text-indigo-500',
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

  const containerClasses = embedded
    ? 'w-full flex flex-col space-y-3 text-slate-800 dark:text-slate-200'
    : 'w-full bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800 rounded-2xl p-3 sm:p-3.5 space-y-3 shadow-none text-slate-800 dark:text-slate-200';

  return (
    <div className={containerClasses}>
      {/* Header Row */}
      <div className="flex items-center justify-between pb-1">
        <span className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
          COMPONENTS ({nodes.length})
        </span>

        <div className="flex items-center gap-1.5">
          {onRestoreOriginal && (
            <button
              onClick={onRestoreOriginal}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#141414] transition-colors cursor-pointer"
              title="Restore baseline architecture"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Add Component Menu */}
          <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-medium text-xs transition-colors shadow-none cursor-pointer"
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
                className="group w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#141414] text-left text-xs cursor-pointer text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Server className="w-3.5 h-3.5 text-slate-600 dark:text-neutral-400 group-hover:text-sky-500 transition-colors" />
                Service
              </button>
              <button
                onClick={() => {
                  onAddNode('cache', `Redis Cache ${nodes.length + 1}`);
                  setShowAddMenu(false);
                }}
                className="group w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#141414] text-left text-xs cursor-pointer text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-slate-600 dark:text-neutral-400 group-hover:text-cyan-500 transition-colors" />
                Cache
              </button>
              <button
                onClick={() => {
                  onAddNode('database', `Database ${nodes.length + 1}`);
                  setShowAddMenu(false);
                }}
                className="group w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#141414] text-left text-xs cursor-pointer text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Database className="w-3.5 h-3.5 text-slate-600 dark:text-neutral-400 group-hover:text-emerald-500 transition-colors" />
                Database
              </button>
              <button
                onClick={() => {
                  onAddNode('gateway', `API Gateway ${nodes.length + 1}`);
                  setShowAddMenu(false);
                }}
                className="group w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#141414] text-left text-xs cursor-pointer text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-slate-600 dark:text-neutral-400 group-hover:text-purple-500 transition-colors" />
                Gateway
              </button>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Component Cards Stack */}
      <div className="space-y-1.5 overflow-y-auto max-h-[38vh] pr-0.5">
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
              onClick={() => onSelectNode(isSelected ? null : node.id)}
              className={`group p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                isSelected
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-500/50 shadow-none ring-1 ring-indigo-400/30'
                  : 'bg-white dark:bg-[#141414]/75 hover:bg-slate-50 dark:hover:bg-[#141414] border-slate-200 dark:border-neutral-800 shadow-none'
              }`}
            >
              {/* Left side: status dot + icon badge + structured text */}
              <div className="flex items-center gap-2 min-w-0 flex-1 mr-1.5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusDot(node.id, node.enabled)}`} />

                {/* Icon badge */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${visual.containerStyle}`}
                >
                  <Icon className={`w-3.5 h-3.5 transition-colors ${visual.hoverColor}`} strokeWidth={1.75} />
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
                      <span className="font-medium text-slate-900 dark:text-slate-100 text-xs tracking-tight truncate">
                        {title}
                      </span>
                      {fileTag && (
                        <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px] ml-1 shrink-0 opacity-90">
                          {fileTag}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-tight">
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
                  <MoreVertical className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800 rounded-xl shadow-lg py-1 z-30 text-left text-slate-700 dark:text-slate-200 text-xs"
                  >
                    <button
                      onClick={() => {
                        setRenamingNodeId(node.id);
                        setRenameValue(node.name);
                        setOpenMenuNodeId(null);
                      }}
                      className="group/item w-full flex items-center gap-2 px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-[#141414] transition-colors text-left cursor-pointer"
                    >
                      <Pencil className="w-3 h-3 text-slate-600 dark:text-neutral-400 group-hover/item:text-indigo-500 transition-colors" />
                      <span>Rename</span>
                    </button>

                    {!isSource && (
                      <button
                        onClick={() => {
                          onToggleNode(node.id);
                          setOpenMenuNodeId(null);
                        }}
                        className={`group/item w-full flex items-center gap-2 px-2.5 py-1 text-slate-700 dark:text-slate-300 ${
                          node.enabled ? 'hover:text-amber-500' : 'hover:text-emerald-500'
                        } hover:bg-slate-100 dark:hover:bg-[#141414] transition-colors text-left cursor-pointer`}
                      >
                        <Power className={`w-3 h-3 text-slate-600 dark:text-neutral-400 ${
                          node.enabled ? 'group-hover/item:text-amber-500' : 'group-hover/item:text-emerald-500'
                        } transition-colors`} />
                        <span>{node.enabled ? 'Disable' : 'Enable'}</span>
                      </button>
                    )}

                    {!isSource && (
                      <button
                        onClick={() => {
                          onDeleteNode(node.id);
                          setOpenMenuNodeId(null);
                        }}
                        className="group/item w-full flex items-center gap-2 px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-[#141414] transition-colors text-left cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3 text-slate-600 dark:text-neutral-400 group-hover/item:text-red-500 transition-colors" />
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
  );
};
