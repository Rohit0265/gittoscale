import { type FC, type HTMLAttributes, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { PenHighlight } from './ui/PenShadowLine';

export interface ListItemTextProps {
  text: string;
  className?: string;
}

export const ListItemText: FC<ListItemTextProps> = ({ text, className }) => {
  return (
    <li className={cn('flex items-start gap-3.5', className)}>
      <span
        className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-neutral-500"
        aria-hidden="true"
      />
      <span className="text-base text-slate-600 dark:text-neutral-300 leading-relaxed">
        {text}
      </span>
    </li>
  );
};

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
}) => {
  return (
    <div
      className={cn(
        'w-full max-w-xl mx-auto rounded-xl bg-slate-100 dark:bg-neutral-900/90 p-1.5 shadow-2xl ring-1 ring-slate-200/80 dark:ring-neutral-800 md:rounded-2xl md:p-2 transition-all',
        className,
      )}
      {...props}
    >
      <div className="w-full rounded-[10px] bg-white dark:bg-[#0A0A0C] p-1 md:rounded-[14px]">
        <div
          className={cn(
            'relative w-full overflow-hidden rounded-lg ring-1 ring-slate-200/60 dark:ring-neutral-800/80 bg-[#090909]',
            aspectRatioClass,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export interface ContinuousAutoplayVideoProps {
  src: string;
  poster?: string;
  className?: string;
}

export const ContinuousAutoplayVideo: FC<ContinuousAutoplayVideoProps> = ({
  src,
  poster,
  className,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Enforce mute and autoplay properties for seamless silent playback
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;

    const playVideo = () => {
      if (video.paused) {
        const p = video.play();
        if (p !== undefined) {
          p.catch(() => {});
        }
      }
    };

    // Attempt playback immediately
    playVideo();

    // Ensure playback stays active during user scrolling or window visibility changes
    const handleScrollOrInteract = () => {
      playVideo();
    };

    window.addEventListener('scroll', handleScrollOrInteract, { passive: true });
    window.addEventListener('touchstart', handleScrollOrInteract, { passive: true });
    document.addEventListener('visibilitychange', playVideo);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            playVideo();
          }
        });
      },
      { threshold: 0.05 },
    );
    observer.observe(video);

    return () => {
      window.removeEventListener('scroll', handleScrollOrInteract);
      window.removeEventListener('touchstart', handleScrollOrInteract);
      document.removeEventListener('visibilitychange', playVideo);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="relative w-full h-full select-none pointer-events-none overflow-hidden">
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
        onPause={(e) => {
          // Keep continuously playing without stopping
          e.currentTarget.play().catch(() => {});
        }}
        className={cn(
          'w-full h-full object-cover object-top pointer-events-none select-none',
          className,
        )}
      />
    </div>
  );
};

export interface FeaturesAlternatingLayout01Props {
  onNavigate?: (route: string) => void;
  onSelectTestSite?: () => void;
  isDark?: boolean;
}

