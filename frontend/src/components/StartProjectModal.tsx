import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowUp,
  Zap,
  Database,
  Layers,
  ShieldCheck,
  GitBranch,
  X,
  Wand2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface StartProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPrompt: (prompt: string) => void;
  onOpenImportRepo: () => void;
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

export const StartProjectModal: React.FC<StartProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmitPrompt,
  onOpenImportRepo,
  isDark: _isDark,
}) => {
  const [query, setQuery] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Typewriter effect for rotating placeholder
  useEffect(() => {
    if (!isOpen || isUserInteracting) return;

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
        typeSpeed = 2200;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        ideaIndex = (ideaIndex + 1) % IDEAS.length;
        typeSpeed = 400;
      }

      timer = setTimeout(typeEffect, typeSpeed);
    };

    timer = setTimeout(typeEffect, 100);
    return () => clearTimeout(timer);
  }, [isOpen, isUserInteracting]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = query.trim() || placeholder;
    if (val) {
      onSubmitPrompt(val);
      onClose();
    }
  };

  const handleChipClick = (prompt: string) => {
    setQuery(prompt);
    setIsUserInteracting(true);
    onSubmitPrompt(prompt);
    onClose();
  };

  const handleImportRepoClick = () => {
    onClose();
    onOpenImportRepo();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-2xl mx-auto flex flex-col items-center"
        >
          {/* Main Card */}
          <div
            className="w-full rounded-2xl p-6 sm:p-7 border border-neutral-800/80 bg-[#12141a]/95 text-gray-200 backdrop-blur-xl shadow-2xl relative"
            style={{
              boxShadow:
                '0 0 0 1px rgba(255, 255, 255, 0.08), 0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 40px rgba(255, 255, 255, 0.02)',
            }}
          >
            {/* Header Bar */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-neutral-800/80">
              <div className="flex items-center space-x-3.5">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                </div>
                <div className="h-4 w-[1px] bg-neutral-800"></div>
                <div className="flex items-center space-x-2 text-neutral-200 font-medium tracking-tight text-sm sm:text-base">
                  <Wand2 className="w-4 h-4 text-neutral-400" />
                  <span className="font-lora">Start Your Architecture</span>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="flex items-center space-x-2 bg-neutral-900/90 border border-neutral-800 px-2.5 py-1 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-mono font-medium text-emerald-400 tracking-wide">
                    AI Ready
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Description Subtext */}
            <p className="text-xs sm:text-sm text-neutral-400 mb-4 font-sans leading-relaxed">
              Enter your system concept or load an existing GitHub repo to run live load and failure simulations.
            </p>

            {/* Input Prompt Box */}
            <form onSubmit={handleSubmit} className="relative group">
              <div className="relative flex items-center bg-neutral-900/95 border border-neutral-800 rounded-xl p-1.5 focus-within:border-neutral-600 focus-within:ring-1 focus-within:ring-neutral-600 transition-all duration-200">
                <div className="pl-3.5 pr-2 text-neutral-400 group-focus-within:text-white transition-colors">
                  <Sparkles className="w-4 h-4" />
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setIsUserInteracting(true);
                  }}
                  onFocus={() => setIsUserInteracting(true)}
                  placeholder={placeholder || 'Share your architecture idea or cook a concept...'}
                  className="w-full bg-transparent py-3 px-2 text-sm sm:text-base text-neutral-100 placeholder-neutral-500 focus:outline-none"
                  autoComplete="off"
                />

                <button
                  type="submit"
                  disabled={!query.trim() && !placeholder}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 hover:scale-[1.03] active:scale-[0.97] transition-all duration-150 shadow-md shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Generate Architecture"
                >
                  <ArrowUp className="w-4 h-4 font-bold" />
                </button>
              </div>
            </form>

            {/* Quick Architecture Scenario Chips */}
            <div className="mt-5 pt-1">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-2.5 font-mono">
                <span className="text-neutral-500">Quick architecture scenarios:</span>
                <span className="hidden sm:inline text-neutral-600">
                  Press <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-300">Enter ↵</kbd>
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {SCENARIO_CHIPS.map((chip) => {
                  const Icon = chip.icon;
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleChipClick(chip.prompt)}
                      className="flex items-center space-x-2 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-xs px-3 py-2 rounded-lg transition-all duration-150 cursor-pointer group"
                    >
                      <Icon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-400 transition-colors" />
                      <span>{chip.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Import GitHub Repo Bar */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between w-full px-4 py-3 rounded-xl bg-neutral-900/60 border border-neutral-800/60 backdrop-blur-md text-gray-200">
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-neutral-400 mb-2.5 sm:mb-0">
              <GitBranch className="w-4 h-4 text-neutral-500" />
              <span>Want automated discovery from code?</span>
            </div>

            <button
              type="button"
              onClick={handleImportRepoClick}
              className="group flex items-center space-x-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/80 hover:border-neutral-600 text-white text-xs px-3.5 py-2 rounded-lg transition-all duration-150 cursor-pointer shadow-xs"
            >
              <span>Import GitHub Repo</span>
              <span className="text-neutral-400 group-hover:text-white transition-colors">→</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

