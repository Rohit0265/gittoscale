import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  ChevronDown,
  ChevronUp,
  X,
  Server,
  Database,
  Layers,
  Zap,
  Globe,
  Sparkles,
} from 'lucide-react';
import { ArchitectureNode } from '../../types';
import { estimateCloudCost, CloudProvider } from '../../utils/cloudCostEstimator';

interface CloudCostHUDProps {
  nodes: ArchitectureNode[];
  incomingRps?: number;
  avgP99LatencyMs?: number;
  isDark?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const CloudCostHUD: React.FC<CloudCostHUDProps> = ({
  nodes,
  incomingRps = 800,
  avgP99LatencyMs = 15,
  isDark: _isDark = true,
  className = 'absolute top-3.5 right-3.5 z-20 flex flex-col items-end select-none',
  style,
}) => {
  const [provider, setProvider] = useState<CloudProvider>('aws');
  const [isExpanded, setIsExpanded] = useState(false);

  const estimate = useMemo(() => {
    return estimateCloudCost(nodes, incomingRps, provider, avgP99LatencyMs);
  }, [nodes, incomingRps, provider, avgP99LatencyMs]);

  const getCategoryIcon = (category: string) => {
    if (category.includes('Compute')) return <Server className="w-3.5 h-3.5 text-sky-500" />;
    if (category.includes('Database')) return <Database className="w-3.5 h-3.5 text-emerald-500" />;
    if (category.includes('Cache')) return <Layers className="w-3.5 h-3.5 text-amber-500" />;
    if (category.includes('Queue')) return <Zap className="w-3.5 h-3.5 text-indigo-500" />;
    return <Globe className="w-3.5 h-3.5 text-slate-500" />;
  };

  return (
    <div className={className} style={style}>
      {/* Floating Cost Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-neutral-800 bg-white/90 dark:bg-[#0c0c0e]/90 backdrop-blur-md shadow-md text-xs font-semibold text-slate-800 dark:text-neutral-100 hover:border-slate-300 dark:hover:border-neutral-700 transition-all cursor-pointer group"
        title="View estimated monthly cloud infrastructure cost"
      >
        <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
          $
        </span>

        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
          ${estimate.totalMonthlyCost.toLocaleString()}/mo
        </span>

        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400">
          {provider.toUpperCase()}
        </span>

        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors" />
        )}
      </button>

      {/* Expanded Cost Breakdown Modal / Popover */}
      {isExpanded && (
        <div className="mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-xl shadow-2xl p-4 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800/80">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                Cloud Cost Estimator
              </h4>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cloud Provider Tabs (AWS, GCP, Azure) */}
          <div className="grid grid-cols-3 gap-1.5 my-3 p-1 rounded-xl bg-slate-100 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800">
            {(['aws', 'gcp', 'azure'] as CloudProvider[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProvider(p)}
                className={`py-1 rounded-lg text-xs font-bold font-mono uppercase transition-all cursor-pointer ${
                  provider === p
                    ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Headline Summary Cards */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/60 dark:border-neutral-800">
              <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-neutral-400 block">
                Monthly Total
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                ${estimate.totalMonthlyCost.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block">
                ≈ ${estimate.totalHourlyCost}/hr
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/60 dark:border-neutral-800">
              <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-neutral-400 block">
                Unit Efficiency
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
                ${estimate.costPer1kRequests}
              </span>
              <span className="text-[10px] text-slate-500 block">
                per 1,000 requests
              </span>
            </div>
          </div>

          {/* Itemized Categories */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 mb-3 scrollbar-thin">
            {estimate.categories.map((cat) => (
              <div
                key={cat.category}
                className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-neutral-900/40 border border-slate-200/60 dark:border-neutral-800/80"
              >
                <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-neutral-200 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {getCategoryIcon(cat.category)}
                    <span>{cat.category}</span>
                  </div>
                  <span className="font-mono text-slate-900 dark:text-white">
                    ${cat.subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-1">
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-[11px] text-slate-600 dark:text-neutral-400"
                    >
                      <span className="truncate max-w-[190px]" title={item.name}>
                        {item.name} ({item.unitLabel})
                      </span>
                      <span className="font-mono">${item.monthlyCost.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Trade-off Insight Box */}
          <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-300 leading-relaxed flex items-start gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
            <span>{estimate.recommendation}</span>
          </div>
        </div>
      )}
    </div>
  );
};
