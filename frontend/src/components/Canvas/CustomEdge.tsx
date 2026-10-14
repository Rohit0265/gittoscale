import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
} from '@xyflow/react';
import { X, Trash2, Check } from 'lucide-react';
import { ArchitectureEdge } from '../../types';

export type EdgeMode =
  | 'http'
  | 'queue'
  | 'db'
  | 'cache'
  | 'grpc'
  | 'external'
  | 'websocket'
  | 'graphql'
  | 'ui'
  | 'disabled';

export interface CustomEdgeData {
  edgeId?: string;
  source?: string;
  target?: string;
  sourceName?: string;
  targetName?: string;
  requestsPerInput: number;
  flowRate?: number;
  enabled: boolean;
  isBidirectional?: boolean;
  label?: string;
  dataFlowDescription?: string;
  communicationType?: string;
  customColor?: string;
  isExternal?: boolean;
  onToggle?: () => void;
  onDelete?: () => void;
  onUpdateEdge?: (edgeId: string, updates: Partial<ArchitectureEdge>) => void;
  onSelectEdge?: (edgeId: string | null) => void;
  isSelected?: boolean;
  [key: string]: unknown;
}

export interface EdgeTypeOption {
  value: string;
  label: string;
  color: string;
  icon: string;
}

export const EDGE_TYPES: EdgeTypeOption[] = [
  { value: 'http', label: 'HTTP / REST', color: '#6366f1', icon: '→' },
  { value: 'db', label: 'Database', color: '#10b981', icon: '🗄️' },
  { value: 'cache', label: 'Cache', color: '#f59e0b', icon: '💾' },
  { value: 'grpc', label: 'RPC / Internal', color: '#8b5cf6', icon: '⇄' },
  { value: 'queue', label: 'Async Queue', color: '#f97316', icon: '⚡' },
  { value: 'websocket', label: 'WebSocket', color: '#06b6d4', icon: '⟲' },
  { value: 'graphql', label: 'GraphQL', color: '#ec4899', icon: '◈' },
  { value: 'external', label: 'Cloud API', color: '#f43f5e', icon: '🌐' },
];

export function resolveEdgeMode(
  commType?: string,
  isExternal?: boolean,
  enabled: boolean = true
): EdgeMode {
  if (!enabled) return 'disabled';
  const t = (commType || '').toLowerCase();
  if (t === 'queue' || t === 'async' || t === 'message_queue') return 'queue';
  if (t === 'db' || t === 'database' || t === 'sql' || t === 'nosql') return 'db';
  if (t === 'cache' || t === 'redis' || t === 'memcached') return 'cache';
  if (t === 'grpc' || t === 'rpc' || t === 'internal') return 'grpc';
  if (t === 'websocket' || t === 'ws' || t === 'realtime') return 'websocket';
  if (t === 'graphql' || t === 'gql') return 'graphql';
  if (t === 'external' || t === 'cloud' || isExternal) return 'external';
  if (t === 'ui' || t === 'inferred' || t === 'client') return 'ui';
  return 'http';
}

export interface EdgeStyleConfig {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  markerColor: string;
}

