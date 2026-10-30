import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowRight, Loader2, Sparkles, FolderGit2, AlertCircle, CheckCircle2, Lock, Mail, User } from 'lucide-react';

interface SignUpPageProps {
  onNavigate: (view: string) => void;
  isDark?: boolean;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onNavigate, isDark = true }) => {
  const { signUp, pendingAction, isConfigured } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const { error: signUpError } = await signUp(email, password, fullName);
      if (signUpError) {
        setError(signUpError.message || 'Failed to create account. Please try again.');
      } else {
        setSuccessMessage('Account created successfully! Redirecting...');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#070709] text-white px-4 py-12 relative overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute bottom-10 right-10 w-[400px] h-[300px] bg-cyan-600/5 blur-[100px] rounded-full" />

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

      {/* Main Card */}
      <div className="w-full max-w-md bg-[#0D0E15]/90 border border-neutral-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl z-10">
        {/* Pending Action Notification Banner */}
        {pendingAction && (
          <div className="mb-6 p-3.5 rounded-xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-3">
            {pendingAction.type === 'prompt' ? (
              <Sparkles className="w-4 h-4 text-slate-300 hover:text-amber-400 transition-colors shrink-0 mt-0.5" />
            ) : (
              <FolderGit2 className="w-4 h-4 text-slate-300 hover:text-cyan-400 transition-colors shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span className="font-semibold text-white block mb-0.5">
                {pendingAction.type === 'prompt'
                  ? 'Complete sign up to synthesize architecture'
                  : 'Complete sign up to import repository'}
              </span>
              <p className="text-neutral-300 text-[11px] line-clamp-2">
                {pendingAction.type === 'prompt'
                  ? `"${pendingAction.prompt}"`
                  : pendingAction.repoUrl}
              </p>
            </div>
          </div>
        )}

        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1.5">
            Create your GitToScale account
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Design, simulate, and scale cloud infrastructure with confidence.
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-slate-300 hover:text-rose-400 transition-colors" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-white hover:text-emerald-400 transition-colors" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Mercer"
                className="w-full bg-[#14151f] border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="w-full bg-[#14151f] border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#14151f] border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <span className="text-[10px] text-neutral-500 mt-1 block">
              At least 6 characters
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#14151f] border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-blue-600/20 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-neutral-800/80 text-center text-xs text-neutral-400">
          Already have an account?{' '}
          <button
            onClick={() => {
              window.history.pushState({}, '', '/signin');
              onNavigate('signin');
            }}
            className="text-blue-400 hover:text-blue-300 font-medium hover:underline cursor-pointer"
          >
            Sign in
          </button>
        </div>

        {!isConfigured && (
          <div className="mt-4 p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-500 text-center">
            Mode: Local Sandbox Demo session active. Connect Supabase in `.env` for production auth.
          </div>
        )}
      </div>
    </div>
  );
};

