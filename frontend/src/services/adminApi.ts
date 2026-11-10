import axios from 'axios';
import { FeedPost } from '../feed/types';

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

export interface AdminUserRecord {
  id: string;
  full_name: string;
  username: string;
  email: string;
  avatar_url?: string | null;
  bio?: string;
  is_admin: boolean;
  role: string;
  is_suspended: boolean;
  warning_count: number;
  warnings: Array<{ id: string; reason: string; created_at: string; issued_by?: string }>;
  suspended_at?: string | null;
  suspension_reason?: string | null;
  created_at: string;
  posts_count: number;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  warnedUsers: number;
  suspendedUsers: number;
  totalPosts: number;
}

export interface AdminUsersResponse {
  users: AdminUserRecord[];
  total: number;
  stats: AdminStats;
  limit: number;
  offset: number;
}

export const adminApi = {
  /**
   * Check if the authenticated user has superuser/admin privileges
   */
  async checkAdminStatus(token?: string | null): Promise<{ isAdmin: boolean; user?: any }> {
    try {
      const res = await axios.get(`${API_BASE}/admin/check`, {
        headers: getAuthHeader(token),
      });
      return {
        isAdmin: Boolean(res.data?.isAdmin),
        user: res.data?.user || null,
      };
    } catch {
      return { isAdmin: false };
    }
  },

  /**
   * Fetch all registered users with search and filter
   */
  async getUsers(
    token?: string | null,
    search?: string,
    status?: 'all' | 'active' | 'warned' | 'suspended',
    limit = 50,
    offset = 0
  ): Promise<AdminUsersResponse> {
    const res = await axios.get(`${API_BASE}/admin/users`, {
      params: { search, status, limit, offset },
      headers: getAuthHeader(token),
    });
    return res.data?.data;
  },

  /**
   * Fetch all posts made by a specific user for admin review
   */
  async getUserPosts(targetUserId: string, token?: string | null): Promise<FeedPost[]> {
    const res = await axios.get(`${API_BASE}/admin/users/${targetUserId}/posts`, {
      headers: getAuthHeader(token),
    });
    return res.data?.data || [];
  },

  /**
   * Issue a warning to a user (auto-suspends on 3rd warning)
   */
  async warnUser(
    targetUserId: string,
    reason: string,
    token?: string | null
  ): Promise<{ user: AdminUserRecord; warningCount: number; isSuspended: boolean; message: string }> {
    const res = await axios.post(
      `${API_BASE}/admin/users/${targetUserId}/warn`,
      { reason },
      { headers: getAuthHeader(token) }
    );
    return {
      user: res.data?.data?.user,
      warningCount: res.data?.data?.warningCount,
      isSuspended: res.data?.data?.isSuspended,
      message: res.data?.message,
    };
  },

  /**
   * Directly suspend/ban an account
   */
  async suspendUser(
    targetUserId: string,
    reason: string,
    token?: string | null
  ): Promise<{ success: boolean; message: string }> {
    const res = await axios.post(
      `${API_BASE}/admin/users/${targetUserId}/suspend`,
      { reason },
      { headers: getAuthHeader(token) }
    );
    return {
      success: res.data?.success,
      message: res.data?.message,
    };
  },

  /**
   * Lift suspension on a user account
   */
  async unsuspendUser(
    targetUserId: string,
    token?: string | null
  ): Promise<{ success: boolean; message: string }> {
    const res = await axios.post(
      `${API_BASE}/admin/users/${targetUserId}/unsuspend`,
      {},
      { headers: getAuthHeader(token) }
    );
    return {
      success: res.data?.success,
      message: res.data?.message,
    };
  },

  /**
   * Reset user warnings count to 0
   */
  async resetWarnings(
    targetUserId: string,
    token?: string | null
  ): Promise<{ success: boolean; message: string }> {
    const res = await axios.post(
      `${API_BASE}/admin/users/${targetUserId}/reset-warnings`,
      {},
      { headers: getAuthHeader(token) }
    );
    return {
      success: res.data?.success,
      message: res.data?.message,
    };
  },

  /**
   * Permanently delete an inappropriate post as administrator
   */
  async deletePost(postId: string, token?: string | null): Promise<boolean> {
    const res = await axios.delete(`${API_BASE}/admin/posts/${postId}`, {
      headers: getAuthHeader(token),
    });
    return res.data?.success || false;
  },

  /**
   * Toggle admin/superuser role for a user
   */
  async toggleRole(
    targetUserId: string,
    makeAdmin: boolean,
    token?: string | null
  ): Promise<{ success: boolean; message: string }> {
    const res = await axios.post(
      `${API_BASE}/admin/users/${targetUserId}/role`,
      { makeAdmin },
      { headers: getAuthHeader(token) }
    );
    return {
      success: res.data?.success,
      message: res.data?.message,
    };
  },
};
