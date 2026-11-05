import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Trash2, MessageSquare, Loader2, LogIn } from 'lucide-react';
import { FeedPost, FeedComment } from '../types';
import { formatRelativeTime } from '../utils/formatTime';
import { feedApi } from '../services/feedApi';

interface CommentPanelProps {
  post: FeedPost | null;
  currentUserId?: string;
  token?: string | null;
  onClose: () => void;
  onCommentAdded?: (postId: string) => void;
  onCommentDeleted?: (postId: string) => void;
  onOpenSignIn?: () => void;
  onNavigateToProfile?: (userId: string) => void;
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
}) => {
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!post) {
      setComments([]);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

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

  if (!post) return null;

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
      const newComment = await feedApi.addComment(post.id, commentText.trim(), token);
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      if (onCommentAdded) onCommentAdded(post.id);

      // Auto-scroll to latest comment
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
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      if (onCommentDeleted) onCommentDeleted(post.id);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to delete comment.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0A0A0A] rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-500" />
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

      {/* Post Context Snip */}
      <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-neutral-900/40 border-b border-slate-100 dark:border-neutral-800/80 text-xs text-slate-600 dark:text-neutral-400 shrink-0">
        <span className="font-semibold text-slate-800 dark:text-neutral-200">{post.author.full_name}:</span>{' '}
        <span className="line-clamp-1 italic">{post.content}</span>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
            <span className="text-xs">Loading discussion...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-xs text-rose-500">{error}</div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center px-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 mb-2">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-700 dark:text-neutral-300">No comments yet</p>
            <p className="text-[11px] text-slate-400 mt-1">Be the first to share your thoughts on this architecture!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isMyComment = Boolean(currentUserId && currentUserId === comment.user_id);
            return (
              <div key={comment.id} className="flex gap-2.5 group">
                <button
                  onClick={() => onNavigateToProfile && onNavigateToProfile(comment.user_id)}
                  className="shrink-0 cursor-pointer"
                >
                  {comment.author.avatar_url ? (
                    <img
                      src={comment.author.avatar_url}
                      alt={comment.author.full_name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-neutral-700"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center uppercase">
                      {(comment.author.full_name || 'U')[0]}
                    </div>
                  )}
                </button>

                <div className="flex-1 min-w-0 bg-slate-50 dark:bg-neutral-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-neutral-800/60">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <button
                      onClick={() => onNavigateToProfile && onNavigateToProfile(comment.user_id)}
                      className="text-xs font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate text-left cursor-pointer"
                    >
                      {comment.author.full_name}
                    </button>
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
                </div>
              </div>
            );
          })
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-100 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] shrink-0">
        {token ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              maxLength={1000}
              disabled={isSubmitting}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isSubmitting || !commentText.trim()}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-xs transition-colors cursor-pointer shrink-0"
              title="Post comment"
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
