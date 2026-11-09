import React, { useState, useEffect, useMemo, useCallback } from 'react';
import '@xyflow/react/dist/style.css';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  useReactFlow,
  NodeChange,
} from '@xyflow/react';
import { ArchitectureCustomNode } from './CustomNodes';
import { CustomEdge, resolveEdgeMode, getEdgeStyleConfig } from './CustomEdge';
import {
  ArchitectureNode,
  ArchitectureEdge,
  NodeSimulationResult,
  EdgeSimulationResult,
  ScenarioFixture,
} from '../../types';
import { FailureScenariosBar } from './FailureScenariosBar';
import { CloudCostHUD } from './CloudCostHUD';
import { CapacitySweeperModal } from './CapacitySweeperModal';
import {
  TrendingUp,
  Plus,
  Minus,
  Copy,
  Sliders,
  Power,
  Trash2,
  Zap,
} from 'lucide-react';

interface ArchitectureCanvasProps {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  nodeResults: Record<string, NodeSimulationResult>;
  edgeResults: Record<string, EdgeSimulationResult>;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onNodesChangePosition: (updatedNodes: ArchitectureNode[]) => void;
  onDeleteNode?: (nodeId: string) => void;
  onUpdateNode?: (updatedNode: ArchitectureNode) => void;
  onApplyScaledNodes?: (updatedNodes: ArchitectureNode[]) => void;
  onDuplicateNode?: (node: ArchitectureNode) => void;
  scenarios?: ScenarioFixture[];
  currentScenarioId?: string;
  onSelectScenario?: (scenarioId: string) => void;
  incomingTrafficRate?: number;
  onAddEdge: (newEdge: ArchitectureEdge) => void;
  onToggleEdge: (edgeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
  onUpdateEdge?: (edgeId: string, updates: Partial<ArchitectureEdge>) => void;
  selectedEdgeId?: string | null;
  onSelectEdge?: (edgeId: string | null) => void;
  viewMode?: 'basic' | 'detailed';
  isDark?: boolean;
  isRunning?: boolean;
  isLeftCollapsed?: boolean;
  isRightCollapsed?: boolean;
  leftSidebarWidth?: number;
}

const NodeFocusController: React.FC<{
  selectedNodeId: string | null;
  nodes: ArchitectureNode[];
  viewMode?: 'basic' | 'detailed';
}> = ({ selectedNodeId, nodes, viewMode }) => {
  const { setCenter, fitView } = useReactFlow();

  // Re-fit canvas into view when switching between basic and detailed view modes
  const prevViewModeRef = React.useRef(viewMode);
  React.useEffect(() => {
    if (prevViewModeRef.current !== viewMode) {
      prevViewModeRef.current = viewMode;
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, duration: 500 });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [viewMode, fitView]);

  // Automatically center & fit architecture whenever new nodes are generated or canvas hydrates from empty
  const prevNodeCountRef = React.useRef<number>(nodes.length);
  const prevNodeIdsRef = React.useRef<string>(nodes.map((n) => n.id).sort().join(','));
  React.useEffect(() => {
    const currentIds = nodes.map((n) => n.id).sort().join(',');
    const wasEmpty = prevNodeCountRef.current === 0 && nodes.length > 0;
    const isMajorChange =
      prevNodeIdsRef.current !== currentIds &&
      (Math.abs(nodes.length - prevNodeCountRef.current) >= 2 || wasEmpty);

    prevNodeCountRef.current = nodes.length;
    prevNodeIdsRef.current = currentIds;

    if ((wasEmpty || isMajorChange) && nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.22, duration: 500 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [nodes, fitView]);

  React.useEffect(() => {
    if (selectedNodeId) {
      const target = nodes.find((n) => n.id === selectedNodeId);
      if (target) {
        setCenter(target.position.x + 128, target.position.y + 60, {
          duration: 600,
          zoom: 1.15,
        });
      }
    }
  }, [selectedNodeId, nodes, setCenter]);

  return null;
};

const nodeTypes = {
  architectureNode: ArchitectureCustomNode,
};

const edgeTypes = {
  customEdge: CustomEdge,
};

const ArchitectureCanvasComponent: React.FC<ArchitectureCanvasProps> = ({
  nodes,
  edges,
  nodeResults,
  edgeResults,
  selectedNodeId,
  onSelectNode,
  onNodesChangePosition,
  onDeleteNode,
  onUpdateNode,
  onApplyScaledNodes,
  onDuplicateNode,
  scenarios,
  currentScenarioId,
  onSelectScenario,
  incomingTrafficRate = 1000,
  onAddEdge,
  onToggleEdge,
  onDeleteEdge,
  onUpdateEdge,
  selectedEdgeId,
  onSelectEdge,
  viewMode = 'detailed',
  isDark: propIsDark,
  isRunning = true,
  isLeftCollapsed = false,
  isRightCollapsed = false,
  leftSidebarWidth = 340,
}) => {
  const [isLargeScreen, setIsLargeScreen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const controlsShiftX = isLargeScreen ? (isLeftCollapsed ? 0 : leftSidebarWidth + 16) : 0;
  const minimapShiftX = isLargeScreen ? (isRightCollapsed ? 0 : -368) : 0;
  const topShiftX = isLargeScreen ? (isLeftCollapsed ? 14 : leftSidebarWidth + 14) : 14;
  const topCostRight = isLargeScreen ? (isRightCollapsed ? 14 : 384) : 14;

  const [isCapacitySweeperOpen, setIsCapacitySweeperOpen] = useState(false);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: ArchitectureNode;
  } | null>(null);

  const [edgeContextMenu, setEdgeContextMenu] = useState<{
    x: number;
    y: number;
    edge: ArchitectureEdge;
  } | null>(null);

  // Close context menus on outside click or Escape
  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenu(null);
      setEdgeContextMenu(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setEdgeContextMenu(null);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, rfNode: Node) => {
      event.preventDefault();
      const domainNode = nodes.find((n) => n.id === rfNode.id);
      if (domainNode) {
        setEdgeContextMenu(null);
        const menuWidth = 240;
        const menuHeight = 260;
        const x = Math.min(event.clientX, window.innerWidth - menuWidth - 16);
        const y = Math.min(event.clientY, window.innerHeight - menuHeight - 16);
        setContextMenu({ x, y, node: domainNode });
      }
    },
    [nodes]
  );

  const handleEdgeContextMenu = useCallback(
    (event: React.MouseEvent, rfEdge: Edge) => {
      event.preventDefault();
      const domainEdge = edges.find((e) => e.id === rfEdge.id);
      if (domainEdge) {
        setContextMenu(null);
        const menuWidth = 200;
        const menuHeight = 150;
        const x = Math.min(event.clientX, window.innerWidth - menuWidth - 16);
        const y = Math.min(event.clientY, window.innerHeight - menuHeight - 16);
        setEdgeContextMenu({ x, y, edge: domainEdge });
      }
    },
    [edges]
  );

  const avgP99Latency = useMemo(() => {
    const latencies = Object.values(nodeResults)
      .filter((r) => r.enabled && r.estimatedLatencyMs > 0)
      .map((r) => r.estimatedLatencyMs);
    if (latencies.length === 0) return 15;
    const sum = latencies.reduce((a, b) => a + b, 0);
    return Math.round((sum / latencies.length) * 10) / 10;
  }, [nodeResults]);

  const handleToggleNodeFromContext = (node: ArchitectureNode) => {
    if (!onUpdateNode) return;
    onUpdateNode({
      ...node,
      enabled: !node.enabled,
    });
    setContextMenu(null);
  };

  const handleScaleWorkersFromContext = (node: ArchitectureNode, delta: number) => {
    if (!onUpdateNode) return;
    const newWorkers = Math.max(1, node.workerCount + delta);
    onUpdateNode({
      ...node,
      workerCount: newWorkers,
    });
    setContextMenu(null);
  };

  const handleDuplicateFromContext = (node: ArchitectureNode) => {
    if (onDuplicateNode) {
      onDuplicateNode(node);
    } else if (onNodesChangePosition) {
      const clone: ArchitectureNode = {
        ...node,
        id: `node-${Date.now().toString().slice(-5)}`,
        name: `${node.name} (Copy)`,
        position: {
          x: node.position.x + 40,
          y: node.position.y + 40,
        },
      };
      onNodesChangePosition([...nodes, clone]);
      onUpdateNode?.(clone);
    }
    setContextMenu(null);
  };
  const [internalSelectedEdgeId, setInternalSelectedEdgeId] = useState<string | null>(null);
  const activeSelectedEdgeId = selectedEdgeId !== undefined ? selectedEdgeId : internalSelectedEdgeId;
  const handleSelectEdge = useCallback((id: string | null) => {
    if (onSelectEdge) {
      onSelectEdge(id);
    } else {
      setInternalSelectedEdgeId(id);
    }
  }, [onSelectEdge]);

  const [domIsDark, setDomIsDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const checkDark = () => {
      setDomIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const isDark = propIsDark !== undefined ? propIsDark : domIsDark;

  // Convert domain nodes to React Flow nodes
  const flowNodes: Node[] = useMemo(() => {
    return nodes.map((node) => ({
      id: node.id,
      type: 'architectureNode',
      position: node.position,
      data: {
        node,
        result: nodeResults[node.id],
      },
      selected: node.id === selectedNodeId,
    }));
  }, [nodes, nodeResults, selectedNodeId]);

  // Convert domain edges to React Flow edges
  const flowEdges: Edge[] = useMemo(() => {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    return edges.map((edge) => {
      const edgeRes = edgeResults[edge.id];
      const isEnabled = edge.enabled;
      const sNode = nodeMap.get(edge.source);
      const tNode = nodeMap.get(edge.target);

      let sourceHandle: string | undefined = undefined;
      let targetHandle: string | undefined = undefined;

      if (sNode && tNode) {
        const dy = tNode.position.y - sNode.position.y;
        const dx = tNode.position.x - sNode.position.x;

        if (dy > 120) {
          // Downward tree flow
          if (dx < -80) {
            sourceHandle = 'source-bottom-left';
          } else if (dx > 80) {
            sourceHandle = 'source-bottom-right';
          } else {
            sourceHandle = 'source-bottom';
          }
          targetHandle = 'target-top';
        } else if (Math.abs(dy) <= 120) {
          // Peer horizontal connection in same row/tier
          if (dx >= 0) {
            sourceHandle = 'source-right';
            targetHandle = 'target-left';
          } else {
            sourceHandle = 'source-left';
            targetHandle = 'target-right';
          }
        } else {
          // Upward flow
          if (dx >= 0) {
            sourceHandle = 'source-right';
            targetHandle = 'target-left';
          } else {
            sourceHandle = 'source-left';
            targetHandle = 'target-right';
          }
        }
      }

      const isExternal =
        tNode?.category === 'External Services' ||
        tNode?.id.startsWith('ext-') ||
        tNode?.id === 'node-firebase' ||
        tNode?.id === 'node-razorpay' ||
        tNode?.id === 'node-llms';

      const isSelected = edge.id === activeSelectedEdgeId;
      const isDarkMode =
        isDark !== undefined
          ? Boolean(isDark)
          : typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
      const mode = resolveEdgeMode(edge.communicationType, isExternal, isEnabled);
      const hasTraffic = isEnabled && (edgeRes?.flowRate ?? 0) > 0;
      const styleConfig = getEdgeStyleConfig(mode, hasTraffic, isDarkMode);

      const targetRes = nodeResults[edge.target];
      const isTargetOverloaded =
        targetRes?.status === 'overloaded' ||
        targetRes?.bottleneckSeverity === 'critical' ||
        (targetRes?.rejectedRequests ?? 0) > 0 ||
        (targetRes?.effectiveUtilization ?? 0) >= 100;
      const isTargetWarning =
        !isTargetOverloaded &&
        (targetRes?.status === 'warning' ||
          targetRes?.bottleneckSeverity === 'warning' ||
          Boolean(targetRes?.isBottleneck));

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle,
        targetHandle,
        type: 'customEdge',
        data: {
          edgeId: edge.id,
          source: edge.source,
          target: edge.target,
          sourceName: sNode?.name || edge.source,
          targetName: tNode?.name || edge.target,
          requestsPerInput: edge.requestsPerInput,
          flowRate: edgeRes?.flowRate ?? 0,
          enabled: isEnabled,
          isBidirectional: edge.isBidirectional,
          label: edge.label,
          dataFlowDescription: edge.dataFlowDescription,
          communicationType: edge.communicationType,
          isExternal,
          isDark: isDarkMode,
          isRunning,
          isOverloaded: isTargetOverloaded,
          isWarning: isTargetWarning,
          onToggle: () => onToggleEdge(edge.id),
          onDelete: () => onDeleteEdge?.(edge.id),
          onUpdateEdge,
          onSelectEdge: handleSelectEdge,
          isSelected,
        },
        selected: isSelected,
        selectable: true,
        interactionWidth: 28,
        // Only asynchronous message queues have animated marching dashes!
        // Synchronous HTTP, Database persistence, Cache, and RPC remain solid!
        animated: mode === 'queue' && hasTraffic,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: styleConfig.markerColor,
          width: 14,
          height: 14,
        },
        markerStart: edge.isBidirectional
          ? {
              type: MarkerType.ArrowClosed,
              color: styleConfig.markerColor,
              width: 14,
              height: 14,
            }
          : undefined,
      };
    });
  }, [edges, edgeResults, nodeResults, onToggleEdge, onDeleteEdge, onUpdateEdge, handleSelectEdge, activeSelectedEdgeId, nodes, isDark, isRunning]);

  const [rfNodes, setRfNodes, onRfNodesChange] = useNodesState(flowNodes);
  const [rfEdges, setRfEdges, onRfEdgesChange] = useEdgesState(flowEdges);

  // Propagate node deletions from keyboard (Backspace/Delete) or canvas actions to domain model
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onRfNodesChange(changes);
      if (onDeleteNode) {
        for (const c of changes) {
          if (c.type === 'remove') {
            onDeleteNode(c.id);
          }
        }
      }
    },
    [onRfNodesChange, onDeleteNode]
  );

