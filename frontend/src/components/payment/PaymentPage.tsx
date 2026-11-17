import React, { useState, useEffect, useCallback } from 'react';
import {
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  Users,
  Cpu,
  Layers,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  Sun,
  Moon,
  ExternalLink,
} from 'lucide-react';
import { api, SubscriptionStatusResponse } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

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
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const res = await api.getPaymentStatus(token);
      setStatus(res);
    } catch (err: any) {
      console.error('[PaymentPage] Failed to fetch subscription status:', err);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Check URL query parameters for return state (e.g. ?status=success or ?action=checkout)
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const checkoutStatus = search.get('status');
    const action = search.get('action');

    if (checkoutStatus === 'success' || checkoutStatus === 'mock_checkout') {
      setFeedbackMessage({
        type: 'success',
        text: 'Your payment was successfully received! Your account is now upgraded to GitToScale Pro with unlimited access.',
      });

      // If mock checkout simulation in test/dev, complete mock payment
      if (checkoutStatus === 'mock_checkout' && user) {
        api.completeMockCheckout(user.id, getAuthToken()).then(() => {
          fetchStatus();
        });
      } else {
        // Poll for subscription activation from webhook
        const interval = setInterval(() => {
          fetchStatus();
        }, 2000);
        setTimeout(() => clearInterval(interval), 10000);
      }
    }

    if (action === 'checkout' && user && !checkoutLoading) {
      handleUpgrade();
    }
  }, [user]);

  const handleUpgrade = async () => {
    if (!user) {
      // Preserve intended purchase action and redirect to signin
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
      const token = getAuthToken();
      const res = await api.createCheckoutSession(token);

      if (res.url) {
        window.location.href = res.url;
      } else {
        throw new Error('No checkout URL received from payment provider');
      }
    } catch (err: any) {
      console.error('[Checkout Error]', err);
      setFeedbackMessage({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Unable to initialize checkout. Please try again.',
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const isPro = status?.plan === 'pro';
  const aiUsed = status?.limits?.aiGenerations?.used || 0;
  const meetingsUsed = status?.limits?.meetings?.used || 0;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'
      }`}
    >
      {/* Top Navbar */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md ${
          isDark ? 'bg-neutral-950/80 border-neutral-800' : 'bg-white/80 border-neutral-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onGoHome}
              className={`p-2 rounded-lg border transition-colors flex items-center gap-2 text-sm font-medium ${
                isDark
                  ? 'border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900'
                  : 'border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to App</span>
            </button>
            <div
              onClick={onGoHome}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-violet-500/20">
                G
              </div>
              <span className="font-bold text-lg tracking-tight">GitToScale</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className={`p-2 rounded-lg border transition-colors ${
                  isDark
                    ? 'border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900'
                    : 'border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {!user ? (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-violet-600 hover:bg-violet-500 transition-colors shadow-sm"
              >
                Sign In
              </button>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    isPro
                      ? 'bg-violet-500/10 text-violet-400 border border-violet-500/30'
                      : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                  }`}
                >
                  {isPro ? 'Pro Member' : 'Free Plan'}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-12 w-full">
        {/* Banner Feedback */}
        {feedbackMessage && (
          <div
            className={`mb-8 p-4 rounded-xl border flex items-start gap-3 animate-in fade-in ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : feedbackMessage.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
            )}
            <div className="flex-1 text-sm font-medium">{feedbackMessage.text}</div>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Polar Subscriptions & Scaling Infrastructure</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Predictable pricing for engineering teams
          </h1>
          <p className="text-base sm:text-lg text-neutral-400 leading-relaxed">
            Design, simulate, and scale cloud architectures. Enjoy unlimited manual editing forever,
            or unlock unlimited AI intelligence and collaborative design rooms with Pro.
          </p>
        </div>

        {/* Current Usage Status Dashboard (for authenticated users) */}
        {status && (
          <div
            className={`mb-12 p-6 rounded-2xl border ${
              isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-white border-neutral-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
                  Current Account Plan
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <h2 className="text-2xl font-bold">{isPro ? 'GitToScale Pro' : 'Free Plan'}</h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                      isPro
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                    }`}
                  >
                    {status.subscriptionStatus}
                  </span>
                </div>
              </div>
              {status.subscription?.expirationDate && (
                <div className="text-xs text-neutral-400">
                  Renews: {new Date(status.subscription.expirationDate).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Quota meters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-neutral-950/60 border-neutral-800/80' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                  <span>AI Architecture Generations</span>
                  <span className="font-semibold text-neutral-200">
                    {isPro ? 'Unlimited' : `${aiUsed} / 3 used`}
                  </span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden mt-2">
                  <div
                    className="bg-violet-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: isPro ? '100%' : `${Math.min(100, (aiUsed / 3) * 100)}%` }}
                  />
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-neutral-950/60 border-neutral-800/80' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                  <span>Collaborative Meetings</span>
                  <span className="font-semibold text-neutral-200">
                    {isPro ? 'Unlimited' : `${meetingsUsed} / 3 created`}
                  </span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden mt-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: isPro ? '100%' : `${Math.min(100, (meetingsUsed / 3) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-neutral-950/60 border-neutral-800/80' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                  <span>Manual Diagram Editing</span>
                  <span className="font-semibold text-emerald-400">100% Unlimited</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden mt-2">
                  <div className="bg-emerald-500 h-2 rounded-full w-full" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 max-w-5xl mx-auto">
          {/* Free Plan Card */}
          <div
            className={`p-8 rounded-3xl border flex flex-col justify-between transition-all ${
              !isPro && user
                ? 'border-neutral-700 bg-neutral-900/50 ring-1 ring-neutral-700'
                : isDark
                ? 'border-neutral-800 bg-neutral-900/30'
                : 'border-neutral-200 bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Free Plan</h3>
                {!isPro && user && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                    Your Active Plan
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-400 mb-6">
                Full-featured manual architecture modeling, simulation, and team discovery.
              </p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-extrabold">$0</span>
                <span className="text-neutral-400 text-sm">/ forever</span>
              </div>

              <div className="space-y-3.5 mb-8 text-sm">
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Unlimited</strong> manual diagram design & node creation
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>3 AI-generated</strong> architectures (prompts & GitHub scans)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>3 live collaborative</strong> design meetings
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited joining of team meetings via invite link</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Real-time traffic & bottleneck simulation engine</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Standard export to PNG, SVG, JSON & Mermaid</span>
                </div>
              </div>
            </div>

            <button
              disabled={!isPro}
              onClick={onGoHome}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold border transition-all ${
                !isPro
                  ? 'border-neutral-800 bg-neutral-800/50 text-neutral-400 cursor-default'
                  : isDark
                  ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-200'
                  : 'border-neutral-300 hover:bg-neutral-100 text-neutral-800'
              }`}
            >
              {!isPro ? 'Current Plan' : 'Downgrade to Free'}
            </button>
          </div>

          {/* Pro Plan Card */}
          <div
            className={`relative p-8 rounded-3xl border flex flex-col justify-between shadow-2xl transition-all ${
              isPro
                ? 'border-emerald-500/50 bg-gradient-to-b from-emerald-950/20 to-neutral-900 ring-2 ring-emerald-500/30'
                : isDark
                ? 'border-violet-500/50 bg-gradient-to-b from-violet-950/30 to-neutral-900 ring-2 ring-violet-500/30'
                : 'border-violet-300 bg-gradient-to-b from-violet-50 to-white ring-2 ring-violet-400/40'
            }`}
          >
            {/* Pill */}
            <div className="absolute -top-3.5 right-8">
              <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md">
                {isPro ? 'Active Subscription' : 'Recommended'}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">GitToScale Pro</h3>
                  <Zap className="w-4 h-4 text-violet-400 fill-violet-400" />
                </div>
              </div>
              <p className="text-sm text-neutral-400 mb-6">
                Uncapped AI generation, unlimited collaborative design rooms, and priority compute.
              </p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-extrabold">$29</span>
                <span className="text-neutral-400 text-sm">/ month</span>
              </div>

              <div className="space-y-3.5 mb-8 text-sm">
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Unlimited</strong> AI-assisted architecture generation
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Unlimited</strong> AI Architect interactive chat
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Unlimited</strong> repository imports & AI architecture scans
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Unlimited</strong> live collaborative meetings
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Unlimited</strong> manual diagram editing & canvas designs
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Priority GPU queue with zero token throttling</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Priority support directly from system architects</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleUpgrade}
              disabled={checkoutLoading || isPro}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isPro
                  ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 cursor-default'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/30'
              }`}
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting to Polar Checkout...</span>
                </>
              ) : isPro ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Active Pro Plan</span>
                </>
              ) : (
                <>
                  <span>Upgrade to Pro</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-8">
            Compare plans & capabilities
          </h2>
          <div
            className={`overflow-x-auto rounded-2xl border ${
              isDark ? 'border-neutral-800 bg-neutral-900/40' : 'border-neutral-200 bg-white'
            }`}
          >
            <table className="w-full text-sm text-left">
              <thead
                className={`border-b text-xs uppercase tracking-wider ${
                  isDark
                    ? 'border-neutral-800 bg-neutral-900/80 text-neutral-400'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-600'
                }`}
              >
                <tr>
                  <th className="py-4 px-6">Feature</th>
                  <th className="py-4 px-6 text-center">Free Plan</th>
                  <th className="py-4 px-6 text-center text-violet-400 font-bold">Pro Plan</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${isDark ? 'divide-neutral-800/80' : 'divide-neutral-200'}`}
              >
                <tr>
                  <td className="py-4 px-6 font-medium">Manual Architecture Diagram Editing</td>
                  <td className="py-4 px-6 text-center text-emerald-400 font-semibold">
                    100% Unlimited
                  </td>
                  <td className="py-4 px-6 text-center text-emerald-400 font-semibold">
                    100% Unlimited
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">AI-Assisted Architecture Generations</td>
                  <td className="py-4 px-6 text-center text-neutral-400">3 Generations</td>
                  <td className="py-4 px-6 text-center text-violet-400 font-bold">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">AI Architect Chat (Interactive Tuning)</td>
                  <td className="py-4 px-6 text-center text-neutral-400">Included in 3 limit</td>
                  <td className="py-4 px-6 text-center text-violet-400 font-bold">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">Repository Architecture Scanning</td>
                  <td className="py-4 px-6 text-center text-neutral-400">Included in 3 limit</td>
                  <td className="py-4 px-6 text-center text-violet-400 font-bold">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">Live Collaborative Meetings (Host)</td>
                  <td className="py-4 px-6 text-center text-neutral-400">3 Live Rooms</td>
                  <td className="py-4 px-6 text-center text-violet-400 font-bold">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">Join Collaborative Meetings</td>
                  <td className="py-4 px-6 text-center text-emerald-400">Unlimited</td>
                  <td className="py-4 px-6 text-center text-emerald-400">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">Traffic & Latency Simulation</td>
                  <td className="py-4 px-6 text-center text-emerald-400">Standard</td>
                  <td className="py-4 px-6 text-center text-violet-400 font-bold">
                    Advanced Multi-Tier
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">Support Tier</td>
                  <td className="py-4 px-6 text-center text-neutral-400">Community</td>
                  <td className="py-4 px-6 text-center text-violet-400 font-bold">Priority 24/7</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div
              className={`p-5 rounded-xl border ${
                isDark ? 'border-neutral-800 bg-neutral-900/40' : 'border-neutral-200 bg-white'
              }`}
            >
              <h3 className="font-semibold text-base mb-2">
                Will I ever be blocked from manually editing my architectures?
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                <strong>Never.</strong> Manual creation, node placement, edge connection, and
                diagram editing are 100% free and unlimited on all plans. The free plan limits only
                apply to AI-powered automatic recommendations and hosting live collaborative
                meetings.
              </p>
            </div>

            <div
              className={`p-5 rounded-xl border ${
                isDark ? 'border-neutral-800 bg-neutral-900/40' : 'border-neutral-200 bg-white'
              }`}
            >
              <h3 className="font-semibold text-base mb-2">
                How does checkout and payment processing work?
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Payments are securely processed through <strong>Polar</strong>, a developer-first
                billing engine. After entering your card details on Polar's secure checkout page,
                your subscription is activated instantaneously via cryptographic webhook verification.
              </p>
            </div>

            <div
              className={`p-5 rounded-xl border ${
                isDark ? 'border-neutral-800 bg-neutral-900/40' : 'border-neutral-200 bg-white'
              }`}
            >
              <h3 className="font-semibold text-base mb-2">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Yes! You can cancel anytime directly from your Polar customer dashboard. Your Pro
                benefits will remain active until the end of your billing cycle.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
