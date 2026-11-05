import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FeedPost } from '../types';
import { formatRelativeTime } from '../utils/formatTime';
import { PostActions } from './PostActions';
import { PostMenu } from './PostMenu';
import { EditPostModal } from './EditPostModal';
import { ShareModal } from './ShareModal';
import { PostMediaGallery } from './PostMediaGallery';

interface PostCardProps {
  post: FeedPost;
  currentUserId?: string;
  onLike: (postId: string) => void;
  onOpenComments: (post: FeedPost) => void;
  onUpdatePost: (postId: string, newContent: string) => Promise<any>;
  onDeletePost: (postId: string) => Promise<any>;
  onNavigateToProfile: (userId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onLike,
  onOpenComments,
  onUpdatePost,
  onDeletePost,
  onNavigateToProfile,
}) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const scrollH = contentRef.current.scrollHeight;
      const lines = post.content.split('\n').length;
      if (scrollH > 108 || lines > 4 || post.content.length > 280) {
        setIsClamped(true);
      }
    }
  }, [post.content]);

  const isOwner = Boolean(currentUserId && currentUserId === post.user_id);
  const author = post.author;

  const postShareUrl = `${window.location.origin}/feed?post=${post.id}`;

  const handleDelete = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this post? This cannot be undone.');
    if (!confirmed) return;
    try {
      setIsDeleting(true);
      await onDeletePost(post.id);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to delete post.');
      setIsDeleting(false);
    }
  };

  const handleCopyDirectLink = async () => {
    try {
      await navigator.clipboard.writeText(postShareUrl);
      alert('Post link copied to clipboard!');
    } catch {
      // Fallback
    }
  };

  return (
    <>
      <article className={`w-full rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] p-4 sm:p-5 shadow-xs mb-4 transition-all duration-200 ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}>
        {/* Post Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => onNavigateToProfile(post.user_id)}
              className="group shrink-0 cursor-pointer focus:outline-hidden"
              title={`View ${author.full_name}'s profile`}
            >
              {author.avatar_url ? (
                <img
                  src={author.avatar_url}
                  alt={author.full_name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-neutral-700 group-hover:border-indigo-500 transition-colors"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center uppercase group-hover:scale-105 transition-transform">
                  {(author.full_name || 'U')[0]}
                </div>
              )}
            </button>

            <div className="min-w-0 flex flex-col">
              <button
                onClick={() => onNavigateToProfile(post.user_id)}
                className="text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate text-left cursor-pointer"
              >
                {author.full_name}
              </button>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-neutral-500">
                <span className="font-mono">@{author.username}</span>
                <span>·</span>
                <span>{formatRelativeTime(post.created_at)}</span>
              </div>
            </div>
          </div>

          <PostMenu
            isOwner={isOwner}
            onEdit={() => setIsEditOpen(true)}
            onDelete={handleDelete}
            onCopyLink={handleCopyDirectLink}
            onReport={() => alert('Post reported to moderators.')}
            onHide={() => alert('Post hidden from your feed.')}
          />
        </div>

        {/* Post Content */}
        <div className="text-sm text-slate-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap break-words mb-3.5">
          {post.content}
        </div>

        {/* Post Media Gallery: Desktop Layout (Exact user design) & Mobile Carousel */}
        {((post.media_items && post.media_items.length > 0) || post.media_url) && (
          <PostMediaGallery
            mediaItems={
              post.media_items && post.media_items.length > 0
                ? post.media_items
                : [{ url: post.media_url!, type: post.media_type || 'image' }]
            }
            postId={post.id}
          />
        )}

        {/* Post Footer Actions */}
        <PostActions
          postId={post.id}
          likeCount={post.like_count}
          commentCount={post.comment_count}
          hasLiked={post.has_liked}
          onLike={() => onLike(post.id)}
          onOpenComments={() => onOpenComments(post)}
          onShare={() => setIsShareOpen(true)}
        />
      </article>

      {/* Edit Post Modal */}
      {isEditOpen && (
        <EditPostModal
          post={post}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSave={(newContent) => onUpdatePost(post.id, newContent)}
        />
      )}

      {/* Share Modal */}
      {isShareOpen && (
        <ShareModal
          title={`GitToScale Post by ${author.full_name}`}
          shareUrl={postShareUrl}
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
        />
      )}
    </>
  );
};

