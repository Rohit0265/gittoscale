import React from 'react';
import {
  ArrowDownRight,
  CheckCircle2,
  AlertOctagon,
  Gauge,
  ShieldAlert,
} from 'lucide-react';
import { SimulationSummaryMetrics } from '../types';

interface MetricsStripProps {
  metrics?: SimulationSummaryMetrics;
  loading?: boolean;
}

export const MetricsStrip: React.FC<MetricsStripProps> = ({ metrics, loading }) => {
  const incoming = metrics?.totalOfferedTraffic ?? 0;
  const throughput = metrics?.completedThroughput ?? 0;
  const overloadedCount = metrics?.overloadedCount ?? 0;
  const maxUtil = metrics?.maxUtilization ?? 0;
  const dropped = metrics?.totalDroppedRequests ?? 0;

  return (
    <div className="h-11 border-b border-slate-200 bg-white/95 backdrop-blur px-4 flex items-center justify-between text-xs shrink-0 select-none">
      <div className="flex items-center gap-6 overflow-x-auto py-1">
        {/* Total Incoming Traffic */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-indigo-50 text-indigo-600">
            <ArrowDownRight className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block leading-tight">Incoming Traffic</span>
            <span className="font-bold text-slate-800 font-mono text-xs">
              {incoming.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">req/s</span>
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-200" />

        {/* Estimated Completed Throughput */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block leading-tight">Completed Throughput</span>
            <span className="font-bold text-emerald-700 font-mono text-xs">
              {throughput.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">req/s</span>
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-200" />

        {/* Overloaded Components */}
        <div className="flex items-center gap-2">
          <div
            className={`p-1 rounded ${
              overloadedCount > 0
                ? 'bg-red-100 text-red-600 animate-pulse'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block leading-tight">Overloaded Nodes</span>
            <span
              className={`font-bold font-mono text-xs ${
                overloadedCount > 0 ? 'text-red-600' : 'text-slate-800'
              }`}
            >
              {overloadedCount} {overloadedCount === 1 ? 'service' : 'services'}
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-200" />

        {/* Maximum Utilization */}
        <div className="flex items-center gap-2">
          <div
            className={`p-1 rounded ${
              maxUtil > 100
                ? 'bg-red-50 text-red-600'
                : maxUtil >= 80
                ? 'bg-amber-50 text-amber-600'
                : 'bg-sky-50 text-sky-600'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block leading-tight">Max Utilization</span>
            <span
              className={`font-bold font-mono text-xs ${
                maxUtil > 100
                  ? 'text-red-600'
                  : maxUtil >= 80
                  ? 'text-amber-600'
                  : 'text-slate-800'
              }`}
            >
              {maxUtil.toFixed(1)}%
            </span>
          </div>
        </div>

        {dropped > 0 && (
          <>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-red-50 text-red-600">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] text-red-500 block leading-tight">Dropped Work</span>
                <span className="font-bold text-red-600 font-mono text-xs">
                  {dropped.toLocaleString()} <span className="text-[10px] font-normal text-red-400">requests</span>
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {loading && (
        <span className="text-[11px] text-indigo-600 flex items-center gap-1 font-medium animate-pulse">
          Simulating...
        </span>
      )}
    </div>
  );
};

