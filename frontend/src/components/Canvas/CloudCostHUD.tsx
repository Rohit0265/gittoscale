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
  TrendingUp,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { ArchitectureNode } from '../../types';
import {
  estimateCloudCost,
  getMultiCloudComparison,
  CloudProvider,
} from '../../utils/cloudCostEstimator';

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
  incomingRps = 1000,
  avgP99LatencyMs = 15,
  isDark: _isDark = true,
  className = 'absolute top-3.5 right-3.5 z-20 flex flex-col items-end select-none',
  style,
}) => {
  const [provider, setProvider] = useState<CloudProvider>('aws');
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'scale' | 'breakdown'>('scale');
  const [customRps, setCustomRps] = useState<number>(incomingRps);

  // Sync customRps when incomingRps changes externally
  React.useEffect(() => {
    setCustomRps(incomingRps);
  }, [incomingRps]);

  const comparison = useMemo(() => {
    return getMultiCloudComparison(nodes, customRps, avgP99LatencyMs);
  }, [nodes, customRps, avgP99LatencyMs]);

  const currentEstimate = comparison[provider];

  const getCategoryIcon = (category: string) => {
    if (category.includes('Compute')) return <Server className="w-3.5 h-3.5 text-sky-500" />;
    if (category.includes('Database')) return <Database className="w-3.5 h-3.5 text-emerald-500" />;
    if (category.includes('Cache')) return <Layers className="w-3.5 h-3.5 text-amber-500" />;
    if (category.includes('Queue')) return <Zap className="w-3.5 h-3.5 text-indigo-500" />;
    return <Globe className="w-3.5 h-3.5 text-slate-500" />;
  };

  const maxCapacity = comparison.maxSystemCapacityRps;

  return (
    <div className={className} style={style}>
      {/* Floating Cost Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-neutral-800 bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-md shadow-md text-xs font-semibold text-slate-800 dark:text-neutral-100 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all cursor-pointer group"
        title="View AWS, GCP & Azure pricing variance and capacity scaling"
      >
        <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
          $
        </span>

        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
          ${currentEstimate.totalMonthlyCost.toLocaleString()}/mo
        </span>

        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300">
          {provider.toUpperCase()}
        </span>

        {comparison.savingsMonthlyVsAws[provider === 'aws' ? 'gcp' : provider] > 0 && provider !== 'aws' && (
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium hidden sm:inline">
            (-${comparison.savingsMonthlyVsAws[provider]}/mo)
          </span>
        )}

        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors" />
        )}
      </button>

      {/* Expanded Cost Breakdown Modal */}
      {isExpanded && (
        <div className="mt-2 w-[340px] sm:w-[480px] max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-white/98 dark:bg-[#0c0c0e]/98 backdrop-blur-xl shadow-2xl p-4 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-neutral-800/80">
            <div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Cloud Infrastructure Cost
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                Multi-cloud price variance & capacity scaling analysis
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 3-Cloud Provider Side-by-Side Cards (AWS, GCP, Azure) */}
          <div className="grid grid-cols-3 gap-2 my-3">
            {(['aws', 'gcp', 'azure'] as CloudProvider[]).map((p) => {
              const est = comparison[p];
              const isSelected = provider === p;
              const isCheapest = comparison.cheapestProvider === p;
              const savingsVsAws = comparison.savingsMonthlyVsAws[p as 'gcp' | 'azure'];

              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500/50'
                      : 'border-slate-200/80 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 bg-slate-50/60 dark:bg-neutral-900/40'
                  }`}
                >
                  {isCheapest && (
                    <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded-full bg-emerald-500 text-white font-mono text-[9px] font-bold">
                      LOWEST
                    </span>
                  )}
                  <span className="text-[10px] font-bold uppercase font-mono text-slate-500 dark:text-neutral-400 block">
                    {p}
                  </span>
                  <span className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white block mt-0.5">
                    ${est.totalMonthlyCost.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    ≈ ${est.totalHourlyCost}/hr
                  </span>
                  {p !== 'aws' && savingsVsAws !== undefined && (
                    <span
                      className={`text-[10px] font-mono font-medium block mt-1 ${
                        savingsVsAws > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {savingsVsAws > 0 ? `-${Math.round((savingsVsAws / comparison.aws.totalMonthlyCost) * 100)}% vs AWS` : 'On par'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Navigation Tabs: Scale Projections vs Itemized Breakdown */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 mb-3">
            <button
              type="button"
              onClick={() => setActiveTab('scale')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'scale'
                  ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Varying Prices by Scale</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('breakdown')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'breakdown'
                  ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Itemized Breakdown</span>
            </button>
          </div>

          {/* TAB 1: Varying Prices by Scale (Up to System Capacity) */}
          {activeTab === 'scale' && (
            <div className="space-y-3">
              {/* Scale Slider */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/60 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-neutral-300">
                    Simulate Traffic Scale:
                  </span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                    {customRps.toLocaleString()} req/s{' '}
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({Math.round((customRps / maxCapacity) * 100)}% cluster limit)
                    </span>
                  </span>
                </div>

                <input
                  type="range"
                  min={100}
                  max={Math.round(maxCapacity * 1.25)}
                  step={100}
                  value={customRps}
                  onChange={(e) => setCustomRps(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-neutral-800 rounded-lg"
                />

                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>100 req/s</span>
                  <span className="text-amber-500 font-semibold">
                    Max Capacity: {maxCapacity.toLocaleString()} rps
                  </span>
                  <span>{(Math.round(maxCapacity * 1.25)).toLocaleString()} rps</span>
                </div>
              </div>

              {/* Varying Scale Cost Progression Table */}
              <div className="rounded-xl border border-slate-200/80 dark:border-neutral-800 overflow-hidden">
                <div className="px-3 py-2 bg-slate-100/80 dark:bg-neutral-900/80 border-b border-slate-200/80 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-neutral-300">
                    Price Variance by Scale
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Max Sustained: {maxCapacity.toLocaleString()} req/s
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 dark:bg-neutral-900/40 text-slate-500 dark:text-neutral-400 font-mono text-[10px] border-b border-slate-200/60 dark:border-neutral-800/60">
                      <tr>
                        <th className="py-1.5 px-2.5">Traffic Load</th>
                        <th className="py-1.5 px-2">Cap %</th>
                        <th className="py-1.5 px-2 text-right">AWS ($/mo)</th>
                        <th className="py-1.5 px-2 text-right">GCP ($/mo)</th>
                        <th className="py-1.5 px-2.5 text-right">Azure ($/mo)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/50 font-mono">
                      {comparison.scalePricePoints.map((pt) => {
                        const isCurrent = Math.abs(pt.trafficRps - customRps) < 50;

                        return (
                          <tr
                            key={pt.trafficRps}
                            onClick={() => setCustomRps(pt.trafficRps)}
                            className={`hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors ${
                              isCurrent
                                ? 'bg-indigo-50/80 dark:bg-indigo-950/40 font-bold text-indigo-950 dark:text-indigo-200'
                                : pt.isMaxCapacity
                                ? 'bg-amber-50/30 dark:bg-amber-950/15'
                                : ''
                            }`}
                          >
                            <td className="py-1.5 px-2.5 flex items-center gap-1 truncate max-w-[140px]">
                              {isCurrent && (
                                <CheckCircle2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              )}
                              <span>{pt.trafficRps.toLocaleString()} rps</span>
                            </td>
                            <td className="py-1.5 px-2 text-slate-500 dark:text-neutral-400">
                              {pt.percentOfMaxCapacity}%
                            </td>
                            <td className="py-1.5 px-2 text-right text-slate-800 dark:text-neutral-200">
                              ${pt.awsCost.toLocaleString()}
                            </td>
                            <td className="py-1.5 px-2 text-right text-emerald-600 dark:text-emerald-400">
                              ${pt.gcpCost.toLocaleString()}
                            </td>
                            <td className="py-1.5 px-2.5 text-right text-sky-600 dark:text-sky-400">
                              ${pt.azureCost.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Itemized Component Breakdown */}
          {activeTab === 'breakdown' && (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
              {currentEstimate.categories.map((cat) => (
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
                        <div className="truncate max-w-[240px]">
                          <span className="font-medium text-slate-800 dark:text-neutral-200">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {item.details}
                          </span>
                        </div>
                        <span className="font-mono font-medium text-slate-900 dark:text-neutral-100">
                          ${item.monthlyCost.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Unit Economics & Latency Metric Strip */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-neutral-800/80">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-neutral-900/40 border border-slate-200/60 dark:border-neutral-800 text-[11px]">
              <span className="text-slate-400 uppercase font-mono text-[9px] block">
                Unit Economics
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                ${currentEstimate.costPer1kRequests} / 1k reqs
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 dark:bg-neutral-900/40 border border-slate-200/60 dark:border-neutral-800 text-[11px]">
              <span className="text-slate-400 uppercase font-mono text-[9px] block">
                Network Egress
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                {currentEstimate.dataEgressGbPerMonth.toLocaleString()} GB / mo
              </span>
            </div>
          </div>

          {/* Technical Architecture Rationale */}
          <div className="mt-2.5 p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-300 leading-relaxed flex items-start gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
            <span>{currentEstimate.recommendation}</span>
          </div>
        </div>
      )}
    </div>
  );
};
