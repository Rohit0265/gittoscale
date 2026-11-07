import { useState, useEffect, useCallback } from 'react';
import { FeedPost } from '../types';
import { feedApi } from '../services/feedApi';

interface UseFeedOptions {
  token?: string | null;
  userId?: string | null;
}

export function useFeed({ token, userId }: UseFeedOptions) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'liked'>(() => {
    if (typeof window !== 'undefined') {
      const param = new URLSearchParams(window.location.search).get('filter');
      if (param === 'liked') return 'liked';
    }
    return 'all';
  });
  const [selectedPostForComments, setSelectedPostForComments] = useState<FeedPost | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (filter === 'liked' && userId) {
        const data = await feedApi.getUserLikedPosts(userId, token);
        setPosts(data);
      } else {
        const data = await feedApi.getPosts(token);
        setPosts(data);
      }
    } catch (err: any) {
      console.error('[useFeed] Error loading feed posts:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load feed.');
    } finally {
      setLoading(false);
    }
  }, [token, filter, userId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCreatePost = async (
    content: string,
    mediaUrl?: string | null,
    mediaType?: 'image' | 'video' | null,
    mediaItems?: import('../types').MediaItem[]
  ) => {
    if (!token) throw new Error('You must be signed in to post.');
    const newPost = await feedApi.createPost({ content, mediaUrl, mediaType, mediaItems }, token);
    setPosts((prev) => [newPost, ...prev]);
    return newPost;
  };

  const handleUpdatePost = async (postId: string, newContent: string) => {
    if (!token) throw new Error('You must be signed in to edit posts.');
    const updated = await feedApi.updatePost(postId, newContent, token);
    setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
    if (selectedPostForComments?.id === postId) {
      setSelectedPostForComments(updated);
    }
    return updated;
  };

  const handleDeletePost = async (postId: string) => {
    if (!token) throw new Error('You must be signed in to delete posts.');
    await feedApi.deletePost(postId, token);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    if (selectedPostForComments?.id === postId) {
      setSelectedPostForComments(null);
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!token) {
      throw new Error('Please sign in to like posts.');
    }

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const wasLiked = p.has_liked;
          return {
            ...p,
            has_liked: !wasLiked,
            has_disliked: !wasLiked ? false : p.has_disliked,
            like_count: wasLiked ? Math.max(0, p.like_count - 1) : p.like_count + 1,
          };
        }
        return p;
      })
    );

    try {
      const res = await feedApi.toggleLike(postId, token);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, has_liked: res.liked, has_disliked: res.liked ? false : p.has_disliked, like_count: res.likeCount } : p))
      );
    } catch (err) {
      // Revert on error
      fetchPosts();
      throw err;
    }
  };

  const handleToggleDislike = async (postId: string) => {
    if (!token) {
      throw new Error('Please sign in to react to posts.');
    }

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const wasDisliked = Boolean(p.has_disliked);
          const wasLiked = Boolean(p.has_liked);
          return {
            ...p,
            has_disliked: !wasDisliked,
            has_liked: !wasDisliked ? false : wasLiked,
            like_count: (!wasDisliked && wasLiked) ? Math.max(0, p.like_count - 1) : p.like_count,
          };
        }
        return p;
      })
    );

    try {
      const res = await feedApi.toggleDislike(postId, token);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, has_disliked: res.disliked, has_liked: res.disliked ? false : p.has_liked } : p))
      );
    } catch (err) {
      fetchPosts();
      throw err;
    }
  };

  const handleOpenComments = (post: FeedPost) => {
    setSelectedPostForComments(post);
  };

  const handleCloseComments = () => {
    setSelectedPostForComments(null);
  };

  const handleCommentCountChange = (postId: string, delta: number) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comment_count: Math.max(0, p.comment_count + delta) } : p))
    );
  };

  return {
    posts,
    loading,
    error,
    filter,
    setFilter,
    refreshPosts: fetchPosts,
    createPost: handleCreatePost,
    updatePost: handleUpdatePost,
    deletePost: handleDeletePost,
    toggleLike: handleToggleLike,
    toggleDislike: handleToggleDislike,
    selectedPostForComments,
    openComments: handleOpenComments,
    closeComments: handleCloseComments,
    notifyCommentChange: handleCommentCountChange,
  };
}

