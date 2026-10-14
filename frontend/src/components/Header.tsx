import React from 'react';
import {
  RotateCcw,
  Activity,
  Sparkles,
  FolderGit2,
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
}

export const Header: React.FC<HeaderProps> = ({
  scenarios,
  currentScenarioId,
  onSelectScenario,
  onReset,
  onOpenImportRepo,
  onGoHome,
}) => {

  return (
    <header className="h-14 border-b px-4 flex items-center justify-between z-20 shrink-0">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-left group hover:opacity-85 transition-opacity"
          title="Return to Landing Page"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                System Design Playground
              </h1>
              <span className="text-[10px] uppercase font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
                Traffic Simulator
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Interactive microservices capacity planner & bottleneck visualizer
            </p>
          </div>
        </button>
      </div>

      {/* Action Controls & Scenario Selector */}
      <div className="flex items-center gap-3">
        {/* Two-Mode Architecture View Toggle */}
        {/* Reset button */}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm cursor-pointer"
          title="Reset architecture to initial scenario values"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          Reset
        </button>

        {/* Import Repo button */}
        <button
          onClick={onOpenImportRepo}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900 transition-all shadow-sm cursor-pointer"
          title="Import architecture from GitHub or local repository"
        >
          <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Import Repo</span>
        </button>

        {/* Scenario dropdown - placed at the top right side */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs ml-1 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-slate-500 font-medium text-[11px]">Scenario:</span>
          <select
            value={currentScenarioId}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="bg-transparent font-semibold text-slate-800 text-xs focus:outline-none cursor-pointer"
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
