import React, { useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { FeedHeader } from '../components/FeedHeader';
import { PostCard } from '../components/PostCard';
import { CommentPanel } from '../components/CommentPanel';
import { ShareModal } from '../components/ShareModal';
import { EditProfileModal } from '../components/EditProfileModal';
import {
  ArrowLeft,
  Share2,
  UserCheck,
  UserPlus,
  Loader2,
  AlertCircle,
  FileText,
  Camera,
  Edit3,
} from 'lucide-react';
import { FeedPost } from '../types';
import { feedApi } from '../services/feedApi';
import { useSmoothScroll } from '../../utils/useSmoothScroll';
import {
  extractAccountAvatar,
  getAvatarColor,
  getRandomBannerColor,
  getInitial,
} from '../utils/avatarUtils';
import { UserAvatar } from '../components/UserAvatar';

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
  isDark = true,
  onToggleTheme,
  onGoHome,
  onNavigateToFeed,
  onOpenAuth,
  onOpenSignUp,
  onSignOut,
  onNavigateToSimulator,
  onNavigateToProfile,
}) => {
  const { profile, setProfile, posts, loading, error, toggleFollow, setPosts } = useProfile({
    userId: profileId,
    token,
  });

  useSmoothScroll({ lerp: 0.085, enabled: true });

  const [selectedPostForComments, setSelectedPostForComments] = useState<FeedPost | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const profileShareUrl = `${window.location.origin}/feed/profile/${profileId}`;

  const isOwner = Boolean(user && user.id === profileId);

  // Determine avatar from profile or account OAuth metadata
  const accountAvatar = isOwner ? extractAccountAvatar(user) : null;
  const effectiveAvatar = profile?.avatar_url || accountAvatar;
  const defaultBannerBg = getRandomBannerColor(profile?.id || profile?.username || profile?.full_name);
  const [bannerImgFailed, setBannerImgFailed] = useState(false);

  React.useEffect(() => {
    setBannerImgFailed(false);
  }, [profile?.banner_url]);

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
        prev.map((p) => (p.id === postId ? { ...p, has_liked: res.liked, has_disliked: res.liked ? false : p.has_disliked, like_count: res.likeCount } : p))
      );
    } catch {
      // Revert if error
    }
  };

  const handlePostDislike = async (postId: string) => {
    if (!token) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

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
    } catch {
      // Revert if error
    }
  };

  const handlePostBookmark = async (postId: string) => {
    if (!token) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            has_bookmarked: !p.has_bookmarked,
          };
        }
        return p;
      })
    );

    try {
      const res = await feedApi.toggleBookmark(postId, token);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, has_bookmarked: res.bookmarked } : p))
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
        token={token}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onGoHome={onGoHome}
        onOpenAuth={onOpenAuth}
        onOpenSignUp={onOpenSignUp}
        onSignOut={onSignOut}
        onNavigateToSimulator={onNavigateToSimulator}
        onNavigateToProfile={onNavigateToProfile}
        onViewLikes={onNavigateToFeed}
        onViewSaved={() => {
          window.history.pushState({}, '', '/feed?filter=saved');
          onNavigateToFeed();
        }}
      />

      <div className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 py-6 flex flex-col items-center">
        {/* Top Navigation */}
        <div className="w-full flex items-center justify-between mb-4">
          <button
            onClick={onNavigateToFeed}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
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
          <div className="w-full rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] overflow-hidden shadow-xs mb-6">
            {/* Profile Cover Banner */}
            <div className="relative h-36 sm:h-52 w-full bg-slate-100 dark:bg-neutral-900 overflow-hidden group">
              {profile.banner_url ? (
                profile.banner_url.startsWith('linear-gradient') ? (
                  <div className="w-full h-full" style={{ background: profile.banner_url }} />
                ) : (
                  <img
                    src={profile.banner_url}
                    alt="Profile banner"
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="w-full h-full" style={{ background: defaultBannerBg }} />
              )}

              {/* Edit Banner Shortcut Button if Owner */}
              {isOwner && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                  title="Change background cover"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Edit Cover</span>
                </button>
              )}
            </div>

            {/* Profile Info & Avatar */}
            <div className="p-6 sm:p-8 pt-0 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar Overlapping Banner */}
              <div className="shrink-0 -mt-12 sm:-mt-16 relative group">
                {effectiveAvatar ? (
                  <img
                    src={effectiveAvatar}
                    alt={profile.full_name}
                    className="w-24 sm:w-28 h-24 sm:h-28 rounded-full object-cover border-4 border-white dark:border-[#0A0A0A] shadow-lg"
                  />
                ) : (
                  <div
                    className="w-24 sm:w-28 h-24 sm:h-28 rounded-full text-white text-3xl font-bold flex items-center justify-center uppercase border-4 border-white dark:border-[#0A0A0A] shadow-lg"
                    style={{ background: getAvatarColor(profile.id || profile.full_name) }}
                  >
                    {getInitial(profile.full_name || profile.username)}
                  </div>
                )}

                {isOwner && (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                    title="Change Avatar"
                  >
                    <Camera className="w-6 h-6 drop-shadow-md" />
                  </button>
                )}
              </div>

              {/* Info & Stats */}
              <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start text-center sm:text-left mt-2 sm:mt-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                      {profile.full_name}
                    </h2>
                    <span className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 font-mono">
                      @{profile.username}
                    </span>
                  </div>

                  {/* Actions: Edit Profile / Follow / Share */}
                  <div className="flex items-center gap-2">
                    {isOwner ? (
                      <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-700 text-slate-800 dark:text-white shadow-xs transition-colors cursor-pointer"
                        title="Edit profile name, username, avatar, cover and bio"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Edit Profile</span>
                      </button>
                    ) : (
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
                <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 mt-3 leading-relaxed max-w-xl">
                  {profile.bio || 'Cloud system architect exploring scalable distributed designs on GitToScale.'}
                </p>

                {/* Counts */}
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-neutral-800/80 w-full justify-center sm:justify-start">
                  <div>
                    <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mr-1.5">
                      {profile.posts_count}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-neutral-400">Posts</span>
                  </div>
                  <div>
                    <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mr-1.5">
                      {profile.followers_count}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-neutral-400">Followers</span>
                  </div>
                  <div>
                    <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mr-1.5">
                      {profile.following_count}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-neutral-400">Following</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* User's Posts Section */}
        <div className="w-full">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-neutral-800">
            <FileText className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
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
                  onDislike={handlePostDislike}
                  onBookmark={handlePostBookmark}
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

      {/* Comments Drawer / Mobile Bottom Sheet */}
      {selectedPostForComments && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setSelectedPostForComments(null)}
          />
          <div className="relative w-full max-w-2xl h-[55vh] sm:h-[650px] max-h-[85vh] rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-out animate-in slide-in-from-bottom">
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

      {/* Edit Profile Modal */}
      {profile && isOwner && token && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={profile}
          token={token}
          accountAvatar={accountAvatar}
          onProfileUpdated={(updated) => {
            setProfile(updated);
          }}
        />
      )}
    </div>
  );
};

