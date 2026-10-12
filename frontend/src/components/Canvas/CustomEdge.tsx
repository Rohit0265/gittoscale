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
  isBidirectional?: boolean;
  label?: string;
  dataFlowDescription?: string;
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
  markerStart,
}) => {
  const edgeData = (data || {}) as CustomEdgeData;
  const requestsPerInput = edgeData.requestsPerInput ?? 1.0;
  const flowRate = edgeData.flowRate ?? 0;
  const enabled = edgeData.enabled ?? true;
  const isBidirectional = edgeData.isBidirectional ?? false;
  const label = edgeData.label;
  const flowDesc = edgeData.dataFlowDescription;

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
        markerStart={markerStart}
        style={{
          stroke: enabled
            ? flowRate > 0
              ? isBidirectional
                ? '#8b5cf6'
                : '#6366f1'
              : '#94a3b8'
            : '#cbd5e1',
          strokeWidth: enabled && flowRate > 0 ? (isBidirectional ? 2.5 : 2) : 1.5,
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
          className={`px-2 py-0.5 rounded-full text-[10px] font-mono border shadow-sm flex items-center gap-1.5 cursor-pointer select-none transition-all ${
            enabled
              ? flowRate > 0
                ? isBidirectional
                  ? 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
          }`}
          title={`${flowDesc ? `${flowDesc}. ` : ''}${isBidirectional ? 'Bidirectional Data Flow (Request ⇄ Response). ' : ''}Multiplier: ×${requestsPerInput}. Flow: ${Math.round(flowRate).toLocaleString()} req/s. Click to toggle.`}
          onClick={(e) => {
            e.stopPropagation();
            if (edgeData.onToggle) edgeData.onToggle();
          }}
        >
          {isBidirectional ? (
            <span className="font-bold text-purple-600 flex items-center gap-0.5">
              <span>⇄</span>
              {label ? <span className="font-sans font-medium text-[9px]">{label}</span> : null}
            </span>
          ) : (
            <span className="font-bold">→</span>
          )}
          <span className="font-semibold">×{requestsPerInput}</span>
          {enabled && flowRate > 0 && (
            <span className="text-[9px] font-sans opacity-90">
              ({Math.round(flowRate).toLocaleString()} r/s)
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

