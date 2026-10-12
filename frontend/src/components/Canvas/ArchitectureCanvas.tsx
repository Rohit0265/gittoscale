import React, { useMemo, useCallback } from 'react';
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
} from '@xyflow/react';
import { ArchitectureCustomNode } from './CustomNodes';
import { CustomEdge, resolveEdgeMode, getEdgeStyleConfig } from './CustomEdge';
import { ArchitectureNode, ArchitectureEdge, NodeSimulationResult, EdgeSimulationResult } from '../../types';
import { Layers, Network } from 'lucide-react';

interface ArchitectureCanvasProps {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  nodeResults: Record<string, NodeSimulationResult>;
  edgeResults: Record<string, EdgeSimulationResult>;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onNodesChangePosition: (updatedNodes: ArchitectureNode[]) => void;
  onAddEdge: (newEdge: ArchitectureEdge) => void;
  onToggleEdge: (edgeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
  viewMode?: 'basic' | 'detailed';
  onToggleViewMode?: (mode: 'basic' | 'detailed') => void;
}

const NodeFocusController: React.FC<{
  selectedNodeId: string | null;
  nodes: ArchitectureNode[];
}> = ({ selectedNodeId, nodes }) => {
  const { setCenter } = useReactFlow();

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

export const ArchitectureCanvas: React.FC<ArchitectureCanvasProps> = ({
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
  viewMode = 'basic',
  onToggleViewMode,
}) => {
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

        if (dy > 80) {
          // Downward tree flow
          if (dx < -60) {
            sourceHandle = 'source-bottom-left';
          } else if (dx > 60) {
            sourceHandle = 'source-bottom-right';
          } else {
            sourceHandle = 'source-bottom';
          }
          targetHandle = 'target-top';
        } else if (Math.abs(dy) <= 80) {
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

      const mode = resolveEdgeMode(edge.communicationType, isExternal, isEnabled);
      const hasTraffic = isEnabled && (edgeRes?.flowRate ?? 0) > 0;
      const styleConfig = getEdgeStyleConfig(mode, hasTraffic);

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle,
        targetHandle,
        type: 'customEdge',
        data: {
          requestsPerInput: edge.requestsPerInput,
          flowRate: edgeRes?.flowRate ?? 0,
          enabled: isEnabled,
          isBidirectional: edge.isBidirectional,
          label: edge.label,
          dataFlowDescription: edge.dataFlowDescription,
          communicationType: edge.communicationType,
          isExternal,
          onToggle: () => onToggleEdge(edge.id),
          onDelete: () => onDeleteEdge?.(edge.id),
        },
        selectable: true,
        interactionWidth: 24,
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
  }, [edges, edgeResults, onToggleEdge, onDeleteEdge]);

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

  // Handle edge connection
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const newEdge: ArchitectureEdge = {
        id: `edge-${connection.source}-${connection.target}-${Date.now().toString().slice(-4)}`,
        source: connection.source,
        target: connection.target,
        requestsPerInput: 1.0,
        enabled: true,
      };
      onAddEdge(newEdge);
      setRfEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'customEdge',
            data: { requestsPerInput: 1.0, flowRate: 0, enabled: true },
          },
          eds
        )
      );
    },
    [onAddEdge, setRfEdges]
  );

  return (
    <div className="w-full h-full relative">
      {/* Floating Two-Mode Toggle & Flow Modes Legend Above Canvas */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 pointer-events-auto">
        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-xs p-1 rounded-xl shadow-md border border-slate-200">
          <button
            onClick={() => onToggleViewMode?.('basic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'basic'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Basic View: High-level overview of services, gateways, datastores, and external services"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Basic View</span>
          </button>
          <button
            onClick={() => onToggleViewMode?.('detailed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'detailed'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Detailed View: Repository-derived architecture flow exposing controllers, middleware, models & external flow"
          >
            <Network className="w-3.5 h-3.5" />
            <span>Detailed View</span>
          </button>

          {viewMode === 'detailed' && (
            <span className="ml-2 pl-2 border-l border-slate-200 text-[10px] text-slate-500 font-medium hidden sm:inline-block">
              {nodes.length} components • {edges.length} flow paths
            </span>
          )}
        </div>

        {/* Edge Modes Legend Bar */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1 bg-white/90 backdrop-blur-xs rounded-full border border-slate-200 shadow-xs text-[10px] text-slate-600">
          <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-slate-400">
            Edge Modes:
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-indigo-600 rounded"></span>
            <span className="font-sans font-medium text-slate-700">HTTP / REST</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-emerald-600 rounded"></span>
            <span className="font-sans font-medium text-slate-700">Database</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-amber-500 rounded"></span>
            <span className="font-sans font-medium text-slate-700">Cache</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-purple-600 rounded"></span>
            <span className="font-sans font-medium text-slate-700">RPC / Internal</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3.5 h-0 border-t-2 border-dashed border-orange-500"></span>
            <span className="font-sans font-medium text-slate-700">Async Queue</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3.5 h-0 border-t-2 border-dashed border-rose-500"></span>
            <span className="font-sans font-medium text-slate-700">Cloud API</span>
          </span>
        </div>
      </div>

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onRfNodesChange}
        onEdgesChange={onRfEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onPaneClick={() => onSelectNode(null)}
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
        <NodeFocusController selectedNodeId={selectedNodeId} nodes={nodes} />
        <Background
          variant={BackgroundVariant.Lines}
          gap={24}
          size={1}
          color="#e2e8f0"
        />
        <Controls
          showInteractive={false}
          className="!bg-white !border !border-slate-200 !shadow-md !rounded-lg"
        />
        <MiniMap
          nodeColor={(n) => {
            const nodeData = n.data as unknown as { result?: NodeSimulationResult };
            const status = nodeData?.result?.status;
            if (status === 'overloaded') return '#ef4444';
            if (status === 'warning') return '#f59e0b';
            if (status === 'disabled') return '#94a3b8';
            return '#10b981';
          }}
          className="!border !border-slate-200 !rounded-lg !bg-white/90"
        />
      </ReactFlow>
    </div>
  );
};
