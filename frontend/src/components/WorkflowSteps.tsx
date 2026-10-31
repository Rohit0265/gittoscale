import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight,
  Bot,
  Zap,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export interface WorkflowStepsProps {
  onSelectTestSite?: () => void;
  onSelectUseRepository?: () => void;
  onOpenRecommender?: () => void;
  isDark?: boolean;
}

const AI_COMPLETION_SCENARIOS = [
  {
    id: 'decouple',
    label: 'Decouple Flow',
    prompt: 'Billing Service is at 80% capacity. Inject a queue to decouple payments.',
    action: 'Injected Kafka buffer & 3x worker consumer pool',
    nodes: [
      { name: 'Billing Service', badge: 'Warning 80%', isInjected: false, color: 'text-amber-300 border-amber-500/50 bg-amber-950/30' },
      { name: 'Kafka Queue', badge: '⚡ Injected Queue', isInjected: true, color: 'text-emerald-300 border-emerald-500/60 bg-emerald-950/40 ring-1 ring-emerald-500/30' },
      { name: 'Worker Pool (3x)', badge: '⚡ Auto-scaled', isInjected: true, color: 'text-emerald-300 border-emerald-500/60 bg-emerald-950/40 ring-1 ring-emerald-500/30' },
      { name: 'Payment DB', badge: 'Normal · 12%', isInjected: false, color: 'text-neutral-200 border-neutral-700 bg-neutral-900/60' },
    ],
    metric: 'Saturation: 80% → 12%',
    latency: 'p95: 184ms → 22ms (-88%)',
  },
  {
    id: 'cache',
    label: 'Inject Cache',
    prompt: 'Database connection pool reached 92%. Add Redis caching between API and DB.',
    action: 'Injected Redis Cache tier with 98% target hit rate',
    nodes: [
      { name: 'API Gateway', badge: 'Active', isInjected: false, color: 'text-neutral-200 border-neutral-700 bg-neutral-900/60' },
      { name: 'Redis Cache', badge: '⚡ 98% Hit Rate', isInjected: true, color: 'text-emerald-300 border-emerald-500/60 bg-emerald-950/40 ring-1 ring-emerald-500/30' },
      { name: 'Postgres DB', badge: 'Pool load · 14%', isInjected: false, color: 'text-neutral-200 border-neutral-700 bg-neutral-900/60' },
    ],
    metric: 'DB Queries: -86% read pressure',
    latency: 'Latency: 120ms → 8ms (-93%)',
  },
  {
    id: 'replica',
    label: 'Auto-Scale',
    prompt: 'Traffic surging to 20,000 req/s. Complete topology to eliminate SPOF.',
    action: 'Added dynamic Load Balancer & 2x Read Replicas',
    nodes: [
      { name: 'Load Balancer', badge: '⚡ Injected Proxy', isInjected: true, color: 'text-emerald-300 border-emerald-500/60 bg-emerald-950/40 ring-1 ring-emerald-500/30' },
      { name: 'Primary DB', badge: 'Writes Only', isInjected: false, color: 'text-neutral-200 border-neutral-700 bg-neutral-900/60' },
      { name: 'Replica Pool (2x)', badge: '⚡ Read Replicas', isInjected: true, color: 'text-emerald-300 border-emerald-500/60 bg-emerald-950/40 ring-1 ring-emerald-500/30' },
    ],
    metric: 'Capacity: 800 → 20,000 req/s',
    latency: 'Zero dropped requests (99.99%)',
  },
];

