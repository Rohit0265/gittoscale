import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api, SubscriptionStatusResponse } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { PricingCards } from './PricingCards';
import { LandingHeader } from '../LandingHeader';

interface PaymentPageProps {
  onGoHome: () => void;
  onOpenAuth: () => void;
  onOpenSignUp?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({
  onGoHome,
  onOpenAuth,
  onOpenSignUp,
  isDark = true,
  onToggleTheme,
}) => {
  const { user, getAuthToken, savePendingAction } = useAuth();
  const [loading, setLoading] = useState(Boolean(user));
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

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
      setFeedbackMessage({
        type: 'success',
        text: 'Payment received — your account is now on GitToScale Pro.',
      });

      if (checkoutStatus === 'mock_checkout' && user) {
        api.completeMockCheckout(user.id, getAuthToken()).then(() => fetchStatus());
      } else {
        const interval = setInterval(() => fetchStatus(), 2000);
        setTimeout(() => clearInterval(interval), 10000);
      }
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
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark ? 'bg-[#050506] text-neutral-100' : 'bg-neutral-50 text-neutral-900'
      }`}
    >
      {/* Minimal Top Bar */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
          isDark ? 'bg-[#050506]/80 border-neutral-900' : 'bg-white/80 border-neutral-200'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onGoHome}
              aria-label="Back to app"
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                isDark
                  ? 'border-neutral-800 text-neutral-400 hover:bg-neutral-900 hover:text-white'
                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <button
              type="button"
              onClick={onGoHome}
              className="flex cursor-pointer items-center gap-2 select-none"
            >
              <img
                src={isDark ? '/logo.png' : '/logo-light.png'}
                alt="GitToScale"
                className="h-6 w-auto object-contain"
              />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label="Toggle theme"
                className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                  isDark
                    ? 'border-neutral-800 text-neutral-400 hover:bg-neutral-900 hover:text-white'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}

            {!user ? (
              <button
                type="button"
                onClick={onOpenAuth}
                className="cursor-pointer rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-violet-500"
              >
                Sign In
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    isPro
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : isDark
                      ? 'border-neutral-800 bg-neutral-900 text-neutral-400'
                      : 'border-neutral-200 bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {loading ? '…' : isPro ? 'Pro Member' : 'Free Plan'}
                </span>
                {loading && <Loader2 className="h-3 w-3 animate-spin opacity-60" />}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        {feedbackMessage && (
          <div
            className={`mb-8 flex items-start gap-3 rounded-xl border p-4 ${
              feedbackMessage.type === 'success'
                ? isDark
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : isDark
                ? 'border-red-500/30 bg-red-500/10 text-red-300'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p className="flex-1 text-sm font-medium">{feedbackMessage.text}</p>
          </div>
        )}

        <PricingCards
          isDark={isDark}
          isAuthenticated={Boolean(user)}
          isPro={isPro}
          loading={checkoutLoading}
          onSignUp={() => (onOpenSignUp ? onOpenSignUp() : onOpenAuth())}
          onUpgrade={handleUpgrade}
        />
      </main>
    </div>
  );
};
