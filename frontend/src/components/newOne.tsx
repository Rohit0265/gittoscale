import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowUpRight,
  Play,
  Github,
  ArrowUp,
  Zap,
  Database,
  Layers,
  ShieldCheck,
  GitBranch,
  Plus,
} from 'lucide-react';

export interface NewOneProps {
  onSelectTestSite?: () => void;
  onSelectUseRepository?: () => void;
  onOpenRecommender?: () => void;
  onOpenAuth?: () => void;
  onStartProject?: (prompt: string) => void;
  onStartBlankProject?: () => void;
  isDark?: boolean;
}

const IDEAS = [
  'Design an e-commerce platform with Redis & Kafka...',
  'Text to system design: Build a Netflix streaming fleet...',
  'Design a real-time chat architecture with WebSockets...',
  'Where are the single points of failure under 200k RPS?',
  'Design a global URL shortener with rate limiting...',
  'Cook a low-latency distributed caching layer idea...',
];

const SCENARIO_CHIPS = [
  {
    label: 'Text to Architecture',
    prompt: 'Design an event-driven payment processing system with Kafka and Postgres',
    icon: Layers,
  },
  {
    label: '10x Traffic',
    prompt: 'How do we handle a 10x Traffic Spike without downtime?',
    icon: Zap,
  },
  {
    label: 'Redis Cache',
    prompt: 'Analyze Redis Caching strategies for session persistence',
    icon: Database,
  },
  {
    label: 'Queue Spike',
    prompt: 'Design fault tolerance for queue spikes with SQS and Workers',
    icon: ShieldCheck,
  },
];

