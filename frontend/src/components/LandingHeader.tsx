import React, { useState, useRef, useEffect } from 'react';
import {
  ExternalLink,
  User,
  History,
  LogOut,
  LogIn,
  UserPlus,
  Sun,
  Moon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export interface LandingHeaderProps {
  isDark?: boolean;
  onToggleTheme?: () => void;
  onGoHome?: () => void;
  onOpenAuth?: () => void;
  onOpenSignUp?: () => void;
  onOpenHistory?: () => void;
  onSignOut?: () => void;
  onNavigate?: (view: any) => void;
  isApp?: boolean;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  isDark = true,
  onToggleTheme,
  onGoHome,
  onOpenAuth,
  onOpenSignUp,
  onOpenHistory,
  onSignOut,
  onNavigate,
  isApp = false,
}) => {
  const { user, signOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click or escape
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleLogoClick = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  const handleHistoryClick = () => {
    setIsProfileOpen(false);
    if (onOpenHistory) {
      onOpenHistory();
    } else if (onNavigate) {
      onNavigate('history');
    } else {
      window.location.href = '/history';
    }
  };

  const handleSignOutClick = () => {
    setIsProfileOpen(false);
    if (onSignOut) {
      onSignOut();
    } else {
      signOut();
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 pointer-events-none ${
        isApp
          ? 'border-b border-slate-200/80 dark:border-neutral-800 bg-white/90 dark:bg-[#020202]/90 backdrop-blur px-3 sm:px-6 md:px-8 h-16 flex items-center justify-between pointer-events-auto'
          : 'pt-3 sm:pt-4 px-3 sm:px-6 flex items-center justify-center gap-2 sm:gap-3'
      }`}
    >
      {/* Centered Floating Pill Navbar */}
      <div
        className={`pointer-events-auto flex items-center justify-between transition-all duration-300 ${
          isApp
            ? 'h-full flex-1 max-w-none'
            : 'h-12 sm:h-13 w-full max-w-4xl px-3 sm:px-5 rounded-full border border-slate-200/90 dark:border-neutral-800/90 bg-white/85 dark:bg-[#020202]/85 backdrop-blur-md shadow-md shadow-slate-200/40 dark:shadow-black/50'
        }`}
      >
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <img
            src={isDark ? '/logo.png' : '/logo-light.png'}
            alt="GitToScale Logo"
            width="140"
            height="36"
            onClick={handleLogoClick}
            className={`w-auto object-contain cursor-pointer transition-all ${
              isApp ? 'h-8 sm:h-9 md:h-10' : 'h-6 sm:h-7'
            }`}
          />
        </div>

        {/* Right: Collab & Feed Navigation */}
        <nav className="flex items-center gap-1 sm:gap-1.5">
          <a
            href="/collab"
            target="_blank"
            rel="noopener noreferrer"
            className="group min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 dark:text-neutral-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/80 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Open GitToScale Collab in new tab"
          >
            <span>Collab</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </a>
          <a
            href="/feed"
            target="_blank"
            rel="noopener noreferrer"
            className="group min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 dark:text-neutral-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/80 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Open Community Feed in new tab"
          >
            <span>Feed</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </a>
        </nav>
      </div>

      {/* Standalone Profile Button & Dropdown Outside Navbar */}
      <div ref={profileRef} className="pointer-events-auto relative shrink-0">
        <button
          type="button"
          onClick={() => setIsProfileOpen((prev) => !prev)}
          aria-label="Profile, Authentication and Appearance settings"
          title={user ? (user.user_metadata?.full_name || user.email || 'Profile') : 'Profile & Settings'}
          className={`group border border-slate-200/90 dark:border-neutral-800/90 bg-white/85 dark:bg-[#0A0A0A]/85 backdrop-blur-md shadow-md shadow-slate-200/40 dark:shadow-black/50 hover:bg-slate-100 dark:hover:bg-[#141416] text-slate-700 dark:text-neutral-200 transition-all cursor-pointer flex items-center justify-center shrink-0 relative min-h-[44px] min-w-[44px] ${
            isApp ? 'p-2 rounded-lg h-10 w-10' : 'p-2.5 rounded-full h-12 w-12 sm:h-13 sm:w-13'
          }`}
        >
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-neutral-200 group-hover:text-indigo-500 transition-colors" />
        </button>

        {/* Profile Dropdown Menu */}
        <AnimatePresence>
          {isProfileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border border-slate-200/90 dark:border-neutral-800/90 bg-white/95 dark:bg-[#0C0C0E]/95 backdrop-blur-xl shadow-xl shadow-slate-300/40 dark:shadow-black/70 p-3.5 z-50 flex flex-col gap-3"
            >
              {/* Account / User Section */}
              {user ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-100/70 dark:bg-neutral-900/60 border border-slate-200/60 dark:border-neutral-800/60">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 flex items-center justify-center font-bold text-sm shrink-0">
                      {(user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  {/* History Option */}
                  <button
                    type="button"
                    onClick={handleHistoryClick}
                    className="group flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-left"
                  >
                    <History className="w-4 h-4 text-slate-500 dark:text-neutral-400 group-hover:text-indigo-500 transition-colors" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate">History</span>
                      <span className="text-[10px] font-normal text-slate-500 dark:text-neutral-400 truncate">
                        Saved systems &amp; snapshots
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleSignOutClick}
                    className="group flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-slate-600 dark:text-neutral-400 group-hover:text-red-500 transition-colors" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 p-1">
                  <div className="px-1 pb-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">Account</p>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                      Sign in to simulate load &amp; save architectures
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Login Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onOpenAuth?.();
                      }}
                      className="group flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#141416] text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#1e1e22] transition-colors cursor-pointer shadow-xs"
                    >
                      <LogIn className="w-3.5 h-3.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                      <span>Log In</span>
                    </button>

                    {/* Sign Up Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        if (onOpenSignUp) {
                          onOpenSignUp();
                        } else if (onOpenAuth) {
                          onOpenAuth();
                        }
                      }}
                      className="group flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                      <span>Sign Up</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Theme Switcher Section */}
              {onToggleTheme && (
                <div className="border-t border-slate-200/80 dark:border-neutral-800/80 pt-2.5 flex flex-col gap-1.5">
                  <div className="px-1 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 dark:text-neutral-400">Appearance</span>
                    <span className="text-[11px] font-medium text-slate-400 dark:text-neutral-500">
                      {isDark ? 'Dark Theme' : 'Light Theme'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100/70 dark:bg-neutral-900/60 border border-slate-200/60 dark:border-neutral-800/60">
                    <button
                      type="button"
                      onClick={() => {
                        if (isDark) onToggleTheme();
                      }}
                      className={`group flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        !isDark
                          ? 'bg-white text-slate-900 shadow-xs font-semibold'
                          : 'text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5 text-slate-700 dark:text-neutral-300 group-hover:text-amber-500 transition-colors" />
                      <span>Light</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!isDark) onToggleTheme();
                      }}
                      className={`group flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isDark
                          ? 'bg-[#1e1e22] text-white shadow-xs font-semibold'
                          : 'text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5 text-slate-700 dark:text-neutral-300 group-hover:text-blue-400 transition-colors" />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
