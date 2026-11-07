import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Bookmark, MessageSquare } from 'lucide-react';

interface PostActionsProps {
  postId: string;
  likeCount: number;
  commentCount: number;
  hasLiked?: boolean;
  hasDisliked?: boolean;
  hasBookmarked?: boolean;
  onLike: () => void;
  onDislike: () => void;
  onBookmark?: () => void;
  onOpenComments: () => void;
}

export const PostActions: React.FC<PostActionsProps> = ({
  likeCount,
  commentCount,
  hasLiked = false,
  hasDisliked = false,
  hasBookmarked = false,
  onLike,
  onDislike,
  onBookmark,
  onOpenComments,
}) => {
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [dislikeAnimating, setDislikeAnimating] = useState(false);
  const [bookmarkAnimating, setBookmarkAnimating] = useState(false);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 300);
    onLike();
  };

  const handleDislikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDislikeAnimating(true);
    setTimeout(() => setDislikeAnimating(false), 300);
    onDislike();
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onBookmark) return;
    setBookmarkAnimating(true);
    setTimeout(() => setBookmarkAnimating(false), 300);
    onBookmark();
  };

  return (
    <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-neutral-800/60">
      {/* Left: Like, Dislike & Bookmark */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Like Button (shows count) */}
        <button
          type="button"
          onClick={handleLikeClick}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            hasLiked
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-neutral-800/40'
          }`}
          title={hasLiked ? 'Unlike' : 'Like'}
          aria-label={hasLiked ? 'Unlike' : 'Like'}
        >
          <ThumbsUp
            className={`w-4 h-4 transition-transform ${
              hasLiked ? 'fill-current' : ''
            } ${likeAnimating ? 'scale-125' : 'scale-100'}`}
          />
          <span>{likeCount}</span>
        </button>

        {/* Dislike Button (NO count shown) */}
        <button
          type="button"
          onClick={handleDislikeClick}
          className={`flex items-center justify-center p-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            hasDisliked
              ? 'text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/40'
              : 'text-slate-600 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100/60 dark:hover:bg-neutral-800/40'
          }`}
          title={hasDisliked ? 'Remove Dislike' : 'Dislike'}
          aria-label={hasDisliked ? 'Remove Dislike' : 'Dislike'}
        >
          <ThumbsDown
            className={`w-4 h-4 transition-transform ${
              hasDisliked ? 'fill-current' : ''
            } ${dislikeAnimating ? 'scale-125' : 'scale-100'}`}
          />
        </button>

        {/* Bookmark Button */}
        {onBookmark && (
          <button
            type="button"
            onClick={handleBookmarkClick}
            className={`flex items-center justify-center p-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              hasBookmarked
                ? 'text-white dark:text-white bg-slate-900 dark:bg-white/15'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-neutral-800/40'
            }`}
            title={hasBookmarked ? 'Remove Bookmark' : 'Bookmark post'}
            aria-label={hasBookmarked ? 'Remove Bookmark' : 'Bookmark post'}
          >
            <Bookmark
              className={`w-4 h-4 transition-transform ${
                hasBookmarked ? 'fill-white text-white' : ''
              } ${bookmarkAnimating ? 'scale-125' : 'scale-100'}`}
            />
          </button>
        )}
      </div>

      {/* Right: Comments Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenComments();
        }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer"
        title="Open comments"
        aria-label="Open comments"
      >
        <MessageSquare className="w-4 h-4" />
        <span>{commentCount}</span>
      </button>
    </div>
  );
};
