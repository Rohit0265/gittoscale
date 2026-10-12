import React from 'react';
import { Activity, Play, FolderGit2, CheckCircle2, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onSelectTestSite: () => void;
  onSelectUseRepository: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectTestSite,
  onSelectUseRepository,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col text-slate-800">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-slate-900">
                System Design Playground
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                Simulator
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Visualize architectures. Simulate traffic. Find bottlenecks.
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Production Architecture & Load Simulation
        </div>
      </header>

      {/* Main Hero & Dual Card Selection */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
            Understand how your system behaves under load.
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Explore a sample architecture or analyze your own repository to discover its structure and experiment with system capacity.
          </p>
        </div>

        {/* Two large selectable cards side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card A: Continue with Test Site */}
          <div className="bg-white rounded-2xl border-2 border-slate-200/80 hover:border-indigo-400 p-7 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Play className="w-6 h-6 fill-current" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Continue with Test Site
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Explore a ready-to-use e-commerce architecture with predefined services, traffic scenarios, and bottleneck simulations.
              </p>

              <div className="space-y-2.5 mb-8">
                <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Preloaded sample architecture (8 nodes, 8 edges)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Interactive traffic controls & 5 live scenarios</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Bottleneck ranking & queue latency visualization</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>No API key or external credentials required</span>
                </div>
              </div>
            </div>

            <button
              onClick={onSelectTestSite}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 group-hover:gap-3"
            >
              <span>Open Test Site</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card B: Use Repository */}
          <div className="bg-white rounded-2xl border-2 border-slate-200/80 hover:border-slate-800 p-7 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <FolderGit2 className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Use Repository
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Analyze your own codebase and generate an architecture diagram using an LLM-assisted repository analyzer.
              </p>

              <div className="space-y-2.5 mb-8">
                <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>GitHub repository URL or local folder scanning</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Whole-repository scanning & Docker Compose discovery</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>AI-assisted component discovery & connection inferencing</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Configurable LLM provider & secure key settings</span>
                </div>
              </div>
            </div>

            <button
              onClick={onSelectUseRepository}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-slate-900 hover:bg-black text-white shadow-md shadow-slate-300 transition-all flex items-center justify-center gap-2 group-hover:gap-3"
            >
              <span>Analyze Repository</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-slate-200 bg-white/70 px-6 flex items-center justify-center text-xs text-slate-400">
        System Design Playground &bull; Deterministic DAG Traffic Simulator & Architecture Visualizer
      </footer>
    </div>
  );
};
