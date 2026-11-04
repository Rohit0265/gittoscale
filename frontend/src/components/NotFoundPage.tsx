import React, { useEffect } from 'react';
import { Home, ArrowLeft, RefreshCw, Compass, Search, Sparkles } from 'lucide-react';
import { Fotter } from './Fotter';

interface NotFoundPageProps {
  isDark?: boolean;
  onGoHome: () => void;
  onNavigateToSimulator?: () => void;
  onNavigate?: (route: string) => void;
  requestedPath?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  isDark = true,
  onGoHome,
  onNavigateToSimulator,
  onNavigate,
  requestedPath,
}) => {
  const currentPath =
    requestedPath || (typeof window !== 'undefined' ? window.location.pathname : '');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = '404: Page Not Found — GitToScale';
    return () => {
      document.title =
        'GitToScale — Turn Code into Interactive System Architectures & Capacity Simulations';
    };
  }, []);

  const handleNavigate = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    } else {
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const popularRoutes = [
    { label: 'System Simulator', path: '/app', desc: 'Simulate high-concurrency architectures' },
    { label: 'Architecture Recommender', path: '/architect', desc: 'AI-guided architecture generator' },
    { label: 'Architecture History', path: '/history', desc: 'Saved designs and simulations' },
  ];

  return (
    <div
      className={`min-h-screen w-full flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200 transition-colors duration-200 ${
        isDark ? 'bg-[#020202] text-neutral-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Minimal Navigation Bar */}
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

      {/* Main 404 Hero Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 sm:py-20 relative overflow-hidden">
        {/* Subtle Ambient Glow Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-emerald-500/5 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-2xl w-full mx-auto text-center relative z-10">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase border mb-6 transition-colors shadow-xs animate-in fade-in duration-500">
            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className={isDark ? 'text-neutral-400' : 'text-slate-600'}>
              Error 404 &bull; Routing Topology Mismatch
            </span>
          </div>

          {/* Big Geometric 404 Display */}
          <div className="relative mb-6 select-none">
            <div
              className={`text-7xl sm:text-9xl font-black tracking-tighter leading-none bg-gradient-to-b ${
                isDark
                  ? 'from-neutral-100 via-neutral-300 to-neutral-700 text-transparent bg-clip-text'
                  : 'from-slate-900 via-slate-800 to-slate-400 text-transparent bg-clip-text'
              }`}
            >
              404
            </div>
            <div
              className={`text-xs sm:text-sm font-mono mt-2 ${
                isDark ? 'text-neutral-500' : 'text-slate-400'
              }`}
            >
              NODE_UNREACHABLE // 0x404_PAGE_NOT_FOUND
            </div>
          </div>

          {/* Title & Description */}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            This endpoint doesn&apos;t exist
          </h1>
          <p
            className={`text-sm sm:text-base max-w-lg mx-auto mb-6 leading-relaxed ${
              isDark ? 'text-neutral-400' : 'text-slate-600'
            }`}
          >
            The URL or architecture path you are attempting to inspect does not exist, was moved,
            or has a typo.
          </p>

          {/* Current Path Monospace Callout */}
          {currentPath && (
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-mono max-w-md mx-auto truncate border mb-8 ${
                isDark
                  ? 'bg-neutral-900/80 border-neutral-800 text-rose-400'
                  : 'bg-slate-100 border-slate-200 text-rose-600'
              }`}
              title={currentPath}
            >
              <span className="text-neutral-400 dark:text-neutral-600">GET</span>
              <span className="truncate">{currentPath}</span>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-12">
            <button
              onClick={onGoHome}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Home className="w-4 h-4" />
              Return to Homepage
            </button>

            {onNavigateToSimulator ? (
              <button
                onClick={onNavigateToSimulator}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                  isDark
                    ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:border-neutral-700'
                    : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800 hover:border-slate-400 shadow-xs'
                }`}
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Launch Simulator
              </button>
            ) : (
              <button
                onClick={() => handleNavigate('/app')}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                  isDark
                    ? 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:border-neutral-700'
                    : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800 hover:border-slate-400 shadow-xs'
                }`}
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Launch Simulator
              </button>
            )}

            <button
              onClick={() => window.location.reload()}
              className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              Reload
            </button>
          </div>

          {/* Suggested Destinations Grid */}
          <div
            className={`p-5 sm:p-6 rounded-2xl border text-left transition-colors ${
              isDark
                ? 'bg-[#090B10]/60 border-neutral-800/80 backdrop-blur-sm'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-4 text-indigo-500">
              <Compass className="w-3.5 h-3.5" />
              <span>Looking for one of these valid routes?</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {popularRoutes.map((route, i) => (
                <button
                  key={i}
                  onClick={() => handleNavigate(route.path)}
                  className={`p-3 rounded-xl border text-left transition-all group cursor-pointer ${
                    isDark
                      ? 'border-neutral-800/80 bg-neutral-900/40 hover:bg-neutral-800/80 hover:border-neutral-700'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-semibold mb-1 group-hover:text-indigo-400 transition-colors flex items-center justify-between">
                    <span>{route.label}</span>
                    <span className="text-neutral-500 text-[10px] font-mono">{route.path}</span>
                  </div>
                  <div
                    className={`text-[11px] leading-relaxed line-clamp-2 ${
                      isDark ? 'text-neutral-400' : 'text-slate-500'
                    }`}
                  >
                    {route.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Global Application Footer */}
      <Fotter brandName="GitToScale" isDark={isDark} onNavigate={onNavigate} />
    </div>
  );
};
