import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  Clock,
  RefreshCw,
  Sparkles,
  Receipt,
  X,
} from 'lucide-react';
import { api, PaymentHistoryResponse, UserTransactionItem } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Fotter } from '../Fotter';
import { LandingHeader } from '../LandingHeader';
import { WanderingEyes } from '../loading-ui/wandering-eyes';

interface PaymentHistoryPageProps {
  onGoHome: () => void;
  onOpenAuth: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onNavigate?: (route: string) => void;
}

export const PaymentHistoryPage: React.FC<PaymentHistoryPageProps> = ({
  onGoHome,
  onOpenAuth,
  isDark = true,
  onToggleTheme,
  onNavigate,
}) => {
  const { user, getAuthToken } = useAuth();
  const [data, setData] = useState<PaymentHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fetchHistory = useCallback(async () => {
    const token = getAuthToken();
    if (!token && !user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.getPaymentHistory(token);
      setData(res);
    } catch (err: any) {
      console.error('[PaymentHistoryPage] Failed to fetch payment history:', err);
      setActionMessage({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Failed to load payment history',
      });
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleCancelSubscription = async () => {
    try {
      setCanceling(true);
      const token = getAuthToken();
      const res = await api.cancelSubscription(token);
      setActionMessage({
        type: 'success',
        text: res.message || 'Subscription canceled successfully',
      });
      setCancelModalOpen(false);
      await fetchHistory();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Failed to cancel subscription',
      });
    } finally {
      setCanceling(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const isPro = data?.subscription?.isPro;
  const isCanceled = data?.subscription?.status === 'canceled';

  return (
    <div className={`min-h-screen w-full flex flex-col transition-colors ${
      isDark ? 'bg-[#060709] text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Floating Pill Landing Header */}
      <LandingHeader
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onGoHome={onGoHome}
        onOpenAuth={onOpenAuth}
        onNavigate={onNavigate}
        isApp={false}
      />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-20 pb-12 sm:pt-24 sm:px-6">
        {/* Page Title */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Payment &amp; Subscription History
            </h1>
            <p className={`mt-1 text-xs sm:text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              Manage your active GitToScale plan, review past receipts, and view billing details.
            </p>
          </div>

          <button
            onClick={fetchHistory}
            disabled={loading}
            className={`self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isDark
                ? 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {actionMessage && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${
              actionMessage.type === 'success'
                ? isDark
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : isDark
                ? 'border-red-500/30 bg-red-500/10 text-red-300'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            )}
            <p className="flex-1 text-xs sm:text-sm font-medium">{actionMessage.text}</p>
            <button
              onClick={() => setActionMessage(null)}
              className="p-1 hover:opacity-70 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {!user ? (
          <div className={`p-8 text-center rounded-2xl border ${
            isDark ? 'border-neutral-800 bg-[#0C0C0E]' : 'border-slate-200 bg-white'
          }`}>
            <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-neutral-500 stroke-1" />
            <h3 className="text-base font-bold mb-1">Sign in to view your billing history</h3>
            <p className={`text-xs max-w-md mx-auto mb-4 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
              Please sign in with your account to access your transaction records, active subscriptions, and receipts.
            </p>
            <button
              onClick={onOpenAuth}
              className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all cursor-pointer"
            >
              Sign In to Account
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-8 text-indigo-500">
              <WanderingEyes className="w-full h-full" />
            </div>
            <span className="text-xs text-slate-500 dark:text-neutral-400">Loading your payment records...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* 1. Current Plan Card */}
            <div className={`rounded-2xl border p-5 sm:p-6 transition-all ${
              isPro
                ? isDark
                  ? 'border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-[#0C0C0E] to-[#0C0C0E]'
                  : 'border-indigo-200 bg-gradient-to-br from-indigo-50/60 via-white to-white'
                : isDark
                ? 'border-neutral-800 bg-[#0C0C0E]'
                : 'border-slate-200 bg-white'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    isPro
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : isDark
                      ? 'bg-neutral-800 text-neutral-400'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isPro ? <Sparkles className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold">
                        {isPro ? 'GitToScale Pro Plan' : 'GitToScale Free Plan'}
                      </h2>
                      {isPro ? (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                          isCanceled
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                        }`}>
                          {isCanceled ? 'Canceled' : 'Activated'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                          Active
                        </span>
                      )}
                    </div>

                    <p className={`mt-1 text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                      {isPro
                        ? isCanceled
                          ? `Subscription will terminate on ${formatDate(data?.subscription?.expirationDate)}. You keep Pro access until then.`
                          : 'Recurring monthly billing active (₹299/mo). Unlimited AI architectures & live collaboration.'
                        : 'Basic tier with manual system design canvas, 3 AI generations, and 3 meeting rooms.'}
                    </p>
                  </div>
                </div>

                {/* Actions / Expiry Info */}
                <div className="flex flex-col sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-neutral-800">
                  {isPro && data?.subscription?.expirationDate && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Expiry: <strong>{formatDate(data.subscription.expirationDate)}</strong></span>
                    </div>
                  )}

                  {isPro && !isCanceled ? (
                    <button
                      type="button"
                      onClick={() => setCancelModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold transition-all cursor-pointer"
                    >
                      Cancel Subscription
                    </button>
                  ) : !isPro ? (
                    <button
                      type="button"
                      onClick={() => (onNavigate ? onNavigate('payment') : onGoHome())}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                    >
                      Upgrade to Pro (₹299/mo)
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* 2. Transactions Table Card */}
            <div className={`rounded-2xl border overflow-hidden ${
              isDark ? 'border-neutral-800 bg-[#0C0C0E]' : 'border-slate-200 bg-white'
            }`}>
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-neutral-800/80 flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold">Transaction History</h3>
                  <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                    List of all recorded payments and plan activations.
                  </p>
                </div>
                <span className={`text-xs font-mono px-2.5 py-1 rounded-lg ${
                  isDark ? 'bg-neutral-900 text-neutral-400' : 'bg-slate-100 text-slate-600'
                }`}>
                  {data?.transactions?.length || 0} Transactions
                </span>
              </div>

              {data?.transactions && data.transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b ${isDark ? 'border-neutral-800 bg-neutral-900/40 text-neutral-400' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
                        <th className="py-3 px-4 font-semibold">Transaction ID</th>
                        <th className="py-3 px-4 font-semibold">Plan</th>
                        <th className="py-3 px-4 font-semibold">Amount</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold">Start Date</th>
                        <th className="py-3 px-4 font-semibold">Expiry Date</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-neutral-800/60' : 'divide-slate-100'}`}>
                      {data.transactions.map((tx: UserTransactionItem) => {
                        const isCurrentActive = isPro && (tx.status === 'paid' || tx.status === 'activated');
                        return (
                          <tr
                            key={tx.id}
                            className={`transition-colors ${
                              isDark ? 'hover:bg-neutral-900/40' : 'hover:bg-slate-50/70'
                            }`}
                          >
                            {/* Transaction ID */}
                            <td className="py-3.5 px-4 font-mono text-[11px] font-medium text-slate-700 dark:text-neutral-300">
                              {tx.id}
                            </td>

                            {/* Plan */}
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {tx.plan.toUpperCase()}
                              </span>
                            </td>

                            {/* Amount */}
                            <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                              {tx.currency === 'INR' ? '₹' : '$'}
                              {tx.amount}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              {isCurrentActive ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Activated</span>
                                </span>
                              ) : tx.status === 'canceled' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                                  <Clock className="w-3 h-3" />
                                  <span>Canceled</span>
                                </span>
                              ) : tx.status === 'refunded' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/30">
                                  <XCircle className="w-3 h-3" />
                                  <span>Refunded</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300">
                                  <span>{tx.status}</span>
                                </span>
                              )}
                            </td>

                            {/* Start Date */}
                            <td className="py-3.5 px-4 text-slate-500 dark:text-neutral-400">
                              {formatDate(tx.start_date)}
                            </td>

                            {/* Expiry Date */}
                            <td className="py-3.5 px-4 text-slate-500 dark:text-neutral-400 font-mono">
                              {formatDate(tx.expires_at)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 px-4 text-center">
                  <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-neutral-700" />
                  <p className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                    No transactions recorded yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Cancellation Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`relative w-full max-w-sm rounded-2xl border p-6 text-center shadow-2xl ${
            isDark ? 'border-neutral-800 bg-[#0C0C0E] text-white' : 'border-slate-200 bg-white text-slate-900'
          }`}>
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold mb-1">Cancel Subscription?</h3>
            <p className={`text-xs mb-5 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              Are you sure you want to cancel your GitToScale Pro subscription? You will retain all Pro benefits until the end of your billing cycle ({formatDate(data?.subscription?.expirationDate)}).
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                  isDark ? 'border-neutral-800 hover:bg-neutral-800 text-neutral-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                Keep Plan
              </button>
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={canceling}
                className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
              >
                {canceling ? 'Canceling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Fotter brandName="GitToScale" isDark={isDark} onNavigate={onNavigate} />
    </div>
  );
};
