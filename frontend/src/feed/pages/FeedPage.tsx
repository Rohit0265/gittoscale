import React from 'react';
import { useFeed } from '../hooks/useFeed';
import { FeedHeader } from '../components/FeedHeader';
import { FeedSidebar } from '../components/FeedSidebar';
import { CreatePost } from '../components/CreatePost';
import { PostCard } from '../components/PostCard';
import { CommentPanel } from '../components/CommentPanel';
import { RefreshCw, MessageSquare, AlertCircle, Users } from 'lucide-react';
import { useSmoothScroll } from '../../utils/useSmoothScroll';
import { FloatingFeedbackButton } from '../../components/FloatingFeedbackButton';

interface FeedPageProps {
  user?: any;
  token?: string | null;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onGoHome: () => void;
  onOpenAuth?: () => void;
  onOpenSignUp?: () => void;
  onSignOut?: () => void;
  onNavigateToSimulator?: () => void;
  onNavigateToProfile: (userId: string) => void;
  pendingPost?: {
    content?: string;
    media?: import('../components/CreatePost').InitialPostMedia[];
  } | null;
  onClearPendingPost?: () => void;
}

export const FeedPage: React.FC<FeedPageProps> = ({
  user,
  token,
  isDark = true,
  onToggleTheme,
  onGoHome,
  onOpenAuth,
  onOpenSignUp,
  onSignOut,
  onNavigateToSimulator,
  onNavigateToProfile,
  pendingPost,
  onClearPendingPost,
}) => {
  const {
    posts,
    loading,
    error,
    filter,
    setFilter,
    refreshPosts,
    createPost,
    deletePost,
    toggleLike,
    toggleDislike,
    toggleBookmark,
    toggleFollow,
    selectedPostForComments,
    openComments,
    closeComments,
    notifyCommentChange,
  } = useFeed({ token, userId: user?.id });

  // Inertia-damped smooth scrolling for feed stream
  useSmoothScroll({ lerp: 0.085, enabled: true });

  const handleToggleFilter = () => {
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setFilter((prev) => (prev === 'liked' ? 'all' : 'liked'));
  };

  const handleViewSaved = () => {
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setFilter('saved');
  };

  React.useEffect(() => {
    if (pendingPost) {
      setFilter('all');
    }
  }, [pendingPost, setFilter]);

  React.useEffect(() => {
    if (!selectedPostForComments) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeComments();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPostForComments, closeComments]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-[#020202] text-slate-900 dark:text-[#ededed] font-sans transition-colors">
      {/* 1. Feed Header */}
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
        onViewLikes={handleToggleFilter}
        onViewSaved={handleViewSaved}
      />

      {/* 2. Responsive 3-Column Layout */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-3.5 sm:py-6 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-start">
        {/* Left Column: User Profile Info (3 cols on desktop) */}
        <div className="hidden md:block md:col-span-4 lg:col-span-3 sticky top-20">
          <FeedSidebar
            user={user}
            token={token}
            isDark={isDark}
            onToggleTheme={onToggleTheme}
            onSignOut={onSignOut}
            onNavigateToProfile={onNavigateToProfile}
            onViewLikes={handleToggleFilter}
            activeFilter={filter}
            onOpenSignIn={onOpenAuth}
            onOpenSignUp={onOpenSignUp}
          />
        </div>

        {/* Center Column: Main Social Feed (maintains stable width on all screens) */}
        <main className="w-full md:col-span-8 lg:col-span-9 flex flex-col">
          {/* Feed Differentiator Tabs: Suggested & Following */}
          <div className="mb-4 flex items-center justify-between border-b border-slate-200/80 dark:border-neutral-800 pb-2.5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/60'
                }`}
              >
                Suggested
              </button>
              <button
                onClick={() => {
                  if (!user && onOpenAuth) {
                    onOpenAuth();
                    return;
                  }
                  setFilter('following');
                }}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  filter === 'following'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/60'
                }`}
              >
                Following
              </button>
            </div>

            <span className="text-[11px] text-slate-400 dark:text-neutral-500 hidden sm:inline-block">
              {filter === 'following'
                ? 'Posts from developers you follow'
                : filter === 'liked'
                ? 'Your liked designs'
                : filter === 'saved'
                ? 'Your saved bookmarks'
                : 'Discover designs and architectures across the community'}
            </span>
          </div>

          {/* Active Filter Banner when viewing 'Your Likes' */}
          {filter === 'liked' && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                Viewing posts you liked
              </span>
              <button
                onClick={() => setFilter('all')}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Back to Suggested
              </button>
            </div>
          )}

          {/* Active Filter Banner when viewing 'Yours Saved' */}
          {filter === 'saved' && (
            <div className="mb-4 p-3 rounded-2xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200">
                Viewing your saved posts & architectures
              </span>
              <button
                onClick={() => setFilter('all')}
                className="text-xs font-bold text-slate-900 dark:text-white hover:underline cursor-pointer"
              >
                Back to Suggested
              </button>
            </div>
          )}

          {/* Sign In Prompt when viewing Following feed while unauthenticated */}
          {filter === 'following' && !user && (
            <div className="mb-6 p-8 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sign in to view Following feed</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto mb-4">
                Follow your favorite architects and engineers to see their design breakdowns in this feed.
              </p>
              {onOpenAuth && (
                <button
                  onClick={onOpenAuth}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors cursor-pointer"
                >
                  <span>Sign In to Continue</span>
                </button>
              )}
            </div>
          )}

          {/* Create Post Widget (available on Suggested and Following feeds) */}
          {(filter === 'all' || filter === 'following') && (
            <CreatePost
              user={user}
              token={token}
              onPostCreated={createPost}
              onOpenSignIn={onOpenAuth}
              initialContent={pendingPost?.content}
              initialMedia={pendingPost?.media}
              onClearInitialMedia={onClearPendingPost}
            />
          )}

          {/* Posts List / Loading / Empty / Error */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-full rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] p-5 shadow-xs animate-pulse"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-neutral-800" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3.5 bg-slate-200 dark:bg-neutral-800 rounded w-1/4" />
                      <div className="h-2.5 bg-slate-200 dark:bg-neutral-800 rounded w-1/6" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-slate-200 dark:bg-neutral-800 rounded w-full" />
                    <div className="h-3 bg-slate-200 dark:bg-neutral-800 rounded w-5/6" />
                  </div>
                  <div className="h-36 bg-slate-100 dark:bg-neutral-900 rounded-xl w-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="w-full rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/20 p-6 text-center shadow-xs">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-rose-800 dark:text-rose-200 mb-1">Could not load feed</h4>
              <p className="text-xs text-rose-600 dark:text-rose-400 mb-4">{error}</p>
              <button
                onClick={refreshPosts}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="w-full rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center justify-center mx-auto mb-3">
                {filter === 'following' ? <Users className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {filter === 'liked'
                  ? 'No liked posts yet'
                  : filter === 'saved'
                  ? 'No saved posts yet'
                  : filter === 'following'
                  ? 'No posts from developers you follow'
                  : 'No posts yet'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
                {filter === 'liked'
                  ? 'Posts you like will show up here for easy access.'
                  : filter === 'saved'
                  ? 'Posts you bookmark will be saved here so you can revisit them anytime.'
                  : filter === 'following'
                  ? 'Follow developers from the Suggested feed to see their posts and designs here.'
                  : 'Be the first to share an architecture diagram, latency finding, or discuss scaling strategies!'}
              </p>
              {filter === 'following' && (
                <button
                  onClick={() => setFilter('all')}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors cursor-pointer"
                >
                  <span>Explore Suggested Posts</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.id}
                  onLike={toggleLike}
                  onDislike={toggleDislike}
                  onBookmark={toggleBookmark}
                  onOpenComments={openComments}
                  onDeletePost={deletePost}
                  onNavigateToProfile={onNavigateToProfile}
                  onToggleFollow={toggleFollow}
                  onOpenSignIn={onOpenAuth}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Comments Overlay Drawer: Slide-over on Desktop (main feed width never shrinks), Bottom Sheet on Mobile */}
      {selectedPostForComments && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Comments discussion">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity cursor-pointer animate-in fade-in duration-200"
            onClick={closeComments}
            title="Click outside to close comments"
          />

          {/* Desktop Slide-over Drawer (lg: and above) */}
          <div className="hidden lg:block fixed inset-y-0 right-0 w-[480px] xl:w-[520px] max-w-full bg-white dark:bg-[#0A0A0A] shadow-2xl border-l border-slate-200 dark:border-neutral-800 z-50 transform transition-transform duration-300 ease-out animate-in slide-in-from-right">
            <CommentPanel
              post={selectedPostForComments}
              currentUserId={user?.id}
              token={token}
              onClose={closeComments}
              onCommentAdded={(pid) => notifyCommentChange(pid, 1)}
              onCommentDeleted={(pid) => notifyCommentChange(pid, -1)}
              onOpenSignIn={onOpenAuth}
              onNavigateToProfile={onNavigateToProfile}
              className="border-0 shadow-none rounded-none h-full"
            />
          </div>

          {/* Mobile / Tablet Bottom-to-Up Sheet (< lg) */}
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 flex items-end justify-center pointer-events-none">
            <div className="pointer-events-auto relative w-full max-w-2xl h-[55vh] max-h-[85vh] rounded-t-3xl overflow-hidden shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-bottom">
              <CommentPanel
                post={selectedPostForComments}
                currentUserId={user?.id}
                token={token}
                onClose={closeComments}
                onCommentAdded={(pid) => notifyCommentChange(pid, 1)}
                onCommentDeleted={(pid) => notifyCommentChange(pid, -1)}
                onOpenSignIn={onOpenAuth}
                onNavigateToProfile={onNavigateToProfile}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Feedback and Recommendations Button */}
      <FloatingFeedbackButton />
    </div>
  );
};

