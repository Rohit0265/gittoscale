import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
} from '@xyflow/react';

export interface CustomEdgeData {
  requestsPerInput: number;
  flowRate?: number;
  enabled: boolean;
  onToggle?: () => void;
  [key: string]: unknown;
}

export const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}) => {
  const edgeData = (data || {}) as CustomEdgeData;
  const requestsPerInput = edgeData.requestsPerInput ?? 1.0;
  const flowRate = edgeData.flowRate ?? 0;
  const enabled = edgeData.enabled ?? true;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: enabled ? (flowRate > 0 ? '#6366f1' : '#94a3b8') : '#cbd5e1',
          strokeWidth: enabled && flowRate > 0 ? 2 : 1.5,
          strokeDasharray: enabled ? undefined : '5,5',
          opacity: enabled ? 1 : 0.4,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className={`px-2 py-0.5 rounded-full text-[10px] font-mono border shadow-sm flex items-center gap-1 cursor-pointer select-none transition-all ${
            enabled
              ? flowRate > 0
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
          }`}
          title={`Multiplier: ×${requestsPerInput}. Flow: ${Math.round(flowRate).toLocaleString()} req/s. Click to toggle.`}
          onClick={(e) => {
            e.stopPropagation();
            if (edgeData.onToggle) edgeData.onToggle();
          }}
        >
          <span className="font-semibold">×{requestsPerInput}</span>
          {enabled && flowRate > 0 && (
            <span className="text-[9px] text-indigo-600 font-sans">
              ({Math.round(flowRate).toLocaleString()} r/s)
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

