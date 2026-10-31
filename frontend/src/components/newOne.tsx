import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  Play,
  Sparkles,
  Github,
  ArrowUp,
  Zap,
  Database,
  Layers,
  ShieldAlert,
} from 'lucide-react';

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

const QUICK_SCENARIOS = [
  { label: '10x Traffic', prompt: 'What will break first if traffic increases 10x?', icon: Zap },
  { label: 'Redis Cache', prompt: 'How much latency does adding a Redis cache eliminate?', icon: Database },
  { label: 'Queue Spike', prompt: 'Where are the single points of failure under 20k req/s?', icon: Layers },
  { label: 'DB Pool', prompt: 'Will our database connection pool exhaust during a spike?', icon: ShieldAlert },
];

export const NewOne: React.FC<NewOneProps> = ({
  onSelectTestSite: _onSelectTestSite,
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

  const triggerQuery = (promptText: string) => {
    if (onStartProject) {
      onStartProject(promptText);
    } else if (onOpenRecommender) {
      onOpenRecommender();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrompt = query.trim() || activePlaceholder;
    triggerQuery(cleanPrompt);
  };

  const handleScenarioClick = (promptText: string) => {
    setQuery(promptText);
    triggerQuery(promptText);
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
        <div className="lg:col-span-7 flex flex-col items-start text-left relative">
          {/* Ambient Lighting Glow Behind Headline */}
          <div className="absolute -top-14 -left-12 w-80 h-80 bg-gradient-to-br from-sky-400/15 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Main Headline */}
          <h1 className="font-lora text-4xl sm:text-5xl md:text-6xl lg:text-[70px] font-bold tracking-[-0.025em] leading-[1.08] select-none">
            <span className="block bg-gradient-to-b from-slate-950 via-slate-900 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent drop-shadow-xs">
              Scale your <br />
              system
            </span>
            <span className="block mt-1">
              <span className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700 dark:from-slate-200 dark:via-slate-300 dark:to-slate-400 bg-clip-text text-transparent">
                before{' '}
              </span>
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-slate-500 via-slate-600 to-slate-400 dark:from-slate-400 dark:via-slate-300 dark:to-slate-500 bg-clip-text text-transparent font-bold">
                  disaster.
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-[2.5px] rounded-full bg-gradient-to-r from-transparent via-cyan-500/50 dark:via-cyan-400/60 to-transparent" />
              </span>
            </span>
          </h1>

          {/* Subheading / Explainer */}
          <p className="font-aleo mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-slate-600 dark:text-neutral-400 leading-relaxed max-w-xl font-normal">
            Import your GitHub repository, ask better questions, and see exactly
            how your system behaves under load.
          </p>

          {/* Action Button Row - Import from GitHub is prominently placed outside the card */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-8 sm:mt-9">
            <button
              type="button"
              onClick={onSelectUseRepository}
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2.5 cursor-pointer group"
              title="Import repository to analyze architecture"
            >
              <Github className="w-4 h-4" />
              <span>Import from GitHub</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform opacity-90" />
            </button>

            {/* Secondary Action: See how it works */}
            <button
              type="button"
              onClick={handleSeeHowItWorks}
              className="px-5 sm:px-6 py-3.5 rounded-xl border border-slate-200/90 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/60 hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-800 dark:text-neutral-200 text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer group"
              title="See walkthrough and interactive steps"
            >
              <span>See how it works</span>
              <Play className="w-3.5 h-3.5 fill-current opacity-70 group-hover:opacity-100 group-hover:text-emerald-500 transition-colors" />
            </button>
          </div>
        </div>

        {/* Right Column: Interactive "Ask your architecture" Card Window */}
        <div className="lg:col-span-5 flex flex-col items-center lg:items-end w-full relative">
          {/* Subtle Ambient Glow Behind Card */}
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/15 via-cyan-500/10 to-indigo-600/15 rounded-3xl blur-2xl pointer-events-none -z-10" />

          {/* Circuit Connector & Node (Visible on md+) */}
          <div className="absolute -left-12 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 pointer-events-none z-0">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-5 h-5 rounded-md bg-cyan-500/20 animate-ping" />
              <div className="w-4 h-4 rounded-md border border-cyan-500/40 bg-white dark:bg-[#0c101d] shadow-xs flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              </div>
            </div>
            <div className="w-8 h-px bg-gradient-to-r from-cyan-500/50 to-slate-300 dark:to-neutral-700" />
          </div>

          {/* Interactive Modern Blueprint Card */}
          <div className="relative z-10 w-full max-w-lg rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-[#0c101d]/90 border border-slate-200/90 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] p-5 sm:p-6 md:p-7 flex flex-col justify-between backdrop-blur-xl transition-all">
            {/* Window Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                {/* 3 macOS style window dots */}
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 dark:bg-rose-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 dark:bg-amber-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 dark:bg-emerald-500/70" />
                </div>

                {/* Title */}
                <div className="flex items-center gap-1.5 text-slate-800 dark:text-neutral-200">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs font-semibold tracking-wide">Ask your architecture</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>AI ready</span>
              </div>
            </div>

            {/* Window Interactive Input Body */}
            <form onSubmit={handleSubmit} className="py-5">
              <div className="relative flex items-center gap-3 px-3.5 sm:px-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#141824]/90 border border-slate-200 dark:border-white/10 focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-inner">
                <div className="text-blue-500 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={activePlaceholder}
                  className="flex-1 min-w-0 bg-transparent text-sm sm:text-base font-normal text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  title="Run scenario question"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Window Footer: Quick Scenarios (Clean tags instead of the import button) */}
            <div className="flex flex-col gap-2.5 pt-4 border-t border-slate-100 dark:border-white/10">
              <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-neutral-500">
                <span>Quick architecture scenarios:</span>
                <span className="hidden sm:inline font-mono text-[10px]">Press Enter ↵</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SCENARIOS.map((scenario) => {
                  const Icon = scenario.icon;
                  return (
                    <button
                      key={scenario.label}
                      type="button"
                      onClick={() => handleScenarioClick(scenario.prompt)}
                      className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-300 dark:hover:border-blue-500/30 text-slate-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer"
                    >
                      <Icon className="w-3 h-3 text-slate-400 dark:text-neutral-400 group-hover:text-blue-500 transition-colors" />
                      <span>{scenario.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Outside the Box: Helper link to import repository */}
          <div className="flex items-center justify-center lg:justify-start w-full max-w-lg mt-3.5 px-2">
            <button
              type="button"
              onClick={onSelectUseRepository}
              className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group"
            >
              <Github className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 group-hover:text-blue-500 transition-colors" />
              <span>Want automated discovery? <span className="underline underline-offset-4 decoration-slate-300 dark:decoration-neutral-700 group-hover:decoration-blue-500">Import your GitHub repository</span></span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewOne;
