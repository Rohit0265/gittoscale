import React, { useState } from 'react';
import { Github, ArrowRight, Sparkles } from 'lucide-react';

export interface NewOneProps {
  onSelectTestSite?: () => void;
  onSelectUseRepository?: () => void;
  onOpenRecommender?: () => void;
  onOpenAuth?: () => void;
  isDark?: boolean;
}

export const NewOne: React.FC<NewOneProps> = ({
  onSelectUseRepository,
  onOpenRecommender,
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Trigger architecture recommender or action with query
    if (onOpenRecommender) {
      onOpenRecommender();
    }
  };

  return (
    <section className="relative w-full flex flex-col items-center justify-center py-20 sm:py-28 px-4 sm:px-6 text-center select-none overflow-hidden">
      {/* Background Ambient Glow */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[340px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-amber-500/10 dark:from-indigo-600/15 dark:via-purple-600/15 dark:to-orange-500/10 blur-3xl rounded-full"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
        {/* Main Hero Heading */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.08]">
          Scale your system{' '}
          <span className="block text-slate-500 dark:text-neutral-400 font-extrabold mt-1 sm:mt-2">
            before disaster.
          </span>
        </h1>

        {/* Small Sub-line */}
        <p className="mt-4 sm:mt-6 text-base sm:text-lg font-medium text-slate-600 dark:text-neutral-400 tracking-tight">
          What&apos;s on your mind?
        </p>

        {/* Input Box Section */}
        <div className="mt-8 sm:mt-10 w-full max-w-xl">
          <form
            onSubmit={handleSubmit}
            className="group relative flex items-center w-full rounded-2xl dark:border-neutral-800 bg-white/90 dark:bg-[#121214]/90 p-2 shadow-lg shadow-slate-200/50 dark:shadow-black/50 backdrop-blur-md transition-all duration-200 "
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe your idea ......."
              className="w-full bg-transparent px-2 py-2 text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-hidden"
            />

            <button
              type="submit"
              disabled={!query.trim()}
              className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-neutral-950 hover:bg-slate-800 dark:hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-slate-900 dark:disabled:hover:bg-white transition-all cursor-pointer disabled:cursor-not-allowed shrink-0 shadow-xs"
              aria-label="Submit"
            >
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </form>

          {/* OR Divider */}
          <div className="flex items-center gap-4 my-5 sm:my-6 w-full">
            <div className="h-px flex-1 bg-slate-200 dark:bg-neutral-800" />
            <span className="text-xs uppercase font-semibold tracking-wider text-slate-400 dark:text-neutral-500">
              or
            </span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-neutral-800" />
          </div>

          {/* Import GitHub Repo Option */}
          <button
            type="button"
            onClick={onSelectUseRepository}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#141416] text-sm font-semibold text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#1c1c20] hover:border-slate-300 dark:hover:border-neutral-700 transition-all shadow-xs cursor-pointer group"
          >
            <Github className="w-4 h-4 text-slate-900 dark:text-white group-hover:scale-110 transition-transform" />
            <span>Import GitHub Repo</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default NewOne;