  // Sync state when props change
  React.useEffect(() => {
    setRfNodes(flowNodes);
  }, [flowNodes, setRfNodes]);

  React.useEffect(() => {
    setRfEdges(flowEdges);
  }, [flowEdges, setRfEdges]);

  // Handle node drag stop: persist position
  const handleNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      const updated = nodes.map((n) =>
        n.id === node.id ? { ...n, position: node.position } : n
      );
      onNodesChangePosition(updated);
    },
    [nodes, onNodesChangePosition]
  );

  // Handle edge connection: defaults to bidirectional flow
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const isDarkMode =
        isDark !== undefined
          ? Boolean(isDark)
          : typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
      const styleConfig = getEdgeStyleConfig('http', false, isDarkMode);

      const newEdge: ArchitectureEdge = {
        id: `edge-${connection.source}-${connection.target}-${Date.now().toString().slice(-4)}`,
        source: connection.source,
        target: connection.target,
        requestsPerInput: 1.0,
        enabled: true,
        isBidirectional: true,
        communicationType: 'http',
        label: 'http',
      };
      onAddEdge(newEdge);

      setRfEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: newEdge.id,
            type: 'customEdge',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: styleConfig.markerColor,
              width: 14,
              height: 14,
            },
            markerStart: {
              type: MarkerType.ArrowClosed,
              color: styleConfig.markerColor,
              width: 14,
              height: 14,
            },
            data: {
              edgeId: newEdge.id,
              source: newEdge.source,
              target: newEdge.target,
              requestsPerInput: 1.0,
              flowRate: 0,
              enabled: true,
              isBidirectional: true,
              communicationType: 'http',
              isDark: isDarkMode,
              isRunning,
            },
          },
          eds
        )
      );
    },
    [onAddEdge, setRfEdges, isDark, isRunning]
  );

  return (
    <div
      className="w-full h-full relative bg-slate-50 dark:bg-[#0A0A0A] transition-colors overflow-hidden"
      style={{ width: '100%', height: '100%', minWidth: '100%', minHeight: '100%' }}
    >
      {/* Top Left Floating Bar: Scenarios & Capacity Sweeper */}
      <div
        className="absolute top-3.5 z-20 flex items-center gap-2 select-none"
        style={{
          left: `${topShiftX}px`,
          transition: 'left 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {scenarios && scenarios.length > 0 && onSelectScenario && (
          <FailureScenariosBar
            scenarios={scenarios}
            currentScenarioId={currentScenarioId}
            onSelectScenario={onSelectScenario}
            isDark={isDark}
          />
        )}
        <button
          type="button"
          onClick={() => setIsCapacitySweeperOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-500/30 dark:border-indigo-500/30 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 backdrop-blur-md shadow-xs text-xs font-semibold transition-all cursor-pointer group"
          title="Analyze cluster breaking point, saturation curve, and capacity limits"
        >
          <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
          <span>Capacity Sweeper</span>
          <span className="px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-mono text-[10px] font-bold">
            SLA
          </span>
        </button>
      </div>

      {/* Top Right Floating Bar: Cloud Cost Estimator */}
      <CloudCostHUD
        nodes={nodes}
        incomingRps={incomingTrafficRate}
        avgP99LatencyMs={avgP99Latency}
        isDark={isDark}
        style={{
          right: `${topCostRight}px`,
          transition: 'right 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      <ReactFlow
        style={{ width: '100%', height: '100%' }}
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={onRfEdgesChange}
        connectionLineStyle={{
          stroke: isDark ? '#ffffff' : '#000000',
          strokeWidth: 2,
        }}
        onNodeDragStop={handleNodeDragStop}
        onNodeClick={(_, node) => {
          onSelectNode(node.id);
          handleSelectEdge(null);
          setContextMenu(null);
        }}
        onEdgeClick={(_, edge) => {
          handleSelectEdge(edge.id);
          onSelectNode(null);
          setEdgeContextMenu(null);
        }}
        onPaneClick={() => {
          onSelectNode(null);
          handleSelectEdge(null);
          setContextMenu(null);
          setEdgeContextMenu(null);
        }}
        onNodeContextMenu={handleNodeContextMenu}
        onEdgeContextMenu={handleEdgeContextMenu}
        onConnect={handleConnect}
        onNodesDelete={(deletedNodes) => {
          if (onDeleteNode) {
            for (const n of deletedNodes) {
              onDeleteNode(n.id);
            }
          }
        }}
        onEdgesDelete={(deletedEdges) => {
          if (onDeleteEdge) {
            for (const e of deletedEdges) {
              onDeleteEdge(e.id);
            }
          }
        }}
        deleteKeyCode={['Backspace', 'Delete']}
        edgesFocusable={true}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.0}
        proOptions={{ hideAttribution: true }}
      >
        <NodeFocusController selectedNodeId={selectedNodeId} nodes={nodes} viewMode={viewMode} />
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color={isDark ? '#262626' : '#cbd5e1'}
        />
        <Controls
          position="bottom-left"
          showInteractive={false}
          style={{
            transform: `translateX(${controlsShiftX}px)`,
            transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          className="!bg-white dark:!bg-[#0A0A0A] !border !border-slate-200 dark:!border-neutral-800 shadow-none !rounded-xl [&>button]:!bg-white dark:[&>button]:!bg-[#0A0A0A] [&>button]:!border-slate-200 dark:[&>button]:!border-neutral-800 [&>button]:!fill-slate-600 dark:[&>button]:!fill-slate-300 [&>button:hover]:!bg-slate-100 dark:[&>button:hover]:!bg-[#141414] [&>button]:!text-slate-600 dark:[&>button]:!text-slate-300 z-10"
        />
        <MiniMap
          position="bottom-right"
          style={{
            transform: `translateX(${minimapShiftX}px)`,
            transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          nodeColor={(n) => {
            const nodeData = n.data as unknown as { result?: NodeSimulationResult };
            const status = nodeData?.result?.status;
            if (status === 'overloaded') return '#ef4444';
            if (status === 'warning') return '#f59e0b';
            if (status === 'disabled') return '#94a3b8';
            return '#10b981';
          }}
          maskColor={isDark ? 'rgba(10, 10, 10, 0.85)' : 'rgba(241, 245, 249, 0.7)'}
          nodeStrokeColor={isDark ? '#333333' : '#cbd5e1'}
          className="!border !border-slate-200 dark:!border-neutral-800 !rounded-xl !bg-white/95 dark:!bg-[#0A0A0A]/95 shadow-none z-10 hidden sm:block"
        />
      </ReactFlow>

      {/* Right-Click Node Context Menu */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 w-60 rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-xl shadow-2xl p-1.5 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Node Summary Header */}
          <div className="px-2.5 py-2 border-b border-slate-100 dark:border-neutral-800/80 mb-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                {contextMenu.node.name}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  !contextMenu.node.enabled
                    ? 'bg-slate-100 dark:bg-neutral-800 text-slate-500'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {contextMenu.node.enabled ? 'ACTIVE' : 'DISABLED'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-neutral-400 capitalize block mt-0.5">
              {contextMenu.node.type.replace('_', ' ')} · {contextMenu.node.workerCount} workers
            </span>
          </div>

          {/* Component Quick Actions */}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => handleToggleNodeFromContext(contextMenu.node)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-neutral-800/80 text-slate-700 dark:text-neutral-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Power className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{contextMenu.node.enabled ? 'Disable Component' : 'Enable Component'}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{contextMenu.node.enabled ? 'Off' : 'On'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleScaleWorkersFromContext(contextMenu.node, 1)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer font-medium"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Scale Up (+1 Worker)</span>
              </div>
              <span className="text-[10px] font-mono text-indigo-500">{contextMenu.node.workerCount + 1}</span>
            </button>

            {contextMenu.node.workerCount > 1 && (
              <button
                type="button"
                onClick={() => handleScaleWorkersFromContext(contextMenu.node, -1)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-neutral-800/80 text-slate-700 dark:text-neutral-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Minus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Scale Down (-1 Worker)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{contextMenu.node.workerCount - 1}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onSelectNode(contextMenu.node.id);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-neutral-800/80 text-slate-700 dark:text-neutral-200 transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Inspect & Edit Properties</span>
            </button>

            <button
              type="button"
              onClick={() => handleDuplicateFromContext(contextMenu.node)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-neutral-800/80 text-slate-700 dark:text-neutral-200 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Duplicate Component</span>
            </button>
          </div>

          {onDeleteNode && (
            <>
              <div className="my-1 border-t border-slate-100 dark:border-neutral-800" />
              <button
                type="button"
                onClick={() => {
                  onDeleteNode(contextMenu.node.id);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Delete Component</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Right-Click Edge Context Menu */}
      {edgeContextMenu && (
        <div
          style={{ top: edgeContextMenu.y, left: edgeContextMenu.x }}
          className="fixed z-50 w-52 rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-xl shadow-2xl p-1.5 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-neutral-800/80 mb-1">
            <span className="font-bold text-slate-900 dark:text-white block truncate">
              Link Connection
            </span>
            <span className="text-[10px] text-slate-500 dark:text-neutral-400 capitalize block">
              {edgeContextMenu.edge.communicationType || 'http'} · {edgeContextMenu.edge.enabled ? 'Active' : 'Severed'}
            </span>
          </div>

          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => {
                onToggleEdge(edgeContextMenu.edge.id);
                setEdgeContextMenu(null);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-neutral-800/80 text-slate-700 dark:text-neutral-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span>{edgeContextMenu.edge.enabled ? 'Sever Link' : 'Restore Link'}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{edgeContextMenu.edge.enabled ? 'Off' : 'On'}</span>
            </button>

            {onDeleteEdge && (
              <button
                type="button"
                onClick={() => {
                  onDeleteEdge(edgeContextMenu.edge.id);
                  setEdgeContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Delete Connection</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Capacity Sweeper & Breaking Point Analyzer Modal */}
      <CapacitySweeperModal
        isOpen={isCapacitySweeperOpen}
        onClose={() => setIsCapacitySweeperOpen(false)}
        nodes={nodes}
        edges={edges}
        currentTrafficRps={incomingTrafficRate}
        onApplyScaling={(scaledNodes) => {
          if (onApplyScaledNodes) {
            onApplyScaledNodes(scaledNodes);
          } else {
            onNodesChangePosition(scaledNodes);
            scaledNodes.forEach((n) => onUpdateNode?.(n));
          }
        }}
        isDark={isDark}
      />
        >
          <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-neutral-800/80 mb-1">
            <span className="font-bold text-slate-900 dark:text-white block truncate">
              Link Connection
            </span>
            <span className="text-[10px] text-slate-500 dark:text-neutral-400 capitalize block">
              {edgeContextMenu.edge.communicationType || 'http'} · {edgeContextMenu.edge.enabled ? 'Active' : 'Severed'}
            </span>
          </div>

          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => {
                onToggleEdge(edgeContextMenu.edge.id);
                setEdgeContextMenu(null);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-neutral-800/80 text-slate-700 dark:text-neutral-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span>{edgeContextMenu.edge.enabled ? 'Sever Link' : 'Restore Link'}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{edgeContextMenu.edge.enabled ? 'Off' : 'On'}</span>
            </button>

            {onDeleteEdge && (
              <button
                type="button"
                onClick={() => {
                  onDeleteEdge(edgeContextMenu.edge.id);
                  setEdgeContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Delete Connection</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const ArchitectureCanvas = React.memo(ArchitectureCanvasComponent);
