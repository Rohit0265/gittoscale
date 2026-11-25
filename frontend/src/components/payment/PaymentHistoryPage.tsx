import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  Clock,
  RefreshCw,
  Receipt,
  X,
  ArrowRight,
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

  const isPro = Boolean(data?.subscription?.isPro);
  const isCanceled = data?.subscription?.status === 'canceled';
  const hasPurchased = isPro || (data?.transactions && data.transactions.length > 0);
  const expirationDate = data?.subscription?.expirationDate;
  const isExpired = Boolean(expirationDate && new Date(expirationDate).getTime() < Date.now());

  return (
    <div className={`min-h-screen w-full flex flex-col transition-colors ${
      isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-950'
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
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-20 pb-16 sm:pt-24 sm:px-6">
        {/* Header Title: Transaction History */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Transaction History
            </h1>
            <p className={`mt-1 text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              List of all recorded payments, active plans, and billing receipts.
            </p>
          </div>

          <button
            onClick={fetchHistory}
            disabled={loading}
            className={`self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              isDark
                ? 'border-gray-800 bg-gray-900/80 hover:bg-gray-800 text-gray-200'
                : 'border-gray-300 bg-white hover:bg-gray-100 text-gray-800'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {actionMessage && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-lg border p-4 ${
              actionMessage.type === 'success'
                ? isDark
                  ? 'border-gray-700 bg-gray-900 text-gray-100'
                  : 'border-gray-300 bg-gray-100 text-gray-900'
                : isDark
                ? 'border-gray-700 bg-gray-900 text-gray-200'
                : 'border-gray-300 bg-gray-100 text-gray-900'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-white" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
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
          <div className={`p-8 text-center rounded-xl border ${
            isDark ? 'border-gray-800 bg-gray-950 text-white' : 'border-gray-200 bg-white text-gray-900'
          }`}>
            <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-400 stroke-1" />
            <h3 className="text-base font-bold mb-1">Sign in to view your billing history</h3>
            <p className={`text-xs max-w-md mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Please sign in with your account to access your transaction records, active subscriptions, and receipts.
            </p>
            <button
              onClick={onOpenAuth}
              className={`px-5 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer ${
                isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              Sign In to Account
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className={`w-16 h-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <WanderingEyes className="w-full h-full" />
            </div>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading your transaction records...
            </span>
          </div>
        ) : (
          <div className={`rounded-xl border overflow-hidden ${
            isDark ? 'border-gray-800 bg-gray-950 text-white' : 'border-gray-200 bg-white text-gray-900'
          }`}>
            {/* Top Bar inside Transaction History Card */}
            <div className={`p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDark ? 'border-gray-800 bg-gray-900/40' : 'border-gray-200 bg-gray-50/70'
            }`}>
              <div>
                <h2 className="text-sm sm:text-base font-bold">Transaction History</h2>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Overview of your plan status, payment records, and subscriptions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isPro && !isCanceled && (
                  <button
                    type="button"
                    onClick={() => setCancelModalOpen(true)}
                    className={`px-2.5 py-1 rounded-md border text-xs font-semibold transition-colors cursor-pointer ${
                      isDark
                        ? 'border-gray-700 bg-transparent hover:bg-gray-800 text-gray-300'
                        : 'border-gray-300 bg-transparent hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    Cancel Subscription
                  </button>
                )}
                {isExpired && (
                  <button
                    type="button"
                    onClick={() => (onNavigate ? onNavigate('payment') : onGoHome())}
                    className={`px-3 py-1 rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    <span>Renew your plans</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                <span className={`text-xs font-mono px-2.5 py-1 rounded-md border ${
                  isDark
                    ? 'border-gray-800 bg-black text-gray-400'
                    : 'border-gray-200 bg-gray-100 text-gray-600'
                }`}>
                  {data?.transactions?.length || 0} Transactions
                </span>
              </div>
            </div>

            {/* Condition 1: No Plan Purchased -> Show Purchase Pro / Premium */}
            {!hasPurchased ? (
              <div className="py-16 px-6 text-center flex flex-col items-center justify-center max-w-md mx-auto">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 border ${
                  isDark ? 'border-gray-800 bg-gray-900 text-gray-300' : 'border-gray-200 bg-gray-100 text-gray-700'
                }`}>
                  <CreditCard className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h3 className="text-base font-bold mb-1.5">No Active Plan</h3>
                <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  You do not have an active subscription yet. Purchase GitToScale Pro or Premium to unlock unlimited AI system design architectures, high-load simulations, and collaborative meeting rooms.
                </p>
                <button
                  type="button"
                  onClick={() => (onNavigate ? onNavigate('payment') : onGoHome())}
                  className={`px-5 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-2 ${
                    isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  <span>Purchase GitToScale Pro</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* Condition 2: Plan Purchased / Has Transactions -> Show Table & Renew if expired */
              <div>
                {/* Active or Expired Plan Banner */}
                {isExpired ? (
                  <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDark ? 'border-gray-800 bg-gray-900/60' : 'border-gray-200 bg-gray-100/70'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold">Your plan has expired</p>
                        <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Expired on {formatDate(expirationDate)}. Renew now to restore full Pro access.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => (onNavigate ? onNavigate('payment') : onGoHome())}
                      className={`px-4 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all cursor-pointer ${
                        isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      Renew your plans
                    </button>
                  </div>
                ) : isPro ? (
                  <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDark ? 'border-gray-800 bg-gray-900/30' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${isDark ? 'text-white' : 'text-black'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">GitToScale Pro</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            isDark
                              ? 'border-gray-700 bg-gray-900 text-white'
                              : 'border-gray-300 bg-gray-200 text-gray-900'
                          }`}>
                            {isCanceled ? 'Canceled' : 'Activated'}
                          </span>
                        </div>
                        <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {isCanceled
                            ? `Terminates on ${formatDate(expirationDate)}. You retain Pro benefits until then.`
                            : `Active subscription • Next renewal on ${formatDate(expirationDate)}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {expirationDate && (
                        <div className={`flex items-center gap-1 font-mono text-[11px] ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Expiry: <strong>{formatDate(expirationDate)}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Transactions Table */}
                {data?.transactions && data.transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className={`border-b ${
                          isDark ? 'border-gray-800 bg-gray-900/50 text-gray-400' : 'border-gray-200 bg-gray-100/70 text-gray-600'
                        }`}>
                          <th className="py-3 px-4 font-semibold">Transaction ID</th>
                          <th className="py-3 px-4 font-semibold">Plan</th>
                          <th className="py-3 px-4 font-semibold">Amount</th>
                          <th className="py-3 px-4 font-semibold">Status</th>
                          <th className="py-3 px-4 font-semibold">Start Date</th>
                          <th className="py-3 px-4 font-semibold">Expiry Date</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-gray-800/80' : 'divide-gray-200'}`}>
                        {data.transactions.map((tx: UserTransactionItem) => {
                          const isCurrentActive = isPro && (tx.status === 'paid' || tx.status === 'activated');
                          return (
                            <tr
                              key={tx.id}
                              className={`transition-colors ${
                                isDark ? 'hover:bg-gray-900/40' : 'hover:bg-gray-100/60'
                              }`}
                            >
                              {/* Transaction ID */}
                              <td className={`py-3.5 px-4 font-mono text-[11px] font-medium ${
                                isDark ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {tx.id}
                              </td>

                              {/* Plan */}
                              <td className="py-3.5 px-4 font-semibold">
                                {tx.plan.toUpperCase()}
                              </td>

                              {/* Amount */}
                              <td className="py-3.5 px-4 font-semibold">
                                {tx.currency === 'INR' ? '₹' : '$'}
                                {tx.amount}
                              </td>

                              {/* Status */}
                              <td className="py-3.5 px-4">
                                {isCurrentActive ? (
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                                    isDark
                                      ? 'border-gray-700 bg-gray-900 text-white'
                                      : 'border-gray-300 bg-gray-200 text-gray-950'
                                  }`}>
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Activated</span>
                                  </span>
                                ) : tx.status === 'canceled' ? (
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                                    isDark
                                      ? 'border-gray-800 bg-gray-950 text-gray-400'
                                      : 'border-gray-300 bg-gray-100 text-gray-700'
                                  }`}>
                                    <Clock className="w-3 h-3" />
                                    <span>Canceled</span>
                                  </span>
                                ) : tx.status === 'refunded' ? (
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                                    isDark
                                      ? 'border-gray-800 bg-gray-950 text-gray-400'
                                      : 'border-gray-300 bg-gray-100 text-gray-700'
                                  }`}>
                                    <XCircle className="w-3 h-3" />
                                    <span>Refunded</span>
                                  </span>
                                ) : (
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                                    isDark
                                      ? 'border-gray-800 bg-gray-900 text-gray-300'
                                      : 'border-gray-200 bg-gray-100 text-gray-800'
                                  }`}>
                                    <span>{tx.status}</span>
                                  </span>
                                )}
                              </td>

                              {/* Start Date */}
                              <td className={`py-3.5 px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {formatDate(tx.start_date)}
                              </td>

                              {/* Expiry Date */}
                              <td className={`py-3.5 px-4 font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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
                    <CreditCard className="w-10 h-10 mx-auto mb-2 text-gray-500 stroke-1" />
                    <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      No transactions recorded yet.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Cancellation Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className={`relative w-full max-w-sm rounded-xl border p-6 text-center shadow-2xl ${
            isDark ? 'border-gray-800 bg-gray-950 text-white' : 'border-gray-200 bg-white text-gray-950'
          }`}>
            <div className={`w-12 h-12 rounded-full border flex items-center justify-center mx-auto mb-3 ${
              isDark ? 'border-gray-800 bg-gray-900 text-white' : 'border-gray-200 bg-gray-100 text-black'
            }`}>
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold mb-1">Cancel Subscription?</h3>
            <p className={`text-xs mb-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Are you sure you want to cancel your GitToScale Pro subscription? You will retain all Pro benefits until the end of your billing cycle ({formatDate(data?.subscription?.expirationDate)}).
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                  isDark
                    ? 'border-gray-800 hover:bg-gray-900 text-gray-300'
                    : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                }`}
              >
                Keep Plan
              </button>
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={canceling}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
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
