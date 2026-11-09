import React, { useEffect, useState } from 'react';
import { User, Bookmark, Heart, FolderGit2, History, Moon, Sun, LogOut, LogIn, UserPlus } from 'lucide-react';
import { UserProfileFeed } from '../feed/types';
import { feedApi } from '../feed/services/feedApi';
import { extractAccountAvatar, getAvatarColor, getInitial } from '../feed/utils/avatarUtils';

export interface UserDropdownMenuProps {
  variant?: 'app' | 'feed';
  user?: any;
  token?: string | null;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onNavigateToProfile?: (userId: string) => void;
  onViewLikes?: () => void;
  onViewSaved?: () => void;
  onOpenImportRepo?: () => void;
  onOpenHistory?: () => void;
  onSignOut?: () => void;
  onClose?: () => void;
  onOpenAuth?: () => void;
  onOpenSignUp?: () => void;
}

export const UserDropdownMenu: React.FC<UserDropdownMenuProps> = ({
  variant = 'feed',
  user,
  token,
  isDark = true,
  onToggleTheme,
  onNavigateToProfile,
  onViewLikes,
  onViewSaved,
  onOpenImportRepo,
  onOpenHistory,
  onSignOut,
  onClose,
  onOpenAuth,
  onOpenSignUp,
}) => {
  const [profile, setProfile] = useState<UserProfileFeed | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(user?.id && variant !== 'app'));

  useEffect(() => {
    if (!user?.id || variant === 'app') {
      setProfile(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    feedApi
      .getUserProfile(user.id, token)
      .then((data) => {
        if (isMounted && data) {
          setProfile(data);
        }
      })
      .catch((err) => {
        console.warn('[UserDropdownMenu] Failed to fetch profile details:', err?.message || err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id, token]);

  // Unauthenticated guest menu
  if (!user) {
    if (variant === 'app') {
      return (
        <div className="w-52 rounded-2xl border border-slate-200/90 dark:border-neutral-800/90 bg-white dark:bg-[#121214] shadow-2xl p-2 flex flex-col gap-1 backdrop-blur-xl">
          {/* Theme */}
          <div className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-neutral-200">
            <div className="flex items-center gap-2.5">
              {isDark ? (
                <Moon className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
              ) : (
                <Sun className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
              )}
              <span>Theme</span>
            </div>
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-xs font-medium text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
              >
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </button>
            )}
          </div>

          <div className="my-0.5 border-t border-slate-100 dark:border-neutral-800/70" />

          {onOpenAuth && (
            <button
              type="button"
              onClick={() => {
                onClose?.();
                onOpenAuth();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-indigo-500" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="w-72 rounded-2xl border border-slate-200/90 dark:border-neutral-800/90 bg-white dark:bg-[#121214] shadow-2xl p-4 flex flex-col gap-3">
        <div className="px-1">
          <p className="text-xs font-bold text-slate-900 dark:text-white">Account</p>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
            Sign in to save your architecture simulations & posts
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {onOpenAuth && (
            <button
              type="button"
              onClick={() => {
                onClose?.();
                onOpenAuth();
              }}
              className="group flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#18181b] text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-[#202024] transition-colors cursor-pointer shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-600 dark:text-neutral-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
              <span>Log In</span>
            </button>
          )}

          {onOpenSignUp && (
            <button
              type="button"
              onClick={() => {
                onClose?.();
                onOpenSignUp();
              }}
              className="group flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
              <span>Sign Up</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Minimal menu for /app workspace: strictly History, Theme, and Sign Out
  if (variant === 'app') {
    return (
      <div className="w-52 rounded-2xl border border-slate-200/90 dark:border-neutral-800/90 bg-white dark:bg-[#121214] shadow-2xl p-2 flex flex-col gap-0.5 backdrop-blur-xl">
        {/* 1. History */}
        {onOpenHistory && (
          <button
            type="button"
            onClick={() => {
              onClose?.();
              onOpenHistory();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer group text-left"
          >
            <History className="w-4 h-4 text-slate-500 dark:text-neutral-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            <span className="group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              History
            </span>
          </button>
        )}

        {/* 2. Theme */}
        <div className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-neutral-200">
          <div className="flex items-center gap-2.5">
            {isDark ? (
              <Moon className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
            ) : (
              <Sun className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
            )}
            <span>Theme</span>
          </div>
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-xs font-medium text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </button>
          )}
        </div>

        <div className="my-0.5 border-t border-slate-100 dark:border-neutral-800/70" />

        {/* 3. Sign Out */}
        {onSignOut && (
          <button
            type="button"
            onClick={() => {
              onClose?.();
              onSignOut();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer group text-left"
          >
            <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-500" />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    );
  }

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const username = profile?.username || user.user_metadata?.user_name || user.email?.split('@')[0]?.toLowerCase() || 'user';
  const avatarUrl = profile?.avatar_url || extractAccountAvatar(user);
  const initial = getInitial(displayName);
  const postsCount = profile?.posts_count ?? 0;
  const followersCount = profile?.followers_count ?? 0;
  const followingCount = profile?.following_count ?? 0;

  return (
    <div className="w-64 sm:w-72 rounded-2xl border border-slate-200/90 dark:border-neutral-800/90 bg-white dark:bg-[#121214] shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* 1. Header with Avatar & Details */}
      <div className="pt-6 pb-4 px-4 flex flex-col items-center text-center bg-gradient-to-b from-slate-100/70 dark:from-neutral-800/40 to-transparent">
        <button
          type="button"
          onClick={() => {
            onClose?.();
            if (onNavigateToProfile) onNavigateToProfile(user.id);
          }}
          className="group focus:outline-hidden cursor-pointer"
          title="View profile"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-neutral-800 shadow-md group-hover:scale-105 transition-transform"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full text-white text-2xl font-bold flex items-center justify-center border-2 border-white dark:border-neutral-800 shadow-md group-hover:scale-105 transition-transform"
              style={{ background: getAvatarColor(profile?.id || user.id || displayName) }}
            >
              {initial}
            </div>
          )}
        </button>

        <h3
          onClick={() => {
            onClose?.();
            if (onNavigateToProfile) onNavigateToProfile(user.id);
          }}
          className="mt-2.5 text-sm font-bold text-slate-900 dark:text-white truncate max-w-full cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          {displayName}
        </h3>

        <span className="text-xs text-slate-500 dark:text-neutral-400 font-mono mt-0.5 truncate max-w-full">
          @{username}
        </span>
      </div>

      {/* 2. Divider */}
      <div className="border-t border-slate-100 dark:border-neutral-800/80" />

      {/* 3. Followers / Following Stats */}
      <div className="grid grid-cols-2 text-center py-2.5 px-3">
        <div className="flex flex-col items-center">
          <span className="text-base font-bold text-slate-900 dark:text-white block leading-none">
            {loading ? '0' : followersCount}
          </span>
          <span className="text-xs text-slate-500 dark:text-neutral-400 mt-1 block">
            Followers
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-base font-bold text-slate-900 dark:text-white block leading-none">
            {loading ? '0' : followingCount}
          </span>
          <span className="text-xs text-slate-500 dark:text-neutral-400 mt-1 block">
            Following
          </span>
        </div>
      </div>

      {/* 4. Divider */}
      <div className="border-t border-slate-100 dark:border-neutral-800/80" />

      {/* 5. Navigation Items */}
      <div className="p-2.5 flex flex-col gap-0.5">
        {/* Profile with Posts Badge */}
        <button
          type="button"
          onClick={() => {
            onClose?.();
            if (onNavigateToProfile) onNavigateToProfile(user.id);
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer group text-left"
        >
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-slate-500 dark:text-neutral-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
            <span className="group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              Profile
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-[11px] font-mono text-slate-600 dark:text-neutral-300">
            {postsCount} {postsCount === 1 ? 'post' : 'posts'}
          </span>
        </button>

        {/* Yours Saved */}
        {onViewSaved && (
          <button
            type="button"
            onClick={() => {
              onClose?.();
              onViewSaved();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer group text-left"
          >
            <Bookmark className="w-4 h-4 text-slate-500 dark:text-neutral-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
            <span className="group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              Yours Saved
            </span>
          </button>
        )}

        {/* Your Likes */}
        <button
          type="button"
          onClick={() => {
            onClose?.();
            if (onViewLikes) onViewLikes();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer group text-left"
        >
          <Heart className="w-4 h-4 text-slate-500 dark:text-neutral-400 group-hover:text-rose-500 transition-colors" />
          <span className="group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
            Your Likes
          </span>
        </button>

        {(onOpenImportRepo || onOpenHistory) && (
          <div className="my-1 border-t border-slate-100 dark:border-neutral-800/70" />
        )}

        {/* Import Repository */}
        {onOpenImportRepo && (
          <button
            type="button"
            onClick={() => {
              onClose?.();
              onOpenImportRepo();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer group text-left"
          >
            <FolderGit2 className="w-4 h-4 text-slate-500 dark:text-neutral-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            <span className="group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              Import Repository
            </span>
          </button>
        )}

        {/* Your History */}
        {onOpenHistory && (
          <button
            type="button"
            onClick={() => {
              onClose?.();
              onOpenHistory();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer group text-left"
          >
            <History className="w-4 h-4 text-slate-500 dark:text-neutral-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            <span className="group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              Your History
            </span>
          </button>
        )}

        <div className="my-1 border-t border-slate-100 dark:border-neutral-800/70" />

        {/* Theme */}
        <div className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-neutral-200">
          <div className="flex items-center gap-2.5">
            {isDark ? (
              <Moon className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
            ) : (
              <Sun className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
            )}
            <span>Theme</span>
          </div>
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="px-3 py-1 rounded-full bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-xs font-medium text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </button>
          )}
        </div>

        {/* Logout */}
        {onSignOut && (
          <button
            type="button"
            onClick={() => {
              onClose?.();
              onSignOut();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer group text-left mt-0.5"
          >
            <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-500" />
            <span className="text-rose-600 dark:text-rose-500">Logout</span>
          </button>
        )}
      </div>
    </div>
  );
};
