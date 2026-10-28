import React, { useState } from 'react';
import { Github } from 'lucide-react';
import { PlaceholdersAndVanishInput } from '@/components/ui/placeholders-and-vanish-input';
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
  const [, setQuery] = useState('');

  const placeholders = [
    "Describe your system architecture or app idea...",
    "How to design an auto-scaling microservices fleet?",
    "Architect an event-driven payment processing pipeline...",
    "What's the best database strategy for 10M active users?",
    "Ask any architecture question or describe what you want to build...",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onOpenRecommender) {
      onOpenRecommender();
    }
  };

  return (
    <section className="relative w-full flex flex-col items-center justify-center py-16 sm:py-24 px-4 sm:px-6 text-center select-none overflow-hidden">
      {/* Background Ambient Glow */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[380px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-amber-500/10 dark:from-indigo-600/15 dark:via-purple-600/15 dark:to-orange-500/10 blur-3xl rounded-full"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center w-full">
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

        {/* Input Box Section using PlaceholdersAndVanishInput */}
        <div className="mt-8 sm:mt-10 w-full max-w-xl">
          <PlaceholdersAndVanishInput
            placeholders={placeholders}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />

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
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-full border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#141416] text-sm font-semibold text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#1c1c20] hover:border-slate-300 dark:hover:border-neutral-700 transition-all shadow-xs cursor-pointer group"
          >
            <Github className="w-4 h-4 text-slate-900 dark:text-white group-hover:scale-110 transition-transform" />
            <span>Import GitHub Repo</span>
          </button>
        </div>

        {/* Infinite 3D Video Carousel (Added after Import button, no timeline) */}
        <div className="mt-14 sm:mt-20 w-full max-w-7xl px-2 sm:px-4 md:px-6">
          <VideoCarousel />
        </div>
      </div>
    </section>
  );
};

export default NewOne;
