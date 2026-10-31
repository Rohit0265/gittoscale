import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Play, Sparkles, Github } from 'lucide-react';
import { VideoCarousel } from './VideoCarousel';

export interface NewOneProps {
  onSelectTestSite?: () => void;
  onSelectUseRepository?: () => void;
  onOpenRecommender?: () => void;
  onOpenAuth?: () => void;
  onStartProject?: (prompt: string) => void;
  isDark?: boolean;
}

const ROTATING_PROMPTS = [
  'What will break first if traffic increases 10x?',
  'Where are the single points of failure under 20k req/s?',
  'How much latency does adding a Redis cache eliminate?',
  'Will our database connection pool exhaust during a spike?',
];

export const NewOne: React.FC<NewOneProps> = ({
  onSelectTestSite,
  onSelectUseRepository,
  onOpenRecommender,
  onStartProject,
  isDark: _isDark,
}) => {
  const [query, setQuery] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Rotate sample architecture questions smoothly
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % ROTATING_PROMPTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const activePlaceholder = ROTATING_PROMPTS[placeholderIndex];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrompt = query.trim() || activePlaceholder;
    if (onStartProject) {
      onStartProject(cleanPrompt);
    } else if (onOpenRecommender) {
      onOpenRecommender();
    }
  };

  const handleSeeHowItWorks = () => {
    const target = document.getElementById('steps-section') || document.getElementById('demo');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full min-h-[calc(100vh-80px)] bg-transparent text-slate-900 dark:text-white flex flex-col items-center justify-between pt-8 sm:pt-14 md:pt-16 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 select-none overflow-hidden font-sans">
      {/* Background Subtle Blueprint Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.45] dark:opacity-[0.25]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(148, 163, 184, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Main 2-Column Split Hero Layout */}
      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center my-auto">
        {/* Left Column: Heading, Subtitle & Primary Actions */}
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          {/* Eyebrow Tag */}
          <div className="inline-flex items-center gap-2 mb-4 sm:mb-5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 ring-4 ring-cyan-400/20" />
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.18em] uppercase text-sky-600 dark:text-sky-400 font-mono">
              Architecture intelligence for teams that scale
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-bold tracking-[-0.035em] text-slate-950 dark:text-white leading-[1.08]">
            Scale your <br />
            system <br />
            before{' '}
            <span className="text-slate-500 dark:text-slate-400 font-bold">
              disaster.
            </span>
          </h1>

          {/* Subheading / Explainer */}
          <p className="mt-5 sm:mt-6 text-base sm:text-lg text-slate-600 dark:text-neutral-400 leading-relaxed max-w-xl font-normal">
            Import your GitHub repository, ask better questions, and see exactly
            how your system behaves under load.
          </p>

          {/* Action Button Row */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-8 sm:mt-9">
            {/* Primary Action: Explore the workspace */}
            <button
              type="button"
              onClick={onSelectTestSite}
              className="px-5 sm:px-6 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs sm:text-sm font-semibold shadow-md shadow-slate-950/10 dark:shadow-none transition-all flex items-center gap-2 cursor-pointer group"
              title="Explore the live simulation playground"
            >
              <span>Explore the workspace</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white dark:text-slate-600 dark:group-hover:text-slate-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </button>

            {/* Secondary Action: See how it works */}
            <button
              type="button"
              onClick={handleSeeHowItWorks}
              className="px-5 sm:px-6 py-3 rounded-xl border border-slate-200/90 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/60 hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-800 dark:text-neutral-200 text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer group"
              title="See walkthrough and interactive steps"
            >
              <span>See how it works</span>
              <Play className="w-3.5 h-3.5 fill-current opacity-70 group-hover:opacity-100 group-hover:text-emerald-500 transition-colors" />
            </button>
          </div>
        </div>

        {/* Right Column: Interactive "Ask your architecture" Card Window */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end w-full relative">
          {/* Faint Architectural Graph Node & Connecting Line (Visible on md+) */}
          <div className="absolute -left-10 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 pointer-events-none z-0">
            <div className="w-4 h-4 rounded-md border border-slate-300 dark:border-neutral-700 bg-white/90 dark:bg-neutral-900 shadow-2xs" />
            <div className="w-6 h-px bg-slate-300 dark:bg-neutral-700" />
          </div>

          {/* Interactive Blueprint Card */}
          <div className="relative z-10 w-full max-w-lg rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-[#0E1117]/95 border border-slate-200/90 dark:border-neutral-800 shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.5)] p-5 sm:p-6 md:p-7 flex flex-col justify-between min-h-[290px] backdrop-blur-xl">
            {/* Window Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-neutral-800/80">
              <div className="flex items-center gap-3">
                {/* 3 macOS style window dots */}
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-neutral-700" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-neutral-700" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-neutral-700" />
                </div>

                {/* Title */}
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-neutral-300">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs font-semibold">Ask your architecture</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>AI ready</span>
              </div>
            </div>

            {/* Window Interactive Input Body */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-center py-6">
              <div className="flex items-start gap-3 w-full">
                <div className="mt-1 p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={activePlaceholder}
                    className="w-full bg-transparent text-base sm:text-lg md:text-xl font-normal text-slate-800 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </form>

            {/* Window Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-neutral-800/80">
              <span className="text-[11.5px] text-slate-400 dark:text-neutral-500">
                Try asking about latency, queues, or database capacity.
              </span>

              {/* Import from GitHub button */}
              <button
                type="button"
                onClick={onSelectUseRepository}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0 group"
                title="Connect repository to auto-discover architecture"
              >
                <Github className="w-3.5 h-3.5" />
                <span>Import from GitHub</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Bottom Video Section Carousel Showcase */}
      {/* <div className="relative z-10 w-full max-w-6xl mt-8 sm:mt-12 px-2 sm:px-4 flex flex-col items-center select-none">
        <VideoCarousel />
      </div> */}
    </section>
  );
};

export default NewOne;
