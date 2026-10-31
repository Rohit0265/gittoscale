import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Sparkles } from 'lucide-react';

export interface WorkflowStepsProps {
  onSelectTestSite?: () => void;
  onSelectUseRepository?: () => void;
  onOpenRecommender?: () => void;
  isDark?: boolean;
}

export const WorkflowSteps: React.FC<WorkflowStepsProps> = ({
  onSelectTestSite,
  onSelectUseRepository,
  onOpenRecommender,
  isDark: _isDark,
}) => {
  // Interactive state for Step 03 (hovered risk)
  const [hoveredRisk, setHoveredRisk] = useState<string | null>(null);

  const handleExploreWorkflow = () => {
    if (onSelectTestSite) {
      onSelectTestSite();
    } else if (onSelectUseRepository) {
      onSelectUseRepository();
    }
  };

  const handleOpenRecommendation = () => {
    if (onOpenRecommender) {
      onOpenRecommender();
    } else if (onSelectTestSite) {
      onSelectTestSite();
    }
  };

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
          {/* Left Column: Visual Card (Risk Signals Telemetry) */}
          <div className="lg:col-span-7 w-full">
            <div className="group relative w-full h-[300px] sm:h-[340px] md:h-[360px] bg-white dark:bg-[#121316] border border-slate-200/80 dark:border-neutral-800 rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-none p-5 sm:p-6 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:border-slate-300 dark:hover:border-neutral-700">
              {/* Card Header */}
              <div className="flex items-center justify-between z-10">
                <span className="text-xs font-mono text-slate-500 dark:text-neutral-400 font-medium">
                  Risk signals
                </span>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60 shadow-2xs">
                  3 detected
                </div>
              </div>

              {/* Card Telemetry Bars Area */}
              <div className="my-auto flex flex-col gap-5 sm:gap-6 w-full">
                {/* Metric 1: Database connection pool (92% Red) */}
                <div
                  onMouseEnter={() => setHoveredRisk('db')}
                  onMouseLeave={() => setHoveredRisk(null)}
                  className="group/item flex flex-col gap-1.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="inline-flex items-center gap-2 text-slate-700 dark:text-neutral-200 font-medium">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span>Database connection pool</span>
                    </div>
                    <span className="font-bold text-rose-600 dark:text-rose-400">92%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-rose-500 rounded-full"
                      initial={{ width: '0%' }}
                      whileInView={{ width: '92%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Metric 2: Queue consumer lag (68% Amber) */}
                <div
                  onMouseEnter={() => setHoveredRisk('queue')}
                  onMouseLeave={() => setHoveredRisk(null)}
                  className="group/item flex flex-col gap-1.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="inline-flex items-center gap-2 text-slate-700 dark:text-neutral-200 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span>Queue consumer lag</span>
                    </div>
                    <span className="font-bold text-amber-600 dark:text-amber-400">68%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-amber-500 rounded-full"
                      initial={{ width: '0%' }}
                      whileInView={{ width: '68%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Metric 3: Cache hit rate (97% Emerald) */}
                <div
                  onMouseEnter={() => setHoveredRisk('cache')}
                  onMouseLeave={() => setHoveredRisk(null)}
                  className="group/item flex flex-col gap-1.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="inline-flex items-center gap-2 text-slate-700 dark:text-neutral-200 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>Cache hit rate</span>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">97%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-emerald-500 rounded-full"
                      initial={{ width: '0%' }}
                      whileInView={{ width: '97%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer: recommendation ready */}
              <button
                type="button"
                onClick={handleOpenRecommendation}
                className="group/rec flex items-center justify-between w-full pt-3 border-t border-slate-100 dark:border-neutral-800/80 z-10 text-xs font-mono text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors cursor-pointer"
              >
                <div className="inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-500 group-hover/rec:rotate-12 transition-transform" />
                  <span className="font-medium">
                    {hoveredRisk === 'db'
                      ? 'Add PgBouncer pooler or replica'
                      : hoveredRisk === 'queue'
                      ? 'Scale Celery/Kafka consumers'
                      : 'recommendation ready'}
                  </span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/rec:translate-x-0.5 group-hover/rec:-translate-y-0.5" />
              </button>
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
      </div>
    </section>
  );
};

export default WorkflowSteps;

