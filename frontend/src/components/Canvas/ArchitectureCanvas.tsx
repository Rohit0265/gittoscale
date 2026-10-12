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
} from '@xyflow/react';
import { ArchitectureCustomNode } from './CustomNodes';
import { CustomEdge } from './CustomEdge';
import { ArchitectureNode, ArchitectureEdge, NodeSimulationResult, EdgeSimulationResult } from '../../types';

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
}

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
          onToggle: () => onToggleEdge(edge.id),
        },
        animated: isEnabled && (edgeRes?.flowRate ?? 0) > 0,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isEnabled && (edgeRes?.flowRate ?? 0) > 0 ? '#6366f1' : '#94a3b8',
          width: 14,
          height: 14,
        },
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
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.0}
        proOptions={{ hideAttribution: true }}
      >
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
