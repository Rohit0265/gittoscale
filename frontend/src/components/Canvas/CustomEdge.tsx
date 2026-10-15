import React, { useMemo } from 'react';
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
  isDark?: boolean;
  isRunning?: boolean;
  isOverloaded?: boolean;
  isWarning?: boolean;
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
  icon: string;
}

export const EDGE_TYPES: EdgeTypeOption[] = [
  { value: 'http', label: 'Synchronous', icon: '→' },
  { value: 'queue', label: 'Queue / Async', icon: '⚡' },
  { value: 'websocket', label: 'WebSocket', icon: '⟲' },
  { value: 'external', label: 'Cloud API', icon: '🌐' },
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
  isDark: boolean = false
): EdgeStyleConfig {
  // Pure black in light theme, pure white in dark theme - NO colors!
  const baseColor = isDark ? '#ffffff' : '#000000';

  if (mode === 'disabled') {
    return {
      stroke: isDark ? '#525252' : '#a3a3a3',
      strokeWidth: 1.5,
      strokeDasharray: '4,4',
      markerColor: isDark ? '#525252' : '#a3a3a3',
    };
  }

  switch (mode) {
    case 'queue':
      return {
        stroke: baseColor,
        strokeWidth: hasTraffic ? 2.4 : 2.0,
        strokeDasharray: '7,4',
        markerColor: baseColor,
      };
    case 'external':
      return {
        stroke: baseColor,
        strokeWidth: 2.0,
        strokeDasharray: '6,4',
        markerColor: baseColor,
      };
    case 'websocket':
      return {
        stroke: baseColor,
        strokeWidth: 2.0,
        strokeDasharray: '4,3',
        markerColor: baseColor,
      };
    case 'grpc':
      return {
        stroke: baseColor,
        strokeWidth: 2.4,
        strokeDasharray: 'none',
        markerColor: baseColor,
      };
    case 'db':
      return {
        stroke: baseColor,
        strokeWidth: 2.6,
        strokeDasharray: 'none',
        markerColor: baseColor,
      };
    case 'cache':
      return {
        stroke: baseColor,
        strokeWidth: 2.2,
        strokeDasharray: 'none',
        markerColor: baseColor,
      };
    case 'graphql':
    case 'ui':
    case 'http':
    default:
      return {
        stroke: baseColor,
        strokeWidth: 2.0,
        strokeDasharray: 'none',
        markerColor: baseColor,
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
  const isExternal = edgeData.isExternal;
  const flowRate = edgeData.flowRate ?? 0;

  const isDarkMode =
    edgeData.isDark !== undefined
      ? Boolean(edgeData.isDark)
      : typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const mode = resolveEdgeMode(commType, isExternal, enabled);
  const hasTraffic = enabled && flowRate > 0;
  const styleConfig = getEdgeStyleConfig(mode, hasTraffic, isDarkMode);

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
  const isRunning = edgeData.isRunning ?? true;
  const isOverloaded = Boolean(edgeData.isOverloaded);
  const isWarning = Boolean(edgeData.isWarning);
  const hasBottleneck = isOverloaded || isWarning;

  // Approximate smooth step edge path length based on Manhattan coordinates
  const dx = Math.abs(targetX - sourceX);
  const dy = Math.abs(targetY - sourceY);
  const approxEdgeLength = Math.max(90, dx + dy);

  // Dynamic density: 1 request ball per ~75px of edge path length (min 2, max 12)
  const ballCount = Math.max(2, Math.min(12, Math.round(approxEdgeLength / 75)));

  // Steady graceful speed (~65 px/s for normal, ~55 px/s for bottleneck)
  const speed = hasBottleneck ? 55 : 65;
  const durSec = Math.max(4.5, approxEdgeLength / speed);

  // Distribute balls evenly along the full edge path
  const balls = useMemo(() => {
    return Array.from({ length: ballCount }, (_, index) => {
      const offset = (index * durSec) / ballCount;
      return {
        id: index,
        begin: `-${offset.toFixed(2)}s`,
      };
    });
  }, [ballCount, durSec]);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={{
          stroke: styleConfig.stroke,
          strokeWidth: isSelected ? styleConfig.strokeWidth + 1.2 : styleConfig.strokeWidth,
          strokeDasharray: styleConfig.strokeDasharray,
          opacity: enabled ? 1 : 0.4,
          filter: isSelected
            ? isDarkMode
              ? 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.7))'
              : 'drop-shadow(0 0 6px rgba(0, 0, 0, 0.5))'
            : undefined,
          transition: 'stroke 0.15s ease, stroke-width 0.15s ease',
          cursor: 'pointer',
        }}
        interactionWidth={28}
      />

      {/* Live Request Flow Animation along the Edge (Scaled Density & Size) */}
      {isRunning && enabled && (
        <g className="pointer-events-none">
          {balls.map((ball) => (
            <circle
              key={`${id}-ball-${ball.id}`}
              r={hasBottleneck ? 6.5 : 5.2}
              fill={hasBottleneck ? '#ef4444' : isDarkMode ? '#ffffff' : '#000000'}
              style={{
                filter: hasBottleneck
                  ? 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.95))'
                  : isDarkMode
                  ? 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.85))'
                  : 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.45))',
              }}
            >
              {hasBottleneck ? (
                <animateMotion
                  path={edgePath}
                  dur={`${durSec.toFixed(2)}s`}
                  begin={ball.begin}
                  repeatCount="indefinite"
                  keyPoints="0; 0.65; 0.82; 0.70; 0.88; 0.78; 1"
                  keyTimes="0; 0.48; 0.66; 0.76; 0.88; 0.94; 1"
                  calcMode="linear"
                />
              ) : (
                <animateMotion
                  path={edgePath}
                  dur={`${durSec.toFixed(2)}s`}
                  begin={ball.begin}
                  repeatCount="indefinite"
                />
              )}
            </circle>
          ))}
        </g>
      )}

      {/* ONLY when tapped / selected: show different type of edge and delete edge option */}
      {isSelected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan nowheel z-40 w-52 rounded-xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800 shadow-xl p-2 text-xs text-slate-800 dark:text-neutral-100 space-y-1.5 animate-in fade-in zoom-in-95 duration-100"
          >
            {/* Header: title & close */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-neutral-800 px-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                Select Edge Type
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  edgeData.onSelectEdge?.(null);
                }}
                className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of Edge Types */}
            <div className="space-y-0.5">
              {EDGE_TYPES.map((type) => {
                const currentMode = resolveEdgeMode(commType, isExternal, enabled);
                const isCurrent =
                  currentMode === type.value ||
                  (type.value === 'http' && ['http', 'db', 'cache', 'grpc', 'graphql', 'ui'].includes(currentMode)) ||
                  ((commType || 'http') === type.value);
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      edgeData.onUpdateEdge?.(id, {
                        communicationType: type.value,
                        label: type.label,
                      });
                      edgeData.onSelectEdge?.(null);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-100 dark:bg-neutral-800 font-semibold text-slate-900 dark:text-white'
                        : 'hover:bg-slate-50 dark:hover:bg-neutral-900 text-slate-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-black dark:bg-white" />
                      <span className="text-xs">{type.icon}</span>
                      <span className="text-[11px] font-medium">{type.label}</span>
                    </div>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-black dark:text-white" />}
                  </button>
                );
              })}
            </div>

            {/* Delete Option */}
            {edgeData.onDelete && (
              <div className="pt-1 border-t border-slate-100 dark:border-neutral-800">
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
