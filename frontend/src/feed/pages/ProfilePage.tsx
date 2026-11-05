import React, { useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { FeedHeader } from '../components/FeedHeader';
import { PostCard } from '../components/PostCard';
import { CommentPanel } from '../components/CommentPanel';
import { ShareModal } from '../components/ShareModal';
import {
  ArrowLeft,
  Share2,
  UserCheck,
  UserPlus,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { FeedPost } from '../types';
import { feedApi } from '../services/feedApi';

interface ProfilePageProps {
  profileId: string;
  user?: any;
  token?: string | null;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onGoHome: () => void;
  onNavigateToFeed: () => void;
  onOpenAuth?: () => void;
  onOpenSignUp?: () => void;
  onSignOut?: () => void;
  onNavigateToSimulator?: () => void;
  onNavigateToProfile: (userId: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  profileId,
  user,
  token,
  isDark = false,
  onToggleTheme,
  onGoHome,
  onNavigateToFeed,
  onOpenAuth,
  onOpenSignUp,
  onSignOut,
  onNavigateToSimulator,
  onNavigateToProfile,
}) => {
  const { profile, posts, loading, error, toggleFollow, setPosts } = useProfile({
    userId: profileId,
    token,
  });

  const [selectedPostForComments, setSelectedPostForComments] = useState<FeedPost | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const profileShareUrl = `${window.location.origin}/feed/profile/${profileId}`;

  const isOwner = Boolean(user && user.id === profileId);

  const handleFollowClick = async () => {
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    try {
      setIsFollowLoading(true);
      await toggleFollow();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to update follow.');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handlePostLike = async (postId: string) => {
    if (!token) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const wasLiked = p.has_liked;
          return {
            ...p,
            has_liked: !wasLiked,
            like_count: wasLiked ? Math.max(0, p.like_count - 1) : p.like_count + 1,
          };
        }
        return p;
      })
    );

    try {
      const res = await feedApi.toggleLike(postId, token);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, has_liked: res.liked, like_count: res.likeCount } : p))
      );
    } catch {
      // Revert if error
    }
  };

  const handleUpdatePost = async (postId: string, newContent: string) => {
    if (!token) return;
    const updated = await feedApi.updatePost(postId, newContent, token);
    setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
  };

  const handleDeletePost = async (postId: string) => {
    if (!token) return;
    await feedApi.deletePost(postId, token);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-[#020202] text-slate-900 dark:text-[#ededed] font-sans transition-colors">
      <FeedHeader
        user={user}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onGoHome={onGoHome}
        onOpenAuth={onOpenAuth}
        onOpenSignUp={onOpenSignUp}
        onSignOut={onSignOut}
        onNavigateToSimulator={onNavigateToSimulator}
      />

      <div className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 py-6 flex flex-col items-center">
        {/* Top Navigation */}
        <div className="w-full flex items-center justify-between mb-4">
          <button
            onClick={onNavigateToFeed}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Feed</span>
          </button>
        </div>

        {/* Profile Card */}
        {loading && !profile ? (
          <div className="w-full rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] p-8 shadow-xs animate-pulse flex flex-col items-center text-center mb-6">
            <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-neutral-800 mb-4" />
            <div className="h-5 bg-slate-200 dark:bg-neutral-800 rounded w-48 mb-2" />
            <div className="h-3 bg-slate-200 dark:bg-neutral-800 rounded w-28" />
          </div>
        ) : error ? (
          <div className="w-full rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/20 p-8 text-center shadow-xs mb-6">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-rose-800 dark:text-rose-200">{error}</h4>
          </div>
        ) : profile ? (
          <div className="w-full rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] p-6 sm:p-8 shadow-xs mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500/20 shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-indigo-600 text-white text-3xl font-bold flex items-center justify-center uppercase shadow-md">
                  {(profile.full_name || 'U')[0]}
                </div>
              )}
            </div>

            {/* Info & Stats */}
            <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {profile.full_name}
                  </h2>
                  <span className="text-xs text-slate-500 dark:text-neutral-400 font-mono">
                    @{profile.username}
                  </span>
                </div>

                {/* Actions: Follow / Share */}
                <div className="flex items-center gap-2">
                  {!isOwner ? (
                    <button
                      onClick={handleFollowClick}
                      disabled={isFollowLoading}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
                        profile.is_following
                          ? 'border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      {isFollowLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : profile.is_following ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
                      Your Profile
                    </span>
                  )}

                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    title="Share Profile Link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bio */}
              <p className="text-xs text-slate-600 dark:text-neutral-300 mt-3 leading-relaxed max-w-xl">
                {profile.bio || 'Cloud system architect exploring scalable distributed designs on GitToScale.'}
              </p>

              {/* Counts */}
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-neutral-800/80 w-full justify-center sm:justify-start">
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mr-1.5">
                    {profile.posts_count}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-neutral-400">Posts</span>
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mr-1.5">
                    {profile.followers_count}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-neutral-400">Followers</span>
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mr-1.5">
                    {profile.following_count}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-neutral-400">Following</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* User's Posts Section */}
        <div className="w-full">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-neutral-800">
            <FileText className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Posts by {profile?.full_name || 'User'} ({posts.length})
            </h3>
          </div>

          {posts.length === 0 ? (
            <div className="w-full rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] p-10 text-center shadow-xs">
              <p className="text-xs text-slate-500 dark:text-neutral-400">No posts shared by this user yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.id}
                  onLike={handlePostLike}
                  onOpenComments={(p) => setSelectedPostForComments(p)}
                  onUpdatePost={handleUpdatePost}
                  onDeletePost={handleDeletePost}
                  onNavigateToProfile={onNavigateToProfile}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comments Drawer / Modal */}
      {selectedPostForComments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg h-[650px] max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <CommentPanel
              post={selectedPostForComments}
              currentUserId={user?.id}
              token={token}
              onClose={() => setSelectedPostForComments(null)}
              onCommentAdded={(pid) => {
                setPosts((prev) =>
                  prev.map((p) => (p.id === pid ? { ...p, comment_count: p.comment_count + 1 } : p))
                );
              }}
              onCommentDeleted={(pid) => {
                setPosts((prev) =>
                  prev.map((p) => (p.id === pid ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p))
                );
              }}
              onOpenSignIn={onOpenAuth}
              onNavigateToProfile={onNavigateToProfile}
            />
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareModal
          title={`Profile of ${profile?.full_name || 'User'}`}
          shareUrl={profileShareUrl}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
};
