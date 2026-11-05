import axios from 'axios';
import { FeedPost, FeedComment, UserProfileFeed } from '../types';

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
  async getPosts(token?: string | null, limit = 20, offset = 0): Promise<FeedPost[]> {
    const res = await axios.get(`${API_BASE}/feed/posts`, {
      params: { limit, offset },
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
    post: { content: string; mediaUrl?: string | null; mediaType?: 'image' | 'video' | null },
    token: string
  ): Promise<FeedPost> {
    const res = await axios.post(`${API_BASE}/feed/posts`, post, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(token),
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
   * Upload media file (image / video <= 1MB)
   */
  async uploadMedia(base64Data: string, token: string): Promise<{ url: string; mediaType: 'image' | 'video' }> {
    const res = await axios.post(
      `${API_BASE}/feed/upload`,
      { base64Data },
      { headers: getAuthHeader(token) }
    );
    return {
      url: res.data?.url,
      mediaType: res.data?.mediaType,
    };
  },
};

