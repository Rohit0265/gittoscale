import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PanelRightClose,
  Sliders,
  Layers,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import {
  ArchitectureNode,
  ArchitectureEdge,
  NodeSimulationResult,
  SimulationResult,
  ComponentType,
} from '../types';
import { ComponentsListCard } from './ComponentsListCard';
import { ComponentInspector } from './ComponentInspector';
import { BottleneckList } from './BottleneckList';

export type RightSidebarTab = 'components' | 'inspector' | 'bottlenecks';

interface RightSidebarProps {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  selectedNodeId: string | null;
  selectedNode?: ArchitectureNode;
  selectedNodeResult?: NodeSimulationResult;
  simulationResult: SimulationResult | null;
  onSelectNode: (nodeId: string | null) => void;
  onAddNode: (type: ComponentType, name: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onToggleNode: (nodeId: string) => void;
  onUpdateNode: (node: ArchitectureNode) => void;
  onRestoreOriginal?: () => void;
  onUpdateEdgeMultiplier: (edgeId: string, multiplier: number) => void;
  onDeleteEdge?: (edgeId: string) => void;
  onChangeIncomingTrafficRate?: (rate: number) => void;
  incomingTrafficRate?: number;
  onNavigateToParent?: (parentId: string) => void;
  viewMode?: 'basic' | 'detailed';
  onToggleCollapse?: () => void;
}

const RightSidebarComponent: React.FC<RightSidebarProps> = ({
  nodes,
  edges,
  selectedNodeId,
  selectedNode,
  selectedNodeResult,
  simulationResult,
  onSelectNode,
  onAddNode,
  onDeleteNode,
  onToggleNode,
  onUpdateNode,
  onRestoreOriginal,
  onUpdateEdgeMultiplier,
  onDeleteEdge,
  onChangeIncomingTrafficRate,
  incomingTrafficRate,
  onNavigateToParent,
  viewMode,
  onToggleCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<RightSidebarTab>('components');

  // Automatically switch to Inspector tab when a node is selected on the canvas
  useEffect(() => {
    if (selectedNodeId) {
      setActiveTab('inspector');
    }
  }, [selectedNodeId]);

  const bottlenecksCount = simulationResult?.bottlenecks?.length || 0;

  const handleSelectFromList = (nodeId: string | null) => {
    onSelectNode(nodeId);
    if (nodeId) {
      setActiveTab('inspector');
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#0A0A0A] text-slate-800 dark:text-slate-200 select-none overflow-hidden">
      {/* 1. Header with Swiggy-inspired Elevated Tab Switcher & Integrated Collapse Toggle */}
      <div className="flex items-center gap-2 p-2.5 pb-2 border-b border-slate-200/80 dark:border-neutral-800/80 bg-slate-50/50 dark:bg-[#0c0c0c] shrink-0">
        <div className="flex-1 flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-[#141414] border border-slate-200/80 dark:border-neutral-800 text-xs relative gap-1">
          {/* Tab 1: Components */}
          <button
            type="button"
            onClick={() => setActiveTab('components')}
            className="relative flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-medium transition-colors cursor-pointer group"
            title="Components Library"
          >
            {activeTab === 'components' && (
              <motion.div
                layoutId="right-tab-card"
                className="absolute inset-0 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200/80 dark:border-neutral-700/80 shadow-xs"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
              />
            )}
            <span className={`relative z-10 flex items-center gap-1.5 transition-colors ${
              activeTab === 'components'
                ? 'text-slate-900 dark:text-white font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
            }`}>
              <Layers className="w-3.5 h-3.5" />
              <span>Components</span>
            </span>

            {activeTab === 'components' && (
              <motion.div
                layoutId="right-tab-line"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[2.5px] w-6 rounded-full bg-slate-900 dark:bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)] z-20"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
              />
            )}
          </button>

          {/* Tab 2: Inspector */}
          <button
            type="button"
            onClick={() => setActiveTab('inspector')}
            className="relative flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-medium transition-colors cursor-pointer group"
            title="Inspect Selected Component"
          >
            {activeTab === 'inspector' && (
              <motion.div
                layoutId="right-tab-card"
                className="absolute inset-0 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200/80 dark:border-neutral-700/80 shadow-xs"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
              />
            )}
            <span className={`relative z-10 flex items-center gap-1.5 transition-colors ${
              activeTab === 'inspector'
                ? 'text-slate-900 dark:text-white font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
            }`}>
              <Sliders className="w-3.5 h-3.5" />
              <span>Inspector</span>
              {selectedNode && (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white shrink-0" />
              )}
            </span>

            {activeTab === 'inspector' && (
              <motion.div
                layoutId="right-tab-line"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[2.5px] w-6 rounded-full bg-slate-900 dark:bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)] z-20"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
              />
            )}
          </button>

