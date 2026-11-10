import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, ChevronDown, LogIn, UserPlus } from 'lucide-react';
import { UserDropdownMenu } from '../../components/UserDropdownMenu';
import { extractAccountAvatar } from '../utils/avatarUtils';
import { UserAvatar } from './UserAvatar';

interface FeedHeaderProps {
  user?: any;
  token?: string | null;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onGoHome: () => void;
  onOpenAuth?: () => void;
  onOpenSignUp?: () => void;
  onSignOut?: () => void;
  onNavigateToProfile?: (userId: string) => void;
  onViewLikes?: () => void;
  onViewSaved?: () => void;
}

export const FeedHeader: React.FC<FeedHeaderProps> = ({
  user,
  token,
  isDark = true,
  onToggleTheme,
  onGoHome,
  onOpenAuth,
  onOpenSignUp,
  onSignOut,
  onNavigateToProfile,
  onViewLikes,
  onViewSaved,
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
  const avatarUrl = extractAccountAvatar(user);

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

      {/* Right Controls: Home Link, Theme Toggle, User Profile / Auth */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onGoHome}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group"
          title="Return to Home"
        >
          <span>Home</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:text-neutral-400 dark:group-hover:text-white transition-colors" />
        </button>
        {/* User Auth Info & Interactive Profile Menu */}
        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1 sm:pl-2 rounded-full sm:rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer focus:outline-hidden"
              title="Account and navigation options"
              aria-expanded={isMenuOpen}
            >
              <UserAvatar
                src={avatarUrl}
                name={displayName}
                seed={user?.id || displayName}
                className="w-8 h-8 rounded-full border border-indigo-500/30"
                fallbackClassName="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold uppercase shadow-xs"
              />
              <span className="hidden lg:inline text-xs font-medium text-slate-800 dark:text-neutral-200 max-w-[120px] truncate text-left">
                {displayName}
              </span>
              <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" />
            </button>

            {/* Profile Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <UserDropdownMenu
                  user={user}
                  token={token}
                  isDark={isDark}
                  onToggleTheme={onToggleTheme}
                  onNavigateToProfile={onNavigateToProfile}
                  onViewLikes={onViewLikes}
                  onViewSaved={onViewSaved}
                  onSignOut={onSignOut}
                  onClose={() => setIsMenuOpen(false)}
                  onOpenAuth={onOpenAuth}
                  onOpenSignUp={onOpenSignUp}
                />
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
