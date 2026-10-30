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
  className?: string;
}

export const HeroArchitectureDiagram: React.FC<HeroArchitectureDiagramProps> = ({
  className = '',
}) => {
  return (
    <div
      className={`relative w-full max-w-[660px] lg:max-w-[720px] aspect-[540/300] select-none mx-auto lg:mx-0 pointer-events-none ${className}`}
    >
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

        {/* Wire 1: Top-Left telemetry badge -> GitHub Card */}
        <path
          d="M 45 44 C 45 110, 48 152, 60 152"
          className="stroke-slate-300 dark:stroke-neutral-800"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Wire 2: GitHub Card -> Service 1 (Top / Box) */}
        <path
          d="M 230 152 C 285 152, 310 90, 370 90"
          className="stroke-slate-300 dark:stroke-neutral-800"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Wire 3: GitHub Card -> Service 2 (Middle / Database) */}
        <path
          d="M 230 152 C 280 152, 310 152, 370 152"
          className="stroke-slate-300 dark:stroke-neutral-800"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Wire 4: GitHub Card -> Service 3 (Bottom / Worker) */}
        <path
          d="M 230 152 C 285 152, 310 216, 370 216"
          className="stroke-slate-300 dark:stroke-neutral-800"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Wire 5: Service 1 outgoing loop back to Top-Right badge */}
        <path
          d="M 540 90 C 560 90, 560 45, 495 45"
          className="stroke-slate-300 dark:stroke-neutral-800"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Wire Node Connection Junctions */}
        <circle cx="60" cy="152" r="3" className="fill-black dark:fill-white" />
        <circle cx="230" cy="152" r="3" className="fill-black dark:fill-white" />
        <circle cx="370" cy="90" r="3" className="fill-black dark:fill-white" />
        <circle cx="370" cy="152" r="3" className="fill-black dark:fill-white" />
        <circle cx="370" cy="216" r="3" className="fill-black dark:fill-white" />
        <circle cx="495" cy="45" r="3" className="fill-black dark:fill-white" />

        {/* Animated Flow Pulse Particles */}
        <circle
          cx="48"
          cy="92"
          r="3"
          className="fill-black dark:fill-white animate-pulse"
        />
        <circle
          cx="285"
          cy="114"
          r="3"
          className="fill-black dark:fill-white animate-pulse"
        />
        <circle
          cx="300"
          cy="152"
          r="3"
          className="fill-black dark:fill-white animate-pulse"
        />
        <circle
          cx="285"
          cy="188"
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
        className="group absolute w-[40px] h-[40px] sm:w-[44px] sm:h-[44px] rounded-xl sm:rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#141416] flex items-center justify-center text-slate-700 dark:text-neutral-300 shadow-xs z-10"
      >
        <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-neutral-400 group-hover:text-indigo-500 transition-colors" />
      </div>

      {/* Floating Badge 2 (Top Right): Uptime / Trend */}
      <div
        style={{ right: '4.5%', top: '4.5%' }}
        className="group absolute w-[40px] h-[40px] sm:w-[44px] sm:h-[44px] rounded-xl sm:rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#141416] flex items-center justify-center text-slate-700 dark:text-neutral-300 shadow-xs z-10"
      >
        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-neutral-400 group-hover:text-emerald-500 transition-colors" />
      </div>

      {/* Center-Left: GitHub Repository Source Card */}
      <div
        style={{ left: '11%', top: '36.5%', width: '31.5%', height: '24.5%' }}
        className="group absolute rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] p-3 sm:p-3.5 flex items-center gap-3 shadow-xs z-10"
      >
        {/* Left incoming wire port */}
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white dark:border-[#0A0A0A] bg-black dark:bg-white" />

        {/* GitHub Logo */}
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shrink-0 shadow-xs">
          <Github className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
        </div>

        {/* 2 Horizontal Skeleton Bars */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-2 w-4/5 bg-slate-200 dark:bg-neutral-800 rounded-full" />
          <div className="h-2 w-3/5 bg-slate-200 dark:bg-neutral-800/70 rounded-full" />
        </div>

        {/* Right outgoing wire port */}
        <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white dark:border-[#0A0A0A] bg-black dark:bg-white" />
      </div>

      {/* Right Column: 3 Destination Microservices */}
      {/* Service 1 (Top): Core / Box Service */}
      <div
        style={{ right: '9%', top: '24.5%', width: '31.5%', height: '17%' }}
        className="group absolute rounded-xl sm:rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] px-3 py-2 flex items-center justify-between shadow-xs z-10"
      >
        {/* Left incoming port */}
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white dark:border-[#0A0A0A] bg-black dark:bg-white" />

        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors flex items-center justify-center shrink-0">
            <Box className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-1.5 w-16 sm:w-20 bg-slate-200 dark:bg-neutral-800 rounded-full" />
            <div className="h-1.5 w-10 sm:w-14 bg-slate-200 dark:bg-neutral-800/70 rounded-full" />
          </div>
        </div>

        {/* Emerald Green status dot */}
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />

        {/* Right outgoing loop port */}
        <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white dark:border-[#0A0A0A] bg-black dark:bg-white" />
      </div>

      {/* Service 2 (Middle): Database */}
      <div
        style={{ right: '9%', top: '46%', width: '31.5%', height: '17%' }}
        className="group absolute rounded-xl sm:rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] px-3 py-2 flex items-center justify-between shadow-xs z-10"
      >
        {/* Left incoming port */}
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white dark:border-[#0A0A0A] bg-black dark:bg-white" />

        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-colors flex items-center justify-center shrink-0">
            <Database className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-1.5 w-18 sm:w-24 bg-slate-200 dark:bg-neutral-800 rounded-full" />
            <div className="h-1.5 w-12 sm:w-16 bg-slate-200 dark:bg-neutral-800/70 rounded-full" />
          </div>
        </div>

        {/* Amber status dot */}
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
      </div>

      {/* Service 3 (Bottom): Settings / Worker */}
      <div
        style={{ right: '9%', top: '67.5%', width: '31.5%', height: '17%' }}
        className="group absolute rounded-xl sm:rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] px-3 py-2 flex items-center justify-between shadow-xs z-10"
      >
        {/* Left incoming port */}
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white dark:border-[#0A0A0A] bg-black dark:bg-white" />

        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 group-hover:bg-rose-500/10 group-hover:text-rose-500 transition-colors flex items-center justify-center shrink-0">
            <Settings className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-1.5 w-14 sm:w-20 bg-slate-200 dark:bg-neutral-800 rounded-full" />
            <div className="h-1.5 w-9 sm:w-14 bg-slate-200 dark:bg-neutral-800/70 rounded-full" />
          </div>
        </div>

        {/* Red / Rose status dot */}
        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/20" />
      </div>
    </div>
  );
};
