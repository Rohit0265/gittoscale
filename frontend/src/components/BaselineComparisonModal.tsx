import React from 'react';
import { X, GitCompare, BookmarkPlus, TrendingDown, TrendingUp } from 'lucide-react';
import { SimulationResult, BaselineSnapshot } from '../types';

interface BaselineComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseline: BaselineSnapshot | null;
  currentResult: SimulationResult | null;
  currentScenarioName: string;
  onSaveAsBaseline: () => void;
}

export const BaselineComparisonModal: React.FC<BaselineComparisonModalProps> = ({
  isOpen,
  onClose,
  baseline,
  currentResult,
  currentScenarioName,
  onSaveAsBaseline,
}) => {
  if (!isOpen) return null;

  const currentMetrics = currentResult?.metrics;
  const baselineMetrics = baseline?.metrics;

  const renderDelta = (currentVal: number, baselineVal: number, inverseGood = false) => {
    const diff = currentVal - baselineVal;
    if (diff === 0) return <span className="text-slate-400 dark:text-slate-500 font-mono">0</span>;

    const isPositive = diff > 0;
    const isGood = inverseGood ? !isPositive : isPositive;

    return (
      <span
        className={`font-mono font-bold flex items-center justify-end gap-0.5 ${
          isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
        }`}
      >
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {isPositive ? `+${diff.toLocaleString()}` : diff.toLocaleString()}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs p-2 sm:p-4">
      <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl shadow-xl border border-slate-200 dark:border-neutral-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-xs text-slate-800 dark:text-slate-200 transition-colors">
        {/* Modal Header */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#141414] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shrink-0">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Scenario Baseline Comparison
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Compare current architectural adjustments against saved baseline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-5 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Baseline status banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#141414]">
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold block">
                Saved Baseline
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
                {baseline ? `${baseline.scenarioName} (${baseline.timestamp})` : 'No baseline saved yet'}
              </span>
            </div>
            <button
              onClick={onSaveAsBaseline}
              className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-none transition-colors cursor-pointer w-full sm:w-auto"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              Save Current as Baseline
            </button>
          </div>

          {/* Comparison Table */}
          {baselineMetrics && currentMetrics ? (
            <div className="border border-slate-200 dark:border-neutral-800 rounded-xl overflow-x-auto w-full">
              <table className="w-full min-w-[480px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-[#141414] border-b border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                    <th className="p-2.5">Key Metric (Model Estimates)</th>
                    <th className="p-2.5 text-right">Baseline</th>
                    <th className="p-2.5 text-right">Current ({currentScenarioName})</th>
                    <th className="p-2.5 text-right">Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-slate-700 dark:text-slate-300">
                      Total Offered Traffic (λ)
                    </td>
                    <td className="p-2.5 text-right text-slate-600 dark:text-slate-400">
                      {baselineMetrics.totalOfferedTraffic.toLocaleString()} r/s
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-800 dark:text-slate-100">
                      {currentMetrics.totalOfferedTraffic.toLocaleString()} r/s
                    </td>
                    <td className="p-2.5 text-right">
                      {renderDelta(
                        currentMetrics.totalOfferedTraffic,
                        baselineMetrics.totalOfferedTraffic
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5 font-sans font-medium text-slate-700 dark:text-slate-300">
                      Completed Throughput (μ)
                    </td>
                    <td className="p-2.5 text-right text-slate-600 dark:text-slate-400">
                      {baselineMetrics.completedThroughput.toLocaleString()} r/s
                    </td>
                    <td className="p-2.5 text-right font-bold text-emerald-700 dark:text-emerald-400">
                      {currentMetrics.completedThroughput.toLocaleString()} r/s
                    </td>
                    <td className="p-2.5 text-right">
                      {renderDelta(
                        currentMetrics.completedThroughput,
                        baselineMetrics.completedThroughput,
                        false
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5 font-sans font-medium text-slate-700 dark:text-slate-300">
                      Rejected Requests (Drops)
                    </td>
                    <td className="p-2.5 text-right text-slate-600 dark:text-slate-400">
                      {baselineMetrics.totalDroppedRequests.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-bold text-red-600 dark:text-red-400">
                      {currentMetrics.totalDroppedRequests.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right">
                      {renderDelta(
                        currentMetrics.totalDroppedRequests,
                        baselineMetrics.totalDroppedRequests,
                        true // lower is better
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5 font-sans font-medium text-slate-700 dark:text-slate-300">
                      Overloaded Components
                    </td>
                    <td className="p-2.5 text-right text-slate-600 dark:text-slate-400">
                      {baselineMetrics.overloadedCount}
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-800 dark:text-slate-100">
                      {currentMetrics.overloadedCount}
                    </td>
                    <td className="p-2.5 text-right">
                      {renderDelta(
                        currentMetrics.overloadedCount,
                        baselineMetrics.overloadedCount,
                        true
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5 font-sans font-medium text-slate-700 dark:text-slate-300">
                      Maximum Utilization
                    </td>
                    <td className="p-2.5 text-right text-slate-600 dark:text-slate-400">
                      {baselineMetrics.maxUtilization.toFixed(1)}%
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-800 dark:text-slate-100">
                      {currentMetrics.maxUtilization.toFixed(1)}%
                    </td>
                    <td className="p-2.5 text-right">
                      {renderDelta(
                        Math.round(currentMetrics.maxUtilization),
                        Math.round(baselineMetrics.maxUtilization),
                        true
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5 font-sans font-medium text-slate-700 dark:text-slate-300">
                      Accumulated Queue Growth
                    </td>
                    <td className="p-2.5 text-right text-slate-600 dark:text-slate-400">
                      {baselineMetrics.totalQueueLength.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-800 dark:text-slate-100">
                      {currentMetrics.totalQueueLength.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right">
                      {renderDelta(
                        currentMetrics.totalQueueLength,
                        baselineMetrics.totalQueueLength,
                        true
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500">
              Click &quot;Save Current as Baseline&quot; above to capture a reference snapshot, then adjust capacities or workers to compare impacts.
            </div>
          )}

          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            <span className="font-bold text-indigo-900 dark:text-indigo-300 block mb-0.5">Note on Model Estimates:</span>
            All values displayed above are analytical approximations calculated by the deterministic DAG simulation engine. They reflect steady-state capacity models, queue rate integrals, and downstream multiplier bounds.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#141414] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 dark:bg-neutral-800 text-white font-medium hover:bg-slate-900 dark:hover:bg-neutral-700 transition-colors cursor-pointer shadow-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
