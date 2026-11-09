import React, { useState } from 'react';
import {
  Flame,
  Activity,
  ChevronDown,
  Zap,
  ShoppingBag,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { ScenarioFixture } from '../../types';

interface FailureScenariosBarProps {
  scenarios: ScenarioFixture[];
  currentScenarioId?: string;
  onSelectScenario: (scenarioId: string) => void;
  isDark?: boolean;
}

export const FailureScenariosBar: React.FC<FailureScenariosBarProps> = ({
  scenarios,
  currentScenarioId = 'normal-traffic',
  onSelectScenario,
  isDark: _isDark = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeScenario = scenarios.find((s) => s.id === currentScenarioId) || scenarios[0];

  const getScenarioBadgeIcon = (id: string) => {
    switch (id) {
      case 'thundering-herd':
        return <Flame className="w-3.5 h-3.5 text-rose-500" />;
      case 'black-friday':
        return <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />;
      case 'leader-election-timeout':
        return <Clock className="w-3.5 h-3.5 text-purple-500" />;
      case 'traffic-spike':
      case 'flash-sale':
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case 'scale-out':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />;
      case 'normal-traffic':
      default:
        return <Activity className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  return (
    <div className="relative select-none">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-neutral-800 bg-white/90 dark:bg-[#0c0c0e]/90 backdrop-blur-md shadow-xs hover:border-slate-300 dark:hover:border-neutral-700 text-xs font-semibold text-slate-800 dark:text-neutral-100 transition-all cursor-pointer group"
        title="Select failure mode or traffic scenario"
      >
        <span className="flex items-center gap-1.5">
          {getScenarioBadgeIcon(activeScenario?.id || '')}
          <span className="max-w-[140px] sm:max-w-[190px] truncate">
            {activeScenario?.name || 'Scenarios'}
          </span>
        </span>
        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400">
          {activeScenario?.incomingTrafficRate?.toLocaleString()} req/s
        </span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-xl shadow-2xl p-3 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2 py-1 mb-2 border-b border-slate-100 dark:border-neutral-800/80 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 dark:text-neutral-500">
              One-Click Stress &amp; Failure Presets
            </span>
            <span className="text-[10px] font-mono text-emerald-500 font-bold">
              LIVE INJECTION
            </span>
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
            {scenarios.map((scen) => {
              const isSelected = scen.id === currentScenarioId;
              const isFailureMode =
                scen.id === 'thundering-herd' ||
                scen.id === 'black-friday' ||
                scen.id === 'leader-election-timeout';

              return (
                <button
                  key={scen.id}
                  type="button"
                  onClick={() => {
                    onSelectScenario(scen.id);
                    setIsOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                      : isFailureMode
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40 text-slate-800 dark:text-neutral-200 hover:bg-rose-100/50 dark:hover:bg-rose-900/30'
                      : 'bg-slate-50/60 dark:bg-neutral-900/50 border-slate-200/60 dark:border-neutral-800 text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      {getScenarioBadgeIcon(scen.id)}
                      <span>{scen.name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${
                        isSelected
                          ? 'bg-white/20 text-white dark:bg-black/10 dark:text-black'
                          : 'bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300'
                      }`}
                    >
                      {scen.incomingTrafficRate.toLocaleString()} req/s
                    </span>
                  </div>

                  <p
                    className={`text-[11px] leading-relaxed line-clamp-2 ${
                      isSelected
                        ? 'text-slate-300 dark:text-slate-700'
                        : 'text-slate-500 dark:text-neutral-400'
                    }`}
                  >
                    {scen.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
