import React from 'react';
import { Activity, Play, FolderGit2, CheckCircle2, ArrowRight, Sun, Moon } from 'lucide-react';
import { Fotter } from './Fotter';

interface LandingPageProps {
  onSelectTestSite: () => void;
  onSelectUseRepository: () => void;
  children?: React.ReactNode;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectTestSite,
  onSelectUseRepository,
  children,
  isDark = false,
  onToggleTheme,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0A] flex flex-col text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-200/80 dark:border-neutral-800 bg-white/90 dark:bg-[#0A0A0A]/90 backdrop-blur px-6 flex items-center justify-between shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-none">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">
                System Design Playground
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-50 dark:bg-[#141414] text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-200 dark:border-neutral-800">
                Simulator
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visualize architectures. Simulate traffic. Find bottlenecks.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
            Production Architecture & Load Simulation
          </span>
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#141414] hover:text-slate-900 dark:hover:text-white transition-all shadow-xs cursor-pointer flex items-center justify-center"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
          )}
        </div>
      </header>

      {/* Main Hero & Dual Card Selection */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
            Understand how your system behaves under load.
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Explore a sample architecture or analyze your own repository to discover its structure and experiment with system capacity.
          </p>
        </div>

        {/* Two large selectable cards side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card A: Continue with Test Site */}
          <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border-2 border-slate-200/80 dark:border-neutral-800 hover:border-indigo-400 dark:hover:border-indigo-500/80 p-7 shadow-sm hover:shadow-lg dark:hover:shadow-black/60 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-[#141414] text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform border border-transparent dark:border-neutral-800">
                <Play className="w-6 h-6 fill-current" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Continue with Test Site
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                Explore a ready-to-use e-commerce architecture with predefined services, traffic scenarios, and bottleneck simulations.
              </p>

              <div className="space-y-2.5 mb-8">
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Preloaded sample architecture (8 nodes, 8 edges)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Interactive traffic controls & 5 live scenarios</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Bottleneck ranking & queue latency visualization</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>No API key or external credentials required</span>
                </div>
              </div>
            </div>

            <button
              onClick={onSelectTestSite}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 group-hover:gap-3 cursor-pointer"
            >
              <span>Open Test Site</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card B: Use Repository */}
          <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border-2 border-slate-200/80 dark:border-neutral-800 hover:border-slate-800 dark:hover:border-neutral-700 p-7 shadow-sm hover:shadow-lg dark:hover:shadow-black/60 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-900 dark:bg-[#141414] text-white flex items-center justify-center mb-5 group-hover:scale-105 transition-transform border border-transparent dark:border-neutral-800">
                <FolderGit2 className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Use Repository
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                Analyze your own codebase and generate an architecture diagram using an LLM-assisted repository analyzer.
              </p>

              <div className="space-y-2.5 mb-8">
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>GitHub repository URL or local folder scanning</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Whole-repository scanning & Docker Compose discovery</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>AI-assisted component discovery & connection inferencing</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Configurable LLM provider & secure key settings</span>
                </div>
              </div>
            </div>

            <button
              onClick={onSelectUseRepository}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-slate-900 hover:bg-black dark:bg-[#141414] dark:hover:bg-[#1a1a1a] dark:border dark:border-neutral-800 text-white shadow-md shadow-slate-300 dark:shadow-none transition-all flex items-center justify-center gap-2 group-hover:gap-3 cursor-pointer"
            >
              <span>Analyze Repository</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Optional Injected Content (ScrollTimeline, etc.) */}
      {children}

      {/* Global Footer */}
      <Fotter brandName="GitToScale" />
    </div>
  );
};
