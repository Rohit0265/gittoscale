import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
} from '@xyflow/react';
import { X } from 'lucide-react';

export type EdgeMode =
  | 'http'
  | 'queue'
  | 'db'
  | 'cache'
  | 'grpc'
  | 'external'
  | 'ui'
  | 'disabled';

export interface CustomEdgeData {
  requestsPerInput: number;
  flowRate?: number;
  enabled: boolean;
  isBidirectional?: boolean;
  label?: string;
  dataFlowDescription?: string;
  communicationType?: string;
  isExternal?: boolean;
  onToggle?: () => void;
  onDelete?: () => void;
  [key: string]: unknown;
}

export function resolveEdgeMode(
  commType?: string,
  isExternal?: boolean,
  enabled: boolean = true
): EdgeMode {
  if (!enabled) return 'disabled';
  if (isExternal) return 'external';

  const t = (commType || '').toLowerCase();
  if (t === 'queue') return 'queue';
  if (t === 'db' || t === 'database') return 'db';
  if (t === 'cache') return 'cache';
  if (t === 'grpc' || t === 'rpc') return 'grpc';
  if (t === 'inferred') return 'ui';
  return 'http';
}

export interface EdgeStyleConfig {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  markerColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  badgeTagBg: string;
  badgeTag: string;
  icon: string;
  description: string;
}

