import React from 'react';
import {
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
  onReset,
  onOpenImportRepo,
  onGoHome,
  isDark = false,
  onToggleTheme,
}) => {
  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between z-20 shrink-0 transition-colors">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onGoHome}
          className="flex items-center text-left group hover:opacity-85 transition-opacity"
          title="Return to Landing Page"
        >
          <img
            src={isDark ? '/logo.png' : '/logo-light.png'}
            alt="GitToScale"
            className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </button>
      </div>

      {/* Action Controls & Scenario Selector */}
      <div className="flex items-center gap-3">
        {/* Reset button */}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm cursor-pointer"
          title="Reset architecture to initial scenario values"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          Reset
        </button>

        {/* Import Repo button */}
        <button
          onClick={onOpenImportRepo}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 dark:hover:bg-slate-600 transition-all shadow-sm cursor-pointer"
          title="Import architecture from GitHub or local repository"
        >
          <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Import Repo</span>
        </button>

        {/* Dark/Light Theme Toggle */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs cursor-pointer flex items-center justify-center"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        )}

        {/* Scenario dropdown - placed at the top right side */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs ml-1 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Scenario:</span>
          <select
            value={currentScenarioId}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 text-xs focus:outline-none cursor-pointer [&>option]:dark:bg-slate-800 [&>option]:dark:text-slate-100"
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
