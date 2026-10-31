import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowUpRight,
  Play,
  Sparkles,
  Github,
  ArrowUp,
  Zap,
  Database,
  Layers,
  ShieldCheck,
  GitBranch,
} from 'lucide-react';

export interface NewOneProps {
  onSelectTestSite?: () => void;
  onSelectUseRepository?: () => void;
  onOpenRecommender?: () => void;
  onOpenAuth?: () => void;
  onStartProject?: (prompt: string) => void;
  isDark?: boolean;
}

const IDEAS = [
  'Cook your next big system architecture...',
  'Share your architecture idea or blueprint...',
  'Where are the single points of failure under 200k RPS?',
  'How should we scale microservices for event streaming?',
  'Cook a low-latency caching layer idea...',
];

const SCENARIO_CHIPS = [
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
    icon: Layers,
  },
  {
    label: 'DB Pool',
    prompt: 'Optimize DB Connection Pooling under heavy concurrent writes',
    icon: ShieldCheck,
  },
];

export const NewOne: React.FC<NewOneProps> = ({
  onSelectTestSite: _onSelectTestSite,
  onSelectUseRepository,
  onOpenRecommender,
  onStartProject,
  isDark: _isDark,
}) => {
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

          {/* Action Button Row */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-8 sm:mt-9">

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
          <div className="absolute -left-12 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 pointer-events-none z-0">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-5 h-5 rounded-md bg-cyan-500/20 animate-ping" />
              <div className="w-4 h-4 rounded-md border border-cyan-500/40 bg-white dark:bg-[#0c101d] shadow-xs flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              </div>
            </div>
            <div className="w-8 h-px bg-gradient-to-r from-cyan-500/50 to-neutral-700" />
          </div>

          <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
            {/* Architect AI Card Component */}
            <div
              className="w-full rounded-2xl p-6 sm:p-7 border border-neutral-800/80 transition-all duration-300 hover:border-neutral-700/80"
              style={{
                background: 'rgba(18, 20, 26, 0.75)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow:
                  '0 0 0 1px rgba(255, 255, 255, 0.08), 0 20px 50px -10px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 255, 255, 0.015)',
              }}
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-5 mb-5 border-b border-neutral-800/80">
                {/* Window Control Dots & Title */}
                <div className="flex items-center space-x-3.5">
                  <div className="flex items-center space-x-2 text-neutral-200 font-medium tracking-tight text-sm sm:text-base">
                    <span>Cook what's in your mind</span>
                  </div>
                </div>

              
              </div>

              {/* Input Prompt Box */}
              <form onSubmit={handleSubmit} className="relative group">
                <div
                  className="relative flex items-center bg-neutral-900/90 border border-neutral-800 rounded-xl p-1.5 focus-within:border-neutral-700 transition-all duration-200"
                  style={{ outline: 'none', boxShadow: 'none' }}
                >
                  <div className="pl-3.5 pr-2 text-neutral-400 group-focus-within:text-white transition-colors">
                    <Sparkles className="w-4 h-4 text-base" />
                  </div>

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
                    className="w-full bg-transparent py-3 px-2 text-sm sm:text-base text-neutral-100 placeholder-neutral-500 border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus:border-transparent focus-visible:outline-none shadow-none"
                    style={{ outline: 'none', boxShadow: 'none' }}
                    placeholder={placeholder || 'Share your architecture idea or cook a concept...'}
                    autoComplete="off"
                  />

                  {/* Off-white / Dark Charcoal Action Button */}
                  <button
                    id="submit-btn"
                    type="submit"
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 hover:scale-[1.03] active:scale-[0.97] transition-all duration-150 shadow-md shrink-0 cursor-pointer"
                    title="Analyze Architecture"
                  >
                    <ArrowUp className="w-4 h-4 text-sm font-bold" />
                  </button>
                </div>
              </form>

              {/* Quick Architecture Scenario Chips */}
              <div className="mt-5 pt-1">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-3 font-mono">
                  <span className="text-neutral-500">Quick architecture scenarios:</span>
                  <span className="hidden sm:inline text-neutral-600">
                    Press{' '}
                    <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-300 font-mono text-[10px]">
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
                        className="chip-btn flex items-center space-x-2 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-xs px-3 py-2 rounded-lg transition-all duration-150 cursor-pointer"
                      >
                        <Icon className="text-neutral-400 text-xs w-3 h-3" />
                        <span>{chip.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Import GitHub Repo Interactive Button / Footer Bar */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between w-full px-3 py-2.5 rounded-xl bg-neutral-900/40 border border-neutral-800/50 backdrop-blur-md">
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-neutral-400 mb-2 sm:mb-0">
                <GitBranch className="w-4 h-4 text-neutral-500" />
                <span>Want automated discovery?</span>
              </div>

              <button
                type="button"
                onClick={onSelectUseRepository}
                className="group flex items-center space-x-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 hover:border-neutral-500 px-4 py-2 rounded-lg text-xs sm:text-sm text-neutral-200 hover:text-white transition-all duration-200 shadow-xs cursor-pointer"
              >
                <Github className="w-4 h-4 text-base text-neutral-300 group-hover:text-white transition-colors" />
                <span className="font-medium">Import GitHub repository</span>
                <ArrowUpRight className="w-3 h-3 text-[10px] text-neutral-500 group-hover:text-neutral-300 transition-colors ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewOne;
