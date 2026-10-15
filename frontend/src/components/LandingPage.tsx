import React from 'react';
import { Play, ArrowRight, Sun, Moon, Github } from 'lucide-react';
import { HeroArchitectureDiagram } from './HeroArchitectureDiagram';
import { Fotter } from './Fotter';

interface LandingPageProps {
  onSelectTestSite: () => void;
  onSelectUseRepository: () => void;
  children?: React.ReactNode;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectTestSite,
  onSelectUseRepository,
  children,
  isDark = false,
  onToggleTheme,
}) => {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-[#0A0A0A] flex flex-col text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-200/80 dark:border-neutral-800 bg-white/90 dark:bg-[#0A0A0A]/90 backdrop-blur px-4 sm:px-6 md:px-8 flex items-center justify-between shadow-xs transition-colors w-full">
        <div className="flex items-center gap-3">
          <img
            src={isDark ? '/logo.png' : '/logo-light.png'}
            alt="GitToScale"
            className="h-8 sm:h-9 md:h-10 w-auto object-contain cursor-pointer"
          />
        </div>
        <div className="flex items-center gap-3">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#141414] hover:text-slate-900 dark:hover:text-white transition-all shadow-xs cursor-pointer flex items-center justify-center"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="min-h-[72vh] w-full flex flex-col justify-center relative py-8 sm:py-12 lg:py-16">
        <div className="max-w-[1340px] mx-auto w-full px-4 sm:px-8 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12 lg:gap-14 my-auto">
          {/* Left Column: Headline, Subtitle, and Action Buttons */}
          <div className="flex-1 max-w-xl lg:max-w-2xl text-left flex flex-col items-start w-full">
            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-black tracking-tight text-slate-900 dark:text-white leading-[1.08] sm:leading-[1.05] mb-4 sm:mb-5">
              Scale your system{' '}
              <span className="block text-slate-500 dark:text-neutral-400 font-extrabold">
                before disaster.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 dark:text-neutral-400 leading-relaxed mb-6 sm:mb-9 max-w-xl">
              Import your GitHub repository and instantly analyze your architecture, discover bottlenecks, and understand how your system behaves under load.
            </p>

            {/* Action Button Group */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={onSelectUseRepository}
                className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-950 shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer group w-full sm:w-auto"
              >
                <Github className="w-5 h-5 fill-current" />
                <span>Import Repository</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onSelectTestSite}
                className="px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base border border-slate-300 dark:border-neutral-800 bg-white dark:bg-[#141414] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#1e1e1e] hover:text-slate-900 dark:hover:text-white shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer group w-full sm:w-auto"
              >
                <Play className="w-4 h-4 fill-current opacity-80" />
                <span>Open Test Site</span>
              </button>
            </div>
          </div>

          {/* Right Column: Visual Architecture Flow Diagram (Non-Clickable) */}
          <div className="flex-1 w-full max-w-2xl lg:max-w-3xl flex items-center justify-center lg:justify-end">
            <HeroArchitectureDiagram />
          </div>
        </div>
      </main>

      {/* Optional Injected Content (ScrollTimeline, etc.) */}
      {children}

      {/* Global Footer */}
      <Fotter brandName="GitToScale" isDark={isDark} />
    </div>
  );
};
