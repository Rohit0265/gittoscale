import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, LogIn, UserPlus, LogOut, LayoutGrid, User, Heart, ChevronDown } from 'lucide-react';

interface FeedHeaderProps {
  user?: any;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onGoHome: () => void;
  onOpenAuth?: () => void;
  onOpenSignUp?: () => void;
  onSignOut?: () => void;
  onNavigateToSimulator?: () => void;
  onNavigateToProfile?: (userId: string) => void;
  onViewLikes?: () => void;
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
  onNavigateToProfile,
  onViewLikes,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url;

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
      </div>

      {/* Right Controls: Simulator Link, Theme Toggle, User Profile / Auth */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onNavigateToSimulator && (
          <button
            onClick={onNavigateToSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Launch Architecture Simulator"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Simulator</span>
          </button>
        )}

        {/* Global Theme Toggle (desktop / fallback) */}
        {/* {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="hidden sm:flex p-2 rounded-lg text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )} */}

        {/* User Auth Info & Interactive Profile Menu */}
        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1 sm:pl-2 rounded-full sm:rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer focus:outline-hidden"
              title="Account and navigation options"
              aria-expanded={isMenuOpen}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover border border-indigo-500/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold uppercase shadow-xs">
                  {displayName[0]}
                </div>
              )}
              <span className="hidden lg:inline text-xs font-medium text-slate-800 dark:text-neutral-200 max-w-[120px] truncate text-left">
                {displayName}
              </span>
              <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" />
            </button>

            {/* Profile Dropdown Menu (on mobile replaces the hidden left sidebar) */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* User snippet at top */}
                <div className="px-3 py-2 border-b border-slate-100 dark:border-neutral-800/80 mb-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate font-mono">
                    {user.email}
                  </p>
                </div>

                {/* 1. Profile option at top */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onNavigateToProfile) onNavigateToProfile(user.id);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 text-left transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                  <span>Profile</span>
                </button>

                {/* 2. Your Likes option */}
                {onViewLikes && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onViewLikes();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 text-left transition-colors cursor-pointer"
                  >
                    <Heart className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                    <span>Your Likes</span>
                  </button>
                )}

                {/* 3. Theme Toggle in profile menu */}
                {onToggleTheme && (
                  <button
                    onClick={() => {
                      onToggleTheme();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {isDark ? (
                        <Moon className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                      ) : (
                        <Sun className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                      )}
                      <span>Theme</span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                      {isDark ? 'Dark' : 'Light'}
                    </span>
                  </button>
                )}

                {/* 4. Sign Out at bottom */}
                {onSignOut && (
                  <div className="border-t border-slate-100 dark:border-neutral-800/80 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
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
