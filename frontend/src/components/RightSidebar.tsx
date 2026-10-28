import React, { useState, useEffect } from 'react';
import {
  Layers,
  Cpu,
  AlertTriangle,
  PanelRight,
  Sliders,
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

export const RightSidebar: React.FC<RightSidebarProps> = ({
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
    <div className="my-auto w-full max-w-[340px] max-h-[calc(100vh-80px)] overflow-hidden rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800 shadow-none p-3 sm:p-3.5 flex flex-col space-y-3 text-slate-800 dark:text-slate-200 select-none">
      {/* 1. Header with Tab Switcher & Collapse */}
      <div className="flex items-center gap-1.5 pb-0.5">
        <div className="flex-1 flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-neutral-800 text-xs">
          {/* Tab 1: Components */}
          <button
            type="button"
            onClick={() => setActiveTab('components')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
              activeTab === 'components'
                ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
            title="Components Library"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Components</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-neutral-700 font-mono text-slate-600 dark:text-neutral-300">
              {nodes.length}
            </span>
          </button>

          {/* Tab 2: Inspector */}
          <button
            type="button"
            onClick={() => setActiveTab('inspector')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
              activeTab === 'inspector'
                ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
            title="Inspect Selected Component"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Inspector</span>
            {selectedNode && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
            )}
          </button>

          {/* Tab 3: Bottlenecks */}
          <button
            type="button"
            onClick={() => setActiveTab('bottlenecks')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
              activeTab === 'bottlenecks'
                ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
            title="Performance Bottlenecks"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Issues</span>
            {bottlenecksCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-mono font-bold">
                {bottlenecksCount}
              </span>
            )}
          </button>
        </div>

        {/* Collapse button */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse right sidebar"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#141414] dark:hover:bg-[#1A1A1A] border border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <PanelRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 2. Tab Content Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-160px)] pr-0.5">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors cursor-pointer shadow-none"
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
            onToggleCollapse={onToggleCollapse}
            embedded={true}
          />
        )}
      </div>
    </div>
  );
};

export default RightSidebar;
