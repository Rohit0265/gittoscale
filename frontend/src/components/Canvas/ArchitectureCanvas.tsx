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
import { ArchitectureNode, ArchitectureEdge, NodeSimulationResult, EdgeSimulationResult } from '../../types';

interface ArchitectureCanvasProps {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  nodeResults: Record<string, NodeSimulationResult>;
  edgeResults: Record<string, EdgeSimulationResult>;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onNodesChangePosition: (updatedNodes: ArchitectureNode[]) => void;
  onDeleteNode?: (nodeId: string) => void;
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
      className="w-full h-full relative bg-slate-50 dark:bg-[#0A0A0A] transition-colors"
      style={{ width: '100%', height: '100%', minWidth: '100%', minHeight: '100%' }}
    >
      <ReactFlow
        style={{ width: '100%', height: '100%' }}
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onRfNodesChange}
        onEdgesChange={onRfEdgesChange}
        connectionLineStyle={{
          stroke: isDark ? '#ffffff' : '#000000',
          strokeWidth: 2,
        }}
        onNodeDragStop={handleNodeDragStop}
        onNodeClick={(_, node) => {
          onSelectNode(node.id);
          handleSelectEdge(null);
        }}
        onEdgeClick={(_, edge) => {
          handleSelectEdge(edge.id);
          onSelectNode(null);
        }}
        onPaneClick={() => {
          onSelectNode(null);
          handleSelectEdge(null);
        }}
        onConnect={handleConnect}
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
    </div>
  );
};

export const ArchitectureCanvas = React.memo(ArchitectureCanvasComponent);