export function getEdgeStyleConfig(
  mode: EdgeMode,
  hasTraffic: boolean,
  customColor?: string
): EdgeStyleConfig {
  switch (mode) {
    case 'queue':
      return {
        stroke: customColor || (hasTraffic ? '#ea580c' : '#f97316'),
        strokeWidth: 2.2,
        strokeDasharray: '7,4',
        markerColor: customColor || (hasTraffic ? '#ea580c' : '#f97316'),
      };
    case 'db':
      return {
        stroke: customColor || (hasTraffic ? '#059669' : '#10b981'),
        strokeWidth: 2.6,
        strokeDasharray: 'none',
        markerColor: customColor || (hasTraffic ? '#059669' : '#10b981'),
      };
    case 'cache':
      return {
        stroke: customColor || (hasTraffic ? '#d97706' : '#f59e0b'),
        strokeWidth: 2.3,
        strokeDasharray: 'none',
        markerColor: customColor || (hasTraffic ? '#d97706' : '#f59e0b'),
      };
    case 'grpc':
      return {
        stroke: customColor || (hasTraffic ? '#7c3aed' : '#8b5cf6'),
        strokeWidth: 2.5,
        strokeDasharray: 'none',
        markerColor: customColor || (hasTraffic ? '#7c3aed' : '#8b5cf6'),
      };
    case 'external':
      return {
        stroke: customColor || (hasTraffic ? '#e11d48' : '#f43f5e'),
        strokeWidth: 2.2,
        strokeDasharray: '6,4',
        markerColor: customColor || (hasTraffic ? '#e11d48' : '#f43f5e'),
      };
    case 'websocket':
      return {
        stroke: customColor || (hasTraffic ? '#0891b2' : '#06b6d4'),
        strokeWidth: 2.2,
        strokeDasharray: '5,3',
        markerColor: customColor || (hasTraffic ? '#0891b2' : '#06b6d4'),
      };
    case 'graphql':
      return {
        stroke: customColor || (hasTraffic ? '#db2777' : '#ec4899'),
        strokeWidth: 2.2,
        strokeDasharray: 'none',
        markerColor: customColor || (hasTraffic ? '#db2777' : '#ec4899'),
      };
    case 'ui':
      return {
        stroke: customColor || (hasTraffic ? '#0284c7' : '#38bdf8'),
        strokeWidth: 1.8,
        strokeDasharray: 'none',
        markerColor: customColor || (hasTraffic ? '#0284c7' : '#38bdf8'),
      };
    case 'disabled':
      return {
        stroke: '#94a3b8',
        strokeWidth: 1.5,
        strokeDasharray: '4,4',
        markerColor: '#94a3b8',
      };
    case 'http':
    default:
      return {
        stroke: customColor || (hasTraffic ? '#4f46e5' : '#6366f1'),
        strokeWidth: 2.0,
        strokeDasharray: 'none',
        markerColor: customColor || (hasTraffic ? '#4f46e5' : '#6366f1'),
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
  const enabled = edgeData.enabled ?? true;
  const commType = edgeData.communicationType;
  const customColor = edgeData.customColor;
  const isExternal = edgeData.isExternal;
  const flowRate = edgeData.flowRate ?? 0;

  const mode = resolveEdgeMode(commType, isExternal, enabled);
  const hasTraffic = enabled && flowRate > 0;
  const styleConfig = getEdgeStyleConfig(mode, hasTraffic, customColor);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 14,
  });

  const isSelected = selected || Boolean(edgeData.isSelected);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={{
          stroke: isSelected ? (customColor || styleConfig.stroke) : styleConfig.stroke,
          strokeWidth: isSelected ? styleConfig.strokeWidth + 1.2 : styleConfig.strokeWidth,
          strokeDasharray: styleConfig.strokeDasharray,
          opacity: enabled ? 1 : 0.45,
          filter: isSelected
            ? `drop-shadow(0 0 6px ${customColor || styleConfig.stroke}bb)`
            : undefined,
          transition: 'stroke 0.15s ease, stroke-width 0.15s ease',
          cursor: 'pointer',
        }}
        interactionWidth={28}
      />

      {/* ONLY when tapped / selected: show different type of edge and delete edge option */}
      {isSelected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan nowheel z-40 w-52 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 text-xs text-slate-800 dark:text-slate-100 space-y-1.5 animate-in fade-in zoom-in-95 duration-100"
          >
            {/* Header: title & close */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800 px-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Select Edge Type
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  edgeData.onSelectEdge?.(null);
                }}
                className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of Edge Types */}
            <div className="space-y-0.5 max-h-56 overflow-y-auto">
              {EDGE_TYPES.map((type) => {
                const isCurrent = (commType || 'http') === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      edgeData.onUpdateEdge?.(id, {
                        communicationType: type.value,
                        customColor: type.color,
                        label: type.label,
                      });
                      edgeData.onSelectEdge?.(null);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 font-semibold text-indigo-700 dark:text-indigo-300'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: type.color }}
                      />
                      <span className="text-xs">{type.icon}</span>
                      <span className="text-[11px]">{type.label}</span>
                    </div>
                    {isCurrent && <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />}
                  </button>
                );
              })}
            </div>

            {/* Delete Option */}
            {edgeData.onDelete && (
              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    edgeData.onDelete?.();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/70 border border-red-200 dark:border-red-900/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Edge</span>
                </button>
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
