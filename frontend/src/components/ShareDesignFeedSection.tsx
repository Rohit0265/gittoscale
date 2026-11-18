import { type FC, type HTMLAttributes, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Heart,
  GitFork,
  MessagesSquare,
  BadgeCheck,
  Sparkles,
  Users,
  Rocket,
  Radar,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { PenHighlight } from './ui/PenShadowLine';

/* ────────────────────────────────────────────────────────────────
 * Shared primitives (exported for reuse / backwards compatibility)
 * ──────────────────────────────────────────────────────────────── */

export interface ListItemTextProps {
  text: string;
  className?: string;
}

export const ListItemText: FC<ListItemTextProps> = ({ text, className }) => (
  <li className={cn('flex items-start gap-3.5', className)}>
    <span
      className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-neutral-500"
      aria-hidden="true"
    />
    <span className="text-base leading-relaxed text-slate-600 dark:text-neutral-300">{text}</span>
  </li>
);

// Backward compatibility alias
export const CheckItemText = ListItemText;

export interface AlternateImageMockupProps extends HTMLAttributes<HTMLDivElement> {
  aspectRatioClass?: string;
}

export const AlternateImageMockup: FC<AlternateImageMockupProps> = ({
  className,
  aspectRatioClass = 'aspect-[16/10] sm:aspect-[16/9] md:aspect-[2/1]',
  children,
  ...props
}) => (
  <div
    className={cn(
      'mx-auto w-full max-w-xl rounded-xl bg-slate-100 p-1.5 shadow-2xl ring-1 ring-slate-200/80 transition-all dark:bg-neutral-900/90 dark:ring-neutral-800 md:rounded-2xl md:p-2',
      className,
    )}
    {...props}
  >
    <div className="w-full rounded-[10px] bg-white p-1 dark:bg-[#0A0A0C] md:rounded-[14px]">
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-lg bg-[#090909] ring-1 ring-slate-200/60 dark:ring-neutral-800/80',
          aspectRatioClass,
        )}
      >
        {children}
      </div>
    </div>
  </div>
);

export interface ContinuousAutoplayVideoProps {
  src: string;
  poster?: string;
  className?: string;
}

