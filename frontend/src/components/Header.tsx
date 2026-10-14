import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  GitCompare,
  Activity,
  Sparkles,
  FolderGit2,
  Layers,
  Network,
} from 'lucide-react';
import { ScenarioFixture } from '../types';

interface HeaderProps {
  scenarios: ScenarioFixture[];
  currentScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  isRunning: boolean;
  onToggleRun: () => void;
  onReset: () => void;
  onOpenCompare: () => void;
  onOpenImportRepo: () => void;
  hasBaseline: boolean;
  onGoHome?: () => void;
  viewMode?: 'basic' | 'detailed';
  onToggleViewMode?: (mode: 'basic' | 'detailed') => void;
}

export const Header: React.FC<HeaderProps> = ({
  scenarios,
  currentScenarioId,
  onSelectScenario,
  isRunning,
  onToggleRun,
  onReset,
  onOpenCompare,
  onOpenImportRepo,
  hasBaseline,
  onGoHome,
  viewMode = 'basic',
  onToggleViewMode,
}) => {
  const currentScenario = scenarios.find((s) => s.id === currentScenarioId);

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between z-20 shrink-0">
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
        {/* <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => onToggleViewMode?.('basic')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'basic'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Basic View: High-level overview"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Basic</span>
          </button>
          <button
            onClick={() => onToggleViewMode?.('detailed')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'detailed'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Detailed View: Submodules, routes, middleware & data flows"
          >
            <Network className="w-3.5 h-3.5" />
            <span>Detailed</span>
          </button>
        </div> */}

        {/* Play/Pause Button */}
        {/* <button
          onClick={onToggleRun}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
          }`}
          title={isRunning ? 'Pause automatic simulation sync' : 'Resume live simulation updates'}
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              Run
            </>
          )}
        </button> */}

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

        {/* Compare / Baseline button */}
        {/* <button
          onClick={onOpenCompare}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 transition-all shadow-sm cursor-pointer"
          title="Compare current architecture metrics against saved baseline"
        >
          <GitCompare className="w-3.5 h-3.5 text-indigo-600" />
          {hasBaseline ? 'Compare Baseline' : 'Set Baseline'}
        </button> */}

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
