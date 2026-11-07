import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowUp,
  GitBranch,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface StartProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPrompt: (prompt: string) => void;
  onOpenImportRepo: () => void;
  onGoHome?: () => void;
  isDark?: boolean;
}

const IDEAS = [
  'Distributed event-driven architecture with Kafka and Go workers...',
  'High-throughput API gateway with Redis rate limiting and PostgreSQL...',
  'Resilient message queue architecture for asynchronous order processing...',
  'Microservices architecture for multi-region financial transactions...',
  'Low-latency caching topology for global session persistence...',
];

const SCENARIO_CHIPS = [
  {
    label: '10x Traffic Spike',
    prompt: 'How do we handle a 10x Traffic Spike without downtime?',
  },
  {
    label: 'Redis Caching',
    prompt: 'Analyze Redis Caching strategies for session persistence',
  },
  {
    label: 'Queue Tolerance',
    prompt: 'Design fault tolerance for queue spikes with SQS and Workers',
  },
  {
    label: 'DB Connection Pool',
    prompt: 'Optimize DB Connection Pooling under heavy concurrent writes',
  },
];

export const StartProjectModal: React.FC<StartProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmitPrompt,
  onOpenImportRepo,
  onGoHome: _onGoHome,
  isDark,
}) => {
  const isDarkMode = isDark ?? (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
  const [query, setQuery] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [useMercury, setUseMercury] = useState(() => {
    try {
      return localStorage.getItem('gitoscale_preferred_ai_provider') === 'mercury';
    } catch {
      return false;
    }
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleMercury = () => {
    setUseMercury((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('gitoscale_preferred_ai_provider', next ? 'mercury' : 'auto');
        const existingConfigStr = localStorage.getItem('gitoscale_mercury_config');
        const existingConfig = existingConfigStr ? JSON.parse(existingConfigStr) : {};
        localStorage.setItem(
          'gitoscale_mercury_config',
          JSON.stringify({
            ...existingConfig,
            enabled: next,
            baseUrl: existingConfig.baseUrl || 'https://api.inceptionlabs.ai/v1',
            model: existingConfig.model || 'mercury-3',
          })
        );
      } catch {}
      return next;
    });
  };

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
          {/* Close button outside */}
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-9 right-0 p-1.5 text-slate-400 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Main Card */}
          <div
            className="w-full rounded-2xl pt-5 pb-6 px-6 sm:pt-6 sm:pb-7 sm:px-7 border border-slate-200 dark:border-neutral-800/80 bg-white dark:bg-[#12141a]/95 text-slate-800 dark:text-gray-200 backdrop-blur-xl shadow-2xl relative"
            style={{
              boxShadow: isDarkMode
                ? '0 0 0 1px rgba(255, 255, 255, 0.08), 0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 40px rgba(255, 255, 255, 0.02)'
                : '0 0 0 1px rgba(0, 0, 0, 0.06), 0 25px 50px -12px rgba(15, 23, 42, 0.2), 0 0 30px rgba(99, 102, 241, 0.04)',
            }}
          >
            {/* Description Subtext & Engine Toggle */}
            <div className="flex items-center justify-between mb-4 gap-2">
              <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 font-sans leading-relaxed">
                Enter a prompt for your system idea or import an existing repository to start simulating load and bottlenecks.
              </p>
              <button
                type="button"
                onClick={toggleMercury}
                className={`shrink-0 flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-medium border transition-colors cursor-pointer ${
                  useMercury
                    ? 'bg-slate-200 dark:bg-neutral-800 border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-neutral-100'
                    : 'bg-slate-100 dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
                }`}
                title={useMercury ? 'Mercury-3 Active' : 'Click to toggle Engine'}
              >
                <span>{useMercury ? 'Model: Mercury-3' : 'Model: Auto'}</span>
              </button>
            </div>

            {/* Input Prompt Box */}
            <form onSubmit={handleSubmit} className="relative group">
              <div className="relative flex items-center bg-slate-50 dark:bg-neutral-900/95 border border-slate-200 dark:border-neutral-800 rounded-xl p-1.5 focus-within:border-indigo-500 dark:focus-within:border-neutral-600 focus-within:ring-1 focus-within:ring-indigo-500/30 dark:focus-within:ring-neutral-600 transition-all duration-200">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setIsUserInteracting(true);
                  }}
                  onFocus={() => setIsUserInteracting(true)}
                  placeholder={placeholder || 'Describe your system architecture requirements...'}
                  className="w-full bg-transparent py-3 px-3 text-sm sm:text-base text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none"
                  autoComplete="off"
                />

                <button
                  type="submit"
                  disabled={!query.trim() && !placeholder}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-950 transition-colors shadow-xs shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Generate Architecture"
                >
                  <ArrowUp className="w-4 h-4 font-bold" />
                </button>
              </div>
            </form>

            {/* Quick Architecture Scenario Chips */}
            <div className="mt-5 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 mb-2.5 font-mono">
                <span className="text-slate-600 dark:text-neutral-500 font-medium">Quick architecture scenarios:</span>
                <span className="hidden sm:inline text-slate-400 dark:text-neutral-600">
                  Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded text-slate-700 dark:text-neutral-300">Enter ↵</kbd>
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {SCENARIO_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleChipClick(chip.prompt)}
                    className="flex items-center bg-slate-50 hover:bg-slate-100 dark:bg-neutral-900/80 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 text-slate-700 dark:text-neutral-300 text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Import GitHub Repo Bar */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between w-full px-4 py-3 rounded-xl bg-slate-50/90 dark:bg-neutral-900/60 border border-slate-200/90 dark:border-neutral-800/60 backdrop-blur-md text-slate-700 dark:text-gray-200">
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mb-2.5 sm:mb-0">
              <GitBranch className="w-4 h-4 text-slate-500 dark:text-neutral-500" />
              <span>Want automated discovery from code?</span>
            </div>

            <button
              type="button"
              onClick={handleImportRepoClick}
              className="group flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-slate-700/80 hover:border-slate-600 dark:border-neutral-700/80 dark:hover:border-neutral-600 text-xs px-3.5 py-2 rounded-lg transition-all duration-150 cursor-pointer shadow-xs"
            >
              <span>Import GitHub Repo</span>
              <span className="text-slate-300 dark:text-neutral-400 group-hover:text-white transition-colors">→</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

