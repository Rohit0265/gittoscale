import React from 'react';
import { Zap, Play, Pause } from 'lucide-react';

interface RequestSenderCardProps {
  incomingTrafficRate: number;
  onChangeTrafficRate: (val: number) => void;
  isRunning?: boolean;
  onToggleRunning?: () => void;
  durationSeconds?: number;
  onChangeDuration?: (val: number) => void;
}

export const RequestSenderCard: React.FC<RequestSenderCardProps> = ({
  incomingTrafficRate,
  onChangeTrafficRate,
  isRunning = true,
  onToggleRunning,
  durationSeconds,
  onChangeDuration,
}) => {
  const sliderPercent = Math.min(100, Math.max(0, ((incomingTrafficRate - 100) / (5000 - 100)) * 100));

  const PRESETS = [500, 1000, 2500, 5000];

  return (
    <div className="w-full bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800 rounded-2xl p-3 sm:p-3.5 space-y-3 shadow-none text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold tracking-wider uppercase text-slate-800 dark:text-slate-200">
              Request Sender
            </h4>
          </div>
        </div>

        {onToggleRunning && (
          <button
            onClick={onToggleRunning}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
              isRunning
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
            }`}
            title={isRunning ? 'Pause request emission' : 'Resume request emission'}
          >
            {isRunning ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <Pause className="w-2.5 h-2.5" />
                <span>Active</span>
              </>
            ) : (
              <>
                <Play className="w-2.5 h-2.5" />
                <span>Paused</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Arrival Rate Input & Slider */}
      <div className="bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-neutral-800 rounded-xl p-2.5 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            Rate (req/sec)
          </span>
          <div className="relative">
            <input
              type="number"
              min={100}
              max={5000}
              step={50}
              value={incomingTrafficRate}
              onChange={(e) => {
                const val = Math.max(0, parseInt(e.target.value) || 0);
                onChangeTrafficRate(val);
              }}
              className="w-18 text-center font-mono font-bold text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 shadow-none no-spinner"
            />
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-1">
          <input
            type="range"
            min={100}
            max={5000}
            step={50}
            value={incomingTrafficRate}
            onChange={(e) => onChangeTrafficRate(Number(e.target.value))}
            style={{
              background: `linear-gradient(to right, #6366F1 0%, #6366F1 ${sliderPercent}%, #334155 ${sliderPercent}%, #334155 100%)`,
            }}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400"
          />
          <div className="flex justify-between text-[9px] text-slate-500 dark:text-slate-400 font-mono">
            <span>100 r/s</span>
            <span>2,500 r/s</span>
            <span>5,000 r/s</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-4 gap-1 pt-1">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => onChangeTrafficRate(preset)}
              className={`py-1 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer border ${
                incomingTrafficRate === preset
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-[#0A0A0A] border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {preset >= 1000 ? `${preset / 1000}k` : preset}
            </button>
          ))}
        </div>

        {/* Optional Duration Control */}
        {onChangeDuration !== undefined && durationSeconds !== undefined && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-neutral-800/60 text-[10px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Duration</span>
            <div className="flex items-center gap-1 font-mono">
              <input
                type="number"
                min={10}
                max={600}
                step={10}
                value={durationSeconds}
                onChange={(e) => onChangeDuration(Math.max(10, parseInt(e.target.value) || 10))}
                className="w-12 text-center font-bold px-1 py-0.5 rounded border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-slate-800 dark:text-slate-100 focus:outline-none"
              />
              <span className="text-slate-400">sec</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
