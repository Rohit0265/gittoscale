import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Send, Trash2, MessageSquare, Loader2, LogIn, Reply, CornerDownRight } from 'lucide-react';
import { FeedPost, FeedComment } from '../types';
import { formatRelativeTime } from '../utils/formatTime';
import { feedApi } from '../services/feedApi';
import { getAvatarColor, getInitial } from '../utils/avatarUtils';
import { UserAvatar } from './UserAvatar';

interface CommentPanelProps {
  post: FeedPost | null;
  currentUserId?: string;
  token?: string | null;
  onClose: () => void;
  onCommentAdded?: (postId: string) => void;
  onCommentDeleted?: (postId: string) => void;
  onOpenSignIn?: () => void;
  onNavigateToProfile?: (userId: string) => void;
  className?: string;
}

interface ReplyingTarget {
  id: string;
  authorName: string;
  depth: number;
}

export const CommentPanel: React.FC<CommentPanelProps> = ({
  post,
  currentUserId,
  token,
  onClose,
  onCommentAdded,
  onCommentDeleted,
  onOpenSignIn,
  onNavigateToProfile,
  className,
}) => {
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ReplyingTarget | null>(null);

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!post) {
      setComments([]);
      setReplyingTo(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    setReplyingTo(null);

    feedApi
      .getComments(post.id)
      .then((data) => {
        if (isMounted) setComments(data);
      })
      .catch((err) => {
        console.error('[CommentPanel] Failed to fetch comments:', err);
        if (isMounted) setError('Failed to load comments.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [post?.id]);

  // Organize comments into YouTube-style conversation tree (max 3 tiers: 0, 1, 2)
  const organizedThreads = useMemo(() => {
    // 1. Separate root comments vs child replies
    const roots: FeedComment[] = [];
    const childrenMap = new Map<string, FeedComment[]>();

    // Also index all comments by ID for fast lookup
    const byId = new Map<string, FeedComment>();
    for (const c of comments) {
      byId.set(c.id, c);
    }

    for (const c of comments) {
      if (!c.parent_id || (c.depth ?? 0) === 0 || !byId.has(c.parent_id)) {
        roots.push(c);
      } else {
        const list = childrenMap.get(c.parent_id) || [];
        list.push(c);
        childrenMap.set(c.parent_id, list);
      }
    }

    // Helper to recursively collect replies up to depth 2
    const buildThread = (parent: FeedComment, currentDepth: number): FeedComment[] => {
      const directChildren = childrenMap.get(parent.id) || [];
      const result: FeedComment[] = [];
      for (const child of directChildren) {
        // Enforce max 3 tiers (0, 1, 2)
        const effectiveDepth = Math.min(child.depth ?? currentDepth + 1, 2);
        result.push({ ...child, depth: effectiveDepth });
        // Recurse for deeper replies if under depth 2
        const deeper = buildThread(child, effectiveDepth);
        result.push(...deeper);
      }
      return result;
    };

    const finalOrdered: { root: FeedComment; replies: FeedComment[] }[] = [];
    for (const root of roots) {
      const replies = buildThread(root, 0);
      finalOrdered.push({ root: { ...root, depth: 0 }, replies });
    }

    return finalOrdered;
  }, [comments]);

  if (!post) return null;

  const handleStartReply = (comment: FeedComment) => {
    if (!token) {
      if (onOpenSignIn) onOpenSignIn();
      return;
    }
    const targetDepth = typeof comment.depth === 'number' ? comment.depth : 0;
    setReplyingTo({
      id: comment.id,
      authorName: comment.author.full_name || 'User',
      depth: targetDepth,
    });
    // Focus the input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!token) {
      if (onOpenSignIn) onOpenSignIn();
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      let finalContent = commentText.trim();
      let parentId: string | null = replyingTo ? replyingTo.id : null;

      // If replying to a tier 2 (depth 2) comment, prefix mention like YouTube if not already present
      if (replyingTo && replyingTo.depth >= 2) {
        const mentionPrefix = `@${replyingTo.authorName} `;
        if (!finalContent.toLowerCase().startsWith(mentionPrefix.toLowerCase())) {
          finalContent = `${mentionPrefix}${finalContent}`;
        }
      }

      const newComment = await feedApi.addComment(post.id, finalContent, token, parentId);
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      setReplyingTo(null);
      if (onCommentAdded) onCommentAdded(post.id);

      // Auto-scroll
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to submit comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!token) return;
    const confirmed = window.confirm('Delete this comment?');
    if (!confirmed) return;

    try {
      await feedApi.deleteComment(commentId, token);
      setComments((prev) => prev.filter((c) => c.id !== commentId && c.parent_id !== commentId));
      if (onCommentDeleted) onCommentDeleted(post.id);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to delete comment.');
    }
  };

  // Render a single comment item with indentation and reply buttons
  const renderCommentCard = (comment: FeedComment) => {
    const isMyComment = Boolean(currentUserId && currentUserId === comment.user_id);
    const depth = comment.depth ?? 0;

    return (
      <div
        key={comment.id}
        className={`flex gap-2.5 group transition-all ${
          depth === 1
            ? 'ml-4 sm:ml-6 pl-2.5 border-l-2 border-indigo-200 dark:border-indigo-900/60'
            : depth >= 2
            ? 'ml-7 sm:ml-10 pl-2.5 border-l-2 border-slate-300 dark:border-neutral-700'
            : ''
        }`}
      >
        <button
          onClick={() => onNavigateToProfile && onNavigateToProfile(comment.user_id)}
          className="shrink-0 cursor-pointer self-start mt-0.5"
          title={`View ${comment.author.full_name}'s profile`}
        >
          {comment.author.avatar_url ? (
            <img
              src={comment.author.avatar_url}
              alt={comment.author.full_name}
              className={`${
                depth === 0 ? 'w-7 h-7' : 'w-6 h-6'
              } rounded-full object-cover border border-slate-200 dark:border-neutral-700`}
            />
          ) : (
            <div
              className={`${
                depth === 0 ? 'w-7 h-7 text-xs' : 'w-6 h-6 text-[11px]'
              } rounded-full text-white font-bold flex items-center justify-center uppercase`}
              style={{ background: getAvatarColor(comment.user_id || comment.author.full_name) }}
            >
              {getInitial(comment.author.full_name)}
            </div>
          )}
        </button>

        <div className="flex-1 min-w-0 bg-slate-50 dark:bg-neutral-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-neutral-800/60">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 truncate">
              <button
                onClick={() => onNavigateToProfile && onNavigateToProfile(comment.user_id)}
                className="text-xs font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate text-left cursor-pointer"
              >
                {comment.author.full_name}
              </button>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                {formatRelativeTime(comment.created_at)}
              </span>
              {isMyComment && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity p-0.5 cursor-pointer"
                  title="Delete comment"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-800 dark:text-neutral-200 whitespace-pre-wrap break-words leading-relaxed">
            {comment.content}
          </p>

          {/* Action: Reply button */}
          <div className="mt-2 flex items-center gap-3 pt-1 border-t border-slate-200/40 dark:border-neutral-800/40">
            <button
              onClick={() => handleStartReply(comment)}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <Reply className="w-3 h-3" />
              <span>Reply</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-[#0A0A0A] ${className || 'rounded-t-2xl sm:rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-xl'} overflow-hidden`}>
      {/* Mobile drag handle for bottom-to-up sheet */}
      <div
        onClick={onClose}
        className="sm:hidden flex justify-center py-2 shrink-0 cursor-pointer"
        title="Tap or drag to close"
      >
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-neutral-700" />
      </div>

      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Comments ({comments.length})
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Close comments"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Comments Conversation Tree */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400 mb-2" />
            <span className="text-xs">Loading conversation...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-xs text-rose-500">{error}</div>
        ) : organizedThreads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center px-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 mb-2">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-700 dark:text-neutral-300">No comments yet</p>
            <p className="text-[11px] text-slate-400 mt-1">Be the first to share your thoughts on this architecture!</p>
          </div>
        ) : (
          organizedThreads.map(({ root, replies }) => (
            <div key={root.id} className="space-y-2.5">
              {/* Level 0 Root Comment */}
              {renderCommentCard(root)}

              {/* Replies (Level 1 and Level 2, max 3 tiers) */}
              {replies.map((reply) => renderCommentCard(reply))}
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Input Form & Reply Context Bar */}
      <div className="p-3 border-t border-slate-100 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] shrink-0">
        {/* Active Reply Banner */}
        {replyingTo && (
          <div className="mb-2 flex items-center justify-between px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-xs">
            <div className="flex items-center gap-1.5 truncate text-indigo-700 dark:text-indigo-300">
              <CornerDownRight className="w-3.5 h-3.5 shrink-0" />
              <span>
                Replying to <strong>@{replyingTo.authorName}</strong>
              </span>
            </div>
            <button
              onClick={handleCancelReply}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 rounded cursor-pointer"
              title="Cancel reply"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {token ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={replyingTo ? `Reply to @${replyingTo.authorName}...` : 'Write a comment...'}
              maxLength={1000}
              disabled={isSubmitting}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isSubmitting || !commentText.trim()}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-xs transition-colors cursor-pointer shrink-0"
              title={replyingTo ? 'Post reply' : 'Post comment'}
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
            <span className="text-xs text-slate-500 dark:text-neutral-400">Sign in to participate</span>
            {onOpenSignIn && (
              <button
                type="button"
                onClick={onOpenSignIn}
                className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors cursor-pointer"
              >
                <LogIn className="w-3 h-3" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