export function getEdgeStyleConfig(
  mode: EdgeMode,
  hasTraffic: boolean
): EdgeStyleConfig {
  switch (mode) {
    case 'queue':
      return {
        // Distinct dashed line for asynchronous event stream & worker queue
        stroke: hasTraffic ? '#ea580c' : '#f97316',
        strokeWidth: 2.2,
        strokeDasharray: '7,4',
        markerColor: hasTraffic ? '#ea580c' : '#f97316',
        badgeBg: 'bg-amber-50 hover:bg-amber-100',
        badgeBorder: 'border-amber-300',
        badgeText: 'text-amber-900',
        badgeTagBg: 'bg-amber-200 text-amber-900',
        badgeTag: 'QUEUE',
        icon: '⚡',
        description: 'Asynchronous event stream / background queue job dispatch',
      };
    case 'db':
      return {
        // Solid thick grounded line for transactional database persistence
        stroke: hasTraffic ? '#059669' : '#10b981',
        strokeWidth: 2.6,
        strokeDasharray: 'none',
        markerColor: hasTraffic ? '#059669' : '#10b981',
        badgeBg: 'bg-emerald-50 hover:bg-emerald-100',
        badgeBorder: 'border-emerald-300',
        badgeText: 'text-emerald-900',
        badgeTagBg: 'bg-emerald-200 text-emerald-900',
        badgeTag: 'DB',
        icon: '🗄️',
        description: 'Database query & persistence layer',
      };
    case 'cache':
      return {
        // Solid warm golden line for in-memory session cache lookups
        stroke: hasTraffic ? '#d97706' : '#f59e0b',
        strokeWidth: 2.3,
        strokeDasharray: 'none',
        markerColor: hasTraffic ? '#d97706' : '#f59e0b',
        badgeBg: 'bg-yellow-50 hover:bg-yellow-100',
        badgeBorder: 'border-yellow-300',
        badgeText: 'text-yellow-900',
        badgeTagBg: 'bg-yellow-200 text-yellow-900',
        badgeTag: 'CACHE',
        icon: '💾',
        description: 'Low-latency in-memory cache operations',
      };
    case 'grpc':
      return {
        // Solid violet line for bidirectional RPC / internal microservice calls
        stroke: hasTraffic ? '#7c3aed' : '#8b5cf6',
        strokeWidth: 2.5,
        strokeDasharray: 'none',
        markerColor: hasTraffic ? '#7c3aed' : '#8b5cf6',
        badgeBg: 'bg-purple-50 hover:bg-purple-100',
        badgeBorder: 'border-purple-300',
        badgeText: 'text-purple-900',
        badgeTagBg: 'bg-purple-200 text-purple-900',
        badgeTag: 'RPC',
        icon: '⇄',
        description: 'Internal microservice RPC call',
      };
    case 'external':
      return {
        // Distinct long boundary dash for 3rd-party cloud providers
        stroke: hasTraffic ? '#e11d48' : '#f43f5e',
        strokeWidth: 2.2,
        strokeDasharray: '6,4',
        markerColor: hasTraffic ? '#e11d48' : '#f43f5e',
        badgeBg: 'bg-rose-50 hover:bg-rose-100',
        badgeBorder: 'border-rose-300',
        badgeText: 'text-rose-900',
        badgeTagBg: 'bg-rose-200 text-rose-900',
        badgeTag: 'CLOUD',
        icon: '🌐',
        description: 'External cloud API integration boundary',
      };
    case 'ui':
      return {
        // Solid clean sky blue line for in-browser client rendering & state
        stroke: hasTraffic ? '#0284c7' : '#38bdf8',
        strokeWidth: 1.8,
        strokeDasharray: 'none',
        markerColor: hasTraffic ? '#0284c7' : '#38bdf8',
        badgeBg: 'bg-sky-50 hover:bg-sky-100',
        badgeBorder: 'border-sky-300',
        badgeText: 'text-sky-900',
        badgeTagBg: 'bg-sky-200 text-sky-900',
        badgeTag: 'UI',
        icon: '⚛️',
        description: 'Client component mount & state flow',
      };
    case 'disabled':
      return {
        // Muted gray dashed line when traffic path is disabled/severed
        stroke: '#cbd5e1',
        strokeWidth: 1.5,
        strokeDasharray: '4,4',
        markerColor: '#94a3b8',
        badgeBg: 'bg-slate-100',
        badgeBorder: 'border-slate-200',
        badgeText: 'text-slate-400 line-through',
        badgeTagBg: 'bg-slate-200 text-slate-500',
        badgeTag: 'OFF',
        icon: '✕',
        description: 'Disabled connection path',
      };
    case 'http':
    default:
      return {
        // Crisp solid indigo line for standard HTTP/REST requests
        stroke: hasTraffic ? '#4f46e5' : '#6366f1',
        strokeWidth: 2.0,
        strokeDasharray: 'none',
        markerColor: hasTraffic ? '#4f46e5' : '#6366f1',
        badgeBg: 'bg-indigo-50 hover:bg-indigo-100',
        badgeBorder: 'border-indigo-300',
        badgeText: 'text-indigo-900',
        badgeTagBg: 'bg-indigo-200 text-indigo-900',
        badgeTag: 'HTTP',
        icon: '→',
        description: 'Synchronous HTTP / REST API flow',
      };
  }
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
  selected,
}) => {
  const edgeData = (data || {}) as CustomEdgeData;
  const requestsPerInput = edgeData.requestsPerInput ?? 1.0;
  const flowRate = edgeData.flowRate ?? 0;
  const enabled = edgeData.enabled ?? true;
  const isBidirectional = edgeData.isBidirectional ?? false;
  const label = edgeData.label;
  const flowDesc = edgeData.dataFlowDescription;
  const commType = edgeData.communicationType;
  const isExternal = edgeData.isExternal;

  const mode = resolveEdgeMode(commType, isExternal, enabled);
  const hasTraffic = enabled && flowRate > 0;
  const styleConfig = getEdgeStyleConfig(mode, hasTraffic);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 14,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={{
          stroke: selected ? '#ef4444' : styleConfig.stroke,
          strokeWidth: selected ? styleConfig.strokeWidth + 1.2 : styleConfig.strokeWidth,
          strokeDasharray: styleConfig.strokeDasharray,
          opacity: enabled ? 1 : 0.45,
          filter: selected ? 'drop-shadow(0 0 5px rgba(239, 68, 68, 0.7))' : undefined,
          transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
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
            styleConfig.badgeBg
          } ${styleConfig.badgeBorder} ${styleConfig.badgeText} ${
            selected ? 'ring-2 ring-red-500 shadow-md ring-offset-1 border-red-300' : ''
          }`}
          title={`${styleConfig.description}. ${
            flowDesc ? `${flowDesc}. ` : ''
          }${
            isBidirectional ? 'Bidirectional Data Flow (Request ⇄ Response). ' : ''
          }Multiplier: ×${requestsPerInput}. Flow: ${Math.round(
            flowRate
          ).toLocaleString()} req/s. Click to toggle path, or click ✕ to delete.`}
          onClick={(e) => {
            e.stopPropagation();
            if (edgeData.onToggle) edgeData.onToggle();
          }}
        >
          {/* Mode Pill Tag */}
          <span
            className={`px-1 py-0.2 rounded text-[8px] font-bold tracking-wider ${styleConfig.badgeTagBg}`}
          >
            {styleConfig.badgeTag}
          </span>

          {isBidirectional ? (
            <span className="font-bold flex items-center gap-0.5">
              <span>⇄</span>
              {label ? (
                <span className="font-sans font-medium text-[9px] max-w-[90px] truncate">
                  {label}
                </span>
              ) : null}
            </span>
          ) : (
            <span className="font-bold flex items-center gap-0.5">
              <span>{styleConfig.icon}</span>
              {label ? (
                <span className="font-sans font-medium text-[9px] max-w-[90px] truncate">
                  {label}
                </span>
              ) : null}
            </span>
          )}

          <span className="font-semibold">×{requestsPerInput}</span>

          {enabled && flowRate > 0 && (
            <span className="text-[9px] font-sans font-medium opacity-90">
              ({Math.round(flowRate).toLocaleString()} r/s)
            </span>
          )}

          {/* Delete Action Button */}
          {edgeData.onDelete && (
            <button
              type="button"
              className="ml-0.5 p-0.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
              title="Delete this connection"
              onClick={(e) => {
                e.stopPropagation();
                edgeData.onDelete?.();
              }}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

