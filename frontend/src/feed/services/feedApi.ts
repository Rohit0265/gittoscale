import axios from 'axios';
import { FeedPost, FeedComment, UserProfileFeed, MediaItem } from '../types';

const RAW_BACKEND_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '').trim();
const CLEAN_URL = RAW_BACKEND_URL.replace(/\/+$/, '');
const API_BASE = CLEAN_URL
  ? (CLEAN_URL.endsWith('/api') ? CLEAN_URL : `${CLEAN_URL}/api`)
  : '/api';

function getAuthHeader(token?: string | null): Record<string, string> {
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export const feedApi = {
  /**
   * Fetch feed posts
   */
  async getPosts(
    token?: string | null,
    limit = 20,
    offset = 0,
    filter: 'all' | 'following' = 'all'
  ): Promise<FeedPost[]> {
    const res = await axios.get(`${API_BASE}/feed/posts`, {
      params: { limit, offset, filter },
      headers: getAuthHeader(token),
    });
    return res.data?.data || [];
  },

  /**
   * Fetch single post
   */
  async getPostById(postId: string, token?: string | null): Promise<FeedPost> {
    const res = await axios.get(`${API_BASE}/feed/posts/${postId}`, {
      headers: getAuthHeader(token),
    });
    return res.data?.data;
  },

  /**
   * Create new post
   */
  async createPost(
    post: {
      content: string;
      mediaUrl?: string | null;
      mediaType?: 'image' | 'video' | null;
      mediaItems?: MediaItem[];
      authorName?: string;
      authorEmail?: string;
    },
    token: string
  ): Promise<FeedPost> {
    const res = await axios.post(`${API_BASE}/feed/posts`, post, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(token),
        ...(post.authorName ? { 'X-User-Name': post.authorName } : {}),
        ...(post.authorEmail ? { 'X-User-Email': post.authorEmail } : {}),
      },
    });
    return res.data?.data;
  },

  /**
   * Edit post
   */
  async updatePost(postId: string, content: string, token: string): Promise<FeedPost> {
    const res = await axios.put(
      `${API_BASE}/feed/posts/${postId}`,
      { content },
      { headers: getAuthHeader(token) }
    );
    return res.data?.data;
  },

  /**
   * Delete post
   */
  async deletePost(postId: string, token: string): Promise<boolean> {
    const res = await axios.delete(`${API_BASE}/feed/posts/${postId}`, {
      headers: getAuthHeader(token),
    });
    return res.data?.success || false;
  },

  /**
   * Toggle post like
   */
  async toggleLike(postId: string, token: string): Promise<{ liked: boolean; likeCount: number }> {
    const res = await axios.post(`${API_BASE}/feed/posts/${postId}/like`, {}, {
      headers: getAuthHeader(token),
    });
    return {
      liked: res.data?.liked,
      likeCount: res.data?.likeCount,
    };
  },

  /**
   * Toggle post dislike
   */
  async toggleDislike(postId: string, token: string): Promise<{ disliked: boolean }> {
    const res = await axios.post(`${API_BASE}/feed/posts/${postId}/dislike`, {}, {
      headers: getAuthHeader(token),
    });
    return {
      disliked: res.data?.disliked,
    };
  },

  /**
   * Toggle bookmark / save for a post
   */
  async toggleBookmark(postId: string, token: string): Promise<{ bookmarked: boolean }> {
    const res = await axios.post(`${API_BASE}/feed/posts/${postId}/bookmark`, {}, {
      headers: getAuthHeader(token),
    });
    return {
      bookmarked: res.data?.bookmarked,
    };
  },

  /**
   * Record a view impression for a post
   */
  async recordView(postId: string, token?: string | null): Promise<number> {
    try {
      const res = await axios.post(
        `${API_BASE}/feed/posts/${postId}/view`,
        {},
        { headers: getAuthHeader(token) }
      );
      return typeof res.data?.views_count === 'number' ? res.data.views_count : 0;
    } catch {
      return 0;
    }
  },

  /**
   * Get post comments
   */
  async getComments(postId: string): Promise<FeedComment[]> {
    const res = await axios.get(`${API_BASE}/feed/posts/${postId}/comments`);
    return res.data?.data || [];
  },

  /**
   * Add comment to post (supports parentId for threaded replies up to 3 tiers)
   */
  async addComment(
    postId: string,
    content: string,
    token: string,
    parentId?: string | null
  ): Promise<FeedComment> {
    const res = await axios.post(
      `${API_BASE}/feed/posts/${postId}/comments`,
      { content, parentId: parentId || null },
      { headers: getAuthHeader(token) }
    );
    return res.data?.data;
  },

  /**
   * Delete comment
   */
  async deleteComment(commentId: string, token: string): Promise<boolean> {
    const res = await axios.delete(`${API_BASE}/feed/comments/${commentId}`, {
      headers: getAuthHeader(token),
    });
    return res.data?.success || false;
  },

  /**
   * Get user feed profile & stats
   */
  async getUserProfile(userId: string, token?: string | null): Promise<UserProfileFeed> {
    const res = await axios.get(`${API_BASE}/feed/profile/${userId}`, {
      headers: getAuthHeader(token),
    });
    return res.data?.data;
  },

  /**
   * Update current user profile details (name, username, bio, avatar, banner)
   */
  async updateProfile(
    profileData: {
      full_name?: string;
      username?: string;
      bio?: string;
      avatar_url?: string | null;
      banner_url?: string | null;
    },
    token: string
  ): Promise<UserProfileFeed> {
    const res = await axios.put(`${API_BASE}/feed/profile`, profileData, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(token),
      },
    });
    return res.data?.data;
  },

  /**
   * Get posts by user
   */
  async getUserPosts(userId: string, token?: string | null): Promise<FeedPost[]> {
    const res = await axios.get(`${API_BASE}/feed/profile/${userId}/posts`, {
      headers: getAuthHeader(token),
    });
    return res.data?.data || [];
  },

  /**
   * Get posts liked by user
   */
  async getUserLikedPosts(userId: string, token?: string | null): Promise<FeedPost[]> {
    const res = await axios.get(`${API_BASE}/feed/profile/${userId}/likes`, {
      headers: getAuthHeader(token),
    });
    return res.data?.data || [];
  },

  /**
   * Get posts saved/bookmarked by user
   */
  async getUserSavedPosts(userId: string, token?: string | null): Promise<FeedPost[]> {
    const res = await axios.get(`${API_BASE}/feed/profile/${userId}/saved`, {
      headers: getAuthHeader(token),
    });
    return res.data?.data || [];
  },

  /**
   * Follow or unfollow user
   */
  async toggleFollow(targetUserId: string, token: string): Promise<{ following: boolean; followersCount: number }> {
    const res = await axios.post(
      `${API_BASE}/feed/profile/${targetUserId}/follow`,
      {},
      { headers: getAuthHeader(token) }
    );
    return {
      following: res.data?.following,
      followersCount: res.data?.followersCount,
    };
  },

  /**
   * Get user followers list
   */
  async getFollowers(targetUserId: string, token?: string): Promise<Array<{
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
    bio: string;
    is_following?: boolean;
  }>> {
    const res = await axios.get(
      `${API_BASE}/feed/profile/${targetUserId}/followers`,
      { headers: getAuthHeader(token) }
    );
    return res.data?.followers || [];
  },

  /**
   * Get user following list
   */
  async getFollowing(targetUserId: string, token?: string): Promise<Array<{
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
    bio: string;
    is_following?: boolean;
  }>> {
    const res = await axios.get(
      `${API_BASE}/feed/profile/${targetUserId}/following`,
      { headers: getAuthHeader(token) }
    );
    return res.data?.following || [];
  },

  /**
   * Upload media file (image / video <= 1MB)
   */
  async uploadMedia(base64Data: string, token: string): Promise<{ url: string; mediaType: 'image' | 'video'; r2Key?: string | null }> {
    const res = await axios.post(
      `${API_BASE}/feed/upload`,
      { base64Data },
      { headers: getAuthHeader(token) }
    );
    return {
      url: res.data?.url,
      mediaType: res.data?.mediaType,
      r2Key: res.data?.r2Key,
    };
  },
};

