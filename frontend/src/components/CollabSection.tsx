import React from 'react';
import {
  Users,
  MousePointer2,
  Radio,
  MessagesSquare,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Wifi,
} from 'lucide-react';
import { PenHighlight } from './ui/PenShadowLine';

export interface CollabSectionProps {
  /** Navigates to the full collaborative rooms landing page (/collab). */
  onOpenCollab?: () => void;
  /** Fallback navigation handler used when onOpenCollab is absent. */
  onNavigate?: (route: string) => void;
  isDark?: boolean;
}

const CAPABILITIES = [
  {
    icon: MousePointer2,
    title: 'Live cursors & shared canvas',
    body: 'Every teammate gets a named cursor on the same architecture canvas. Drag a node and it moves for everyone — no refresh, no merge conflicts.',
    accent: 'text-cyan-500',
    ring: 'group-hover:border-cyan-400/60',
  },
  {
    icon: MessagesSquare,
    title: 'Threaded design chat',
    body: 'Talk through trade-offs beside the diagram. Decisions stay attached to the room instead of scattering across Slack and docs.',
    accent: 'text-violet-500',
    ring: 'group-hover:border-violet-400/60',
  },
  {
    icon: Radio,
    title: 'Shared simulation runs',
    body: 'Trigger a 10x traffic spike once and the whole room watches the same bottleneck light up — the same evidence, at the same second.',
    accent: 'text-amber-500',
    ring: 'group-hover:border-amber-400/60',
  },
];

