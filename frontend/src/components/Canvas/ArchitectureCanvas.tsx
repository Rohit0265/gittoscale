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
import { CustomEdge } from './CustomEdge';
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
    return edges.map((edge) => {
      const edgeRes = edgeResults[edge.id];
      const isEnabled = edge.enabled;
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'customEdge',
        data: {
          requestsPerInput: edge.requestsPerInput,
          flowRate: edgeRes?.flowRate ?? 0,
          enabled: isEnabled,
          isBidirectional: edge.isBidirectional,
          label: edge.label,
          dataFlowDescription: edge.dataFlowDescription,
          onToggle: () => onToggleEdge(edge.id),
        },
        animated: isEnabled && (edgeRes?.flowRate ?? 0) > 0,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isEnabled && (edgeRes?.flowRate ?? 0) > 0
            ? edge.isBidirectional ? '#8b5cf6' : '#6366f1'
            : '#94a3b8',
          width: 14,
          height: 14,
        },
        markerStart: edge.isBidirectional
          ? {
              type: MarkerType.ArrowClosed,
              color: isEnabled && (edgeRes?.flowRate ?? 0) > 0 ? '#8b5cf6' : '#94a3b8',
              width: 14,
              height: 14,
            }
          : undefined,
      };
    });
  }, [edges, edgeResults, onToggleEdge]);

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
    <div className="w-full h-full relative excel-grid">
      {/* Floating Two-Mode Toggle Above Canvas */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-xs p-1 rounded-xl shadow-md border border-slate-200">
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