export const NewOne: React.FC<NewOneProps> = ({
  onSelectTestSite: _onSelectTestSite,
  onSelectUseRepository,
  onOpenRecommender,
  onStartProject,
  onStartBlankProject,
  isDark,
}) => {
  const isDarkMode = isDark ?? (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
  const [query, setQuery] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Typewriter effect for rotating idea placeholders
  useEffect(() => {
    if (isUserInteracting) return;

    let ideaIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const typeEffect = () => {
      const currentIdea = IDEAS[ideaIndex];

      if (isDeleting) {
        setPlaceholder(currentIdea.substring(0, charIndex - 1));
        charIndex--;
      } else {
        setPlaceholder(currentIdea.substring(0, charIndex + 1));
        charIndex++;
      }

      let typeSpeed = isDeleting ? 30 : 60;

      if (!isDeleting && charIndex === currentIdea.length) {
        typeSpeed = 2200; // Pause at end of phrase
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        ideaIndex = (ideaIndex + 1) % IDEAS.length;
        typeSpeed = 400; // Pause before typing next phrase
      }

      timer = setTimeout(typeEffect, typeSpeed);
    };

    timer = setTimeout(typeEffect, 100);

    return () => clearTimeout(timer);
  }, [isUserInteracting]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = query.trim() || placeholder;
    if (val) {
      if (onStartProject) {
        onStartProject(val);
      } else if (onOpenRecommender) {
        onOpenRecommender();
      }
    }
  };

  const handleSetPrompt = (text: string) => {
    setQuery(text);
    setIsUserInteracting(true);
    inputRef.current?.focus();
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
          <h1 className="font-lora text-4xl sm:text-5xl md:text-6xl lg:text-[70px] font-bold tracking-[-0.025em] leading-[1.08] select-none text-slate-950 dark:text-white">
            <span className="block drop-shadow-xs">
              Scale your <br />
              system
            </span>
            <span className="block mt-1">
              <span className="text-slate-900 dark:text-slate-200">
                before{' '}
              </span>
              <span className="relative inline-block">
                <span className="text-slate-600 dark:text-slate-300 font-bold">
                  disaster.
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-[2.5px] rounded-full bg-cyan-500/50 dark:bg-cyan-400/60" />
              </span>
            </span>
          </h1>

          {/* Subheading / Explainer */}
          <p className="font-aleo mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-slate-700 dark:text-neutral-300 leading-relaxed max-w-xl font-normal">
            Turn text prompts into interactive system architectures or scan your GitHub repository. Simulate traffic, stress-test microservices, and eliminate bottlenecks before production.
          </p>

          {/* Action Button Row */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-8 sm:mt-9">
            {/* Primary Action: Start Blank Project */}
            {onStartBlankProject && (
              <button
                type="button"
                onClick={onStartBlankProject}
                className="px-5 sm:px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-950 text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer group"
                title="Start designing on a blank architecture canvas"
              >
                <Plus className="w-4 h-4 text-slate-300 dark:text-neutral-700 group-hover:text-white dark:group-hover:text-black transition-colors" />
                <span>Start Blank Project</span>
              </button>
            )}

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

        {/* Right Column: Architect AI Card Component */}
        <div className="lg:col-span-5 flex flex-col items-center lg:items-end w-full relative">
          {/* Circuit Connector & Node (Visible on md+) */}
     

          <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
            {/* Architect AI Card Component */}
            <div
              className="w-full rounded-2xl p-6 sm:p-7 border border-slate-200/90 dark:border-neutral-800/80 bg-white/85 dark:bg-[#12141a]/75 transition-all duration-300 hover:border-slate-300 dark:hover:border-neutral-700/80 backdrop-blur-xl"
              style={{
                boxShadow: isDarkMode
                  ? '0 0 0 1px rgba(255, 255, 255, 0.08), 0 20px 50px -10px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 255, 255, 0.015)'
                  : '0 0 0 1px rgba(0, 0, 0, 0.05), 0 20px 45px -12px rgba(15, 23, 42, 0.12), 0 0 25px rgba(99, 102, 241, 0.03)',
              }}
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/80 dark:border-neutral-800/70">
                <div className="flex items-center">
                  <span className="relative font-lora text-sm sm:text-base font-semibold tracking-tight text-slate-900 dark:text-neutral-100 select-none">
                    Text to System Design
                  </span>
                </div>
              </div>

              {/* Input Prompt Box */}
              <form onSubmit={handleSubmit} className="relative group">
                <div
                  className="relative flex items-center bg-slate-50 dark:bg-neutral-900/90 border border-slate-200 dark:border-neutral-800 rounded-xl p-1.5 focus-within:border-indigo-500 dark:focus-within:border-neutral-700 transition-all duration-200"
                  style={{ outline: 'none', boxShadow: 'none' }}
                >
                  <input
                    ref={inputRef}
                    id="prompt-input"
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setIsUserInteracting(true);
                    }}
                    onFocus={() => setIsUserInteracting(true)}
                    onBlur={() => {
                      if (!query.trim()) {
                        setIsUserInteracting(false);
                      }
                    }}
                    className="w-full bg-transparent py-3 px-2 text-sm sm:text-base text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-400 border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus:border-transparent focus-visible:outline-none shadow-none"
                    style={{ outline: 'none', boxShadow: 'none' }}
                    placeholder={placeholder || 'Describe your system idea (e.g. "Design Uber ride-matching at scale")...'}
                    autoComplete="off"
                    aria-label="Describe your system idea for architecture generation"
                  />

                  {/* Submit Action Button */}
                  <button
                    id="submit-btn"
                    type="submit"
                    aria-label="Generate Architecture"
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-950 hover:scale-[1.03] active:scale-[0.97] transition-all duration-150 shadow-md shrink-0 cursor-pointer"
                    title="Analyze Architecture"
                  >
                    <ArrowUp className="w-4 h-4 text-sm font-bold" />
                  </button>
                </div>
              </form>

              {/* Quick Architecture Scenario Chips */}
              <div className="mt-5 pt-1">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-300 mb-3 font-mono">
                  <span className="text-slate-600 dark:text-neutral-300 font-medium">Quick scenarios:</span>
                  <span className="hidden sm:inline text-slate-400 dark:text-neutral-400">
                    Press{' '}
                    <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded text-slate-700 dark:text-neutral-200 font-mono text-[10px]">
                      Enter ↵
                    </kbd>
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {SCENARIO_CHIPS.map((chip) => {
                    const Icon = chip.icon;
                    return (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => handleSetPrompt(chip.prompt)}
                        className="chip-btn min-h-[44px] flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 dark:bg-neutral-900/80 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 text-slate-700 dark:text-neutral-300 text-xs px-3.5 py-2.5 rounded-lg transition-all duration-150 cursor-pointer shadow-2xs"
                      >
                        <Icon className="text-slate-500 dark:text-neutral-300 text-xs w-3.5 h-3.5" />
                        <span>{chip.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Import GitHub Repo Interactive Button / Footer Bar */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between w-full px-3 py-2.5 rounded-xl bg-slate-50/80 dark:bg-neutral-900/40 border border-slate-200/80 dark:border-neutral-800/50 backdrop-blur-md">
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-600 dark:text-neutral-300 mb-2 sm:mb-0">
                <GitBranch className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                <span>Have an existing codebase?</span>
              </div>

              <button
                type="button"
                onClick={onSelectUseRepository}
                className="group min-h-[44px] flex items-center space-x-2.5 bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-700/80 hover:border-slate-300 dark:hover:border-neutral-500 px-4 py-2.5 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-neutral-200 hover:text-slate-900 dark:hover:text-white transition-all duration-200 shadow-xs cursor-pointer"
              >
                <Github className="w-4 h-4 text-base text-slate-700 dark:text-neutral-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                <span className="font-medium">Scan GitHub repository</span>
                <ArrowUpRight className="w-3 h-3 text-[10px] text-slate-400 dark:text-neutral-400 group-hover:text-slate-700 dark:group-hover:text-neutral-200 transition-colors ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewOne;