          {/* Tab 3: Bottlenecks */}
          <button
            type="button"
            onClick={() => setActiveTab('bottlenecks')}
            className="relative flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-medium transition-colors cursor-pointer group"
            title="Performance Bottlenecks"
          >
            {activeTab === 'bottlenecks' && (
              <motion.div
                layoutId="right-tab-card"
                className="absolute inset-0 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200/80 dark:border-neutral-700/80 shadow-xs"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
              />
            )}
            <span className={`relative z-10 flex items-center gap-1.5 transition-colors ${
              activeTab === 'bottlenecks'
                ? 'text-slate-900 dark:text-white font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Issues</span>
              {bottlenecksCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-mono font-bold">
                  {bottlenecksCount}
                </span>
              )}
            </span>

            {activeTab === 'bottlenecks' && (
              <motion.div
                layoutId="right-tab-line"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[2.5px] w-6 rounded-full bg-slate-900 dark:bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)] z-20"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
              />
            )}
          </button>
        </div>

        {/* Integrated Panel Collapse Toggle */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Tab Content Area (Scrollable full height) */}
      <div className="flex-1 overflow-y-auto p-3 pt-2.5 space-y-3 min-h-0">
        {/* TAB 1: Components List */}
        {activeTab === 'components' && (
          <ComponentsListCard
            nodes={nodes}
            selectedNodeId={selectedNodeId}
            onSelectNode={handleSelectFromList}
            onAddNode={onAddNode}
            onDeleteNode={onDeleteNode}
            onToggleNode={onToggleNode}
            onUpdateNode={onUpdateNode}
            onRestoreOriginal={onRestoreOriginal}
            nodeResults={simulationResult?.nodeResults || {}}
            embedded={true}
          />
        )}

        {/* TAB 2: Component Inspector */}
        {activeTab === 'inspector' && (
          selectedNode ? (
            <ComponentInspector
              node={selectedNode}
              result={selectedNodeResult}
              edges={edges}
              onClose={() => {
                onSelectNode(null);
                setActiveTab('components');
              }}
              onDeleteNode={(nodeId) => {
                onDeleteNode(nodeId);
                setActiveTab('components');
              }}
              onUpdateNode={onUpdateNode}
              onUpdateEdgeMultiplier={onUpdateEdgeMultiplier}
              onDeleteEdge={onDeleteEdge}
              onChangeIncomingTrafficRate={onChangeIncomingTrafficRate}
              incomingTrafficRate={incomingTrafficRate}
              onNavigateToParent={onNavigateToParent}
              viewMode={viewMode}
              allNodes={nodes}
              onToggleCollapse={onToggleCollapse}
              embedded={true}
            />
          ) : (
            <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-neutral-800 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-slate-200/60 dark:bg-neutral-800/80 flex items-center justify-center text-slate-400 dark:text-neutral-400">
                <Sliders className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  No Component Selected
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[220px]">
                  Click any node on the architecture canvas or pick one from the Components list to tune workers, capacity, and latency.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('components')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-medium text-xs transition-colors cursor-pointer shadow-xs"
              >
                <span>View Components</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        )}

        {/* TAB 3: Bottlenecks & Analysis */}
        {activeTab === 'bottlenecks' && (
          <BottleneckList
            simulationResult={simulationResult}
            nodes={nodes}
            onSelectNode={(nodeId) => {
              onSelectNode(nodeId);
              setActiveTab('inspector');
            }}
            selectedNodeId={selectedNodeId}
            embedded={true}
          />
        )}
      </div>
    </div>
  );
};

export const RightSidebar = React.memo(RightSidebarComponent);
export default RightSidebar;
