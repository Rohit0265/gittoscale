import React, { useState } from 'react';
import { Github, ArrowRight, Sparkles } from 'lucide-react';
import { VideoCarousel } from './VideoCarousel';

export interface NewOneProps {
  onSelectTestSite?: () => void;
  onSelectUseRepository?: () => void;
  onOpenRecommender?: () => void;
  onOpenAuth?: () => void;
  onStartProject?: (prompt: string) => void;
  isDark?: boolean;
}

export const NewOne: React.FC<NewOneProps> = ({
  onSelectUseRepository,
  onOpenRecommender,
  onStartProject,
}) => {
  const [query, setQuery] = useState('');

  const handleSuggestionClick = (text: string) => {
    setQuery(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrompt = query.trim() || 'A scalable microservices architecture on cloud with high throughput';
    if (onStartProject) {
      onStartProject(cleanPrompt);
    } else if (onOpenRecommender) {
      onOpenRecommender();
    }
  };

  return (
    <section className="relative w-full min-h-screen bg-black text-white flex flex-col items-center justify-start pt-20 sm:pt-24 md:pt-28 pb-16 px-4 sm:px-6 select-none overflow-hidden font-sans">
      {/* Central Hero Content Container */}
      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center w-full">
        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight text-center">
          Scale your system
          <span className="block mt-1 sm:mt-1.5">
            before{' '}
            <span className="text-red-500 font-extrabold tracking-tight inline-block drop-shadow-[0_0_16px_rgba(239,68,68,0.5)]">
              disaster.
            </span>
          </span>
        </h1>

        {/* Refined AI Prompt Input */}
        <div className="mt-7 sm:mt-9 w-full max-w-xl px-2">
          <form
            onSubmit={handleSubmit}
            className="group relative rounded-full border border-cyan-500/30 hover:border-cyan-500/50 focus-within:border-cyan-400/80 focus-within:ring-2 focus-within:ring-cyan-500/20 shadow-[0_0_24px_rgba(6,182,212,0.12)] transition-all duration-200 bg-[#0c0d12]/95 backdrop-blur-xl"
          >
            <div className="relative flex items-center justify-between w-full rounded-full px-4 sm:px-5 py-2 sm:py-2.5 gap-2 sm:gap-3">
              {/* Left: Refined Sparkles Icon Badge */}
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-950/50 border border-cyan-500/30 shrink-0 text-cyan-400">
                <Sparkles className="w-4 h-4" />
              </div>

              {/* Center: Two-Line Text Area */}
              <div className="flex-1 flex flex-col text-left min-w-0 pr-1">
                <span className="text-xs font-semibold text-white/90 tracking-wide">
                  What&apos;s on your mind?
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe your system or ask a question..."
                  className="w-full bg-transparent text-xs sm:text-sm text-neutral-200 placeholder:text-neutral-500 font-normal focus:outline-hidden pr-2 truncate"
                />
              </div>

              {/* Right: Electric Blue Pill Action Button */}
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wide uppercase shadow-md shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
              >
                <span>GENERATE AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Clean Suggestion Chips */}
          <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 mt-3 text-xs text-neutral-400">
            <span className="text-neutral-500 text-[11px]">Try:</span>
            <button
              type="button"
              onClick={() => handleSuggestionClick('A microservices app on AWS')}
              className="px-2.5 py-0.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] text-neutral-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
            >
              &ldquo;A microservices app on AWS&rdquo;
            </button>
            <span className="text-neutral-600">•</span>
            <button
              type="button"
              onClick={() => handleSuggestionClick('Show scaling before failover')}
              className="px-2.5 py-0.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] text-neutral-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
            >
              &ldquo;Show scaling before failover&rdquo;
            </button>
          </div>

          {/* OR Divider */}
          <div className="flex items-center gap-3 my-3.5 w-full max-w-xs mx-auto">
            <div className="h-px flex-1 bg-neutral-800" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
              OR
            </span>
            <div className="h-px flex-1 bg-neutral-800" />
          </div>

          {/* Sleek Dark Capsule Button: Import GitHub Repo */}
          <button
            type="button"
            onClick={onSelectUseRepository}
            className="flex items-center justify-center gap-2 mx-auto px-5 py-2 rounded-full border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-200 hover:text-white transition-all shadow-sm cursor-pointer group"
          >
            <Github className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform" />
            <span>Import GitHub Repo</span>
          </button>
        </div>
      </div>

      {/* Connected Bottom Video Section Carousel Showcase */}
      <div className="relative z-10 w-full max-w-6xl mt-6 sm:mt-10 px-2 sm:px-4 flex flex-col items-center select-none">
        <VideoCarousel />
      </div>
    </section>
  );
};

export default NewOne;
