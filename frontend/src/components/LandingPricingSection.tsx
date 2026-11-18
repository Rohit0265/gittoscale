import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { PenHighlight } from './ui/PenShadowLine';
import { PricingCards } from './payment/PricingCards';
import { api, SubscriptionStatusResponse } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export interface LandingPricingSectionProps {
  isDark?: boolean;
  /** Called when a signed-out visitor clicks "Sign Up" on the free card. */
  onOpenSignUp?: () => void;
  /** Fallback auth handler when no dedicated sign-up handler is provided. */
  onOpenAuth?: () => void;
  /** Called when a visitor clicks "Upgrade to Pro". */
  onOpenPayment?: () => void;
  /** Fallback navigation handler. */
  onNavigate?: (route: string) => void;
}

export const LandingPricingSection: React.FC<LandingPricingSectionProps> = ({
  isDark = true,
  onOpenSignUp,
  onOpenAuth,
  onOpenPayment,
  onNavigate,
}) => {
  const { user, getAuthToken } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!user) {
        setStatus(null);
        return;
      }
      try {
        const res = await api.getPaymentStatus(getAuthToken());
        if (!cancelled) setStatus(res);
      } catch (err) {
        console.warn('[LandingPricingSection] status unavailable', err);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user, getAuthToken]);

  const goToPayment = useCallback(() => {
    if (onOpenPayment) {
      onOpenPayment();
      return;
    }
    if (onNavigate) {
      onNavigate('/payment');
      return;
    }
    window.history.pushState({}, '', '/payment');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, [onOpenPayment, onNavigate]);

  const isPro = status?.plan === 'pro';

  return (
    <section
      id="pricing"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 900px' }}
      className="relative w-full overflow-hidden border-t border-slate-200/80 bg-slate-50/70 px-4 py-20 transition-colors dark:border-neutral-900 dark:bg-[#020202] sm:px-6 sm:py-24 lg:px-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-cyan-500/10 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-5xl">
        <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center text-center">
          <h2 className="text-3xl font-black leading-[0.96] tracking-[-0.03em] text-slate-900 dark:text-white sm:text-4xl md:text-[46px]">
            <span className="sm:hidden flex flex-col items-center">
              <PenHighlight className="block w-fit" highlightClassName="bg-slate-400/85 dark:bg-neutral-500/85">
                Start free.
              </PenHighlight>
              <PenHighlight className="mt-1 block w-fit" highlightClassName="bg-slate-400/85 dark:bg-neutral-500/85">
                Scale when you do.
              </PenHighlight>
            </span>
            <span className="hidden sm:block">
              <PenHighlight className="block w-fit" highlightClassName="bg-slate-400/85 dark:bg-neutral-500/85">
                Start free. Scale when you do.
              </PenHighlight>
            </span>
          </h2>

          <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-neutral-400 sm:text-lg">
            Manual diagramming is unlimited on every plan. Upgrade only when you need uncapped AI
            generations and unlimited collaborative rooms.
          </p>
        </div>

        <PricingCards
          isDark={isDark}
          isAuthenticated={Boolean(user)}
          isPro={isPro}
          onSignUp={() => {
            if (onOpenSignUp) onOpenSignUp();
            else if (onOpenAuth) onOpenAuth();
            else goToPayment();
          }}
          onUpgrade={goToPayment}
        />

        <div className="mt-8 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <button
            type="button"
            onClick={goToPayment}
            className="group inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-900 dark:text-neutral-300 dark:decoration-neutral-700 dark:hover:text-white"
          >
            <span>View full plan details</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
          <span className="hidden text-slate-300 dark:text-neutral-700 sm:inline">·</span>
          <span className="text-xs text-slate-500 dark:text-neutral-500">
            Secure checkout via Polar · cancel anytime
          </span>
        </div>
      </div>
    </section>
  );
};

export default LandingPricingSection;
