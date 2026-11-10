import { useState, useEffect, useCallback } from 'react';
import { UserProfileFeed, FeedPost } from '../types';
import { feedApi } from '../services/feedApi';

interface UseProfileOptions {
  userId: string;
  token?: string | null;
}

export function useProfile({ userId, token }: UseProfileOptions) {
  const [profile, setProfile] = useState<UserProfileFeed | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileAndPosts = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const [profileData, postsData] = await Promise.all([
        feedApi.getUserProfile(userId, token),
        feedApi.getUserPosts(userId, token),
      ]);
      setProfile(profileData);
      setPosts(postsData);
    } catch (err: any) {
      console.error('[useProfile] Failed to load profile:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    fetchProfileAndPosts();
  }, [fetchProfileAndPosts]);

  const handleToggleFollow = async () => {
    if (!token) throw new Error('Please sign in to follow.');
    if (!profile) return;

    // Optimistic toggle
    const prevFollowing = profile.is_following;
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            is_following: !prevFollowing,
            followers_count: prevFollowing ? Math.max(0, prev.followers_count - 1) : prev.followers_count + 1,
          }
        : null
    );

    try {
      const res = await feedApi.toggleFollow(userId, token);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              is_following: res.following,
              followers_count: res.followersCount,
            }
          : null
      );
      window.dispatchEvent(
        new CustomEvent('gitoscale:follow-toggled', {
          detail: { userId, following: res.following, followersCount: res.followersCount },
        })
      );
    } catch (err) {
      fetchProfileAndPosts();
      throw err;
    }
  };

  useEffect(() => {
    const handleFollowSync = (e: any) => {
      const detail = e?.detail;
      if (!detail?.userId || detail.userId !== userId) return;
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              is_following: detail.following,
              followers_count:
                typeof detail.followersCount === 'number' ? detail.followersCount : prev.followers_count,
            }
          : null
      );
    };

    window.addEventListener('gitoscale:follow-toggled', handleFollowSync);
    return () => window.removeEventListener('gitoscale:follow-toggled', handleFollowSync);
  }, [userId]);

  return {
    profile,
    setProfile,
    posts,
    loading,
    error,
    refreshProfile: fetchProfileAndPosts,
    toggleFollow: handleToggleFollow,
    setPosts,
  };
}

