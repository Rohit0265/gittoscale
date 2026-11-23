import { type FC, type HTMLAttributes, useEffect, useRef } from 'react';
import {
  ArrowRight,
  GitFork,
  MessagesSquare,
  Rocket,
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
 * Community feed section — one showcase block: copy left, feed right
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
  },
  {
    icon: GitFork,
    title: 'Fork real architectures',
    body: 'Open a verified post from another engineer, fork it into your canvas, then re-run the simulation with your own capacity numbers.',
  },
  {
    icon: MessagesSquare,
    title: 'Critique that sticks',
    body: 'Threads stay attached to the exact design they discuss, so reviews and trade-offs never vanish into chat history.',
  },
];

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
      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:px-10">
        {/* ── Copy column ──────────────────────────────────────── */}
        <div className="max-w-xl">


          <h2 className="mt-5 text-3xl font-black leading-[0.97] tracking-[-0.03em] text-slate-900 dark:text-white sm:text-4xl md:text-[44px]">
            <PenHighlight className="block w-fit" highlightClassName="bg-slate-400/85 dark:bg-neutral-500/85">
              Share your design
            </PenHighlight>
            <PenHighlight className="mt-1 block w-fit" highlightClassName="bg-slate-400/85 dark:bg-neutral-500/85">
              with the community.
            </PenHighlight>
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
                  className="group relative flex gap-3.5 rounded-2xl border border-slate-200/90 bg-white/70 p-4 dark:border-neutral-800/80 dark:bg-neutral-900/40"
                >
                  <span className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white transition-colors duration-200 group-hover:border-slate-300 dark:border-neutral-800 dark:bg-neutral-950 dark:group-hover:border-neutral-700">
                    <Icon className="h-4 w-4 text-slate-500 transition-colors duration-200 group-hover:text-slate-900 dark:text-neutral-400 dark:group-hover:text-white" />
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
          </div>
        </div>

        {/* ── Video showcase column ────────────────────────────── */}
        <div className="relative w-full">
          <AlternateImageMockup aspectRatioClass="aspect-[930/850]">
            <ContinuousAutoplayVideo
              src="/feed-share-design.mp4"
              poster="/feed-share-design.png"
            />
          </AlternateImageMockup>
        </div>
      </div>
    </section>
  );
};

// Aliased export kept for existing imports elsewhere in the app
export const FeaturesAlternatingLayout01 = ShareDesignFeedSection;
export default ShareDesignFeedSection;