export const WorkflowSteps: React.FC<WorkflowStepsProps> = ({
  onSelectTestSite,
  onSelectUseRepository,
  onOpenRecommender: _onOpenRecommender,
  isDark: _isDark,
}) => {
  // Interactive state for Step 04 (AI flow completion scenario)
  const [activeScenario, setActiveScenario] = useState<number>(0);

  const handleExploreWorkflow = () => {
    if (onSelectTestSite) {
      onSelectTestSite();
    } else if (onSelectUseRepository) {
      onSelectUseRepository();
    }
  };

  const currentScenario = AI_COMPLETION_SCENARIOS[activeScenario];

  return (
    <section
      id="steps-section"
      className="relative w-full bg-transparent text-slate-900 dark:text-white py-16 sm:py-24 md:py-32 px-4 sm:px-6 md:px-10 lg:px-14 overflow-hidden font-sans"
    >
      {/* Background Subtle Blueprint Grid Pattern matching hero */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.35] dark:opacity-[0.20]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(148, 163, 184, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* 1. SECTION HEADER: "From codebase to confidence." */}
      <div className="relative z-10 w-full max-w-7xl mx-auto mb-16 sm:mb-24 md:mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end">
          {/* Left Column: Eyebrow + Main Headline */}
          <div className="lg:col-span-8 flex flex-col items-start text-left">
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.2em] uppercase text-sky-600 dark:text-sky-400 mb-4 sm:mb-5">
              A CLEARER PATH TO SCALE
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-bold tracking-[-0.035em] leading-[1.08] text-slate-950 dark:text-white">
              From codebase <br />
              <span className="text-slate-500 dark:text-slate-400">
                to confidence.
              </span>
            </h2>
          </div>

          {/* Right Column: Subtitle */}
          <div className="lg:col-span-4 lg:text-left flex flex-col justify-end pb-1 sm:pb-2">
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              GitToScale turns distributed systems into something your whole team can reason about.
            </p>
          </div>
        </div>
      </div>

      {/* 2. STEPS CONTAINER */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col gap-20 sm:gap-28 md:gap-36">
        {/* STEP 01: DISCOVER */}
        <div
          id="step-1"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center"
        >
          {/* Left Column: Visual Card (Architecture Map Image) */}
          <div className="lg:col-span-7 w-full">
            <div className="group relative w-full bg-[#08090d] border border-slate-200/80 dark:border-neutral-800 rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-none p-2 sm:p-3 flex items-center justify-center overflow-hidden transition-all duration-300 hover:border-slate-300 dark:hover:border-neutral-700">
              <img
                src="/architecture-map.jpg"
                alt="GitToScale Architecture Map"
                className="w-full h-auto object-contain rounded-xl select-none"
                loading="eager"
              />
            </div>
          </div>

          {/* Right Column: Step Copy */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-sky-600 dark:text-sky-400">
              01 / DISCOVER
            </span>
            <h3 className="text-3xl sm:text-4xl md:text-[42px] font-bold text-slate-950 dark:text-white leading-[1.12] tracking-tight mt-3">
              See the architecture hiding in your repo.
            </h3>
            <p className="text-slate-600 dark:text-neutral-400 text-base sm:text-lg leading-relaxed mt-4 max-w-lg">
              Import a GitHub repository and let GitToScale map services, queues, data stores, and the traffic between them.
            </p>
            <button
              type="button"
              onClick={handleExploreWorkflow}
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors mt-6 cursor-pointer"
            >
              <span>Explore the workflow</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>

        {/* STEP 02: SIMULATE (Reversed Layout) */}
        <div
          id="step-2"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center"
        >
          {/* Left Column: Step Copy (Desktop order 1, Mobile order 2) */}
          <div className="lg:col-span-5 flex flex-col items-start text-left order-2 lg:order-1">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-sky-600 dark:text-sky-400">
              02 / SIMULATE
            </span>
            <h3 className="text-3xl sm:text-4xl md:text-[42px] font-bold text-slate-950 dark:text-white leading-[1.12] tracking-tight mt-3">
              Stress-test before production does.
            </h3>
            <p className="text-slate-600 dark:text-neutral-400 text-base sm:text-lg leading-relaxed mt-4 max-w-lg">
              Model traffic spikes, cache misses, database saturation, and failure paths with a clear, interactive view of what happens next.
            </p>
            <button
              type="button"
              onClick={handleExploreWorkflow}
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors mt-6 cursor-pointer"
            >
              <span>Explore the workflow</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>

          {/* Right Column: Visual Card (Simulation Demo Video) */}
          <div className="lg:col-span-7 w-full order-1 lg:order-2">
            <div className="group relative w-full bg-[#08090d] border border-slate-200/80 dark:border-neutral-800 rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-none p-2 sm:p-3 flex items-center justify-center overflow-hidden transition-all duration-300 hover:border-slate-300 dark:hover:border-neutral-700">
              <video
                src="/simulation-demo.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto object-contain rounded-xl select-none"
              />
            </div>
          </div>
        </div>

        {/* STEP 03: DETECT */}
        <div
          id="step-3"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center"
        >
          {/* Left Column: Visual Card (Bottleneck Detection Image) */}
          <div className="lg:col-span-7 w-full">
            <div className="group relative w-full bg-[#08090d] border border-slate-200/80 dark:border-neutral-800 rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-none p-2 sm:p-3 flex items-center justify-center overflow-hidden transition-all duration-300 hover:border-slate-300 dark:hover:border-neutral-700">
              <img
                src="/detect-bottleneck.png"
                alt="GitToScale Bottleneck Detection & Inspector"
                className="w-full h-auto object-contain rounded-xl select-none"
                loading="eager"
              />
            </div>
          </div>

          {/* Right Column: Step Copy */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-sky-600 dark:text-sky-400">
              03 / DETECT
            </span>
            <h3 className="text-3xl sm:text-4xl md:text-[42px] font-bold text-slate-950 dark:text-white leading-[1.12] tracking-tight mt-3">
              Find the bottleneck before the outage.
            </h3>
            <p className="text-slate-600 dark:text-neutral-400 text-base sm:text-lg leading-relaxed mt-4 max-w-lg">
              Turn invisible coupling into a prioritized list of risks your team can understand, discuss, and fix.
            </p>
            <button
              type="button"
              onClick={handleExploreWorkflow}
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors mt-6 cursor-pointer"
            >
              <span>Explore the workflow</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>

        {/* STEP 04: COMPLETE WITH AI (Reversed Layout) */}
        <div
          id="step-4"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center"
        >
          {/* Left Column: Step Copy (Desktop order 1, Mobile order 2) */}
          <div className="lg:col-span-5 flex flex-col items-start text-left order-2 lg:order-1">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-sky-600 dark:text-sky-400">
              04 / COMPLETE WITH AI
            </span>
            <h3 className="text-3xl sm:text-4xl md:text-[42px] font-bold text-slate-950 dark:text-white leading-[1.12] tracking-tight mt-3">
              Use AI to complete, scale, and heal your flow.
            </h3>
            <p className="text-slate-600 dark:text-neutral-400 text-base sm:text-lg leading-relaxed mt-4 max-w-lg">
              Prompt the AI Architect to heal bottlenecks, inject cache layers, decouple asynchronous workers, or generate complete production topologies with real-time canvas execution.
            </p>
            <button
              type="button"
              onClick={handleExploreWorkflow}
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors mt-6 cursor-pointer"
            >
              <span>Explore the workflow</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>

          {/* Right Column: Visual Card (Interactive AI Flow Completion Card) */}
          <div className="lg:col-span-7 w-full order-1 lg:order-2">
            <div className="group relative w-full min-h-[340px] sm:min-h-[380px] bg-[#07080b] border border-neutral-800 rounded-2xl shadow-xl p-5 sm:p-6 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:border-neutral-700">
              {/* Canvas Dot Matrix Grid */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              />

              {/* Card Header: AI Copilot indicator & Scenario selector */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <span className="text-xs font-mono text-neutral-300 font-semibold">
                    AI Architecture Copilot
                  </span>
                  <span className="relative flex h-2 w-2 ml-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>

                {/* Scenario Toggle Pills */}
                <div className="inline-flex items-center p-0.5 rounded-lg bg-[#11131a] border border-neutral-800 text-[10.5px] font-mono">
                  {AI_COMPLETION_SCENARIOS.map((scenario, idx) => (
                    <button
                      key={scenario.id}
                      type="button"
                      onClick={() => setActiveScenario(idx)}
                      className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                        activeScenario === idx
                          ? 'bg-sky-600 text-white font-medium shadow-xs'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {scenario.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Middle Area: Prompt & Completed Topology Flow */}
              <div className="relative z-10 my-4 flex flex-col gap-3.5">
                {/* User Prompt Input simulation */}
                <div className="p-3 rounded-xl bg-[#12141c] border border-neutral-800 flex items-start gap-2.5 shadow-inner">
                  <div className="w-5 h-5 rounded-md bg-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-mono font-bold text-sky-400">⌘</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                      User Prompt
                    </div>
                    <p className="text-xs font-mono text-neutral-200 mt-0.5 leading-relaxed">
                      "{currentScenario.prompt}"
                    </p>
                  </div>
                </div>

                {/* AI Action Execution Banner */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-medium truncate">{currentScenario.action}</span>
                </div>

                {/* Completed Flow Diagram Pipeline */}
                <div className="p-3.5 rounded-xl bg-[#0c0d12] border border-neutral-800/80">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-2.5 flex items-center justify-between">
                    <span>Completed Topology Pipeline</span>
                    <span className="text-emerald-400 font-medium">⚡ Flow Verified</span>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentScenario.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-wrap items-center gap-2"
                    >
                      {currentScenario.nodes.map((node, i) => (
                        <React.Fragment key={node.name}>
                          <div
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-medium flex flex-col gap-0.5 transition-all shadow-xs ${node.color}`}
                          >
                            <span className="text-[11px] font-semibold">{node.name}</span>
                            <span className="text-[9px] opacity-80">{node.badge}</span>
                          </div>

                          {i < currentScenario.nodes.length - 1 && (
                            <ArrowRight className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Card Footer: Telemetry Improvement */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-neutral-800/80 text-xs font-mono">
                <div className="inline-flex items-center gap-3 text-neutral-400">
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <Zap className="w-3.5 h-3.5" />
                    {currentScenario.metric}
                  </span>
                  <span className="hidden sm:inline text-neutral-500">·</span>
                  <span className="hidden sm:inline text-neutral-300">{currentScenario.latency}</span>
                </div>

                <button
                  type="button"
                  onClick={handleExploreWorkflow}
                  className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 font-medium transition-colors cursor-pointer"
                >
                  <span>Apply in Playground</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorkflowSteps;
