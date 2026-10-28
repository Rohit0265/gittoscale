import React from 'react';
import {
  Globe,
  Server,
  Database,
  Layers,
  Cpu,
  Radio,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface SkeletonCanvasProps {
  projectName?: string;
  activePrompt?: string;
  onHydrateClick?: () => void;
  isDark?: boolean;
}

export const SkeletonCanvas: React.FC<SkeletonCanvasProps> = ({
  projectName = 'Architectural Skeleton',
  activePrompt,
  onHydrateClick,
}) => {
  return (
    <div className="relative w-full h-full bg-slate-50 dark:bg-[#07080B] flex flex-col items-center justify-center p-4 sm:p-8 select-none overflow-hidden font-sans">
      {/* Grid Pattern Background */}
      <div
        className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Banner Notice */}
      <div className="absolute top-4 z-20 flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border border-indigo-200 dark:border-indigo-900/60 bg-white/90 dark:bg-[#0D0E14]/90 backdrop-blur-md shadow-sm text-xs font-medium text-slate-700 dark:text-neutral-300">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" style={{ animationDuration: '4s' }} />
        <span>
          <strong className="text-slate-900 dark:text-white">Skeleton Blueprint ({projectName}):</strong> Answer contextual queries on the left to hydrate concrete technologies.
        </span>
      </div>

      {/* Interactive Blueprint Stage */}
      <div className="relative w-full max-w-5xl h-[460px] sm:h-[500px] border border-dashed border-slate-300 dark:border-neutral-800 rounded-2xl bg-white/40 dark:bg-[#0A0B10]/40 p-6 flex flex-col justify-between overflow-hidden shadow-inner">
        {/* Tier Boundary Markers */}
        <div className="absolute inset-0 pointer-events-none grid grid-cols-4 divide-x divide-dashed divide-slate-200 dark:divide-neutral-800/80">
          <div className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-600">
              Tier 01: Ingress
            </span>
          </div>
          <div className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-600">
              Tier 02: Gateway
            </span>
          </div>
          <div className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-600">
              Tier 03: Compute
            </span>
          </div>
          <div className="p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-600">
              Tier 04: Data &amp; Cache
            </span>
          </div>
        </div>

        {/* SVG Skeleton Flow Connector Lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="skEdgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Dotted Connections between tiers */}
          <path d="M 180,210 L 290,210" stroke="url(#skEdgeGrad)" strokeWidth="2" strokeDasharray="5 5" className="animate-pulse" />
          <path d="M 440,195 C 490,195, 480,140, 520,140" stroke="url(#skEdgeGrad)" strokeWidth="2" strokeDasharray="5 5" />
          <path d="M 440,225 C 490,225, 480,280, 520,280" stroke="url(#skEdgeGrad)" strokeWidth="2" strokeDasharray="5 5" />
          <path d="M 680,140 L 750,130" stroke="url(#skEdgeGrad)" strokeWidth="2" strokeDasharray="5 5" />
          <path d="M 680,280 L 750,290" stroke="url(#skEdgeGrad)" strokeWidth="2" strokeDasharray="5 5" />
          <path d="M 680,160 C 720,180, 710,270, 750,285" stroke="url(#skEdgeGrad)" strokeWidth="2" strokeDasharray="5 5" />
        </svg>

        {/* Skeleton Nodes Floating in Space */}
        <div className="relative z-10 w-full h-full flex flex-col justify-around py-4">
          <div className="grid grid-cols-4 gap-4 h-full items-center">
            {/* Column 1: Ingress */}
            <div className="flex flex-col justify-center gap-4">
              <div className="p-3.5 rounded-xl border border-dashed border-sky-400/50 bg-sky-50/40 dark:bg-sky-950/20 backdrop-blur-sm shadow-xs animate-pulse">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-sky-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Client Traffic</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-neutral-400">
                  <span>Web &amp; Mobile Apps</span>
                  <span className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-semibold">TBD</span>
                </div>
              </div>
            </div>

            {/* Column 2: Gateway */}
            <div className="flex flex-col justify-center gap-4">
              <div className="p-3.5 rounded-xl border border-dashed border-indigo-400/50 bg-indigo-50/40 dark:bg-indigo-950/20 backdrop-blur-sm shadow-xs animate-pulse" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">API Gateway</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-neutral-400">
                  <span>TLS / Ingress</span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold">Evaluating...</span>
                </div>
              </div>
            </div>

            {/* Column 3: Compute */}
            <div className="flex flex-col justify-around gap-6">
              <div className="p-3.5 rounded-xl border border-dashed border-blue-400/50 bg-blue-50/40 dark:bg-blue-950/20 backdrop-blur-sm shadow-xs animate-pulse" style={{ animationDelay: '0.8s' }}>
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Core Services</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-neutral-400">
                  <span>Microservice Fleet</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">Drafting</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-dashed border-purple-400/50 bg-purple-50/40 dark:bg-purple-950/20 backdrop-blur-sm shadow-xs animate-pulse" style={{ animationDelay: '1.2s' }}>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Event Stream / Bus</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-neutral-400">
                  <span>Async Workers</span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-semibold">Evaluating...</span>
                </div>
              </div>
            </div>

            {/* Column 4: Data & Cache */}
            <div className="flex flex-col justify-around gap-6">
              <div className="p-3.5 rounded-xl border border-dashed border-amber-400/50 bg-amber-50/40 dark:bg-amber-950/20 backdrop-blur-sm shadow-xs animate-pulse" style={{ animationDelay: '0.6s' }}>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Cache Layer</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-neutral-400">
                  <span>In-Memory Store</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-semibold">TBD</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-dashed border-emerald-400/50 bg-emerald-50/40 dark:bg-emerald-950/20 backdrop-blur-sm shadow-xs animate-pulse" style={{ animationDelay: '1.0s' }}>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Primary Database</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-neutral-400">
                  <span>State &amp; Persistence</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold">Resolving</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stage Overlay Prompt */}
        {activePrompt && (
          <div className="relative z-10 pt-3 border-t border-slate-200/80 dark:border-neutral-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
            <div className="flex items-center gap-1.5 truncate max-w-xl">
              <span className="font-semibold text-slate-800 dark:text-neutral-200">Prompt:</span>
              <span className="truncate italic">&ldquo;{activePrompt}&rdquo;</span>
            </div>

            {onHydrateClick && (
              <button
                type="button"
                onClick={onHydrateClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer shrink-0"
              >
                <span>Hydrate Final Diagram</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkeletonCanvas;
