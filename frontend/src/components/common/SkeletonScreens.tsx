import React from 'react';
import { SkeletonCanvas } from '../ProjectWorkspace/SkeletonCanvas';

/**
 * Common base Shimmer Block
 */
export const ShimmerBlock: React.FC<{
  className?: string;
  style?: React.CSSProperties;
}> = ({ className = '', style }) => (
  <div
    style={style}
    className={`bg-slate-200/80 dark:bg-neutral-800/80 rounded-md skeleton-shimmer-layer animate-pulse ${className}`}
  />
);

/**
 * 1. AppWorkspaceSkeleton
 * Full-screen skeleton matching the main GitOScale Simulator Workspace:
 * - Header
 * - Metrics Strip
 * - Left AI Chat Sidebar
 * - Center Canvas with node skeletons
 * - Right Tabbed Inspector Sidebar
 */
export const AppWorkspaceSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark = false }) => {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#090B10] font-sans select-none">
      {/* 1. Header Skeleton */}
      <header className="h-14 border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ShimmerBlock className="w-7 h-7 rounded-lg" />
            <ShimmerBlock className="w-24 h-5 rounded" />
          </div>
          <div className="h-4 w-px bg-slate-200 dark:bg-neutral-800 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2">
            <ShimmerBlock className="w-32 h-7 rounded-lg" />
            <ShimmerBlock className="w-20 h-7 rounded-lg" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ShimmerBlock className="w-24 h-7 rounded-lg hidden md:block" />
          <ShimmerBlock className="w-20 h-7 rounded-lg hidden sm:block" />
          <ShimmerBlock className="w-8 h-8 rounded-lg" />
          <ShimmerBlock className="w-8 h-8 rounded-full" />
        </div>
      </header>

      {/* 2. Metrics Strip Skeleton */}
      <div className="h-16 border-b border-slate-200/90 dark:border-neutral-800/90 bg-white/70 dark:bg-[#0A0A0A]/70 backdrop-blur-md px-4 flex items-center gap-4 overflow-x-hidden shrink-0">
        {[
          'Incoming Traffic',
          'System Throughput',
          'P99 Latency',
          'Error Rate',
          'Monthly Cost',
        ].map((_, idx) => (
          <div
            key={idx}
            className="flex-1 min-w-[130px] h-11 bg-slate-100/80 dark:bg-[#121214]/80 border border-slate-200/60 dark:border-neutral-800/60 rounded-xl px-3 py-1.5 flex items-center justify-between"
          >
            <div className="space-y-1">
              <ShimmerBlock className="w-16 h-2.5 rounded" />
              <ShimmerBlock className="w-12 h-3.5 rounded" />
            </div>
            <ShimmerBlock className="w-10 h-5 rounded-md" />
          </div>
        ))}
      </div>

      {/* 3. Three-Section Workspace Skeleton */}
      <div className="flex flex-1 overflow-hidden relative w-full h-full">
        {/* Full Canvas with Architecture Diagram Skeleton */}
        <main className="w-full h-full absolute inset-0 overflow-hidden bg-slate-50 dark:bg-[#090B10]">
          <SkeletonCanvas viewMode="basic" isDark={isDark} />
        </main>

        {/* Left Floating Sidebar Skeleton (AI Architect Chat) */}
        <div className="hidden md:flex absolute left-3 top-3 bottom-3 w-[340px] z-20 pointer-events-none">
          <div className="w-full h-full bg-white/95 dark:bg-[#0E1017]/95 border border-slate-200 dark:border-neutral-800/90 rounded-2xl shadow-xl flex flex-col p-4 justify-between pointer-events-auto backdrop-blur-md">
            {/* Sidebar Top Title */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800/70">
              <div className="flex items-center gap-2">
                <ShimmerBlock className="w-5 h-5 rounded-md" />
                <ShimmerBlock className="w-28 h-4 rounded" />
              </div>
              <ShimmerBlock className="w-6 h-6 rounded-md" />
            </div>

            {/* Mock Message Bubbles */}
            <div className="flex-1 py-4 space-y-4 overflow-hidden">
              <div className="flex gap-2.5">
                <ShimmerBlock className="w-6 h-6 rounded-full shrink-0" />
                <div className="space-y-1.5 max-w-[80%]">
                  <ShimmerBlock className="w-48 h-3 rounded" />
                  <ShimmerBlock className="w-36 h-3 rounded" />
                </div>
              </div>

              <div className="flex gap-2.5 justify-end">
                <div className="space-y-1.5 max-w-[80%] items-end flex flex-col">
                  <ShimmerBlock className="w-44 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/40" />
                </div>
              </div>

              <div className="flex gap-2.5">
                <ShimmerBlock className="w-6 h-6 rounded-full shrink-0" />
                <div className="space-y-2 max-w-[85%] w-full">
                  <ShimmerBlock className="w-full h-3 rounded" />
                  <ShimmerBlock className="w-4/5 h-3 rounded" />
                  <ShimmerBlock className="w-3/5 h-3 rounded" />
                  <div className="pt-2 flex gap-1.5 flex-wrap">
                    <ShimmerBlock className="w-20 h-6 rounded-full" />
                    <ShimmerBlock className="w-24 h-6 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Prompt Input Box Skeleton */}
            <div className="pt-2 border-t border-slate-100 dark:border-neutral-800/70">
              <ShimmerBlock className="w-full h-11 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Right Floating Sidebar Skeleton (Inspector / Bottlenecks) */}
        <div className="hidden lg:flex absolute right-3 top-3 bottom-3 w-[340px] z-20 pointer-events-none">
          <div className="w-full h-full bg-white/95 dark:bg-[#0E1017]/95 border border-slate-200 dark:border-neutral-800/90 rounded-2xl shadow-xl flex flex-col p-4 justify-between pointer-events-auto backdrop-blur-md">
            {/* Tabs */}
            <div className="flex gap-2 pb-3 border-b border-slate-100 dark:border-neutral-800/70">
              <ShimmerBlock className="flex-1 h-8 rounded-lg" />
              <ShimmerBlock className="flex-1 h-8 rounded-lg" />
              <ShimmerBlock className="flex-1 h-8 rounded-lg" />
            </div>

            {/* Card list */}
            <div className="flex-1 py-4 space-y-3 overflow-hidden">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border border-slate-100 dark:border-neutral-800/60 bg-slate-50/80 dark:bg-[#14161F]/80 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShimmerBlock className="w-4 h-4 rounded" />
                      <ShimmerBlock className="w-24 h-3.5 rounded" />
                    </div>
                    <ShimmerBlock className="w-12 h-4 rounded-full" />
                  </div>
                  <ShimmerBlock className="w-full h-2.5 rounded" />
                  <ShimmerBlock className="w-3/4 h-2.5 rounded" />
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-slate-100 dark:border-neutral-800/70 flex gap-2">
              <ShimmerBlock className="flex-1 h-9 rounded-xl" />
              <ShimmerBlock className="w-9 h-9 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 2. HistoryPageSkeleton
 * Skeleton for the Architecture & Repository History page
 */
export const HistoryPageSkeleton: React.FC<{ isDark?: boolean }> = () => {
  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-[#090B10] font-sans select-none">
      {/* Header */}
      <header className="h-14 border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <ShimmerBlock className="w-24 h-6 rounded" />
          <div className="h-4 w-px bg-slate-200 dark:bg-neutral-800" />
          <ShimmerBlock className="w-32 h-4 rounded hidden sm:block" />
        </div>
        <div className="flex items-center gap-2">
          <ShimmerBlock className="w-24 h-8 rounded-lg" />
          <ShimmerBlock className="w-8 h-8 rounded-lg" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1">
        {/* Title & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-1.5">
            <ShimmerBlock className="w-48 h-6 rounded" />
            <ShimmerBlock className="w-72 h-3.5 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <ShimmerBlock className="w-32 h-9 rounded-xl" />
            <ShimmerBlock className="w-32 h-9 rounded-xl" />
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <ShimmerBlock className="w-full h-11 rounded-xl" />
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-[#0E1017] border border-slate-200/80 dark:border-neutral-800/80 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1.5 flex-1 pr-2">
                  <ShimmerBlock className="w-3/4 h-4 rounded" />
                  <ShimmerBlock className="w-1/2 h-3 rounded" />
                </div>
                <ShimmerBlock className="w-6 h-6 rounded-md shrink-0" />
              </div>

              <div className="space-y-2">
                <ShimmerBlock className="w-full h-3 rounded" />
                <ShimmerBlock className="w-5/6 h-3 rounded" />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-neutral-800/70 flex items-center justify-between">
                <div className="flex gap-2">
                  <ShimmerBlock className="w-12 h-5 rounded-full" />
                  <ShimmerBlock className="w-12 h-5 rounded-full" />
                </div>
                <ShimmerBlock className="w-16 h-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

/**
 * 3. RecommenderPageSkeleton
 * Skeleton for the AI Architecture Recommender page
 */
export const RecommenderPageSkeleton: React.FC<{ isDark?: boolean }> = () => {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#090B10] font-sans select-none">
      {/* Header */}
      <header className="h-14 border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <ShimmerBlock className="w-24 h-6 rounded" />
          <div className="h-4 w-px bg-slate-200 dark:bg-neutral-800" />
          <ShimmerBlock className="w-44 h-4 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <ShimmerBlock className="w-24 h-7 rounded-lg" />
          <ShimmerBlock className="w-8 h-8 rounded-lg" />
        </div>
      </header>

      {/* 2-Column Recommender Body */}
      <main className="flex-1 overflow-hidden p-4 sm:p-6 lg:p-8 flex gap-6 max-w-7xl mx-auto w-full">
        {/* Left Column: Requirements Form Skeleton */}
        <div className="w-full lg:w-1/2 bg-white dark:bg-[#0E1017] border border-slate-200 dark:border-neutral-800/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-6">
            <div className="space-y-2">
              <ShimmerBlock className="w-48 h-6 rounded" />
              <ShimmerBlock className="w-72 h-3.5 rounded" />
            </div>

            <div className="space-y-2">
              <ShimmerBlock className="w-32 h-4 rounded" />
              <ShimmerBlock className="w-full h-28 rounded-xl" />
            </div>

            <div className="space-y-2">
              <ShimmerBlock className="w-36 h-4 rounded" />
              <div className="flex gap-2 flex-wrap">
                <ShimmerBlock className="w-20 h-8 rounded-lg" />
                <ShimmerBlock className="w-24 h-8 rounded-lg" />
                <ShimmerBlock className="w-20 h-8 rounded-lg" />
                <ShimmerBlock className="w-28 h-8 rounded-lg" />
              </div>
            </div>

            <div className="space-y-2">
              <ShimmerBlock className="w-40 h-4 rounded" />
              <ShimmerBlock className="w-full h-8 rounded-lg" />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-neutral-800/70">
            <ShimmerBlock className="w-full h-11 rounded-xl" />
          </div>
        </div>

        {/* Right Column: Preview Recommendation Skeleton */}
        <div className="hidden lg:flex flex-1 bg-white/70 dark:bg-[#0E1017]/70 border border-slate-200/80 dark:border-neutral-800/80 rounded-2xl p-6 shadow-xs flex-col justify-between backdrop-blur-sm">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-neutral-800/70">
              <div className="space-y-1.5">
                <ShimmerBlock className="w-40 h-5 rounded" />
                <ShimmerBlock className="w-56 h-3 rounded" />
              </div>
              <ShimmerBlock className="w-24 h-6 rounded-full" />
            </div>

            {/* Architecture Node Blocks Shimmer */}
            <div className="grid grid-cols-2 gap-3 py-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-neutral-800/60 bg-slate-50 dark:bg-[#14161F] space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <ShimmerBlock className="w-4 h-4 rounded" />
                    <ShimmerBlock className="w-20 h-3.5 rounded" />
                  </div>
                  <ShimmerBlock className="w-full h-2 rounded" />
                </div>
              ))}
            </div>

            {/* Trade-offs & Notes */}
            <div className="space-y-2.5">
              <ShimmerBlock className="w-32 h-4 rounded" />
              <ShimmerBlock className="w-full h-3 rounded" />
              <ShimmerBlock className="w-5/6 h-3 rounded" />
              <ShimmerBlock className="w-4/6 h-3 rounded" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-neutral-800/70 flex gap-3">
            <ShimmerBlock className="flex-1 h-10 rounded-xl" />
            <ShimmerBlock className="w-28 h-10 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
};

/**
 * 4. LegalPageSkeleton
 * Clean document layout skeleton for terms, privacy policy, and cookie policy
 */
export const LegalPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#090B10] font-sans select-none flex flex-col">
      <header className="h-14 border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] px-4 sm:px-6 flex items-center justify-between shrink-0">
        <ShimmerBlock className="w-28 h-6 rounded" />
        <ShimmerBlock className="w-20 h-8 rounded-lg" />
      </header>

      <main className="max-w-4xl w-full mx-auto p-6 sm:p-10 flex-1">
        <div className="space-y-6">
          <div className="space-y-2 pb-6 border-b border-slate-200 dark:border-neutral-800">
            <ShimmerBlock className="w-56 h-8 rounded-lg" />
            <ShimmerBlock className="w-36 h-4 rounded" />
          </div>

          {[1, 2, 3].map((section) => (
            <div key={section} className="space-y-3 pt-2">
              <ShimmerBlock className="w-44 h-5 rounded" />
              <ShimmerBlock className="w-full h-3 rounded" />
              <ShimmerBlock className="w-full h-3 rounded" />
              <ShimmerBlock className="w-11/12 h-3 rounded" />
              <ShimmerBlock className="w-4/5 h-3 rounded" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

/**
 * 5. AuthModalSkeleton
 * Modal dialog skeleton for login/signup popup
 */
export const AuthModalSkeleton: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#0E1017] border border-slate-200 dark:border-neutral-800 p-6 shadow-2xl space-y-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <ShimmerBlock className="w-10 h-10 rounded-xl" />
          <ShimmerBlock className="w-36 h-6 rounded" />
          <ShimmerBlock className="w-48 h-3 rounded" />
        </div>

        <ShimmerBlock className="w-full h-10 rounded-xl" />

        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-slate-200 dark:bg-neutral-800" />
          <ShimmerBlock className="w-8 h-2 rounded" />
          <div className="flex-1 h-px bg-slate-200 dark:bg-neutral-800" />
        </div>

        <div className="space-y-3">
          <ShimmerBlock className="w-full h-10 rounded-xl" />
          <ShimmerBlock className="w-full h-10 rounded-xl" />
        </div>

        <ShimmerBlock className="w-full h-10 rounded-xl bg-indigo-500/20" />
      </div>
    </div>
  );
};

