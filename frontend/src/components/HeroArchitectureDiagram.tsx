import React from 'react';
import {
  Github,
  Box,
  Database,
  Settings,
  BarChart2,
  TrendingUp,
} from 'lucide-react';

interface HeroArchitectureDiagramProps {
  onImportRepo?: () => void;
  onOpenTestSite?: () => void;
}

export const HeroArchitectureDiagram: React.FC<HeroArchitectureDiagramProps> = ({
  onImportRepo,
  onOpenTestSite,
}) => {
  return (
    <div className="relative w-full max-w-[740px] lg:max-w-[800px] xl:max-w-[840px] aspect-[540/300] select-none mx-auto lg:mx-0">
      {/* Background Dot Matrix Grid (Left & Right, matching reference design) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 540 300"
        fill="none"
      >
        {/* Left Dot Matrix (3 columns x 4 rows) */}
        <g className="fill-slate-300/80 dark:fill-neutral-800">
          <circle cx="16" cy="115" r="1.5" />
          <circle cx="28" cy="115" r="1.5" />
          <circle cx="40" cy="115" r="1.5" />
          <circle cx="16" cy="130" r="1.5" />
          <circle cx="28" cy="130" r="1.5" />
          <circle cx="40" cy="130" r="1.5" />
          <circle cx="16" cy="145" r="1.5" />
          <circle cx="28" cy="145" r="1.5" />
          <circle cx="40" cy="145" r="1.5" />
          <circle cx="16" cy="160" r="1.5" />
          <circle cx="28" cy="160" r="1.5" />
          <circle cx="40" cy="160" r="1.5" />
        </g>

        {/* Right Dot Matrix (3 columns x 4 rows) */}
        <g className="fill-slate-300/80 dark:fill-neutral-800">
          <circle cx="500" cy="145" r="1.5" />
          <circle cx="512" cy="145" r="1.5" />
          <circle cx="524" cy="145" r="1.5" />
          <circle cx="500" cy="160" r="1.5" />
          <circle cx="512" cy="160" r="1.5" />
          <circle cx="524" cy="160" r="1.5" />
          <circle cx="500" cy="175" r="1.5" />
          <circle cx="512" cy="175" r="1.5" />
          <circle cx="524" cy="175" r="1.5" />
          <circle cx="500" cy="190" r="1.5" />
          <circle cx="512" cy="190" r="1.5" />
          <circle cx="524" cy="190" r="1.5" />
        </g>

        {/* SVG Connecting Cables & Loops */}
        {/* Left Loop: From GitHub Card left edge (60, 147) around to Left Badge (45, 56) */}
        <path
          d="M 60 147 C 12 147, 8 95, 45 56"
          fill="none"
          className="stroke-black dark:stroke-white"
          strokeWidth="1.75"
        />

        {/* Middle Tree: From GitHub Card right edge (230, 147) to 3 Service Cards */}
        {/* Branch 1 to Top Service (320, 99) */}
        <path
          d="M 230 147 C 275 147, 275 99, 320 99"
          fill="none"
          className="stroke-black dark:stroke-white"
          strokeWidth="1.75"
        />
        {/* Branch 2 to Middle Database (320, 163) */}
        <path
          d="M 230 147 C 275 147, 275 163, 320 163"
          fill="none"
          className="stroke-black dark:stroke-white"
          strokeWidth="1.75"
        />
        {/* Branch 3 to Bottom Worker (320, 227) */}
        <path
          d="M 230 147 C 275 147, 275 227, 320 227"
          fill="none"
          className="stroke-black dark:stroke-white"
          strokeWidth="1.75"
        />

        {/* Right Loop: From Top Service right edge (490, 99) around to Right Badge (495, 56) */}
        <path
          d="M 490 99 C 532 99, 530 75, 495 56"
          fill="none"
          className="stroke-black dark:stroke-white"
          strokeWidth="1.75"
        />

        {/* Glowing / Pulsing Signal Nodes */}
        <circle
          cx="20"
          cy="115"
          r="3"
          className="fill-black dark:fill-white animate-pulse"
        />
        <circle
          cx="275"
          cy="118"
          r="3"
          className="fill-black dark:fill-white animate-pulse"
        />
        <circle
          cx="275"
          cy="155"
          r="3"
          className="fill-black dark:fill-white animate-pulse"
        />
        <circle
          cx="275"
          cy="192"
          r="3"
          className="fill-black dark:fill-white animate-pulse"
        />
        <circle
          cx="522"
          cy="84"
          r="3"
          className="fill-black dark:fill-white animate-pulse"
        />
      </svg>

      {/* Floating Badge 1 (Top Left): Telemetry / Activity */}
      <div
        style={{ left: '4.5%', top: '4.5%' }}
        className="absolute w-[46px] h-[46px] sm:w-[52px] sm:h-[52px] rounded-xl sm:rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#141416] flex items-center justify-center text-slate-700 dark:text-neutral-300 shadow-sm transition-transform hover:scale-105 z-10"
      >
        <BarChart2 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-neutral-400" />
      </div>

      {/* Floating Badge 2 (Top Right): Uptime / Trend */}
      <div
        style={{ right: '4.5%', top: '4.5%' }}
        className="absolute w-[46px] h-[46px] sm:w-[52px] sm:h-[52px] rounded-xl sm:rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#141416] flex items-center justify-center text-slate-700 dark:text-neutral-300 shadow-sm transition-transform hover:scale-105 z-10"
      >
        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-neutral-400" />
      </div>

      {/* Center-Left: GitHub Repository Source Card */}
      <div
        onClick={onImportRepo}
        style={{ left: '11%', top: '36.5%', width: '31.5%', height: '24.5%' }}
        className="absolute group cursor-pointer rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] p-3 sm:p-4 flex items-center gap-3 sm:gap-3.5 shadow-md hover:border-slate-400 dark:hover:border-neutral-600 hover:shadow-xl transition-all z-10"
        title="Click to Import Repository"
      >
        {/* Left incoming wire port */}
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white dark:border-[#0A0A0A] bg-black dark:bg-white" />

        {/* GitHub Logo (white in dark mode, black in light mode) */}
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
          <Github className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
        </div>

        {/* 2 Horizontal Skeleton Bars */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-2 sm:h-2.5 w-4/5 bg-slate-200 dark:bg-neutral-800 rounded-full group-hover:bg-slate-300 dark:group-hover:bg-neutral-700 transition-colors" />
          <div className="h-2 sm:h-2.5 w-3/5 bg-slate-200 dark:bg-neutral-800/80 rounded-full group-hover:bg-slate-300 dark:group-hover:bg-neutral-700 transition-colors" />
        </div>

        {/* Right outgoing wire port */}
        <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white dark:border-[#0A0A0A] bg-black dark:bg-white" />
      </div>

      {/* Right Column: 3 Destination Microservices */}
      {/* Service 1 (Top): Core / Box Service */}
      <div
        onClick={onOpenTestSite}
        style={{ right: '9%', top: '24.5%', width: '31.5%', height: '17%' }}
        className="absolute group cursor-pointer rounded-xl sm:rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] px-3 sm:px-3.5 py-2 sm:py-2.5 flex items-center justify-between shadow-xs hover:border-slate-400 dark:hover:border-neutral-600 hover:shadow-md transition-all z-10"
        title="Click to Open Test Site"
      >
        {/* Left incoming port */}
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white dark:border-[#0A0A0A] bg-black dark:bg-white" />

        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Box className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-1.5 sm:h-2 w-16 sm:w-20 bg-slate-200 dark:bg-neutral-800 rounded-full" />
            <div className="h-1.5 sm:h-2 w-10 sm:w-14 bg-slate-200 dark:bg-neutral-800/70 rounded-full" />
          </div>
        </div>

        {/* Emerald Green status dot */}
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />

        {/* Right outgoing loop port */}
        <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white dark:border-[#0A0A0A] bg-black dark:bg-white" />
      </div>

      {/* Service 2 (Middle): Database */}
      <div
        onClick={onOpenTestSite}
        style={{ right: '9%', top: '46%', width: '31.5%', height: '17%' }}
        className="absolute group cursor-pointer rounded-xl sm:rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] px-3 sm:px-3.5 py-2 sm:py-2.5 flex items-center justify-between shadow-xs hover:border-slate-400 dark:hover:border-neutral-600 hover:shadow-md transition-all z-10"
        title="Click to Open Test Site"
      >
        {/* Left incoming port */}
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white dark:border-[#0A0A0A] bg-black dark:bg-white" />

        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-1.5 sm:h-2 w-18 sm:w-24 bg-slate-200 dark:bg-neutral-800 rounded-full" />
            <div className="h-1.5 sm:h-2 w-12 sm:w-16 bg-slate-200 dark:bg-neutral-800/70 rounded-full" />
          </div>
        </div>

        {/* Amber status dot */}
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
      </div>

      {/* Service 3 (Bottom): Settings / Worker */}
      <div
        onClick={onOpenTestSite}
        style={{ right: '9%', top: '67.5%', width: '31.5%', height: '17%' }}
        className="absolute group cursor-pointer rounded-xl sm:rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] px-3 sm:px-3.5 py-2 sm:py-2.5 flex items-center justify-between shadow-xs hover:border-slate-400 dark:hover:border-neutral-600 hover:shadow-md transition-all z-10"
        title="Click to Open Test Site"
      >
        {/* Left incoming port */}
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white dark:border-[#0A0A0A] bg-black dark:bg-white" />

        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-1.5 sm:h-2 w-14 sm:w-20 bg-slate-200 dark:bg-neutral-800 rounded-full" />
            <div className="h-1.5 sm:h-2 w-9 sm:w-14 bg-slate-200 dark:bg-neutral-800/70 rounded-full" />
          </div>
        </div>

        {/* Red / Rose status dot */}
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500 ring-2 ring-rose-500/20" />
      </div>
    </div>
  );
};
