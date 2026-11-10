import type { FC, HTMLAttributes } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

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

export const AlternateImageMockup: FC<HTMLAttributes<HTMLDivElement>> = (props) => {
  return (
    <div
      className={cn(
        'size-full rounded-xl bg-slate-100 dark:bg-neutral-900 p-1 shadow-xl ring-1 ring-slate-200/80 dark:ring-neutral-800 md:rounded-2xl md:p-1.5 lg:absolute lg:w-auto lg:max-w-none transition-colors',
        props.className,
      )}
    >
      <div className="size-full rounded-[10px] bg-white dark:bg-[#0A0A0C] p-0.5 md:rounded-[14px] md:p-1">
        <div className="relative size-full overflow-hidden rounded-lg ring-1 ring-slate-200/60 dark:ring-neutral-800/80">
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
      className="flex flex-col gap-12 overflow-hidden bg-white dark:bg-[#020202] py-16 sm:gap-16 md:gap-20 md:py-24 lg:gap-24 border-t border-slate-200/80 dark:border-neutral-800/80 transition-colors"
    >
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
            Share your design to others
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
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
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

        {/* Feature 2: Share your design and projects too */}
        <div className="grid grid-cols-1 gap-10 md:gap-20 lg:grid-cols-2 lg:gap-24 items-center">
          <div className="max-w-xl flex-1 self-center lg:order-last">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Now you can even share your design and projects too
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
      </div>
    </section>
  );
};

// Aliased exports for flexible usage across LandingPage
export const ShareDesignFeedSection = FeaturesAlternatingLayout01;
export default FeaturesAlternatingLayout01;
