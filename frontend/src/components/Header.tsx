import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  FolderGit2,
  Sun,
  Moon,
} from 'lucide-react';
import { ScenarioFixture } from '../types';

interface HeaderProps {
  scenarios: ScenarioFixture[];
  currentScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  isRunning?: boolean;
  onToggleRun?: () => void;
  onReset: () => void;
  onOpenCompare?: () => void;
  onOpenImportRepo: () => void;
  hasBaseline?: boolean;
  onGoHome?: () => void;
  viewMode?: 'basic' | 'detailed';
  onToggleViewMode?: (mode: 'basic' | 'detailed') => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  scenarios,
  currentScenarioId,
  onSelectScenario,
  isRunning = true,
  onToggleRun,
  onReset,
  onOpenImportRepo,
  onGoHome,
  isDark = false,
  onToggleTheme,
}) => {
  return (
    <header className="h-14 border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] px-2.5 sm:px-4 flex items-center justify-between z-20 shrink-0 transition-colors w-full overflow-hidden">
      {/* Brand & Title */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={onGoHome}
          className="flex items-center text-left group hover:opacity-85 transition-opacity"
          title="Return to Landing Page"
        >
          <img
            src={isDark ? '/logo.png' : '/logo-light.png'}
            alt="GitToScale"
            className="h-6 sm:h-7 md:h-8 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </button>
      </div>

      {/* Action Controls & Scenario Selector */}
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 overflow-x-auto no-scrollbar py-1 shrink min-w-0">
        {/* Play/Pause Simulation Button */}
        {onToggleRun && (
          <button
            onClick={onToggleRun}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0 ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
            }`}
            title={isRunning ? 'Pause request flow simulation' : 'Play live request simulation'}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span className="hidden xs:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="hidden xs:inline">Start</span>
              </>
            )}
          </button>
        )}

        {/* Reset button */}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-900 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm cursor-pointer shrink-0"
          title="Reset architecture to initial scenario values"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {/* Import Repo button */}
        <button
          onClick={onOpenImportRepo}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 text-white hover:bg-slate-900 dark:hover:bg-neutral-800 transition-all shadow-sm cursor-pointer shrink-0"
          title="Import architecture from GitHub or local repository"
        >
          <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Import Repo</span>
        </button>

        {/* Dark/Light Theme Toggle */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs cursor-pointer flex items-center justify-center shrink-0"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        )}

        {/* Scenario dropdown - placed at the top right side */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 dark:bg-[#0A0A0A] border border-slate-200 dark:border-neutral-800 rounded-lg px-2 sm:px-2.5 py-1 text-xs shadow-2xs shrink-0 max-w-[130px] sm:max-w-[200px] md:max-w-none">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-slate-500 dark:text-neutral-400 font-medium text-[11px] hidden md:inline">Scenario:</span>
          <select
            value={currentScenarioId}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="bg-transparent font-semibold text-slate-800 dark:text-neutral-200 text-xs focus:outline-none cursor-pointer truncate max-w-[85px] sm:max-w-[130px] md:max-w-none [&>option]:dark:bg-[#0A0A0A] [&>option]:dark:text-neutral-100"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};
