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
import { getAvatarColor, getInitial } from '../utils/avatarUtils';

interface PostCardProps {
  post: FeedPost;
  currentUserId?: string;
  onLike: (postId: string) => void;
  onDislike?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onOpenComments: (post: FeedPost) => void;
  onUpdatePost: (postId: string, newContent: string) => Promise<any>;
  onDeletePost: (postId: string) => Promise<any>;
  onNavigateToProfile: (userId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onLike,
  onDislike,
  onBookmark,
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
      <article className={`w-full rounded-xl border border-slate-200/80 dark:border-neutral-800/80 bg-transparent p-4 sm:p-5 shadow-none mb-4 transition-all duration-200 ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}>
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
                <div
                  className="w-10 h-10 rounded-full text-white font-bold flex items-center justify-center uppercase group-hover:scale-105 transition-transform"
                  style={{ background: getAvatarColor(post.user_id || author.full_name) }}
                >
                  {getInitial(author.full_name || author.username)}
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

        {/* Post Content with Rich Markdown and 4-5 line Read More */}
        <div className="relative mb-3.5">
          <div
            ref={contentRef}
            className={`text-sm text-slate-800 dark:text-neutral-200 leading-relaxed break-words transition-all overflow-hidden ${
              !isExpanded ? 'max-h-[105px]' : ''
            }`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    onClick={(e) => e.stopPropagation()}
                  />
                ),
                pre: ({ node, ...props }: any) => (
                  <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto my-2 border border-slate-800" {...props} />
                ),
                code: ({ node, className, children, ...props }: any) => {
                  return (
                    <code className={className || "px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800 font-mono text-xs text-indigo-600 dark:text-indigo-400"} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Read more / Show less toggle */}
          {isClamped && (
            <div className="pt-1.5 flex items-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {isExpanded ? 'Show less' : '... Read more'}
              </button>
            </div>
          )}
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
          hasDisliked={post.has_disliked}
          hasBookmarked={post.has_bookmarked}
          onLike={() => onLike(post.id)}
          onDislike={() => onDislike?.(post.id)}
          onBookmark={onBookmark ? () => onBookmark(post.id) : undefined}
          onOpenComments={() => onOpenComments(post)}
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

