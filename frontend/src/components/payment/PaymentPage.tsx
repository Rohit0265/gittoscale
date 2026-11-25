import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { api, SubscriptionStatusResponse } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { PricingCards } from './PricingCards';
import { Fotter } from '../Fotter';
import { LandingHeader } from '../LandingHeader';

interface PaymentPageProps {
  onGoHome: () => void;
  onOpenAuth: () => void;
  onOpenSignUp?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onNavigate?: (route: string) => void;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({
  onGoHome,
  onOpenAuth,
  onOpenSignUp,
  isDark = true,
  onToggleTheme,
  onNavigate,
}) => {
  const { user, getAuthToken, savePendingAction } = useAuth();
  const [_loading, setLoading] = useState(Boolean(user));
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Auto-hide the success popup after 5 seconds
  useEffect(() => {
    if (!showSuccessPopup) return;
    const timer = setTimeout(() => {
      setShowSuccessPopup(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [showSuccessPopup]);

  const fetchStatus = useCallback(async () => {
    if (!getAuthToken()) {
      setStatus(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.getPaymentStatus(getAuthToken());
      setStatus(res);
    } catch (err: any) {
      console.error('[PaymentPage] Failed to fetch subscription status:', err);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus, user]);

  // Handle return state from the payment provider (?status=success / ?action=checkout)
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const checkoutStatus = search.get('status');
    const action = search.get('action');

    if (checkoutStatus === 'success' || checkoutStatus === 'mock_checkout') {
      const sessionId = search.get('session_id');
      setShowSuccessPopup(true);

      if (checkoutStatus === 'mock_checkout' && user) {
        api.completeMockCheckout(user.id, getAuthToken()).then(() => fetchStatus());
      } else if (checkoutStatus === 'success' && sessionId) {
        api
          .confirmCheckoutSession(sessionId, getAuthToken())
          .then((res) => {
            if (res.success) {
              fetchStatus();
            }
          })
          .catch((err) => {
            console.warn('[PaymentPage] confirmCheckoutSession warning:', err);
          });
      }

      // Clean query params from URL so refreshing doesn't re-trigger
      window.history.replaceState({}, '', '/payment');

      const interval = setInterval(() => fetchStatus(), 1500);
      const timer = setTimeout(() => clearInterval(interval), 10000);
      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }

    if (action === 'checkout' && user && !checkoutLoading) {
      handleUpgrade();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleUpgrade = async () => {
    if (!user) {
      savePendingAction({
        type: 'payment',
        action: 'checkout',
        returnUrl: '/payment?action=checkout',
        createdAt: Date.now(),
      });
      onOpenAuth();
      return;
    }

    try {
      setCheckoutLoading(true);
      setFeedbackMessage(null);
      const res = await api.createCheckoutSession(getAuthToken());

      if (res.url) {
        window.location.href = res.url;
      } else {
        throw new Error('No checkout URL received from payment provider');
      }
    } catch (err: any) {
      console.error('[Checkout Error]', err);
      setFeedbackMessage({
        type: 'error',
        text:
          err?.response?.data?.message ||
          err?.message ||
          'Unable to initialize checkout. Please try again.',
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const isPro = status?.plan === 'pro';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 scroll-smooth ${
        isDark ? 'bg-[#050506] text-neutral-100' : 'bg-neutral-50 text-neutral-900'
      }`}
    >
      {/* Floating Pill Landing Header */}
      <LandingHeader
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onGoHome={onGoHome}
        onOpenAuth={onOpenAuth}
        onOpenSignUp={onOpenSignUp}
        onNavigate={onNavigate}
        isApp={false}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-20 pb-12 sm:pt-24 sm:px-6">
        {feedbackMessage && feedbackMessage.type === 'error' && (
          <div
            className={`mb-8 flex items-start gap-3 rounded-xl border p-4 ${
              isDark
                ? 'border-red-500/30 bg-red-500/10 text-red-300'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1 text-sm font-medium">{feedbackMessage.text}</p>
          </div>
        )}

        {/* Heading & Subheading */}
        <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-neutral-900 dark:text-white">
            Predictable pricing for engineering teams
          </h1>
          <p className="mt-4 text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg">
            Design, simulate, and scale cloud architectures. Enjoy unlimited manual editing forever, or unlock unlimited AI intelligence and collaborative design rooms with Pro.
          </p>
        </div>

        <PricingCards
          isDark={isDark}
          isAuthenticated={Boolean(user)}
          isPro={isPro}
          loading={checkoutLoading}
          onSignUp={() => (onOpenSignUp ? onOpenSignUp() : onOpenAuth())}
          onUpgrade={handleUpgrade}
        />
      </main>

      {/* ── Centered Payment Success Pop-up Modal (5s auto-hide, Seen, Close button) ── */}
      {showSuccessPopup && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowSuccessPopup(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-md overflow-hidden rounded-3xl border p-6 sm:p-8 text-center shadow-2xl transition-all animate-in zoom-in-95 duration-200 ${
              isDark
                ? 'border-neutral-800 bg-[#0c0c0e] text-white shadow-black/80'
                : 'border-slate-200 bg-white text-slate-900 shadow-slate-300/60'
            }`}
          >
            {/* Close 'X' cross button */}
            <button
              type="button"
              onClick={() => setShowSuccessPopup(false)}
              aria-label="Close"
              className={`absolute top-4 right-4 rounded-xl p-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              <X className="h-5 w-5" />
            </button>

            {/* Success Icon Badge */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>

            {/* Title & Description */}
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Payment done, you are now Pro!
            </h3>
            <p className={`mt-2 text-sm leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              Your account has been upgraded to GitToScale Pro. Unlimited AI generations, live collaborative rooms, and scaling simulations are now unlocked.
            </p>

            {/* Dismiss CTA & Auto-hide indicator */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowSuccessPopup(false)}
                className={`w-full cursor-pointer rounded-xl py-3 text-sm font-bold shadow-md transition-all ${
                  isDark
                    ? 'bg-white text-neutral-950 hover:bg-neutral-200'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                Start Using Pro
              </button>
              <p className={`mt-2.5 text-[11px] font-mono ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                Auto-closing in 5 seconds
              </p>
            </div>
          </div>
        </div>
      )}

      <Fotter brandName="GitToScale" isDark={isDark} onNavigate={onNavigate} />
    </div>
  );
};
