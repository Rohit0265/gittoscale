import React, { useEffect } from 'react';
import { ShieldAlert, ArrowLeft, Home, LogIn, Lock, Sparkles } from 'lucide-react';
import { Fotter } from './Fotter';

interface UnverifiedProjectPageProps {
  projectId: string;
  isDark?: boolean;
  onGoHome: () => void;
  onNavigateToSimulator?: () => void;
  onOpenAuth?: () => void;
  onNavigate?: (route: string) => void;
}

export const UnverifiedProjectPage: React.FC<UnverifiedProjectPageProps> = ({
  projectId,
  isDark = true,
  onGoHome,
  onNavigateToSimulator,
  onOpenAuth,
  onNavigate,
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'Project Access Unverified — GitToScale';
    return () => {
      document.title =
        'GitToScale — Turn Code into Interactive System Architectures & Capacity Simulations';
    };
  }, []);

  return (
    <div
      className={`min-h-screen w-full flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200 transition-colors duration-200 ${
        isDark ? 'bg-[#020202] text-neutral-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Header */}
      <header
        className={`w-full border-b transition-colors ${
          isDark ? 'border-neutral-800/80 bg-[#090B10]/80' : 'border-slate-200/80 bg-white/80'
        } backdrop-blur-md sticky top-0 z-40`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-hidden"
            title="Return to GitToScale Homepage"
          >
            <img
              src={isDark ? '/logo.png' : '/logo-light.png'}
              alt="GitToScale"
              className="h-7 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </button>

          <button
            onClick={onGoHome}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-300'
                : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 sm:py-20 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-gradient-to-tr from-amber-500/10 via-rose-500/10 to-indigo-500/5 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-xl w-full mx-auto text-center relative z-10">
          {/* Security Alert Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase border mb-6 transition-colors shadow-xs">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className={isDark ? 'text-amber-400' : 'text-amber-700'}>
              Security Verification Required
            </span>
          </div>

          {/* Visual Lock Icon Shield */}
          <div className="mb-6 flex justify-center">
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center border shadow-xl ${
                isDark
                  ? 'bg-amber-950/20 border-amber-500/30 text-amber-400 shadow-amber-950/30'
                  : 'bg-amber-50 border-amber-200 text-amber-600 shadow-amber-500/10'
              }`}
            >
              <ShieldAlert className="w-10 h-10 stroke-[1.75]" />
            </div>
          </div>

          {/* Title & Explanation */}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Project Ownership Unverified
          </h1>

          <p
            className={`text-sm sm:text-base max-w-md mx-auto mb-6 leading-relaxed ${
              isDark ? 'text-neutral-400' : 'text-slate-600'
            }`}
          >
            You are signed in as an account that does not own or have permission to inspect this
            architecture. Each project is protected and restricted to its verified creator.
          </p>

          {/* Project ID Tag */}
          {projectId && (
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-mono max-w-md mx-auto truncate border mb-8 ${
                isDark
                  ? 'bg-neutral-900/80 border-neutral-800 text-neutral-300'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Project ID:</span>
              <span className="text-amber-500 font-semibold truncate">{projectId}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8">
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 active:bg-amber-700 shadow-md shadow-amber-500/20 transition-all cursor-pointer hover:scale-[1.02]"
              >
                <LogIn className="w-4 h-4" />
                Switch Account
              </button>
            )}

            <button
              onClick={onGoHome}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Home className="w-4 h-4" />
              Return to Homepage
            </button>

            {onNavigateToSimulator && (
              <button
                onClick={onNavigateToSimulator}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                  isDark
                    ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:border-neutral-700'
                    : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800 hover:border-slate-400 shadow-xs'
                }`}
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Start New Architecture
              </button>
            )}
          </div>

          <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
            If you believe this is in error, verify you are logged in with the email address used to
            create this project.
          </p>
        </div>
      </main>

      {/* Global Footer */}
      <Fotter brandName="GitToScale" isDark={isDark} onNavigate={onNavigate} />
    </div>
  );
};
