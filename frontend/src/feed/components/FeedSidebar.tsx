import React, { useEffect, useState } from 'react';
import { User, FileText, Users, LogIn, UserPlus } from 'lucide-react';
import { UserProfileFeed } from '../types';
import { feedApi } from '../services/feedApi';

interface FeedSidebarProps {
  user?: any;
  token?: string | null;
  onNavigateToProfile: (userId: string) => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onSignOut?: () => void;
  onViewLikes?: () => void;
  activeFilter?: 'all' | 'liked';
  onOpenSignIn?: () => void;
  onOpenSignUp?: () => void;
}

export const FeedSidebar: React.FC<FeedSidebarProps> = ({
  user,
  token,
  onNavigateToProfile,
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
    <aside className="w-full rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] p-5 shadow-xs">
      {/* User Header */}
      <div className="flex flex-col items-center text-center">
        <button
          onClick={() => onNavigateToProfile(user.id)}
          className="group relative cursor-pointer focus:outline-hidden"
          title="View your profile"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/30 group-hover:border-indigo-500 transition-colors shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-600 text-white text-xl font-bold flex items-center justify-center uppercase shadow-sm group-hover:scale-105 transition-transform">
              {displayName[0]}
            </div>
          )}
        </button>

        <button
          onClick={() => onNavigateToProfile(user.id)}
          className="mt-3 text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
        >
          {displayName}
        </button>
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
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-neutral-800/80 grid grid-cols-2 gap-2 text-center">
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

      {/* Action / Nav list */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-neutral-800/80 flex flex-col gap-1">
        <button
          onClick={() => onNavigateToProfile(user.id)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800/60 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer"
        >
          <FileText className="w-4 h-4 text-indigo-500" />
          <span>Your Posts</span>
          <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400">
            {profile?.posts_count || 0}
          </span>
        </button>

        <button
          onClick={() => onNavigateToProfile(user.id)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800/60 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer"
        >
          <Users className="w-4 h-4 text-emerald-500" />
          <span>View Public Profile</span>
        </button>
      </div>
    </aside>
  );
};
