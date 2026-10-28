import React, { useState } from 'react';
import { Github, ArrowRight, Sparkles } from 'lucide-react';
import { VideoCarousel } from './VideoCarousel';

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

  const handleSuggestionClick = (text: string) => {
    setQuery(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onOpenRecommender) {
      onOpenRecommender();
    }
  };

  return (
    <section className="relative w-full min-h-screen bg-[#050506] text-white flex flex-col items-center justify-start pt-24 sm:pt-32 md:pt-36 pb-16 px-4 sm:px-6 select-none overflow-hidden font-sans">
      {/* 1. Volumetric Blue Atmospheric Glow Aura in Center */}
      <div
        className="pointer-events-none absolute top-[-40px] left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-blue-700/25 via-indigo-600/15 to-transparent blur-[140px] rounded-full"
        aria-hidden="true"
      />

      {/* 2. Left Illustration: 3D Wireframe Server + Ladder + Stickman */}
      <div className="pointer-events-none hidden lg:block absolute left-2 xl:left-8 top-[200px] xl:top-[230px] w-[260px] xl:w-[290px] z-0 select-none">
        <img
          src="/hero-left-server.png"
          alt="Server wireframe diagram with stickman climbing"
          className="w-full h-auto object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.08)]"
          draggable={false}
        />
      </div>

      {/* 3. Right Illustration: 3D Wireframe Database on Fire + Running Stickman with Bucket */}
      <div className="pointer-events-none hidden lg:block absolute right-2 xl:right-8 top-[200px] xl:top-[230px] w-[250px] xl:w-[280px] z-0 select-none">
        <img
          src="/hero-right-db.png"
          alt="Database on fire with stickman running with water bucket"
          className="w-full h-auto object-contain filter drop-shadow-[0_0_20px_rgba(249,115,22,0.2)]"
          draggable={false}
        />
      </div>

      {/* 4. Central Hero Content Container */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center w-full">
        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.08] text-center drop-shadow-[0_0_30px_rgba(255,255,255,0.12)]">
          Scale your system
          <span className="block mt-1 sm:mt-2">
            before{' '}
            <span className="inline-block relative align-baseline">
              <img
                src="/hero-disaster-text.png"
                alt="disaster."
                className="inline-block h-[0.92em] w-auto object-contain align-baseline -ml-1 filter drop-shadow-[0_0_16px_rgba(239,68,68,0.7)]"
                draggable={false}
              />
            </span>
          </span>
        </h1>

        {/* 5. Consolidated AI Prompt Input (The Focal Centerpiece) */}
        <div className="mt-8 sm:mt-11 w-full max-w-2xl px-2">
          <form
            onSubmit={handleSubmit}
            className="group relative p-[1.5px] rounded-full bg-gradient-to-r from-[#22d3ee] via-[#3b82f6] to-[#a855f7] shadow-[0_0_35px_rgba(34,211,238,0.32),0_0_60px_rgba(168,85,247,0.32)] transition-all duration-300 hover:shadow-[0_0_45px_rgba(34,211,238,0.45),0_0_70px_rgba(168,85,247,0.42)]"
          >
            <div className="relative flex items-center justify-between w-full rounded-full bg-[#08090d] px-4 sm:px-6 py-2.5 sm:py-3.5 gap-2 sm:gap-3">
              {/* Left: Pencil & Sparkle Icon Badge */}
              <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/15 bg-white/5 shrink-0 text-white shadow-inner">
                <span className="text-base sm:text-lg select-none">✏️</span>
              </div>

              {/* Center: Two-Line Text Area */}
              <div className="flex-1 flex flex-col text-left min-w-0 pr-1">
                <span className="text-xs sm:text-sm font-bold text-white tracking-normal">
                  What&apos;s on your mind?
                </span>
                <div className="relative flex items-center w-full">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Describe your system or ask a question..."
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-200 placeholder-neutral-500 font-normal focus:outline-hidden pr-2 truncate"
                  />
                  {!query && (
                    <span
                      className="text-neutral-400 text-sm font-light select-none pointer-events-none"
                      style={{ marginLeft: '-4px' }}
                    >
                      |
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Electric Blue Action Button */}
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] hover:from-[#2563eb] hover:to-[#60a5fa] text-white font-extrabold text-[11px] sm:text-xs tracking-wider uppercase shadow-[0_0_24px_rgba(37,99,235,0.7)] transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 border border-blue-400/40"
              >
                <span>GENERATE AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Suggestion Chips */}
          <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 mt-3.5 text-xs text-neutral-400">
            <span className="text-neutral-500">Try:</span>
            <button
              type="button"
              onClick={() => handleSuggestionClick('A microservices app on AWS')}
              className="hover:text-cyan-400 transition-colors cursor-pointer text-neutral-300 font-medium"
            >
              &ldquo;A microservices app on AWS&rdquo;
            </button>
            <span className="text-neutral-600">•</span>
            <button
              type="button"
              onClick={() => handleSuggestionClick('Show scaling before failover')}
              className="hover:text-cyan-400 transition-colors cursor-pointer text-neutral-300 font-medium"
            >
              &ldquo;Show scaling before failover&rdquo;
            </button>
          </div>

          {/* OR Divider */}
          <div className="flex items-center gap-3 my-4 sm:my-5 w-full max-w-xs mx-auto">
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
            className="flex items-center justify-center gap-2 mx-auto px-7 py-2.5 rounded-full border border-neutral-800 bg-[#0d0d12] hover:bg-[#15151e] hover:border-neutral-700 text-xs sm:text-sm font-semibold text-neutral-200 transition-all shadow-md cursor-pointer group"
          >
            <Github className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
            <span>Import GitHub Repo</span>
          </button>
        </div>

        {/* 6. Connecting Ground Wire Image (Draped between Server and DB) */}
        <div className="pointer-events-none relative w-full max-w-4xl -mt-5 mb-2 hidden md:block select-none opacity-85">
          <img
            src="/hero-cable-wire.png"
            alt="Connecting cable diagram"
            className="w-full h-auto object-contain"
            draggable={false}
          />
        </div>
      </div>

      {/* 7. Connected Video Section Carousel Showcase at the Bottom */}
      <div className="relative z-10 w-full max-w-7xl mt-4 sm:mt-6 px-2 sm:px-4 md:px-6 flex flex-col items-center select-none">
        <VideoCarousel />

        {/* Bottom Right 4-Point Star Sparkle Accent */}
        <div className="absolute right-6 -top-4 text-neutral-400/80 pointer-events-none hidden sm:block">
          <Sparkles className="w-8 h-8 text-slate-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
        </div>
      </div>
    </section>
  );
};

export default NewOne;
