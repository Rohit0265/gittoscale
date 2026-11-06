import React, { useEffect, useState, useRef } from 'react';
import { User, Camera, LogIn, UserPlus, ArrowRight } from 'lucide-react';
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
  const [coverImage, setCoverImage] = useState<string | null>(() => {
    if (!user?.id) return null;
    try {
      return localStorage.getItem(`gitoscale_sidebar_bg_${user.id}`) || null;
    } catch {
      return null;
    }
  });
  const coverInputRef = useRef<HTMLInputElement>(null);

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

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCoverImage(result);
      try {
        localStorage.setItem(`gitoscale_sidebar_bg_${user.id}`, result);
      } catch (err) {
        console.warn('Could not persist cover image to localStorage:', err);
      }
    };
    reader.readAsDataURL(file);
  };

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
    <aside className="w-full rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] overflow-hidden shadow-xs">
      {/* 1. Cover Banner with Background Image Support */}
      <div className="relative h-24 w-full bg-slate-100 dark:bg-neutral-900 overflow-hidden group">
        {coverImage || profile?.banner_url ? (
          <img
            src={coverImage || profile?.banner_url || ''}
            alt="Cover background"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-slate-200 to-slate-300 dark:from-neutral-900 dark:to-neutral-800" />
        )}

        {/* Change / Add Cover Background Button */}
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
          title="Add or change background cover image"
        >
          <Camera className="w-3.5 h-3.5" />
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverChange}
          className="hidden"
        />
      </div>

      <div className="px-5 pb-5 pt-0 flex flex-col gap-4">
        {/* 2. User Avatar Overlapping Cover */}
        <div
          onClick={() => onNavigateToProfile(user.id)}
          className="group relative flex flex-col items-center text-center cursor-pointer -mt-10"
          title="View your profile"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-[#0A0A0A] shadow-md group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-indigo-600 text-white text-2xl font-bold flex items-center justify-center uppercase border-4 border-white dark:border-[#0A0A0A] shadow-md group-hover:scale-105 transition-transform">
              {displayName[0]}
            </div>
          )}

          <h3 className="mt-2.5 text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {displayName}
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

        {/* 3. Social Stats: Followers & Following */}
        <div className="pt-3 border-t border-slate-100 dark:border-neutral-800/80 grid grid-cols-2 gap-2 text-center">
          <div className="flex flex-col">
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {loading ? '—' : profile?.followers_count ?? 0}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400">
              Followers
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {loading ? '—' : profile?.following_count ?? 0}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400">
              Following
            </span>
          </div>
        </div>

        {/* 4. Profile Actions: Profile at Top, Your Likes, Theme Change, Logout */}
        <div className="pt-3 border-t border-slate-100 dark:border-neutral-800/80 flex flex-col gap-1">
          {/* Profile row */}
          <button
            onClick={() => onNavigateToProfile(user.id)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
              <span>Profile</span>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 font-mono">
              {profile?.posts_count ?? 0} posts
            </span>
          </button>

          {/* Your Likes row */}
          {onViewLikes && (
            <button
              onClick={onViewLikes}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                activeFilter === 'liked'
                  ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                  : 'text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Heart className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                <span>Your Likes</span>
              </div>
              {activeFilter === 'liked' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-500 text-white font-bold">
                  Active
                </span>
              )}
            </button>
          )}

          {/* Theme change row */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {isDark ? (
                  <Moon className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                ) : (
                  <Sun className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                )}
                <span>Theme</span>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400">
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </span>
            </button>
          )}

          {/* Logout row */}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left cursor-pointer mt-1"
            >
              <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-500" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
