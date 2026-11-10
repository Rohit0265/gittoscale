import React, { FC, HTMLAttributes } from 'react';
import {
  MessageSquare,
  Zap,
  BarChart3,
  Check,
  ArrowRight,
} from 'lucide-react';
import { cn, cn as cx } from '../lib/utils';

export interface FeaturedIconProps {
  icon: React.ComponentType<{ className?: string }>;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  theme?: string;
  className?: string;
}

export const FeaturedIcon: FC<FeaturedIconProps> = ({
  icon: Icon,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shadow-xs',
        className,
      )}
    >
      <Icon className="h-6 w-6 stroke-[2]" />
    </div>
  );
};

export interface CheckItemTextProps {
  text: string;
  size?: string;
  iconStyle?: string;
  color?: string;
  className?: string;
}

export const CheckItemText: FC<CheckItemTextProps> = ({ text, className }) => {
  return (
    <li className={cn('flex items-start gap-3', className)}>
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
      </div>
      <span className="text-base text-slate-700 dark:text-neutral-300 leading-snug">
        {text}
      </span>
    </li>
  );
};

export const AlternateImageMockup: FC<HTMLAttributes<HTMLDivElement>> = (props) => {
  return (
    <div
      className={cx(
        'size-full rounded-[9.03px] bg-white dark:bg-neutral-900 p-[0.9px] shadow-2xl ring-[0.56px] ring-slate-300 dark:ring-neutral-700 ring-inset md:rounded-[20.08px] md:p-0.5 md:ring-[1.25px] lg:absolute lg:w-auto lg:max-w-none',
        props.className,
      )}
    >
      <div className="size-full rounded-[7.9px] bg-white dark:bg-neutral-900 p-0.5 shadow-inner md:rounded-[17.57px] md:p-[3.5px]">
        <div className="relative size-full overflow-hidden rounded-[6.77px] ring-[0.56px] ring-slate-200 dark:ring-neutral-800 md:rounded-[15.06px] md:ring-[1.25px]">
          {props.children}
        </div>
      </div>
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
      className="flex flex-col gap-12 overflow-hidden bg-white dark:bg-[#090B10] py-16 sm:gap-16 md:gap-20 md:py-24 lg:gap-24 border-t border-slate-200 dark:border-neutral-800 transition-colors"
    >
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 md:text-base">
            Community Feed
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
            Share your design to others
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-neutral-400 md:mt-5 md:text-xl leading-relaxed">
            See what other engineers are building, explore battle-tested system architectures, and publish your own designs to collaborate with the community.
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 sm:gap-16 md:gap-20 md:px-8 lg:gap-24">
        {/* Feature 1: See others' designs and what they are building */}
        <div className="grid grid-cols-1 gap-10 md:gap-20 lg:grid-cols-2 lg:gap-24 items-center">
          <div className="max-w-xl flex-1 self-center">
            <FeaturedIcon icon={MessageSquare} size="lg" color="brand" theme="light" />
            <h2 className="mt-5 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
              See others' designs and what they are building
            </h2>
            <p className="mt-2 text-base text-slate-600 dark:text-neutral-400 md:mt-4 md:text-lg leading-relaxed">
              Explore real-world distributed architectures published by engineers worldwide. Gain direct visibility into how teams configure microservices, load balancers, message queues, and caching layers.
            </p>
            <ul className="mt-8 flex flex-col gap-4 pl-2 md:gap-5 md:pl-4">
              {[
                'Inspect production topologies, cloud setups, and microservice flows',
                'Learn from real capacity benchmarks, P99 latencies, and post-mortems',
                'Fork community blueprints directly into your simulation canvas in one click',
              ].map((feat) => (
                <CheckItemText key={feat} size="md" iconStyle="outlined" color="primary" text={feat} />
              ))}
            </ul>

            <div className="mt-8 pt-4">
              <button
                type="button"
                onClick={handleOpenFeed}
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors cursor-pointer group"
              >
                <span>Explore Community Feed & Posts</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="relative w-full flex-1 h-80 sm:h-96 lg:h-128">
            <AlternateImageMockup className="lg:left-0">
              {/* Light mode image (hidden in dark mode) */}
              <img
                alt="Dashboard mockup showing application interface"
                src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-light-01.webp"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/demo-detailed.png';
                }}
                className="size-full object-contain lg:w-auto lg:max-w-none dark:hidden"
              />
              {/* Dark mode image (hidden in light mode) */}
              <img
                alt="Dashboard mockup showing application interface"
                src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-dark-01.webp"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/demo-detailed.png';
                }}
                className="size-full object-contain hidden dark:block lg:w-auto lg:max-w-none"
              />
            </AlternateImageMockup>
          </div>
        </div>

        {/* Feature 2: Publish your architectures & get peer feedback */}
        <div className="grid grid-cols-1 gap-10 md:gap-20 lg:grid-cols-2 lg:gap-24 items-center">
          <div className="max-w-xl flex-1 self-center lg:order-last">
            <FeaturedIcon icon={Zap} size="lg" color="brand" theme="light" />
            <h2 className="mt-5 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
              Publish your architectures & get peer feedback
            </h2>
            <p className="mt-2 text-base text-slate-600 dark:text-neutral-400 md:mt-4 md:text-lg leading-relaxed">
              Turn your system simulation results into rich community posts. Share your scaling breakthroughs, discuss architectural trade-offs, and receive constructive feedback from senior engineers.
            </p>
            <ul className="mt-8 flex flex-col gap-4 pl-2 md:gap-5 md:pl-4">
              {[
                'Publish interactive architecture graphs with verified simulation metrics',
                'Debate distributed trade-offs (ACID vs BASE, sharding, backpressure)',
                'Attach multi-media diagrams, video walkthroughs, and benchmark logs',
              ].map((feat) => (
                <CheckItemText key={feat} size="md" iconStyle="outlined" color="primary" text={feat} />
              ))}
            </ul>
          </div>

          <div className="relative w-full flex-1 h-80 sm:h-96 lg:h-128">
            <AlternateImageMockup className="lg:right-0">
              {/* Light mode image (hidden in dark mode) */}
              <img
                alt="Dashboard mockup showing application interface"
                src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-light-01.webp"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/demo-basic.png';
                }}
                className="size-full object-contain lg:w-auto lg:max-w-none dark:hidden"
              />
              {/* Dark mode image (hidden in light mode) */}
              <img
                alt="Dashboard mockup showing application interface"
                src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-dark-01.webp"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/demo-basic.png';
                }}
                className="size-full object-contain hidden dark:block lg:w-auto lg:max-w-none"
              />
            </AlternateImageMockup>
          </div>
        </div>

        {/* Feature 3: Bookmark, fork, and test proven topologies */}
        <div className="grid grid-cols-1 gap-10 md:gap-20 lg:grid-cols-2 lg:gap-24 items-center">
          <div className="max-w-xl flex-1 self-center">
            <FeaturedIcon icon={BarChart3} size="lg" color="brand" theme="light" />
            <h2 className="mt-5 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
              Bookmark, fork, and test proven topologies
            </h2>
            <p className="mt-2 text-base text-slate-600 dark:text-neutral-400 md:mt-4 md:text-lg leading-relaxed">
              Never design high-scale systems in isolation. Save your favorite community architectures, duplicate verified setups, and run custom stress simulations under peak burst traffic.
            </p>
            <ul className="mt-8 flex flex-col gap-4 pl-2 md:gap-5 md:pl-4">
              {[
                'Save top-rated architectures directly to your personal library',
                'Stress-test cloned community designs under extreme traffic spikes',
                'Export comprehensive system design specifications and capacity reports',
              ].map((feat) => (
                <CheckItemText key={feat} size="md" iconStyle="outlined" color="primary" text={feat} />
              ))}
            </ul>
          </div>

          <div className="relative w-full flex-1 h-80 sm:h-96 lg:h-128">
            <AlternateImageMockup className="lg:left-0">
              {/* Light mode image (hidden in dark mode) */}
              <img
                alt="Dashboard mockup showing application interface"
                src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-light-01.webp"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/demo-import.png';
                }}
                className="size-full object-contain lg:w-auto lg:max-w-none dark:hidden"
              />
              {/* Dark mode image (hidden in light mode) */}
              <img
                alt="Dashboard mockup showing application interface"
                src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-dark-01.webp"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/demo-import.png';
                }}
                className="size-full object-contain hidden dark:block lg:w-auto lg:max-w-none"
              />
            </AlternateImageMockup>
          </div>
        </div>
                  (e.currentTarget as HTMLImageElement).src = '/demo-import.png';
                }}
                className="size-full object-contain hidden dark:block lg:w-auto lg:max-w-none"
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
