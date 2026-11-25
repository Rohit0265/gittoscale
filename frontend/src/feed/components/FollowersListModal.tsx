import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, UserCheck, Users, Search, Loader2 } from 'lucide-react';
import { feedApi } from '../services/feedApi';
import { UserAvatar } from './UserAvatar';

export interface FollowUser {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string;
  is_following?: boolean;
}

interface FollowersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialTab?: 'followers' | 'following';
  currentUserId?: string;
  token?: string;
  onNavigateToProfile?: (userId: string) => void;
  onFollowChange?: (targetUserId: string, isFollowing: boolean) => void;
}

export const FollowersListModal: React.FC<FollowersListModalProps> = ({
  isOpen,
  onClose,
  userId,
  initialTab = 'followers',
  currentUserId,
  token,
  onNavigateToProfile,
  onFollowChange,
}) => {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [followActionLoading, setFollowActionLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchQuery('');
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen || !userId) return;

    let isMounted = true;
    setLoading(true);

    const fetchData = async () => {
      try {
        if (activeTab === 'followers') {
          const list = await feedApi.getFollowers(userId, token);
          if (isMounted) setFollowers(list);
        } else {
          const list = await feedApi.getFollowing(userId, token);
          if (isMounted) setFollowing(list);
        }
      } catch (err) {
        console.error('Failed to fetch follow list:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId, activeTab, token]);

  // Handle follow / unfollow toggle directly inside modal
  const handleToggleFollow = async (e: React.MouseEvent, targetUser: FollowUser) => {
    e.stopPropagation();
    if (!token || !currentUserId || targetUser.id === currentUserId) return;

    setFollowActionLoading((prev) => ({ ...prev, [targetUser.id]: true }));
    try {
      const res = await feedApi.toggleFollow(targetUser.id, token);
      const newFollowingState = res.following;

      // Update in followers list
      setFollowers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_following: newFollowingState } : u))
      );
      // Update in following list
      setFollowing((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_following: newFollowingState } : u))
      );

      if (onFollowChange) {
        onFollowChange(targetUser.id, newFollowingState);
      }
    } catch (err) {
      console.error('Failed to toggle follow in modal:', err);
    } finally {
      setFollowActionLoading((prev) => ({ ...prev, [targetUser.id]: false }));
    }
  };

  const handleUserClick = (targetId: string) => {
    onClose();
    if (onNavigateToProfile) {
      onNavigateToProfile(targetId);
    }
  };

  const currentList = activeTab === 'followers' ? followers : following;
  const filteredList = currentList.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-[#0D0D11] border border-slate-200 dark:border-neutral-800 shadow-2xl overflow-hidden z-10"
          >
            {/* Header with Tabs */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-slate-100 dark:border-neutral-800/80">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-900 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('followers')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'followers'
                      ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Followers
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('following')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'following'
                      ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Following
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-neutral-800/80">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 dark:text-neutral-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-neutral-900/80 border border-slate-200/80 dark:border-neutral-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-neutral-800/60 p-2 min-h-[220px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400 dark:text-neutral-500">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="text-xs">Loading {activeTab}...</span>
                </div>
              ) : filteredList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400 dark:text-neutral-500 text-center px-4">
                  <Users className="w-8 h-8 stroke-1 text-slate-300 dark:text-neutral-700" />
                  <p className="text-xs font-medium text-slate-600 dark:text-neutral-400">
                    {searchQuery
                      ? 'No users match your search'
                      : activeTab === 'followers'
                      ? 'No followers yet'
                      : 'Not following anyone yet'}
                  </p>
                </div>
              ) : (
                filteredList.map((userItem) => {
                  const isSelf = currentUserId === userItem.id;
                  const isFollowingTarget = userItem.is_following;
                  const isActionLoading = followActionLoading[userItem.id];

                  return (
                    <div
                      key={userItem.id}
                      onClick={() => handleUserClick(userItem.id)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-900/70 transition-colors cursor-pointer group"
                    >
                      {/* Avatar & User Details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                        <UserAvatar
                          src={userItem.avatar_url}
                          name={userItem.full_name}
                          className="w-10 h-10 rounded-full shrink-0"
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {userItem.full_name}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono truncate">
                            @{userItem.username}
                          </span>
                          {userItem.bio && (
                            <span className="text-[11px] text-slate-500 dark:text-neutral-500 line-clamp-1 mt-0.5">
                              {userItem.bio}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Follow / Following Action Button */}
                      {currentUserId && !isSelf && (
                        <button
                          type="button"
                          onClick={(e) => handleToggleFollow(e, userItem)}
                          disabled={isActionLoading}
                          className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            isFollowingTarget
                              ? 'border border-slate-200 dark:border-neutral-700 bg-transparent text-slate-700 dark:text-neutral-300 hover:border-red-500/40 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                          }`}
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isFollowingTarget ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Following</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Follow</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