export const FeaturesAlternatingLayout01: FC<FeaturesAlternatingLayout01Props> = ({
  onNavigate,
  onSelectTestSite: _onSelectTestSite,
  isDark: _isDark,
}) => {
  const handleOpenFeed = () => {
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
      className="flex flex-col gap-12 overflow-hidden bg-white dark:bg-[#020202] py-16 sm:gap-16 md:gap-20 md:py-24 lg:gap-24 border-t border-slate-200/80 dark:border-neutral-800/80 transition-colors"
    >
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
        <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          {/* Ambient Lighting Glow Behind Headline */}
          <div
            className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-72 sm:w-[500px] h-32 bg-gradient-to-r from-indigo-500/15 via-sky-500/20 to-blue-600/15 dark:from-indigo-500/25 dark:via-sky-400/20 dark:to-blue-500/25 blur-3xl rounded-full -z-10"
            aria-hidden="true"
          />
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl md:text-5xl drop-shadow-md dark:drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] [text-shadow:_0_2px_12px_rgba(0,0,0,0.1)] dark:[text-shadow:_0_2px_22px_rgba(255,255,255,0.22)]">
            {/* Mobile View (< sm): separate highlight per line */}
            <span className="sm:hidden flex flex-col items-center">
              <PenHighlight className="mx-auto block w-fit" highlightClassName="bg-slate-400/85 dark:bg-neutral-500/85">
                Share your design
              </PenHighlight>
              <PenHighlight className="mx-auto mt-1 block w-fit" highlightClassName="bg-slate-400/85 dark:bg-neutral-500/85">
                with others
              </PenHighlight>
            </span>
            {/* Desktop View (>= sm) */}
            <span className="hidden sm:block">
              <PenHighlight className="mx-auto block w-fit" highlightClassName="bg-slate-400/85 dark:bg-neutral-500/85">
                Share your design with others
              </PenHighlight>
            </span>
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-neutral-400 sm:text-lg md:text-xl leading-relaxed max-w-2xl">
            See what other engineers are building, explore battle-tested system architectures, and publish your own designs to collaborate with the community.
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 sm:gap-16 md:gap-20 md:px-8 lg:gap-24">
        {/* Feature 1: See others' designs and what they are building */}
        <div className="grid grid-cols-1 gap-10 md:gap-20 lg:grid-cols-2 lg:gap-24 items-center">
          <div className="max-w-xl flex-1 self-center">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl drop-shadow-xs dark:drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
              See others' designs and what they are building
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-neutral-400 sm:text-lg leading-relaxed">
              Explore real-world distributed architectures published by engineers worldwide. Gain direct visibility into how teams configure microservices, load balancers, message queues, and caching layers.
            </p>
            <ul className="mt-8 flex flex-col gap-3.5">
              {[
                'Inspect production topologies, cloud setups, and microservice flows',
                'Learn from real capacity benchmarks, P99 latencies, and post-mortems',
                'Fork community blueprints directly into your simulation canvas in one click',
              ].map((feat) => (
                <ListItemText key={feat} text={feat} />
              ))}
            </ul>

            <div className="mt-8 pt-2">
              <button
                type="button"
                onClick={handleOpenFeed}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white hover:text-slate-600 dark:hover:text-neutral-300 transition-colors group cursor-pointer"
              >
                <span className="underline underline-offset-4 decoration-slate-300 dark:decoration-neutral-700 group-hover:decoration-slate-900 dark:group-hover:decoration-white transition-colors">
                  Explore Community Feed & Posts
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 dark:text-neutral-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>

          <div className="w-full flex-1 flex items-center justify-center">
            <AlternateImageMockup aspectRatioClass="aspect-[16/14] sm:aspect-[950/864]">
              <ContinuousAutoplayVideo
                src="/feed-explore-designs.mp4"
                poster="/feed-explore-designs.png"
                className="hover:scale-[1.01] transition-transform duration-300"
              />
            </AlternateImageMockup>
          </div>
        </div>

        {/* Feature 2: Share your design and projects too */}
        <div className="grid grid-cols-1 gap-10 md:gap-20 lg:grid-cols-2 lg:gap-24 items-center">
          <div className="max-w-xl flex-1 self-center lg:order-last">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl drop-shadow-xs dark:drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
              Share your design , projects and ideas with the community.
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-neutral-400 sm:text-lg leading-relaxed">
              Seamlessly share your verified architecture blueprints, live simulation topologies, and full imported repository projects with colleagues or the engineering community.
            </p>
            <ul className="mt-8 flex flex-col gap-3.5">
              {[
                'Share complete architecture designs with interactive node topologies',
                'Publish imported repository projects, service dependencies, and bottlenecks',
                'Collaborate on scaling solutions, trade-off analyses, and capacity benchmarks',
              ].map((feat) => (
                <ListItemText key={feat} text={feat} />
              ))}
            </ul>
          </div>

          <div className="w-full flex-1 flex items-center justify-center">
            <AlternateImageMockup aspectRatioClass="aspect-[16/11] sm:aspect-[1262/880]">
              <ContinuousAutoplayVideo
                src="/feed-share-design.mp4"
                poster="/feed-share-design.png"
                className="hover:scale-[1.01] transition-transform duration-300"
              />
            </AlternateImageMockup>
          </div>
        </div>
      </div>
    </section>
  );
};

// Aliased exports for flexible usage across LandingPage
export const ShareDesignFeedSection = FeaturesAlternatingLayout01;
export default FeaturesAlternatingLayout01;
