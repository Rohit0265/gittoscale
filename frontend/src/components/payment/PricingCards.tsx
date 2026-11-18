import React from 'react';
import { Check, Zap, ArrowRight, Loader2, CheckCircle2, Sparkles } from 'lucide-react';

export interface PricingCardsProps {
  /** Explicit dark-mode flag; falls back to neutral dark styling when omitted. */
  isDark?: boolean;
  /** Whether a user session exists. Drives the free-tier CTA state. */
  isAuthenticated: boolean;
  /** Whether the signed-in user is on the Pro plan. */
  isPro: boolean;
  /** Shows a spinner on the Pro CTA while checkout is being created. */
  loading?: boolean;
  /** Free-tier CTA when the visitor is signed out (typically sign up). */
  onSignUp?: () => void;
  /** Pro CTA for signed-out or free-tier users. */
  onUpgrade?: () => void;
  className?: string;
}

const FREE_FEATURES = [
  'Unlimited manual diagram design & node creation',
  '3 AI-generated architectures (prompts & GitHub scans)',
  '3 live collaborative design meetings',
  'Unlimited joining of team meetings via invite link',
  'Real-time traffic & bottleneck simulation engine',
  'Standard export to PNG, SVG, JSON & Mermaid',
];

const PRO_FEATURES = [
  'Unlimited AI-assisted architecture generation',
  'Unlimited AI Architect interactive chat',
  'Unlimited repository imports & AI architecture scans',
  'Unlimited live collaborative meetings',
  'Unlimited manual diagram editing & canvas designs',
  'Priority GPU queue with zero token throttling',
  'Priority support directly from system architects',
];

const FeatureRow: React.FC<{ label: string; isDark: boolean; isWhiteCard?: boolean }> = ({
  label,
  isDark,
  isWhiteCard = false,
}) => (
  <div className="flex items-start gap-3">
    <span
      className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full ${
        isWhiteCard
          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80'
          : isDark
          ? 'bg-emerald-500/10 text-emerald-400'
          : 'bg-emerald-50 text-emerald-600'
      }`}
    >
      <Check className="h-3 w-3" strokeWidth={3} />
    </span>
    <span
      className={`text-[13px] leading-relaxed ${
        isWhiteCard ? 'text-slate-700 font-medium' : isDark ? 'text-neutral-300' : 'text-neutral-600'
      }`}
    >
      {label}
    </span>
  </div>
);

/**
 * Plan cards shared by the landing page pricing section and the /payment route.
 * Only the cards themselves are rendered — no comparison tables, usage meters or FAQs.
 */
export const PricingCards: React.FC<PricingCardsProps> = ({
  isDark = true,
  isAuthenticated,
  isPro,
  loading = false,
  onSignUp,
  onUpgrade,
  className = '',
}) => {
  const isFreeActive = isAuthenticated && !isPro;

  return (
    <div className={`grid grid-cols-1 gap-6 lg:grid-cols-2 ${className}`}>
      {/* ── Free plan ─────────────────────────────────────────────── */}
      <div
        className={`relative flex flex-col justify-between rounded-3xl border p-7 sm:p-8 transition-all duration-300 ${
          isFreeActive
            ? isDark
              ? 'border-neutral-600/80 bg-neutral-900/70 ring-1 ring-neutral-600/60'
              : 'border-neutral-400 bg-white ring-1 ring-neutral-300 shadow-lg'
            : isDark
            ? 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
            : 'border-neutral-200 bg-white shadow-sm hover:border-neutral-300'
        }`}
      >
        <div>
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <span
                className={`text-[10px] font-mono uppercase tracking-[0.18em] ${
                  isDark ? 'text-neutral-500' : 'text-neutral-400'
                }`}
              >
                Starter
              </span>
              <h3 className={`mt-1 text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Free
              </h3>
            </div>
            {isFreeActive && (
              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  isDark
                    ? 'border-neutral-700 bg-neutral-800 text-neutral-300'
                    : 'border-neutral-300 bg-neutral-100 text-neutral-600'
                }`}
              >
                Current plan
              </span>
            )}
          </div>

          <div className="mb-6 flex items-baseline gap-1.5">
            <span className={`text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              $0
            </span>
            <span className={`text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>/ forever</span>
          </div>

          <div className="mb-7 space-y-3 border-t pt-6" style={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }}>
            {FREE_FEATURES.map((feature) => (
              <FeatureRow key={feature} label={feature} isDark={isDark} />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!isAuthenticated) onSignUp?.();
          }}
          disabled={isAuthenticated}
          className={`group flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
            isAuthenticated
              ? isDark
                ? 'cursor-default border border-neutral-800 bg-neutral-800/40 text-neutral-500'
                : 'cursor-default border border-neutral-200 bg-neutral-100 text-neutral-500'
              : isDark
              ? 'cursor-pointer bg-white text-neutral-950 hover:bg-neutral-200 shadow-sm'
              : 'cursor-pointer bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm'
          }`}
        >
          {!isAuthenticated ? (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Sign Up</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>{isPro ? 'Included in Pro' : 'Current Plan'}</span>
            </>
          )}
        </button>
      </div>

      {/* ── Pro plan (Premium White Card) ─────────────────────────── */}
      <div
        className={`relative flex flex-col justify-between overflow-hidden rounded-3xl p-7 sm:p-8 transition-all duration-300 ${
          isPro
            ? 'bg-white text-slate-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/15 ring-4 ring-emerald-500/10'
            : 'bg-white text-slate-900 border border-slate-200/90 shadow-2xl shadow-indigo-500/15 ring-2 ring-indigo-500/10 hover:border-indigo-300 hover:shadow-indigo-500/25'
        }`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full blur-3xl bg-indigo-500/10"
        />

        <div className="relative">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-indigo-600">
                Full access
              </span>
              <h3 className="mt-1 flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-950">
                GitToScale Pro
                <Zap className="h-4 w-4 fill-current text-indigo-600" />
              </h3>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${
                isPro
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600'
              }`}
            >
              {isPro ? 'Active' : 'Recommended'}
            </span>
          </div>

          <div className="mb-6 flex items-baseline gap-1.5">
            <span className="text-4xl font-extrabold tracking-tight text-slate-950">
              $29
            </span>
            <span className="text-sm font-medium text-slate-500">/ month</span>
          </div>

          <div className="mb-7 space-y-3 border-t border-slate-100 pt-6">
            {PRO_FEATURES.map((feature) => (
              <FeatureRow key={feature} label={feature} isDark={isDark} isWhiteCard={true} />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!isPro) onUpgrade?.();
          }}
          disabled={isPro || loading}
          className={`relative flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
            isPro
              ? 'cursor-default border border-emerald-500/30 bg-emerald-50 text-emerald-700'
              : 'cursor-pointer bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.99]'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Connecting to checkout…</span>
            </>
          ) : isPro ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Active Pro Plan</span>
            </>
          ) : (
            <>
              <span>Upgrade to Pro</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PricingCards;
