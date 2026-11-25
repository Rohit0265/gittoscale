import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Ban,
  CheckCircle,
  Trash2,
  Search,
  X,
  MessageSquare,
  Heart,
  Calendar,
  Users,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  Eye,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { adminApi, AdminUserRecord, AdminStats } from '../../services/adminApi';
import { feedApi } from '../../feed/services/feedApi';
import { FeedPost } from '../../feed/types';
import { UserAvatar } from '../../feed/components/UserAvatar';
import { formatRelativeTime } from '../../feed/utils/formatTime';
import { useAuth } from '../../contexts/AuthContext';

export interface AdminPageProps {
  user?: any;
  token?: string | null;
  onNavigate: (view: string) => void;
  isDark?: boolean;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  user: propUser,
  token: propToken,
  onNavigate,
  isDark = true,
}) => {
  const { user: authUser, profile: authProfile, isLoading: isAuthLoading, getAuthToken } = useAuth();
  const effectiveUser = propUser || authUser;
  const initialToken = propToken || (typeof getAuthToken === 'function' ? getAuthToken() : null);

  const [token, setToken] = useState<string | null>(initialToken);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Users list state
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    warnedUsers: 0,
    suspendedUsers: 0,
    totalPosts: 0,
  });
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'warned' | 'suspended'>('all');

  // Selected User state (for inspection modal/drawer)
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [userPosts, setUserPosts] = useState<FeedPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  // Moderation modals state
  const [warnModalUser, setWarnModalUser] = useState<AdminUserRecord | null>(null);
  const [warnReason, setWarnReason] = useState('Adult content / NSFW media or links');
  const [customWarnReason, setCustomWarnReason] = useState('');
  const [isSubmittingWarn, setIsSubmittingWarn] = useState(false);

  const [suspendModalUser, setSuspendModalUser] = useState<AdminUserRecord | null>(null);
  const [suspendReason, setSuspendReason] = useState('Severe policy violation: adult content distribution');
  const [isSubmittingSuspend, setIsSubmittingSuspend] = useState(false);

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(
    null
  );

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  }, []);

  // Retrieve auth token and check superuser status
  useEffect(() => {
    if (isAuthLoading) return;

    const currentToken = propToken || (typeof getAuthToken === 'function' ? getAuthToken() : null);
    setToken(currentToken);

    if (!effectiveUser) {
      setIsAdmin(false);
      setIsCheckingAuth(false);
      return;
    }

    const ap = authProfile as any;
    const email = String(effectiveUser.email || '').toLowerCase();
    const metaUsername = String(
      effectiveUser.user_metadata?.user_name ||
      effectiveUser.user_metadata?.username ||
      effectiveUser.user_metadata?.preferred_username ||
      effectiveUser.user_metadata?.full_name ||
      ap?.username ||
      ap?.full_name ||
      ap?.fullName ||
      email.split('@')[0] ||
      ''
    ).toLowerCase();

    // Verify admin through profile flags or server check
    const isKnownAdmin = Boolean(ap?.is_admin) || ap?.role === 'admin';

    if (isKnownAdmin) {
      setIsAdmin(true);
      setIsCheckingAuth(false);
      return;
    }

    adminApi
      .checkAdminStatus(currentToken)
      .then((res) => {
        setIsAdmin(Boolean(res.isAdmin));
      })
      .catch(() => {
        setIsAdmin(isKnownAdmin);
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, [effectiveUser, propToken, isAuthLoading, authProfile, getAuthToken]);

  // Fetch users when filter or search changes
  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoadingUsers(true);
    try {
      const data = await adminApi.getUsers(token, searchQuery, statusFilter);
      if (data) {
        setUsers(data.users || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to load users', 'error');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [isAdmin, token, searchQuery, statusFilter, showToast]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  // Inspect user posts
  const handleInspectUser = async (user: AdminUserRecord) => {
    setSelectedUser(user);
    setIsLoadingPosts(true);
    const activeToken = token || (typeof getAuthToken === 'function' ? getAuthToken() : null);
    try {
      let posts = await adminApi.getUserPosts(user.id, activeToken);
      if ((!posts || posts.length === 0) && user.id) {
        try {
          const feedPosts = await feedApi.getUserPosts(user.id, activeToken);
          if (feedPosts && feedPosts.length > 0) {
            posts = feedPosts;
          }
        } catch {}
      }
      setUserPosts(posts || []);
    } catch (err: any) {
      try {
        const feedPosts = await feedApi.getUserPosts(user.id, activeToken);
        setUserPosts(feedPosts || []);
      } catch {
        showToast(err?.response?.data?.message || 'Failed to load user posts', 'error');
        setUserPosts([]);
      }
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Close inspector
  const handleCloseInspector = () => {
    setSelectedUser(null);
    setUserPosts([]);
  };

  // Warn user handler
  const handleExecuteWarn = async () => {
    if (!warnModalUser) return;
    const finalReason = warnReason === 'Custom' ? customWarnReason.trim() : warnReason;
    if (!finalReason) {
      showToast('Please specify a warning reason', 'warning');
      return;
    }

    setIsSubmittingWarn(true);
    try {
      const res = await adminApi.warnUser(warnModalUser.id, finalReason, token);
      showToast(res.message, res.isSuspended ? 'error' : 'warning');
      setWarnModalUser(null);
      setCustomWarnReason('');
      // Refresh selected user if open
      if (selectedUser?.id === warnModalUser.id) {
        setSelectedUser((prev) =>
          prev
            ? {
                ...prev,
                warning_count: res.warningCount,
                is_suspended: res.isSuspended,
                warnings: [
                  ...(prev.warnings || []),
                  { id: Math.random().toString(), reason: finalReason, created_at: new Date().toISOString() },
                ],
              }
            : null
        );
      }
      fetchUsers();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to issue warning', 'error');
    } finally {
      setIsSubmittingWarn(false);
    }
  };

  // Direct suspend handler
  const handleExecuteSuspend = async () => {
    if (!suspendModalUser) return;
    setIsSubmittingSuspend(true);
    try {
      const res = await adminApi.suspendUser(suspendModalUser.id, suspendReason, token);
      showToast(res.message, 'warning');
      setSuspendModalUser(null);
      if (selectedUser?.id === suspendModalUser.id) {
        setSelectedUser((prev) =>
          prev
            ? {
                ...prev,
                is_suspended: true,
                suspension_reason: suspendReason,
              }
            : null
        );
      }
      fetchUsers();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to suspend user', 'error');
    } finally {
      setIsSubmittingSuspend(false);
    }
  };

  // Unsuspend user handler
  const handleExecuteUnsuspend = async (targetUser: AdminUserRecord) => {
    try {
      const res = await adminApi.unsuspendUser(targetUser.id, token);
      showToast(res.message, 'success');
      if (selectedUser?.id === targetUser.id) {
        setSelectedUser((prev) =>
          prev
            ? {
                ...prev,
                is_suspended: false,
                suspension_reason: null,
              }
            : null
        );
      }
      fetchUsers();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to unsuspend user', 'error');
    }
  };

  // Reset warnings handler
  const handleResetWarnings = async (targetUser: AdminUserRecord) => {
    if (!window.confirm(`Reset warnings count to 0 for @${targetUser.username}?`)) return;
    try {
      const res = await adminApi.resetWarnings(targetUser.id, token);
      showToast(res.message, 'success');
      if (selectedUser?.id === targetUser.id) {
        setSelectedUser((prev) =>
          prev
            ? {
                ...prev,
                warning_count: 0,
                warnings: [],
              }
            : null
        );
      }
      fetchUsers();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to reset warnings', 'error');
    }
  };

  // Delete post handler
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to permanently remove this post?')) return;
    try {
      const success = await adminApi.deletePost(postId, token);
      if (success) {
        showToast('Post removed successfully by administrator', 'success');
        setUserPosts((prev) => prev.filter((p) => p.id !== postId));
        // Update user's post count
        if (selectedUser) {
          setSelectedUser((prev) => (prev ? { ...prev, posts_count: Math.max(prev.posts_count - 1, 0) } : null));
        }
        fetchUsers();
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to remove post', 'error');
    }
  };

  // Toggle superuser role
  const handleToggleRole = async (targetUser: AdminUserRecord) => {
    const makeAdmin = !targetUser.is_admin;
    const actionLabel = makeAdmin ? 'grant Superuser rights to' : 'revoke Superuser rights from';
    if (!window.confirm(`Are you sure you want to ${actionLabel} @${targetUser.username}?`)) return;

    try {
      const res = await adminApi.toggleRole(targetUser.id, makeAdmin, token);
      showToast(res.message, 'success');
      if (selectedUser?.id === targetUser.id) {
        setSelectedUser((prev) => (prev ? { ...prev, is_admin: makeAdmin, role: makeAdmin ? 'admin' : 'user' } : null));
      }
      fetchUsers();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to toggle role', 'error');
    }
  };

  // Preset warning reasons
  const presetReasons = useMemo(
    () => [
      'Adult content / NSFW media or links',
      'Harassment, hate speech, or abuse',
      'Spam, unsolicited advertising, or bot behavior',
      'Malware, phishing, or malicious links',
      'Copyright infringement / unauthorized material',
      'Custom',
    ],
    []
  );

  // Auth checking loader
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm font-medium">Verifying superuser privileges...</p>
      </div>
    );
  }

  // Not logged in state
  if (!effectiveUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Superuser Portal</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          Please sign in with your administrator account to access the moderation console.
        </p>
        <button
          onClick={() => onNavigate('signin')}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition-colors cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Access denied state
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Superuser Access Restricted</h1>
        <p className="text-sm text-slate-400 max-w-md mb-2">
          This portal is reserved strictly for GitToScale system administrators and content moderators.
        </p>
        <p className="text-xs text-slate-500 mb-6">
          Signed in as: <span className="text-slate-300 font-semibold">{effectiveUser.email || effectiveUser.id}</span>
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('feed')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-white transition-colors cursor-pointer"
          >
            Go to Community Feed
          </button>
          <button
            onClick={() => onNavigate('landing')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition-colors cursor-pointer"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0B0F17] text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-semibold border backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-800 text-rose-200'
              : toastMessage.type === 'warning'
              ? 'bg-amber-950/90 border-amber-800 text-amber-200'
              : 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : toastMessage.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0B0F17]/80 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('feed')}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Return to Feed"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">Superuser Control Panel</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Moderator
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Account warnings, adult content moderation & suspension desk</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchUsers}
            disabled={isLoadingUsers}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => onNavigate('feed')}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            View Feed
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Metric Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Users</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats.totalUsers}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Active Accounts</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">{stats.activeUsers}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Warned (1-2)</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">{stats.warnedUsers}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Suspended (3+)</span>
              <Ban className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400">{stats.suspendedUsers}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Platform Posts</span>
              <FileText className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-400">{stats.totalPosts}</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-3 rounded-2xl">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user by @username, full name, or email..."
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { id: 'all', label: 'All Users' },
                { id: 'active', label: 'Active' },
                { id: 'warned', label: 'Warned (1-2)' },
                { id: 'suspended', label: 'Suspended (Banned)' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-950/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table / List */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800/80">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Warnings (3 Max)</th>
                  <th className="px-4 py-3.5">Posts</th>
                  <th className="px-4 py-3.5">Joined</th>
                  <th className="px-5 py-3.5 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoadingUsers ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      No users found matching your search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const isBanned = user.is_suspended || user.warning_count >= 3;
                    const warningTiers = Math.min(user.warning_count || 0, 3);

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* User Identity Column */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleInspectUser(user)}
                              className="relative shrink-0 cursor-pointer"
                              title={`Inspect ${user.full_name}'s profile and posts`}
                            >
                              <UserAvatar
                                src={user.avatar_url}
                                name={user.full_name || user.username}
                                seed={user.id || user.full_name}
                                className="w-9 h-9 rounded-full border border-slate-700"
                                fallbackClassName="w-9 h-9 rounded-full text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs"
                              />
                              {isBanned && (
                                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-600 border border-slate-900 flex items-center justify-center text-white text-[9px]">
                                  &times;
                                </span>
                              )}
                            </button>

                            <div className="min-w-0">
                              <button
                                onClick={() => handleInspectUser(user)}
                                className="font-semibold text-white hover:text-indigo-400 transition-colors truncate block text-left cursor-pointer"
                              >
                                {user.full_name}
                              </button>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span>@{user.username}</span>
                                {user.email && (
                                  <>
                                    <span>&bull;</span>
                                    <span className="truncate max-w-[140px] text-slate-500">{user.email}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Column */}
                        <td className="px-4 py-3.5">
                          {user.is_admin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              <ShieldCheck className="w-3 h-3" />
                              Superuser
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300">
                              User
                            </span>
                          )}
                        </td>

                        {/* Status Column */}
                        <td className="px-4 py-3.5">
                          {isBanned ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <Ban className="w-3 h-3" />
                              Suspended
                            </span>
                          ) : user.warning_count > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <AlertTriangle className="w-3 h-3" />
                              Warned ({user.warning_count}/3)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          )}
                        </td>

                        {/* Warning Progress Column */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3].map((step) => {
                              const filled = warningTiers >= step;
                              return (
                                <div
                                  key={step}
                                  className={`h-2 w-5 rounded-full transition-colors ${
                                    filled
                                      ? step === 3
                                        ? 'bg-rose-500'
                                        : step === 2
                                        ? 'bg-orange-500'
                                        : 'bg-amber-400'
                                      : 'bg-slate-800'
                                  }`}
                                  title={`Warning tier ${step}`}
                                />
                              );
                            })}
                            <span className="text-[11px] font-semibold text-slate-400 ml-1">
                              {user.warning_count}/3
                            </span>
                          </div>
                        </td>

                        {/* Post count */}
                        <td className="px-4 py-3.5 text-slate-300 font-medium">
                          <button
                            onClick={() => handleInspectUser(user)}
                            className="hover:text-indigo-400 underline underline-offset-2 cursor-pointer"
                          >
                            {user.posts_count} posts
                          </button>
                        </td>

                        {/* Joined Date */}
                        <td className="px-4 py-3.5 text-slate-400 text-xs">
                          {formatRelativeTime(user.created_at)}
                        </td>

                        {/* Moderation Actions Column */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspect posts */}
                            <button
                              onClick={() => handleInspectUser(user)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              title="Inspect posts & activity"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Issue warning */}
                            <button
                              onClick={() => setWarnModalUser(user)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-semibold transition-colors cursor-pointer"
                              title="Issue strike warning"
                            >
                              +1 Warn
                            </button>

                            {/* Suspend or Unsuspend */}
                            {isBanned ? (
                              <button
                                onClick={() => handleExecuteUnsuspend(user)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-colors cursor-pointer"
                                title="Unsuspend account"
                              >
                                Unsuspend
                              </button>
                            ) : (
                              <button
                                onClick={() => setSuspendModalUser(user)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-colors cursor-pointer"
                                title="Direct account suspension"
                              >
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* User Inspection & Posts Modal Drawer ("after tapping on the username i can see the post it makes") */}
      {selectedUser && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={selectedUser.avatar_url}
                  name={selectedUser.full_name || selectedUser.username}
                  seed={selectedUser.id || selectedUser.full_name}
                  className="w-11 h-11 rounded-full border border-slate-700"
                  fallbackClassName="w-11 h-11 rounded-full text-white font-bold text-sm flex items-center justify-center uppercase shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">{selectedUser.full_name}</h2>
                    {selectedUser.is_admin && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">@{selectedUser.username} &bull; {selectedUser.email}</p>
                </div>
              </div>

              <button
                onClick={handleCloseInspector}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 space-y-6 flex-1">
              {/* Account Status Card */}
              <div
                className={`p-4 rounded-2xl border ${
                  selectedUser.is_suspended || selectedUser.warning_count >= 3
                    ? 'bg-rose-950/30 border-rose-800/60'
                    : selectedUser.warning_count > 0
                    ? 'bg-amber-950/30 border-amber-800/60'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Moderation Standing
                    </span>
                  </div>
                  <div className="text-xs font-bold">
                    {selectedUser.is_suspended || selectedUser.warning_count >= 3 ? (
                      <span className="text-rose-400 flex items-center gap-1">
                        <Ban className="w-3.5 h-3.5" /> Suspended Account
                      </span>
                    ) : selectedUser.warning_count > 0 ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> {selectedUser.warning_count} / 3 Warnings
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Clean Standing (0 Warnings)
                      </span>
                    )}
                  </div>
                </div>

                {selectedUser.suspension_reason && (
                  <p className="text-xs text-rose-300 bg-rose-950/60 p-2.5 rounded-xl border border-rose-900/60 mb-3">
                    <strong>Suspension Reason:</strong> {selectedUser.suspension_reason}
                  </p>
                )}

                {/* Warnings history if any */}
                {selectedUser.warnings && selectedUser.warnings.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">Warning History:</p>
                    {selectedUser.warnings.map((w, idx) => (
                      <div
                        key={w.id || idx}
                        className="text-xs bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex items-start justify-between gap-2"
                      >
                        <div>
                          <span className="font-bold text-amber-400 mr-1.5">Strike {idx + 1}:</span>
                          <span className="text-slate-300">{w.reason}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {formatRelativeTime(w.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => setWarnModalUser(selectedUser)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Issue Warning (+1)</span>
                  </button>

                  {selectedUser.is_suspended || selectedUser.warning_count >= 3 ? (
                    <button
                      onClick={() => handleExecuteUnsuspend(selectedUser)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Unsuspend Account</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setSuspendModalUser(selectedUser)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Direct Ban / Suspend</span>
                    </button>
                  )}

                  {selectedUser.warning_count > 0 && (
                    <button
                      onClick={() => handleResetWarnings(selectedUser)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Warnings (0)</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleRole(selectedUser)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 text-xs font-semibold transition-colors cursor-pointer ml-auto"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>{selectedUser.is_admin ? 'Revoke Superuser' : 'Make Superuser'}</span>
                  </button>
                </div>
              </div>

              {/* User's Posts Section ("after tapping on the username i can see the post it makes") */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>Published Posts ({userPosts.length})</span>
                  </h3>
                  <span className="text-xs text-slate-400">Review content for adult/policy violations</span>
                </div>

                {isLoadingPosts ? (
                  <div className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                    Loading user posts...
                  </div>
                ) : userPosts.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-950/50 border border-slate-800 text-center text-slate-400 text-xs">
                    This user has not published any posts yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userPosts.map((post) => (
                      <div
                        key={post.id}
                        className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3 group"
                      >
                        {/* Post Header */}
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatRelativeTime(post.created_at)}
                          </span>

                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5 text-rose-500" />
                              {post.like_count}
                            </span>
                            <span className="flex items-center gap-1" title="Comments">
                              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                              {post.comment_count}
                            </span>
                            <span className="flex items-center gap-1 text-slate-400" title={`${post.views_count ?? 0} views`}>
                              <Eye className="w-3.5 h-3.5 text-slate-400" />
                              {post.views_count ?? 0}
                            </span>

                            {/* "if there is an gadbadi there i can ban hin or remove its post etc" */}
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-colors cursor-pointer"
                              title="Delete post immediately"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove Post</span>
                            </button>
                          </div>
                        </div>

                        {/* Post Content */}
                        <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                          {post.content}
                        </p>

                        {/* Media Display if present */}
                        {post.media_items && post.media_items.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden mt-2">
                            {post.media_items.map((m, idx) => (
                              <div key={idx} className="relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-800">
                                {m.type === 'video' ? (
                                  <video
                                    src={m.url}
                                    controls
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <img
                                    src={m.url}
                                    alt={`Media ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : post.media_url ? (
                          <div className="rounded-xl overflow-hidden mt-2 border border-slate-800 max-h-72 bg-black">
                            {post.media_type === 'video' ? (
                              <video
                                src={post.media_url}
                                controls
                                className="w-full max-h-72 object-contain"
                              />
                            ) : (
                              <img
                                src={post.media_url}
                                alt="Post media"
                                className="w-full max-h-72 object-contain"
                              />
                            )}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issue Warning Modal (Rules: 3 warnings = Auto-Suspension) */}
      {warnModalUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Issue Strike Warning</h3>
                  <p className="text-xs text-slate-400">Target: @{warnModalUser.username}</p>
                </div>
              </div>
              <button
                onClick={() => setWarnModalUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-900/60 text-xs text-amber-200">
              <strong>Three-Strike Policy:</strong> User currently has{' '}
              <span className="font-bold underline">{warnModalUser.warning_count} / 3</span> strikes.
              {warnModalUser.warning_count >= 2 ? (
                <span className="block mt-1 text-rose-300 font-bold">
                  ⚠️ This warning will trigger Strike #3 and automatically suspend the user's account!
                </span>
              ) : (
                <span className="block mt-1">
                  Upon receiving 3 strikes, the account is permanently suspended from posting and commenting.
                </span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Select Violation Category:</label>
              <select
                value={warnReason}
                onChange={(e) => setWarnReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:border-amber-500"
              >
                {presetReasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {warnReason === 'Custom' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Custom Reason Description:</label>
                <textarea
                  value={customWarnReason}
                  onChange={(e) => setCustomWarnReason(e.target.value)}
                  placeholder="Detail the exact community guideline breach..."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setWarnModalUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteWarn}
                disabled={isSubmittingWarn}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingWarn ? 'Recording Warning...' : `Confirm Strike #${warnModalUser.warning_count + 1}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Suspend Modal ("if there is an gadbadi there i can ban hin") */}
      {suspendModalUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-rose-800/60 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Direct Account Suspension</h3>
                  <p className="text-xs text-slate-400">Suspend: @{suspendModalUser.username}</p>
                </div>
              </div>
              <button
                onClick={() => setSuspendModalUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-rose-300 bg-rose-950/40 p-3 rounded-xl border border-rose-900/60 leading-relaxed">
              Immediate suspension will instantly block this user from creating posts, uploading videos/images, or leaving comments.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Suspension Reason / Ground:</label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Specify the policy violation (e.g. Adult/NSFW content distribution)..."
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSuspendModalUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteSuspend}
                disabled={isSubmittingSuspend}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingSuspend ? 'Suspending...' : 'Suspend Account Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
