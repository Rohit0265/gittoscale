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
    <section className="relative w-full min-h-screen bg-[#060608] text-white flex flex-col items-center justify-start pt-20 sm:pt-24 md:pt-28 pb-16 px-4 sm:px-6 select-none overflow-hidden font-sans">
      {/* 1. Subtle, Elegant Dark Ambient Glow (No muddy blobs) */}
      <div
        className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-blue-600/[0.07] blur-[100px] rounded-full"
        aria-hidden="true"
      />

      {/* 2. Unified Vector 3D Stickman Diagram Background (Chalk SVGs: Server + Continuous Wire + Burning Database) */}
      <div className="pointer-events-none absolute inset-x-0 top-10 sm:top-14 w-full h-[580px] sm:h-[640px] md:h-[680px] z-0 flex items-center justify-center overflow-hidden select-none">
        <svg
          viewBox="0 0 1440 680"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full max-w-[1440px] select-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Soft chalk glow filter */}
            <filter id="vectorChalkGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="#ffffff" floodOpacity="0.3" />
            </filter>
            {/* Flame glow filter */}
            <filter id="vectorFireGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="-2" stdDeviation="6" floodColor="#f97316" floodOpacity="0.8" />
              <feDropShadow dx="0" dy="-4" stdDeviation="12" floodColor="#ef4444" floodOpacity="0.6" />
            </filter>
            {/* Gradients for fire */}
            <linearGradient id="vectorFlameOuter" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="50%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id="vectorFlameInner" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="60%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>
          </defs>

          {/* ========================================================
              LEFT: 3D SERVER WIREFRAME BOX + LADDER + CLIMBING STICKMAN
             ======================================================== */}
          <g filter="url(#vectorChalkGlow)">
            {/* Server Cube Isometric Faces */}
            {/* Back wireframe edges (dashed) */}
            <path
              d="M 180,200 L 180,400 M 180,400 L 260,440 M 180,400 L 100,360"
              stroke="#64748b"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.35"
            />
            {/* Top Diamond Face */}
            <path
              d="M 100,160 L 180,120 L 260,160 L 180,200 Z"
              stroke="#e2e8f0"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity="0.85"
            />
            {/* Right Face */}
            <path
              d="M 180,200 L 260,160 L 260,360 L 180,400 Z"
              stroke="#e2e8f0"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity="0.85"
            />
            {/* Left Face */}
            <path
              d="M 100,160 L 180,200 L 180,400 L 100,360 Z"
              stroke="#e2e8f0"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity="0.85"
            />

            {/* "SERVER" Hand-Drawn Label on Right Face */}
            <text
              x="215"
              y="265"
              transform="rotate(-26 215 265)"
              fill="#e2e8f0"
              fontFamily="monospace, ui-monospace, sans-serif"
              fontSize="20"
              fontWeight="bold"
              letterSpacing="2.5"
              opacity="0.8"
            >
              SERVER
            </text>

            {/* Cable Port on Left Face */}
            <ellipse cx="145" cy="310" rx="10" ry="6" fill="#060608" stroke="#cbd5e1" strokeWidth="2" />
            {/* Cables spilling from port down to ground */}
            <path
              d="M 145,313 C 152,345 158,380 172,415 C 178,430 185,440 200,446"
              stroke="#94a3b8"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M 148,315 C 160,350 170,385 186,420 C 195,435 208,443 225,448"
              stroke="#e2e8f0"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Leaning 3D Ladder */}
            <g transform="translate(65, 140) rotate(-14)">
              {/* Rails */}
              <line x1="0" y1="0" x2="0" y2="290" stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
              <line x1="32" y1="0" x2="32" y2="290" stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
              {/* Rungs */}
              {[35, 70, 105, 140, 175, 210, 245, 275].map((ry, idx) => (
                <line
                  key={idx}
                  x1="0"
                  y1={ry}
                  x2="32"
                  y2={ry}
                  stroke="#f1f5f9"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.85"
                />
              ))}

              {/* Climbing Stickman */}
              <g transform="translate(16, 110)">
                {/* Head */}
                <circle cx="0" cy="-24" r="14" stroke="#ffffff" strokeWidth="2.5" fill="#060608" />
                {/* Torso */}
                <line x1="0" y1="-10" x2="0" y2="30" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                {/* Arms gripping rails/rungs */}
                <path d="M 0,-4 L -16,-12" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 0,-4 L 16,-18" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                {/* Legs stepping on rungs */}
                <path d="M 0,30 L -12,48 L -16,58" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 0,30 L 12,42 L 16,56" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            </g>
          </g>

          {/* ========================================================
              RIGHT: 3D DATABASE WIREFRAME BOX ON FIRE + RUNNING STICKMAN
             ======================================================== */}
          <g>
            {/* Database Cube */}
            <g filter="url(#vectorChalkGlow)">
              {/* Back edges (dashed) */}
              <path
                d="M 1260,240 L 1260,440 M 1260,440 L 1340,400 M 1260,440 L 1180,400"
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.35"
              />
              {/* Top Face */}
              <path
                d="M 1180,200 L 1260,160 L 1340,200 L 1260,240 Z"
                stroke="#e2e8f0"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity="0.85"
              />
              {/* Right Face */}
              <path
                d="M 1260,240 L 1340,200 L 1340,400 L 1260,440 Z"
                stroke="#e2e8f0"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity="0.85"
              />
              {/* Left Face */}
              <path
                d="M 1180,200 L 1260,240 L 1260,440 L 1180,400 Z"
                stroke="#e2e8f0"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity="0.85"
              />

              {/* "DATABASE" Label on Left Face */}
              <text
                x="1200"
                y="275"
                transform="rotate(26 1200 275)"
                fill="#e2e8f0"
                fontFamily="monospace, ui-monospace, sans-serif"
                fontSize="18"
                fontWeight="bold"
                letterSpacing="2"
                opacity="0.8"
              >
                DATABASE
              </text>

              {/* Stacked Database Cylinder Disks Inside */}
              <g transform="translate(1200, 315)">
                <ellipse cx="22" cy="0" rx="18" ry="7" stroke="#94a3b8" strokeWidth="2" fill="none" />
                <path d="M 4,0 L 4,16 C 4,22 40,22 40,16 L 40,0" stroke="#94a3b8" strokeWidth="2" fill="none" />
                <path d="M 4,16 L 4,32 C 4,38 40,38 40,32 L 40,16" stroke="#94a3b8" strokeWidth="2" fill="none" />
                <path d="M 4,32 L 4,48 C 4,54 40,54 40,48 L 40,32" stroke="#94a3b8" strokeWidth="2" fill="none" />
              </g>

              {/* Cables connecting from bottom-left to main wire */}
              <path
                d="M 1180,400 C 1200,420 1215,435 1230,445"
                stroke="#e2e8f0"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>

            {/* Stylized Vector Fire Flames on Top of Database */}
            <g transform="translate(1260, 160)" filter="url(#vectorFireGlow)">
              {/* Outer Layer Fire (Crimson Red / Orange) */}
              <path
                d="M -35,15 C -45,-10 -30,-45 -25,-75 C -15,-50 -10,-40 0,-65 C 10,-95 25,-75 30,-45 C 42,-70 50,-35 40,15 C 25,28 -20,28 -35,15 Z"
                fill="url(#vectorFlameOuter)"
              />
              {/* Mid Layer Fire (Orange / Amber) */}
              <path
                d="M -24,12 C -32,-8 -20,-38 -15,-55 C -8,-38 -4,-30 4,-48 C 12,-65 20,-50 20,-30 C 28,-48 32,-20 24,12 C 16,20 -16,20 -24,12 Z"
                fill="url(#vectorFlameInner)"
              />
              {/* Core Yellow Tongue */}
              <path
                d="M -12,10 C -16,-5 -8,-25 0,-38 C 4,-25 12,-16 10,10 Z"
                fill="#ffffff"
                opacity="0.95"
              />
              {/* Sparks and Embers floating up */}
              <circle cx="-12" cy="-85" r="2" fill="#fef08a" />
              <circle cx="16" cy="-92" r="2" fill="#fb923c" />
              <circle cx="4" cy="-105" r="1.5" fill="#fef08a" />
            </g>

            {/* Panicked Stickman Running with Water Bucket */}
            <g transform="translate(1360, 360)" filter="url(#vectorChalkGlow)">
              {/* Panic Sweat Drops */}
              <path d="M -22,-42 C -26,-46 -24,-50 -20,-47 Z" fill="#38bdf8" />
              <path d="M -16,-50 C -20,-54 -18,-58 -14,-55 Z" fill="#38bdf8" />

              {/* Head */}
              <circle cx="-6" cy="-30" r="13" stroke="#ffffff" strokeWidth="2.5" fill="#060608" />

              {/* Leaning Torso running towards left */}
              <line x1="-2" y1="-17" x2="14" y2="24" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

              {/* Arms outstretched holding water bucket */}
              <path d="M 2,-6 L -20,-1 L -32,-12" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 6,-3 L -16,5 L -28,-6" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

              {/* Water Bucket */}
              <g transform="translate(-40, -14) rotate(15)">
                <path d="M 0,0 L 4,18 L 16,18 L 20,0 Z" stroke="#ffffff" strokeWidth="2" fill="#1e293b" />
                <path d="M 2,3 Q 10,1 18,3" stroke="#38bdf8" strokeWidth="2" fill="none" />
                <path d="M -2,-2 Q -6,-6 -2,-10" stroke="#38bdf8" strokeWidth="1.5" fill="none" />
              </g>

              {/* Running Legs */}
              <path d="M 14,24 L -2,42 L -14,56" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 14,24 L 30,36 L 44,34" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

              {/* Speed / Dash Lines behind running stickman */}
              <line x1="38" y1="-4" x2="56" y2="-4" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <line x1="46" y1="10" x2="68" y2="10" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <line x1="50" y1="24" x2="62" y2="24" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            </g>
          </g>

          {/* ========================================================
              CONTINUOUS CONNECTING FLOOR WIRE (Server to Database)
             ======================================================== */}
          {/* Main chalk wire looping across center floor */}
          <path
            d="M 200,446 C 310,470 420,440 540,465 C 640,486 685,550 725,525 C 765,500 815,445 925,465 C 1020,482 1120,445 1230,445"
            stroke="#cbd5e1"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.8"
          />
          {/* Inner chalk dashed tracer */}
          <path
            d="M 204,449 C 314,473 424,443 544,468 C 644,489 689,553 729,528 C 769,503 819,448 929,468 C 1024,485 1124,448 1234,448"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeDasharray="6 8"
            strokeLinecap="round"
            fill="none"
            opacity="0.9"
          />
        </svg>
      </div>

      {/* 3. Central Hero Content Container */}
      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center w-full">
        {/* Main Headline (Clean, refined size, not oversized) */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight text-center">
          Scale your system
          <span className="block mt-1 sm:mt-1.5">
            before{' '}
            <span className="text-red-500 font-extrabold tracking-tight inline-block drop-shadow-[0_0_16px_rgba(239,68,68,0.5)]">
              disaster.
            </span>
          </span>
        </h1>

        {/* 4. Refined AI Prompt Input (Clean executive engineering craft, no AI slop) */}
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

      {/* 5. Connected Bottom Video Section Carousel Showcase */}
      <div className="relative z-10 w-full max-w-6xl mt-6 sm:mt-10 px-2 sm:px-4 flex flex-col items-center select-none">
        <VideoCarousel />
      </div>
    </section>
  );
};

export default NewOne;