/** Small anonymous-looking avatar stack used in the room mockup. */
const Avatar: React.FC<{ initials: string; tone: string; className?: string }> = ({
  initials,
  tone,
  className = '',
}) => (
  <span
    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white dark:border-[#0b0b0f] ${tone} ${className}`}
  >
    {initials}
  </span>
);

const RoomMockup: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const panel = isDark ? 'bg-[#0b0b0f] border-neutral-800/90' : 'bg-white border-slate-200/90';
  const hairline = isDark ? 'border-neutral-800/80' : 'border-slate-200/80';
  const nodeBase = isDark
    ? 'bg-[#131318] border-neutral-700/70 text-neutral-200'
    : 'bg-white border-slate-200 text-slate-700';

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border shadow-2xl ${panel} ${
        isDark ? 'shadow-black/60' : 'shadow-slate-300/40'
      }`}
    >
      {/* Window chrome */}
      <div className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${hairline}`}>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span
            className={`ml-2 font-mono text-[11px] ${
              isDark ? 'text-neutral-400' : 'text-slate-500'
            }`}
          >
            payments-platform.gts
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
            <Wifi className="h-2.5 w-2.5" />
            live
          </span>
          <div className="flex -space-x-1.5">
            <Avatar initials="RM" tone="bg-cyan-600" />
            <Avatar initials="AK" tone="bg-violet-600" />
            <Avatar initials="SD" tone="bg-amber-600" />
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                isDark
                  ? 'border-[#0b0b0f] bg-neutral-800 text-neutral-300'
                  : 'border-white bg-slate-200 text-slate-600'
              }`}
            >
              +3
            </span>
          </div>
        </div>
      </div>

      {/* Canvas area with faux nodes and a live cursor */}
      <div className="relative h-[290px] sm:h-[330px]">
        {/* grid */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage: isDark
              ? 'linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)'
              : 'linear-gradient(to right, rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.06) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* connector lines */}
        <svg aria-hidden="true" className="absolute inset-0 h-full w-full">
          <path d="M 118 92 C 190 92, 196 150, 262 150" className="stroke-slate-400/50" fill="none" strokeWidth="1.5" strokeDasharray="5 6" />
          <path d="M 118 92 C 190 92, 196 236, 262 236" className="stroke-slate-400/50" fill="none" strokeWidth="1.5" strokeDasharray="5 6" />
          <path d="M 356 150 C 420 150, 424 192, 486 192" className="stroke-violet-400/60" fill="none" strokeWidth="1.5" strokeDasharray="5 6" />
          <path d="M 356 236 C 420 236, 424 192, 486 192" className="stroke-violet-400/60" fill="none" strokeWidth="1.5" strokeDasharray="5 6" />
        </svg>

        {/* Nodes */}
        <div className={`absolute left-4 top-[68px] w-[100px] rounded-xl border px-2.5 py-2 ${nodeBase}`}>
          <p className="text-[10px] font-bold tracking-tight">API Gateway</p>
          <p className="font-mono text-[9px] opacity-60">14.2k rps</p>
        </div>
        <div className={`absolute left-[262px] top-[126px] w-[100px] rounded-xl border px-2.5 py-2 ${nodeBase}`}>
          <p className="text-[10px] font-bold tracking-tight">Orders</p>
          <p className="font-mono text-[9px] opacity-60">48ms p99</p>
        </div>
        <div
          className={`absolute left-[262px] top-[212px] w-[100px] rounded-xl border px-2.5 py-2 ${
            isDark
              ? 'border-amber-600/60 bg-amber-500/10 text-amber-200'
              : 'border-amber-300 bg-amber-50 text-amber-800'
          }`}
        >
          <p className="text-[10px] font-bold tracking-tight">Payments</p>
          <p className="font-mono text-[9px] opacity-70">queue 92%</p>
        </div>
        <div
          className={`absolute left-[486px] top-[168px] w-[104px] rounded-xl border px-2.5 py-2 ${
            isDark
              ? 'border-violet-600/50 bg-violet-500/10 text-violet-200'
              : 'border-violet-300 bg-violet-50 text-violet-800'
          }`}
        >
          <p className="text-[10px] font-bold tracking-tight">Postgres</p>
          <p className="font-mono text-[9px] opacity-70">pool 61%</p>
        </div>

        {/* Live cursor 1 */}
        <div className="absolute left-[352px] top-[152px] z-10">
          <MousePointer2 className="h-4 w-4 rotate-[-15deg] fill-cyan-500 text-cyan-600" />
          <span className="ml-3 -mt-1 block w-fit rounded-md bg-cyan-600 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-sm">
            Aarav
          </span>
        </div>

        {/* Live cursor 2 */}
        <div className="absolute left-[214px] top-[268px] z-10">
          <MousePointer2 className="h-4 w-4 rotate-[-15deg] fill-violet-500 text-violet-600" />
          <span className="ml-3 -mt-1 block w-fit rounded-md bg-violet-600 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-sm">
            Sara
          </span>
        </div>

        {/* Chat bubble */}
        <div
          className={`absolute bottom-3 right-3 max-w-[190px] rounded-xl border px-3 py-2 shadow-lg ${
            isDark
              ? 'border-neutral-700/80 bg-[#17171d] text-neutral-200'
              : 'border-slate-200 bg-white text-slate-700'
          }`}
        >
          <p className="mb-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-violet-500">
            <Sparkles className="h-2.5 w-2.5" /> AI note
          </p>
          <p className="text-[10px] leading-snug">
            Payments queue saturates before Postgres. Add workers, then re-run the spike.
          </p>
        </div>
      </div>
    </div>
  );
};

export const CollabSection: React.FC<CollabSectionProps> = ({
  onOpenCollab,
  onNavigate,
  isDark = true,
}) => {
  const openCollab = () => {
    if (onOpenCollab) {
      onOpenCollab();
    } else if (onNavigate) {
      onNavigate('/collab');
    } else {
      window.history.pushState({}, '', '/collab');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <section
      id="collab"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 900px' }}
      className="relative w-full overflow-hidden border-t border-slate-200/80 bg-white px-4 py-20 transition-colors dark:border-neutral-900 dark:bg-[#050506] sm:px-6 sm:py-24 lg:px-10"
    >
      {/* Ambient aurora backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-64 bg-gradient-to-b from-cyan-500/[0.07] via-violet-500/[0.05] to-transparent dark:from-cyan-500/[0.09] dark:via-violet-500/[0.07]"
      />

      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Copy column */}
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-neutral-400">
            <Users className="h-3 w-3" />
            Collaborative design rooms
          </span>

          <h2 className="mt-5 text-3xl font-black leading-[0.98] tracking-[-0.03em] text-slate-900 dark:text-white sm:text-4xl md:text-[46px]">
            <span className="sm:hidden flex flex-col items-start">
              <PenHighlight className="block w-fit" highlightClassName="bg-cyan-200/80 dark:bg-cyan-500/25">
                Design the system
              </PenHighlight>
              <PenHighlight className="mt-1 block w-fit" highlightClassName="bg-violet-200/80 dark:bg-violet-500/25">
                together, live.
              </PenHighlight>
            </span>
            <span className="hidden sm:block">
              <PenHighlight className="block w-fit" highlightClassName="bg-cyan-200/80 dark:bg-cyan-500/25">
                Design the system
              </PenHighlight>
              <PenHighlight className="mt-1 block w-fit" highlightClassName="bg-violet-200/80 dark:bg-violet-500/25">
                together, live.
              </PenHighlight>
            </span>
          </h2>

          <p className="mt-5 text-base leading-relaxed text-slate-600 dark:text-neutral-400 sm:text-lg">
            Spin up a shared architecture room and invite your team with a single link. Everyone
            drags, connects and stress-tests the same canvas at the same time — no screenshots, no
            “which version is latest?”.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {CAPABILITIES.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.title}
                  className={`group flex gap-3.5 rounded-2xl border border-slate-200/90 bg-white/70 p-4 transition-all hover:shadow-md dark:border-neutral-800/80 dark:bg-neutral-900/40 dark:hover:bg-neutral-900/70 ${cap.ring}`}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900">
                    <Icon className={`h-4 w-4 ${cap.accent}`} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                      {cap.title}
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-600 dark:text-neutral-400">
                      {cap.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openCollab}
              className="group flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
              <Users className="h-4 w-4" />
              <span>Start a collab room</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={openCollab}
              className="group flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <span>Join with a link</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-60 transition-opacity group-hover:opacity-100" />
            </button>
          </div>

          <p className="mt-4 font-mono text-[11px] text-slate-500 dark:text-neutral-500">
            Free tier hosts 3 rooms · joining is always unlimited
          </p>
        </div>

        {/* Mockup column */}
        <div className="relative w-full">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-6 -z-10 rounded-[32px] bg-gradient-to-tr from-cyan-500/10 via-transparent to-violet-500/10 blur-2xl"
          />
          <RoomMockup isDark={isDark} />
        </div>
      </div>
    </section>
  );
};

export default CollabSection;
