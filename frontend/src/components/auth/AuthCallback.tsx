import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, CheckCircle2, AlertCircle, Lock, ArrowRight } from 'lucide-react';

interface AuthCallbackProps {
  onNavigate: (view: string) => void;
  isDark?: boolean;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({ onNavigate, isDark = true }) => {
  const { updatePassword, pendingAction } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'recovery' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New password state for recovery mode
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      if (typeof window === 'undefined') return;

      const hash = window.location.hash;
      const search = new URLSearchParams(window.location.search);
      const isRecovery = hash.includes('type=recovery') || search.get('type') === 'recovery';

      if (isRecovery) {
        if (mounted) setStatus('recovery');
        return;
      }

      if (!isSupabaseConfigured) {
        if (mounted) {
          setStatus('success');
          setTimeout(() => {
            const destination = pendingAction ? '/app' : '/app';
            window.history.pushState({}, '', destination);
            onNavigate('simulator');
          }, 800);
        }
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          if (window.opener && window.opener !== window) {
            try {
              window.opener.postMessage({ type: 'GTS_OAUTH_ERROR', error: error.message }, window.location.origin);
            } catch {}
            window.close();
            return;
          }
          if (mounted) {
            setStatus('error');
            setErrorMessage(error.message);
          }
          return;
        }

        if (session) {
          if (window.opener && window.opener !== window) {
            try {
              window.opener.postMessage({
                type: 'GTS_OAUTH_SUCCESS',
                session: session,
                user: session.user,
              }, window.location.origin);
            } catch {}
            window.close();
            return;
          }
          if (mounted) {
            setStatus('success');
            setTimeout(() => {
              const destination = pendingAction?.returnUrl || '/app';
              window.history.pushState({}, '', destination);
              onNavigate('simulator');
            }, 600);
          }
        } else {
          // Allow onAuthStateChange listener to catch session if still parsing token
          const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
            if (newSession && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
              authListener.subscription.unsubscribe();
              if (window.opener && window.opener !== window) {
                try {
                  window.opener.postMessage({
                    type: 'GTS_OAUTH_SUCCESS',
                    session: newSession,
                    user: newSession.user,
                  }, window.location.origin);
                } catch {}
                window.close();
                return;
              }
              if (mounted) {
                setStatus('success');
                setTimeout(() => {
                  const destination = pendingAction?.returnUrl || '/app';
                  window.history.pushState({}, '', destination);
                  onNavigate('simulator');
                }, 600);
              }
            }
          });

          // Timeout fallback
          setTimeout(() => {
            if (mounted && status === 'verifying') {
              window.history.pushState({}, '', '/app');
              onNavigate('simulator');
            }
          }, 3000);
        }
      } catch (err: any) {
        if (mounted) {
          setStatus('error');
          setErrorMessage(err?.message || 'Authentication callback failed.');
        }
      }
    }

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [onNavigate, pendingAction]);

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    setErrorMessage(null);

    const { error } = await updatePassword(newPassword);
    setIsUpdatingPassword(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setStatus('success');
      setTimeout(() => {
        window.history.pushState({}, '', '/app');
        onNavigate('simulator');
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#070709] text-white px-4 py-12 relative overflow-hidden font-sans">
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 blur-[120px] rounded-full" />

      {/* Header Logo */}
      <div className="mb-8 z-10">
        <button
          onClick={() => {
            window.history.pushState({}, '', '/');
            onNavigate('landing');
          }}
          className="flex items-center gap-2 group hover:opacity-90 transition-opacity cursor-pointer"
        >
          <img
            src={isDark ? '/logo.png' : '/logo-light.png'}
            alt="GitToScale"
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </button>
      </div>

      <div className="w-full max-w-md bg-[#0D0E15]/90 border border-neutral-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl z-10 text-center">
        {status === 'verifying' && (
          <div className="py-6 flex flex-col items-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <h2 className="text-lg font-semibold text-white mb-1">
              Verifying credentials...
            </h2>
            <p className="text-xs text-neutral-400">
              Securing session and synchronizing your workspace.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 flex flex-col items-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-4" />
            <h2 className="text-lg font-semibold text-white mb-1">
              Authentication Verified
            </h2>
            <p className="text-xs text-neutral-400">
              Launching GitToScale simulation canvas...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 flex flex-col items-center">
            <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
            <h2 className="text-lg font-semibold text-white mb-1">
              Authentication Failed
            </h2>
            <p className="text-xs text-red-300 mb-6 max-w-xs">
              {errorMessage || 'Unable to verify session callback token.'}
            </p>
            <button
              onClick={() => {
                window.history.pushState({}, '', '/signin');
                onNavigate('signin');
              }}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
            >
              Return to Sign In
            </button>
          </div>
        )}

        {status === 'recovery' && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-1.5">
              Set New Password
            </h2>
            <p className="text-xs text-neutral-400 mb-5">
              Please enter your new password to regain access.
            </p>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handlePasswordResetSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#14151f] border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#14151f] border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <>
                    <span>Update Password & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

