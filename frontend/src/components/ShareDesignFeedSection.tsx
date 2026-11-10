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
            Features
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
            Beautiful analytics to grow smarter
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-neutral-400 md:mt-5 md:text-xl leading-relaxed">
            Powerful, self-serve product and growth analytics to help you convert, engage, and retain more users. Trusted by over 4,000 startups.
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 sm:gap-16 md:gap-20 md:px-8 lg:gap-24">
        {/* Feature 1: Share team inboxes */}
        <div className="grid grid-cols-1 gap-10 md:gap-20 lg:grid-cols-2 lg:gap-24 items-center">
          <div className="max-w-xl flex-1 self-center">
            <FeaturedIcon icon={MessageSquare} size="lg" color="brand" theme="light" />
            <h2 className="mt-5 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
              Share team inboxes
            </h2>
            <p className="mt-2 text-base text-slate-600 dark:text-neutral-400 md:mt-4 md:text-lg leading-relaxed">
              Whether you have a team of 2 or 200, our shared team inboxes keep everyone on the same page and in the loop.
            </p>
            <ul className="mt-8 flex flex-col gap-4 pl-2 md:gap-5 md:pl-4">
              {[
                'Leverage automation to move fast',
                'Always give customers a human to chat to',
                'Automate customer support and close leads faster',
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
                <span>Explore Community Posts & Designs</span>
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

        {/* Feature 2: Deliver instant answers (Reversed: Image Left, Text Right) */}
        <div className="grid grid-cols-1 gap-10 md:gap-20 lg:grid-cols-2 lg:gap-24 items-center">
          <div className="max-w-xl flex-1 self-center lg:order-last">
            <FeaturedIcon icon={Zap} size="lg" color="brand" theme="light" />
            <h2 className="mt-5 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
              Deliver instant answers
            </h2>
            <p className="mt-2 text-base text-slate-600 dark:text-neutral-400 md:mt-4 md:text-lg leading-relaxed">
              An all-in-one customer service platform that helps you balance everything your customers need to be happy.
            </p>
            <ul className="mt-8 flex flex-col gap-4 pl-2 md:gap-5 md:pl-4">
              {[
                'Keep your customers in the loop with live chat',
                'Embed help articles right on your website',
                'Customers never have to leave the page to find an answer',
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

        {/* Feature 3: Manage your team with reports */}
        <div className="grid grid-cols-1 gap-10 md:gap-20 lg:grid-cols-2 lg:gap-24 items-center">
          <div className="max-w-xl flex-1 self-center">
            <FeaturedIcon icon={BarChart3} size="lg" color="brand" theme="light" />
            <h2 className="mt-5 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
              Manage your team with reports
            </h2>
            <p className="mt-2 text-base text-slate-600 dark:text-neutral-400 md:mt-4 md:text-lg leading-relaxed">
              Measure what matters with Untitled's easy-to-use reports. You can filter, export, and drilldown on the data in a couple clicks.
            </p>
            <ul className="mt-8 flex flex-col gap-4 pl-2 md:gap-5 md:pl-4">
              {[
                'Filter, export, and drilldown on the data quickly',
                'Save, schedule, and automate reports to your inbox',
                'Connect the tools you already use with 100+ integrations',
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
      </div>
    </section>
  );
};

// Aliased exports for flexible usage across LandingPage
export const ShareDesignFeedSection = FeaturesAlternatingLayout01;
export default FeaturesAlternatingLayout01;
