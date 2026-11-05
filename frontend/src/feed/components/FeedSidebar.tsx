import React, { useEffect, useState } from 'react';
import { User, FileText, Users, LogIn, UserPlus, Heart, Moon, Sun, LogOut, ChevronRight } from 'lucide-react';
import { UserProfileFeed } from '../types';
import { feedApi } from '../services/feedApi';

interface FeedSidebarProps {
  user?: any;
  token?: string | null;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onSignOut?: () => void;
  onNavigateToProfile: (userId: string) => void;
  onViewLikes?: () => void;
  activeFilter?: 'all' | 'liked';
  onOpenSignIn?: () => void;
  onOpenSignUp?: () => void;
}

export const FeedSidebar: React.FC<FeedSidebarProps> = ({
  user,
  token,
  isDark = false,
  onToggleTheme,
  onSignOut,
  onNavigateToProfile,
  onViewLikes,
  activeFilter = 'all',
  onOpenSignIn,
  onOpenSignUp,
}) => {
  const [profile, setProfile] = useState<UserProfileFeed | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(user));

  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    feedApi
      .getUserProfile(user.id, token)
      .then((data) => {
        if (isMounted) setProfile(data);
      })
      .catch((err) => {
        console.error('[FeedSidebar] Failed to load user profile stats:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id, token]);

  if (!user) {
    return (
      <aside className="w-full rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] p-5 shadow-xs">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-500 dark:text-neutral-400 mb-3">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Welcome to GitToScale</h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 mb-4">
            Join the conversation, share cloud architectures, and discuss system designs.
          </p>
          <div className="w-full flex flex-col gap-2">
            {onOpenSignIn && (
              <button
                onClick={onOpenSignIn}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-900 dark:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
            {onOpenSignUp && (
              <button
                onClick={onOpenSignUp}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    );
  }

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const username = profile?.username || user.email?.split('@')[0]?.toLowerCase() || 'user';
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;

  return (
    <aside className="w-full rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] p-5 shadow-xs flex flex-col gap-4">
      {/* Interactive User Profile Section */}
      <div
        onClick={() => onNavigateToProfile(user.id)}
        className="group relative flex flex-col items-center text-center p-3 rounded-xl hover:bg-slate-50/80 dark:hover:bg-neutral-900/60 border border-transparent hover:border-slate-200/60 dark:hover:border-neutral-800/80 transition-all cursor-pointer"
        title="Tap to view full profile"
      >
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/30 group-hover:border-indigo-500 group-hover:scale-105 transition-all shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-600 text-white text-xl font-bold flex items-center justify-center uppercase shadow-sm group-hover:scale-105 transition-transform">
              {displayName[0]}
            </div>
          )}
        </div>

        <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1">
          <span>{displayName}</span>
          <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </h3>
        <span className="text-xs text-slate-500 dark:text-neutral-400 font-mono">
          @{username}
        </span>

        {profile?.bio && (
          <p className="text-xs text-slate-600 dark:text-neutral-300 mt-2 line-clamp-2 px-1">
            {profile.bio}
          </p>
        )}
      </div>

      {/* Social Stats: Followers & Following */}
      <div className="pt-3 border-t border-slate-100 dark:border-neutral-800/80 grid grid-cols-2 gap-2 text-center">
        <div className="flex flex-col">
          <span className="text-base font-bold text-slate-900 dark:text-white">
            {loading ? '—' : profile?.followers_count || 0}
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400">
            Followers
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold text-slate-900 dark:text-white">
            {loading ? '—' : profile?.following_count || 0}
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400">
            Following
          </span>
        </div>
      </div>

      {/* Profile Actions: Profile at Top, Your Likes, Theme Change, Logout */}
      <div className="pt-3 border-t border-slate-100 dark:border-neutral-800/80 flex flex-col gap-1.5">
        {/* 1. Profile at top */}
        <button
          onClick={() => onNavigateToProfile(user.id)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer"
          title="Open your profile"
        >
          <User className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold">Profile</span>
          <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400">
            {profile?.posts_count || 0} posts
          </span>
        </button>

        {/* 2. Your Likes */}
        {onViewLikes && (
          <button
            onClick={onViewLikes}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
              activeFilter === 'liked'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
                : 'text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800/80 hover:text-rose-600 dark:hover:text-rose-400'
            }`}
            title="View posts you liked"
          >
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
            <span>Your Likes</span>
            {activeFilter === 'liked' && (
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md bg-rose-500 text-white font-bold">
                Active
              </span>
            )}
          </button>
        )}

        {/* 3. Theme change in profile section */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800/80 transition-colors text-left cursor-pointer"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            <div className="flex items-center gap-2.5">
              {isDark ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <span>Theme</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 font-medium capitalize">
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </span>
          </button>
        )}

        {/* 4. Logout in profile section */}
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left cursor-pointer mt-1"
            title="Sign out of your account"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Logout</span>
          </button>
        )}
      </div>
    </aside>
  );
};