/** Silent, looped background video that keeps playing through scroll/visibility changes. */
export const ContinuousAutoplayVideo: FC<ContinuousAutoplayVideoProps> = ({
  src,
  poster,
  className,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;

    const play = () => {
      if (video.paused) {
        const p = video.play();
        if (p !== undefined) p.catch(() => {});
      }
    };

    play();

    window.addEventListener('scroll', play, { passive: true });
    window.addEventListener('touchstart', play, { passive: true });
    document.addEventListener('visibilitychange', play);

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && play()),
      { threshold: 0.05 },
    );
    observer.observe(video);

    return () => {
      window.removeEventListener('scroll', play);
      window.removeEventListener('touchstart', play);
      document.removeEventListener('visibilitychange', play);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="pointer-events-none relative h-full w-full select-none overflow-hidden">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
        onPause={(e) => e.currentTarget.play().catch(() => {})}
        className={cn('pointer-events-none h-full w-full select-none object-cover object-top', className)}
      />
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────
 * Community feed section — single showcase block
 * ──────────────────────────────────────────────────────────────── */

export interface ShareDesignFeedSectionProps {
  onNavigate?: (route: string) => void;
  onSelectTestSite?: () => void;
  isDark?: boolean;
}

const HIGHLIGHTS = [
  {
    icon: Rocket,
    title: 'Publish in one click',
    body: 'Push any canvas — prompt-generated, repo-scanned or hand-built — to the feed with its full node graph intact.',
    accent: 'text-cyan-500',
    wash: 'from-cyan-500/20 via-cyan-500/5',
  },
  {
    icon: GitFork,
    title: 'Fork real architectures',
    body: 'Open a verified post from another engineer, fork it into your canvas, then re-run the simulation with your own capacity numbers.',
    accent: 'text-violet-500',
    wash: 'from-violet-500/20 via-violet-500/5',
  },
  {
    icon: MessagesSquare,
    title: 'Critique that sticks',
    body: 'Threads stay attached to the exact design they discuss, so reviews and trade-offs never vanish into chat history.',
    accent: 'text-amber-500',
    wash: 'from-amber-500/20 via-amber-500/5',
  },
];

const STATS = [
  { value: '2.4k+', label: 'designs published' },
  { value: '18k', label: 'forks & re-runs' },
  { value: '3 tiers', label: 'community · verified · private' },
];

interface FloatChipProps {
  icon: typeof Heart;
  label: string;
  className?: string;
  tone: string;
  delay: string;
}

/** Small floating metric chip layered over the video mockup. */
const FloatChip: FC<FloatChipProps> = ({ icon: Icon, label, className = '', tone, delay }) => (
  <div
    className={cn(
      'absolute z-20 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-2.5 py-1.5 shadow-lg backdrop-blur-md animate-[gtsFeedFloat_6s_ease-in-out_infinite]',
      className,
    )}
    style={{ animationDelay: delay }}
  >
    <Icon className={cn('h-3.5 w-3.5', tone)} />
    <span className="font-mono text-[11px] font-semibold tracking-tight text-white">{label}</span>
  </div>
);

export const ShareDesignFeedSection: FC<ShareDesignFeedSectionProps> = ({ onNavigate }) => {
  const openFeed = () => {
    if (onNavigate) {
      onNavigate('feed');
    } else {
      window.history.pushState({}, '', '/feed');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <section
      id="community-feed"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 900px' }}
      className="relative w-full overflow-hidden border-t border-slate-200/80 bg-white py-20 transition-colors dark:border-neutral-900 dark:bg-[#020202] sm:py-24"
    >
      {/* Ambient wash + corner bloom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-violet-500/[0.07] via-cyan-500/[0.04] to-transparent dark:from-violet-500/[0.10] dark:via-cyan-500/[0.05]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 top-20 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-500/[0.13]"
      />

      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:px-10">
        {/* ── Copy column ──────────────────────────────────────── */}
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-neutral-400">
            <Users className="h-3 w-3" />
            Community feed
          </span>

          <h2 className="mt-5 text-3xl font-black leading-[0.97] tracking-[-0.03em] text-slate-900 dark:text-white sm:text-4xl md:text-[44px]">
            <span className="flex flex-col items-start sm:hidden">
              <PenHighlight className="block w-fit" highlightClassName="bg-violet-200/80 dark:bg-violet-500/25">
                Share your design
              </PenHighlight>
              <PenHighlight className="mt-1 block w-fit" highlightClassName="bg-cyan-200/80 dark:bg-cyan-500/25">
                with the community.
              </PenHighlight>
            </span>
            <span className="hidden sm:block">
              <PenHighlight className="block w-fit" highlightClassName="bg-violet-200/80 dark:bg-violet-500/25">
                Share your design
              </PenHighlight>
              <PenHighlight className="mt-1 block w-fit" highlightClassName="bg-cyan-200/80 dark:bg-cyan-500/25">
                with the community.
              </PenHighlight>
            </span>
          </h2>

          <p className="mt-5 text-base leading-relaxed text-slate-600 dark:text-neutral-400 sm:text-lg">
            Publish real architectures, browse what other engineers shipped, and fork their
            topologies into your own canvas. Every post carries its live simulation data — so the
            critique is grounded in numbers, not opinions.
          </p>

          <div className="mt-8 flex flex-col gap-2.5">
            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group relative flex gap-3.5 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/70 p-4 transition-all hover:-translate-y-px hover:shadow-md dark:border-neutral-800/80 dark:bg-neutral-900/40 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/70"
                >
                  <div
                    aria-hidden="true"
                    className={cn(
                      'pointer-events-none absolute inset-y-0 left-0 w-28 bg-gradient-to-r to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100',
                      item.wash,
                    )}
                  />
                  <span className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                    <Icon className={cn('h-4 w-4', item.accent)} />
                  </span>
                  <div className="relative">
                    <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-600 dark:text-neutral-400">
                      {item.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openFeed}
              className="group flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
              <span>Open the community feed</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={openFeed}
              className="group flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              <span>Publish a design</span>
            </button>
          </div>

          <dl className="mt-9 grid grid-cols-3 gap-4 border-t border-slate-200/80 pt-6 dark:border-neutral-800/80">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="font-mono text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                  {stat.value}
                </dt>
                <dd className="mt-0.5 text-[11px] leading-tight text-slate-500 dark:text-neutral-500">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ── Video showcase column ────────────────────────────── */}
        <div className="relative w-full">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-5 -z-10 rounded-[34px] bg-gradient-to-tr from-violet-500/15 via-transparent to-cyan-500/15 blur-2xl"
          />

          <AlternateImageMockup aspectRatioClass="aspect-[16/13] sm:aspect-[1262/880]">
            <ContinuousAutoplayVideo
              src="/feed-share-design.mp4"
              poster="/feed-share-design.png"
              className="transition-transform duration-500 hover:scale-[1.015]"
            />

            {/* Scrim so the top chrome row stays legible */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/55 to-transparent"
            />

            {/* App chrome row */}
            <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400/80" />
                <span className="h-2 w-2 rounded-full bg-amber-400/80" />
                <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                <span className="ml-2 font-mono text-[10px] text-white/70">gittoscale.tech/feed</span>
              </div>
              <span className="flex items-center gap-1 rounded-full border border-white/15 bg-black/50 px-2 py-0.5 backdrop-blur-md">
                <Radar className="h-2.5 w-2.5 text-emerald-400" />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-white/90">
                  Live sim data
                </span>
              </span>
            </div>
          </AlternateImageMockup>

          {/* Metrics strip — sits below the frame so nothing overlaps the recording */}
          <div className="mx-auto mt-4 flex w-full max-w-xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/50">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-[10px] font-bold text-white">
                AK
              </span>
              <span className="text-[12px] font-semibold text-slate-800 dark:text-neutral-200">
                Aarav
              </span>
              <span className="font-mono text-[11px] text-slate-500 dark:text-neutral-500">
                payments-v3.gts
              </span>
              <BadgeCheck className="h-3.5 w-3.5 text-cyan-500" />
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px] font-semibold text-slate-600 dark:text-neutral-400">
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                1.2k
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="h-3.5 w-3.5 text-cyan-500" />
                84
              </span>
              <span className="flex items-center gap-1">
                <MessagesSquare className="h-3.5 w-3.5 text-violet-500" />
                26
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gtsFeedFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[gtsFeedFloat_6s_ease-in-out_infinite\\] { animation: none !important; }
        }
      `}</style>
    </section>
  );
};

// Aliased export kept for existing imports elsewhere in the app
export const FeaturesAlternatingLayout01 = ShareDesignFeedSection;
export default ShareDesignFeedSection;
