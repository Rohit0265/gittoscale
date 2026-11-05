import React from 'react';
import { Sun, Moon, LogIn, UserPlus, LogOut, LayoutGrid } from 'lucide-react';

interface FeedHeaderProps {
  user?: any;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onGoHome: () => void;
  onOpenAuth?: () => void;
  onOpenSignUp?: () => void;
  onSignOut?: () => void;
  onNavigateToSimulator?: () => void;
}

export const FeedHeader: React.FC<FeedHeaderProps> = ({
  user,
  isDark = false,
  onToggleTheme,
  onGoHome,
  onOpenAuth,
  onOpenSignUp,
  onSignOut,
  onNavigateToSimulator,
}) => {
  return (
    <header className="sticky top-0 z-40 h-14 w-full border-b border-slate-200 dark:border-neutral-800 bg-white/95 dark:bg-[#020202]/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between transition-colors">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onGoHome}
          className="flex items-center text-left group hover:opacity-85 transition-opacity cursor-pointer"
          title="Return to Landing Page"
        >
          <img
            src={isDark ? '/logo.png' : '/logo-light.png'}
            alt="GitToScale"
            className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </button>
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
          Community Feed
        </span>
      </div>

      {/* Right Controls: Simulator Link, Theme Toggle, User Profile / Auth */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onNavigateToSimulator && (
          <button
            onClick={onNavigateToSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Launch Architecture Simulator"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden md:inline">Simulator</span>
          </button>
        )}

        {/* Theme Toggle */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        )}

        {/* User Auth Info */}
        {user ? (
          <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata?.full_name || 'User'}
                  className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-neutral-700"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold uppercase">
                  {(user.user_metadata?.full_name || user.email || 'U')[0]}
                </div>
              )}
              <span className="hidden lg:inline text-xs font-medium text-slate-800 dark:text-neutral-200 max-w-[120px] truncate">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </span>
            </div>

            {onSignOut && (
              <button
                onClick={onSignOut}
                className="p-1.5 rounded-lg text-slate-500 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-neutral-200 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
            {onOpenSignUp && (
              <button
                onClick={onOpenSignUp}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
