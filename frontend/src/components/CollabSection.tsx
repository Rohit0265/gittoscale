import React from 'react';
import {
  Users,
  MousePointer2,
  Radio,
  MessagesSquare,
  ArrowRight,
} from 'lucide-react';
import { PenHighlight } from './ui/PenShadowLine';
import { AlternateImageMockup, ContinuousAutoplayVideo } from './ShareDesignFeedSection';

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
  },
  {
    icon: MessagesSquare,
    title: 'Threaded design chat',
    body: 'Talk through trade-offs beside the diagram. Decisions stay attached to the room instead of scattering across Slack and docs.',
  },
  {
    icon: Radio,
    title: 'Shared simulation runs',
    body: 'Trigger a 10x traffic spike once and the whole room watches the same bottleneck light up — the same evidence, at the same second.',
  },
];

export const CollabSection: React.FC<CollabSectionProps> = ({
  onOpenCollab,
  onNavigate,
  isDark: _isDark = true,
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
      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[1.15fr_1fr] xl:grid-cols-[1.25fr_1fr] lg:gap-16">
        {/* Video showcase column (Left on desktop) */}
        <div className="relative w-full order-2 lg:order-1">
          <AlternateImageMockup
            aspectRatioClass="aspect-[16/9]"
            className="mx-auto w-full max-w-none lg:max-w-2xl xl:max-w-3xl"
          >
            <ContinuousAutoplayVideo
              src="/collab-feature.mp4"
              poster="/collab-feature.png"
            />
          </AlternateImageMockup>
        </div>

        {/* Copy column (Right on desktop) */}
        <div className="max-w-xl order-1 lg:order-2 lg:ml-auto">
          <h2 className="mt-5 text-3xl font-black leading-[0.98] tracking-[-0.03em] text-slate-900 dark:text-white sm:text-4xl md:text-[46px]">
            <span className="sm:hidden flex flex-col items-start">
              <PenHighlight className="block w-fit" highlightClassName="bg-slate-400/85 dark:bg-neutral-500/85">
                Design the system
              </PenHighlight>
              <PenHighlight className="mt-1 block w-fit" highlightClassName="bg-slate-400/85 dark:bg-neutral-500/85">
                together, live.
              </PenHighlight>
            </span>
            <span className="hidden sm:block">
              <PenHighlight className="block w-fit" highlightClassName="bg-slate-400/85 dark:bg-neutral-500/85">
                Design the system
              </PenHighlight>
              <PenHighlight className="mt-1 block w-fit" highlightClassName="bg-slate-400/85 dark:bg-neutral-500/85">
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
                  className="group flex gap-3.5 rounded-2xl border border-slate-200/90 bg-white/70 p-4 dark:border-neutral-800/80 dark:bg-neutral-900/40"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 transition-colors duration-200 group-hover:border-slate-300 dark:border-neutral-800 dark:bg-neutral-900 dark:group-hover:border-neutral-700">
                    <Icon className="h-4 w-4 text-slate-500 transition-colors duration-200 group-hover:text-slate-900 dark:text-neutral-400 dark:group-hover:text-white" />
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
          </div>
        </div>
      </div>
    </section>
  );
};

export default CollabSection;
