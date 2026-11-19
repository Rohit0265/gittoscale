import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { api, SubscriptionStatusResponse } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { PricingCards } from './PricingCards';
import { LandingHeader } from '../LandingHeader';
import { Fotter } from '../Fotter';

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
      const sessionId = search.get('session_id');

      if (checkoutStatus === 'mock_checkout' && user) {
        setFeedbackMessage({
          type: 'success',
          text: 'Payment received — your account is now on GitToScale Pro.',
        });
        api.completeMockCheckout(user.id, getAuthToken()).then(() => fetchStatus());
      } else if (checkoutStatus === 'success') {
        setFeedbackMessage({
          type: 'success',
          text: 'Payment received — activating your GitToScale Pro account…',
        });
        if (sessionId) {
          api
            .confirmCheckoutSession(sessionId, getAuthToken())
            .then((res) => {
              if (res.success) {
                setFeedbackMessage({
                  type: 'success',
                  text: 'Payment verified! Your account is now on GitToScale Pro.',
                });
                fetchStatus();
              }
            })
            .catch((err) => {
              console.warn('[PaymentPage] confirmCheckoutSession warning:', err);
            });
        }
      }

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
      {/* Landing Page Navbar Header */}
      <LandingHeader
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onGoHome={onGoHome}
        onOpenAuth={onOpenAuth}
        onOpenSignUp={onOpenSignUp}
        onOpenHistory={() => {
          window.history.pushState({}, '', '/history');
          onGoHome();
        }}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-28 pb-16 sm:px-6 sm:pt-32 sm:pb-20">
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

      <Fotter brandName="GitToScale" isDark={isDark} onNavigate={onNavigate} />
    </div>
  );
};
