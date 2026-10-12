import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Server,
  Database,
  Layers,
  Globe,
  Radio,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  PowerOff,
  Users,
} from 'lucide-react';
import { ArchitectureNode, NodeSimulationResult } from '../../types';

interface CustomNodeData {
  node: ArchitectureNode;
  result?: NodeSimulationResult;
  selected?: boolean;
}

export const ArchitectureCustomNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as CustomNodeData;
  const { node, result } = nodeData;

  const status = result?.status || (node.enabled ? 'normal' : 'disabled');
  const offered = result?.offeredRequestsPerSecond ?? 0;
  const capacity = result?.effectiveCapacity ?? (node.capacityPerSecond * node.workerCount);
  const utilization = result?.offeredUtilization ?? 0;
  const queueLength = result?.queueLength ?? 0;
  const rejectedRequests = result?.rejectedRequests ?? 0;

  const getTypeIcon = () => {
    switch (node.type) {
      case 'load_generator':
        return <Radio className="w-4 h-4 text-indigo-600" />;
      case 'gateway':
        return <Globe className="w-4 h-4 text-sky-600" />;
      case 'database':
        return <Database className="w-4 h-4 text-emerald-600" />;
      case 'cache':
        return <Layers className="w-4 h-4 text-amber-600" />;
      case 'service':
      default:
        return <Server className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'overloaded':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
            <AlertOctagon className="w-3 h-3 text-red-600 animate-pulse" />
            Overloaded
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Warning
          </span>
        );
      case 'disabled':
        return (
          <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
            <PowerOff className="w-3 h-3 text-slate-400" />
            Disabled
          </span>
        );
      case 'normal':
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Normal
          </span>
        );
    }
  };

  const getCardBorder = () => {
    if (selected) return 'ring-2 ring-indigo-500 shadow-lg border-indigo-500';
    switch (status) {
      case 'overloaded':
        return 'border-red-400 shadow-md shadow-red-100/50 bg-red-50/20';
      case 'warning':
        return 'border-amber-400 shadow-sm shadow-amber-100/50 bg-amber-50/20';
      case 'disabled':
        return 'border-slate-300 opacity-60 bg-slate-50';
      case 'normal':
      default:
        return 'border-slate-200 shadow-sm hover:border-slate-300 bg-white';
    }
  };

  const getProgressBarColor = () => {
    if (status === 'overloaded') return 'bg-red-500';
    if (status === 'warning') return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getSubmoduleBadge = () => {
    const subType = node.submoduleType || (node.config?.submoduleType as string | undefined);
    if (!subType) return null;
    const colors: Record<string, string> = {
      entrypoint: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      middleware: 'bg-amber-50 text-amber-700 border-amber-200',
      controller: 'bg-sky-50 text-sky-700 border-sky-200',
      service_logic: 'bg-purple-50 text-purple-700 border-purple-200',
      model: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      cache_client: 'bg-orange-50 text-orange-700 border-orange-200',
      worker: 'bg-teal-50 text-teal-700 border-teal-200',
      external_api: 'bg-rose-50 text-rose-700 border-rose-200',
      component: 'bg-blue-50 text-blue-700 border-blue-200',
    };
    const style = colors[subType] || 'bg-slate-50 text-slate-700 border-slate-200';
    return (
      <span className={`text-[8.5px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${style}`}>
        {subType.replace('_', ' ')}
      </span>
    );
  };

  const isSource = node.type === 'load_generator';

  return (
    <div
      className={`relative rounded-xl border bg-white p-3.5 w-64 transition-all duration-200 cursor-pointer ${getCardBorder()}`}
    >
      {/* Target Handles (Top center, Left, and Right for tree routing) */}
      {!isSource && (
        <>
          <Handle
            type="target"
            id="target-top"
            position={Position.Top}
            className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white hover:!bg-indigo-600"
          />
          <Handle
            type="target"
            id="target-left"
            position={Position.Left}
            className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white hover:!bg-indigo-600"
          />
          <Handle
            type="target"
            id="target-right"
            position={Position.Right}
            className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white hover:!bg-indigo-600"
          />
        </>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-slate-100 shrink-0">
            {getTypeIcon()}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-800 truncate block" title={node.name}>
              {node.name}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              {getSubmoduleBadge()}
              {Boolean(node.config?.category) && (
                <span className="text-[9px] font-medium text-slate-400 truncate">
                  {String(node.config.category)}
                </span>
              )}
            </div>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Load & Capacity Metrics */}
      <div className="space-y-1.5 mt-2.5">
        <div className="flex items-center justify-between text-[11px] text-slate-600">
          <span>{isSource ? 'Outbound Rate' : 'Load / Capacity'}</span>
          <span className="font-semibold text-slate-800 font-mono">
            {isSource ? (
              `${Math.round(offered).toLocaleString()} req/s`
            ) : (
              `${Math.round(offered).toLocaleString()} / ${Math.round(capacity).toLocaleString()}`
            )}
          </span>
        </div>

        {/* Utilization Bar */}
        {!isSource && (
          <div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getProgressBarColor()}`}
                style={{ width: `${Math.min(100, utilization)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <Users className="w-2.5 h-2.5 text-slate-400" />
                {node.workerCount} {node.workerCount === 1 ? 'worker' : 'workers'}
              </span>
              <span className="font-medium font-mono text-slate-700">
                {utilization.toFixed(0)}% util
              </span>
            </div>
          </div>
        )}

        {/* Queue & Drops Alert Strip */}
        {(queueLength > 0 || rejectedRequests > 0) && (
          <div className="flex gap-1.5 pt-1 text-[10px]">
            {queueLength > 0 && (
              <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-medium">
                Queue: {queueLength.toLocaleString()}
              </span>
            )}
            {rejectedRequests > 0 && (
              <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-mono font-bold">
                Drop: {rejectedRequests.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Source Handles (Bottom Left 25%, Center 50%, Right 75%, and Sides for clean tree branching) */}
      <Handle
        type="source"
        id="source-bottom"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-white hover:!bg-indigo-700"
      />
      <Handle
        type="source"
        id="source-bottom-left"
        position={Position.Bottom}
        style={{ left: '25%' }}
        className="!w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-white hover:!bg-indigo-700"
      />
      <Handle
        type="source"
        id="source-bottom-right"
        position={Position.Bottom}
        style={{ left: '75%' }}
        className="!w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-white hover:!bg-indigo-700"
      />
      <Handle
        type="source"
        id="source-right"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-white hover:!bg-indigo-700"
      />
      <Handle
        type="source"
        id="source-left"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-white hover:!bg-indigo-700"
      />
    </div>
  );
});

ArchitectureCustomNode.displayName = 'ArchitectureCustomNode';

