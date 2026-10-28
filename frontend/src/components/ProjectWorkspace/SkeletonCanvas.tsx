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
  Network,
  Wifi,
} from 'lucide-react';

export interface SkeletonCanvasProps {
  projectName?: string;
  activePrompt?: string;
  selectedAnswers?: {
    scale?: string;
    budget?: string;
    consistency?: string;
    region?: string;
  };
  viewMode?: 'basic' | 'detailed';
  onToggleViewMode?: (mode: 'basic' | 'detailed') => void;
  onHydrateClick?: () => void;
  isDark?: boolean;
}

export const SkeletonCanvas: React.FC<SkeletonCanvasProps> = ({
  projectName = 'Architectural Skeleton',
  activePrompt,
  selectedAnswers = {},
  viewMode = 'basic',
  onToggleViewMode,
  onHydrateClick,
}) => {
  const scaleText =
    selectedAnswers.scale === 'scale_burst'
      ? 'Burst 50k+ req/s'
      : selectedAnswers.scale === 'scale_mvp'
      ? 'MVP < 1k req/s'
      : 'Growth 10k req/s';

  const budgetText =
    selectedAnswers.budget === 'budget_enterprise'
      ? 'Enterprise Multi-Region'
      : selectedAnswers.budget === 'budget_frugal'
      ? 'Serverless (< $100)'
      : 'Balanced Cloud ($500-$2k)';

  const consistencyText =
    selectedAnswers.consistency === 'consistency_eventual'
      ? 'Eventual (Kafka / NoSQL)'
      : 'Strict ACID (PostgreSQL)';

  return (
    <div className="relative w-full h-full bg-slate-50 dark:bg-[#07080B] flex flex-col items-center justify-center p-3 sm:p-6 select-none overflow-hidden font-sans">
      {/* Grid Background */}
      <div
        className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none"
        aria-hidden="true"
      />

      {/* 1. Slow Network / Streaming Simulation Banner */}
      <div className="absolute top-3.5 z-20 flex flex-wrap items-center justify-between gap-3 px-4 py-2 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white/95 dark:bg-[#0C0E14]/95 backdrop-blur-md shadow-md max-w-4xl w-[calc(100%-2rem)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/10 text-amber-500 shrink-0">
            <Wifi className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                Simulating Network Skeleton Loading
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60">
                Streaming Topology (840ms)
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-neutral-400 truncate">
              {projectName} • Live placeholders streaming into canvas
            </p>
          </div>
        </div>

        {/* View Mode Switcher in Skeleton Mode */}
        {onToggleViewMode && (
          <div className="flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-900 shrink-0 text-xs">
            <button
              type="button"
              onClick={() => onToggleViewMode('basic')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                viewMode === 'basic'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Basic Skeleton</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleViewMode('detailed')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                viewMode === 'detailed'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Network className="w-3 h-3" />
              <span>Detailed Skeleton</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Main Shimmering Canvas Stage */}
      <div className="relative w-full max-w-5xl h-[470px] sm:h-[510px] border border-slate-200 dark:border-neutral-800/90 rounded-2xl bg-white/60 dark:bg-[#090A0E]/60 backdrop-blur-xs p-5 sm:p-7 flex flex-col justify-between overflow-hidden shadow-sm">
        {/* Animated Network Shimmer Loading Indicator Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-neutral-900 overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-indigo-500 to-transparent skeleton-shimmer-layer" />
        </div>

        {/* Dynamic Tier Columns */}
        {viewMode === 'basic' ? (
          /* ========================================================
             BASIC SKELETON: 4 High-Level Tiers
             ======================================================== */
          <div className="relative z-10 w-full h-full flex flex-col justify-between pt-4">
            {/* Tier Headers */}
            <div className="grid grid-cols-4 gap-4 pb-2 border-b border-dashed border-slate-200 dark:border-neutral-800/80">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                  Tier 01: Client Ingress
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                  Tier 02: API Gateway
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                  Tier 03: Microservices
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                  Tier 04: Cache &amp; Storage
                </span>
              </div>
            </div>

            {/* SVG Connecting Flow Lines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="shimmerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#6366f1" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              <path
                d="M 180,210 L 280,210"
                stroke="url(#shimmerGrad)"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="animate-pulse"
              />
              <path
                d="M 430,200 C 470,200 480,150 520,150"
                stroke="url(#shimmerGrad)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <path
                d="M 430,220 C 470,220 480,270 520,270"
                stroke="url(#shimmerGrad)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <path
                d="M 680,150 L 740,150"
                stroke="url(#shimmerGrad)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <path
                d="M 680,270 L 740,270"
                stroke="url(#shimmerGrad)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </svg>

            {/* Shimmer Skeleton Cards Grid */}
            <div className="grid grid-cols-4 gap-4 h-full items-center my-auto py-4 relative z-10">
              {/* Column 1: Client Ingress */}
              <div className="flex flex-col justify-center">
                <div className="skeleton-shimmer-layer p-4 rounded-xl border border-dashed border-sky-400/50 bg-sky-50/40 dark:bg-sky-950/20 backdrop-blur-xs shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-400/20 flex items-center justify-center text-sky-500 skeleton-shimmer-layer">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 w-24 bg-sky-200 dark:bg-sky-900/60 rounded-md skeleton-shimmer-layer" />
                      <div className="h-2.5 w-16 bg-sky-100 dark:bg-sky-900/40 rounded-md skeleton-shimmer-layer" />
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-sky-200/50 dark:border-sky-900/40 flex items-center justify-between">
                    <span className="text-[10px] text-sky-700 dark:text-sky-300 font-semibold font-mono">
                      {scaleText}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-sky-100 dark:bg-sky-900/80 text-sky-700 dark:text-sky-300 font-bold uppercase">
                      Ingress
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 2: Gateway */}
              <div className="flex flex-col justify-center">
                <div className="skeleton-shimmer-layer p-4 rounded-xl border border-dashed border-indigo-400/50 bg-indigo-50/40 dark:bg-indigo-950/20 backdrop-blur-xs shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-400/20 flex items-center justify-center text-indigo-500 skeleton-shimmer-layer">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 w-24 bg-indigo-200 dark:bg-indigo-900/60 rounded-md skeleton-shimmer-layer" />
                      <div className="h-2.5 w-20 bg-indigo-100 dark:bg-indigo-900/40 rounded-md skeleton-shimmer-layer" />
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-indigo-200/50 dark:border-indigo-900/40 flex items-center justify-between">
                    <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold font-mono">
                      {budgetText}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-bold uppercase">
                      Gateway
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 3: Compute Services */}
              <div className="flex flex-col justify-around gap-4">
                <div className="skeleton-shimmer-layer p-3.5 rounded-xl border border-dashed border-blue-400/50 bg-blue-50/40 dark:bg-blue-950/20 backdrop-blur-xs shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-400/20 flex items-center justify-center text-blue-500 skeleton-shimmer-layer">
                      <Server className="w-3.5 h-3.5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="h-3 w-20 bg-blue-200 dark:bg-blue-900/60 rounded-md skeleton-shimmer-layer" />
                      <div className="h-2 w-14 bg-blue-100 dark:bg-blue-900/40 rounded-md skeleton-shimmer-layer" />
                    </div>
                  </div>
                </div>

                <div className="skeleton-shimmer-layer p-3.5 rounded-xl border border-dashed border-purple-400/50 bg-purple-50/40 dark:bg-purple-950/20 backdrop-blur-xs shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-400/20 flex items-center justify-center text-purple-500 skeleton-shimmer-layer">
                      <Cpu className="w-3.5 h-3.5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="h-3 w-22 bg-purple-200 dark:bg-purple-900/60 rounded-md skeleton-shimmer-layer" />
                      <div className="h-2 w-16 bg-purple-100 dark:bg-purple-900/40 rounded-md skeleton-shimmer-layer" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 4: Storage & Cache */}
              <div className="flex flex-col justify-around gap-4">
                <div className="skeleton-shimmer-layer p-3.5 rounded-xl border border-dashed border-amber-400/50 bg-amber-50/40 dark:bg-amber-950/20 backdrop-blur-xs shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-500 skeleton-shimmer-layer">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="h-3 w-20 bg-amber-200 dark:bg-amber-900/60 rounded-md skeleton-shimmer-layer" />
                      <div className="h-2 w-14 bg-amber-100 dark:bg-amber-900/40 rounded-md skeleton-shimmer-layer" />
                    </div>
                  </div>
                </div>

                <div className="skeleton-shimmer-layer p-3.5 rounded-xl border border-dashed border-emerald-400/50 bg-emerald-50/40 dark:bg-emerald-950/20 backdrop-blur-xs shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-400/20 flex items-center justify-center text-emerald-500 skeleton-shimmer-layer">
                      <Database className="w-3.5 h-3.5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="h-3 w-20 bg-emerald-200 dark:bg-emerald-900/60 rounded-md skeleton-shimmer-layer" />
                      <div className="h-2 w-14 bg-emerald-100 dark:bg-emerald-900/40 rounded-md skeleton-shimmer-layer" />
                    </div>
                  </div>
                  <div className="mt-2 text-[9px] text-emerald-700 dark:text-emerald-300 font-mono">
                    {consistencyText}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================
             DETAILED SKELETON: Decomposed Granular Topology
             ======================================================== */
          <div className="relative z-10 w-full h-full flex flex-col justify-between pt-4">
            <div className="grid grid-cols-5 gap-3 pb-2 border-b border-dashed border-slate-200 dark:border-neutral-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                01: Edge &amp; Ingress
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                02: Reverse Proxy
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                03: App Worker Pool
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                04: Message Queue
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                05: Data Replicas
              </span>
            </div>

            <div className="grid grid-cols-5 gap-3 h-full items-center my-auto py-3">
              {/* Detailed Col 1: Edge */}
              <div className="flex flex-col gap-3">
                <div className="skeleton-shimmer-layer p-3 rounded-lg border border-slate-300 dark:border-neutral-800 bg-slate-100/50 dark:bg-neutral-900/50">
                  <div className="h-3 w-16 bg-slate-300 dark:bg-neutral-700 rounded skeleton-shimmer-layer" />
                  <div className="h-2 w-10 bg-slate-200 dark:bg-neutral-800 rounded mt-1.5 skeleton-shimmer-layer" />
                </div>
                <div className="skeleton-shimmer-layer p-3 rounded-lg border border-slate-300 dark:border-neutral-800 bg-slate-100/50 dark:bg-neutral-900/50">
                  <div className="h-3 w-14 bg-slate-300 dark:bg-neutral-700 rounded skeleton-shimmer-layer" />
                  <div className="h-2 w-12 bg-slate-200 dark:bg-neutral-800 rounded mt-1.5 skeleton-shimmer-layer" />
                </div>
              </div>

              {/* Detailed Col 2: Gateway */}
              <div className="flex flex-col gap-3">
                <div className="skeleton-shimmer-layer p-3 rounded-lg border border-indigo-300 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20">
                  <div className="h-3 w-20 bg-indigo-300 dark:bg-indigo-800/80 rounded skeleton-shimmer-layer" />
                  <div className="h-2 w-14 bg-indigo-200 dark:bg-indigo-900/50 rounded mt-1.5 skeleton-shimmer-layer" />
                </div>
                <div className="skeleton-shimmer-layer p-3 rounded-lg border border-indigo-300 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20">
                  <div className="h-3 w-18 bg-indigo-300 dark:bg-indigo-800/80 rounded skeleton-shimmer-layer" />
                  <div className="h-2 w-12 bg-indigo-200 dark:bg-indigo-900/50 rounded mt-1.5 skeleton-shimmer-layer" />
                </div>
              </div>

              {/* Detailed Col 3: App Worker Cluster */}
              <div className="flex flex-col gap-2.5">
                <div className="skeleton-shimmer-layer p-2.5 rounded-lg border border-blue-300 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20">
                  <div className="h-2.5 w-16 bg-blue-300 dark:bg-blue-800/80 rounded skeleton-shimmer-layer" />
                </div>
                <div className="skeleton-shimmer-layer p-2.5 rounded-lg border border-blue-300 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20">
                  <div className="h-2.5 w-18 bg-blue-300 dark:bg-blue-800/80 rounded skeleton-shimmer-layer" />
                </div>
                <div className="skeleton-shimmer-layer p-2.5 rounded-lg border border-blue-300 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20">
                  <div className="h-2.5 w-14 bg-blue-300 dark:bg-blue-800/80 rounded skeleton-shimmer-layer" />
                </div>
              </div>

              {/* Detailed Col 4: Async Queue */}
              <div className="flex flex-col gap-3">
                <div className="skeleton-shimmer-layer p-3 rounded-lg border border-purple-300 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20">
                  <div className="h-3 w-18 bg-purple-300 dark:bg-purple-800/80 rounded skeleton-shimmer-layer" />
                  <div className="h-2 w-10 bg-purple-200 dark:bg-purple-900/50 rounded mt-1.5 skeleton-shimmer-layer" />
                </div>
              </div>

              {/* Detailed Col 5: Data Primary + Replica */}
              <div className="flex flex-col gap-3">
                <div className="skeleton-shimmer-layer p-3 rounded-lg border border-emerald-300 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20">
                  <div className="h-3 w-20 bg-emerald-300 dark:bg-emerald-800/80 rounded skeleton-shimmer-layer" />
                  <div className="h-2 w-14 bg-emerald-200 dark:bg-emerald-900/50 rounded mt-1.5 skeleton-shimmer-layer" />
                </div>
                <div className="skeleton-shimmer-layer p-3 rounded-lg border border-emerald-300 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20">
                  <div className="h-3 w-16 bg-emerald-300 dark:bg-emerald-800/80 rounded skeleton-shimmer-layer" />
                  <div className="h-2 w-12 bg-emerald-200 dark:bg-emerald-900/50 rounded mt-1.5 skeleton-shimmer-layer" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Bottom Blueprint Footer Prompt */}
        <div className="relative z-10 pt-3 border-t border-slate-200/80 dark:border-neutral-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
          <div className="flex items-center gap-2 truncate max-w-lg">
            <span className="font-semibold text-slate-800 dark:text-neutral-200">Active Prompt:</span>
            <span className="truncate italic text-slate-600 dark:text-neutral-300">
              &ldquo;{activePrompt}&rdquo;
            </span>
          </div>

          {onHydrateClick && (
            <button
              type="button"
              onClick={onHydrateClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hydrate Final Diagram</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkeletonCanvas;
