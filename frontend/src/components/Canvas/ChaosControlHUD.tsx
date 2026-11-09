import React, { useState, useEffect } from 'react';
import {
  Flame,
  Zap,
  Clock,
  RotateCcw,
  Skull,
  ShieldCheck,
  ChevronDown,
  X,
  Shuffle,
} from 'lucide-react';
import { ArchitectureNode } from '../../types';

export interface ChaosControlHUDProps {
  nodes: ArchitectureNode[];
  onUpdateNode: (updatedNode: ArchitectureNode) => void;
  onRestoreAllNodes?: () => void;
  isDark?: boolean;
  className?: string;
}

export const ChaosControlHUD: React.FC<ChaosControlHUDProps> = ({
  nodes,
  onUpdateNode,
  onRestoreAllNodes,
  isDark: _isDark = true,
  className = 'relative flex flex-col items-start select-none',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');

  // Find all nodes that currently have active chaos
  const affectedNodes = nodes.filter(
    (n) => n.config.chaos?.isKilled || n.config.chaos?.isPartitioned || (n.config.chaos?.injectedLatencyMs || 0) > 0
  );

  useEffect(() => {
    if (!selectedNodeId && nodes.length > 0) {
      setSelectedNodeId(nodes[0].id);
    }
  }, [nodes, selectedNodeId]);

  const activeNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const handleKillNode = (node: ArchitectureNode) => {
    onUpdateNode({
      ...node,
      config: {
        ...node.config,
        chaos: {
          ...node.config.chaos,
          isKilled: true,
          isPartitioned: false,
        },
      },
    });
  };

  const handleInjectLatency = (node: ArchitectureNode, delayMs: number = 250) => {
    onUpdateNode({
      ...node,
      config: {
        ...node.config,
        chaos: {
          ...node.config.chaos,
          injectedLatencyMs: delayMs,
        },
      },
    });
  };

  const handlePartitionNode = (node: ArchitectureNode) => {
    onUpdateNode({
      ...node,
      config: {
        ...node.config,
        chaos: {
          ...node.config.chaos,
          isPartitioned: true,
          isKilled: false,
        },
      },
    });
  };

  const handleHealNode = (node: ArchitectureNode) => {
    onUpdateNode({
      ...node,
      config: {
        ...node.config,
        chaos: {
          isKilled: false,
          injectedLatencyMs: 0,
          isPartitioned: false,
        },
      },
    });
  };

  const handleHealAll = () => {
    if (onRestoreAllNodes) {
      onRestoreAllNodes();
      return;
    }
    nodes.forEach((node) => {
      if (node.config.chaos?.isKilled || node.config.chaos?.isPartitioned || (node.config.chaos?.injectedLatencyMs || 0) > 0) {
        handleHealNode(node);
      }
    });
  };

  const handleRandomStrike = () => {
    const candidates = nodes.filter((n) => n.enabled && !n.config.isSource && n.type !== 'load_generator');
    if (candidates.length === 0) return;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    const roll = Math.random();
    if (roll < 0.4) {
      handleKillNode(target);
    } else if (roll < 0.7) {
      handleInjectLatency(target, 350);
    } else {
      handlePartitionNode(target);
    }
  };

  return (
    <div className={className}>
      {/* Trigger Button */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-md text-xs font-semibold ${
            affectedNodes.length > 0
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 backdrop-blur-md animate-pulse'
              : 'bg-white/90 dark:bg-[#0c0c0e]/90 border-slate-200/90 dark:border-neutral-800 text-slate-800 dark:text-neutral-100 hover:border-slate-300 dark:hover:border-neutral-700 backdrop-blur-md'
          }`}
          title="Open Chaos Monkey failure injection controls"
        >
          <Flame className={`w-3.5 h-3.5 ${affectedNodes.length > 0 ? 'text-rose-500 fill-current' : 'text-amber-500'}`} />
          <span>Chaos Monkey</span>
          {affectedNodes.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold">
              {affectedNodes.length} Active
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </button>

        {affectedNodes.length > 0 && (
          <button
            type="button"
            onClick={handleHealAll}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-all cursor-pointer shadow-md"
            title="Restore all nodes to pristine health"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Heal All</span>
          </button>
        )}
      </div>

      {/* Expanded Failure Injection Drawer */}
      {isOpen && (
        <div className="mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-xl shadow-2xl p-4 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800/80">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-500" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Chaos Monkey Failure Engine
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Inject live crashes and observe cascading resilience
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Random Strike Button */}
          <div className="my-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleRandomStrike}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Strike Random Node</span>
            </button>

            {affectedNodes.length > 0 && (
              <button
                type="button"
                onClick={handleHealAll}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Target Component Selector */}
          <div className="mb-3">
            <label className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-neutral-400 block mb-1">
              Select Target Component
            </label>
            <select
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.type}) {n.config.chaos?.isKilled ? '🔥 [CRASHED]' : n.config.chaos?.isPartitioned ? '⚡ [PARTITIONED]' : (n.config.chaos?.injectedLatencyMs || 0) > 0 ? '⏱️ [+LAG]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Chaos Injection Actions for Active Node */}
          {activeNode && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                <span className="truncate max-w-[200px]">{activeNode.name}</span>
                <span className="text-[10px] font-mono uppercase text-slate-400">
                  {activeNode.type}
                </span>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleKillNode(activeNode)}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                    activeNode.config.chaos?.isKilled
                      ? 'bg-rose-500 text-white border-rose-600 font-bold'
                      : 'border-slate-200 dark:border-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <div className="flex items-center gap-1 font-semibold text-xs">
                    <Skull className="w-3.5 h-3.5" />
                    <span>Kill Node</span>
                  </div>
                  <span className="text-[10px] opacity-80">Instant crash (0 RPS)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInjectLatency(activeNode, 250)}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                    (activeNode.config.chaos?.injectedLatencyMs || 0) > 0
                      ? 'bg-amber-500 text-white border-amber-600 font-bold'
                      : 'border-slate-200 dark:border-neutral-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  <div className="flex items-center gap-1 font-semibold text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>+250ms Delay</span>
                  </div>
                  <span className="text-[10px] opacity-80">Replication / Network lag</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePartitionNode(activeNode)}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                    activeNode.config.chaos?.isPartitioned
                      ? 'bg-purple-600 text-white border-purple-700 font-bold'
                      : 'border-slate-200 dark:border-neutral-800 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-purple-600 dark:text-purple-400'
                  }`}
                >
                  <div className="flex items-center gap-1 font-semibold text-xs">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Partition</span>
                  </div>
                  <span className="text-[10px] opacity-80">Sever incoming/outgoing</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleHealNode(activeNode)}
                  className="p-2 rounded-lg border border-slate-200 dark:border-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-left transition-all cursor-pointer flex flex-col gap-0.5"
                >
                  <div className="flex items-center gap-1 font-semibold text-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Heal Component</span>
                  </div>
                  <span className="text-[10px] opacity-80">Restore pristine status</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
