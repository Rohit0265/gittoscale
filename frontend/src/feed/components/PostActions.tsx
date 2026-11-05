import React, { useState } from 'react';
import { Heart, MessageSquare, Share2 } from 'lucide-react';

interface PostActionsProps {
  postId: string;
  likeCount: number;
  commentCount: number;
  hasLiked?: boolean;
  onLike: () => void;
  onOpenComments: () => void;
  onShare: () => void;
}

export const PostActions: React.FC<PostActionsProps> = ({
  likeCount,
  commentCount,
  hasLiked = false,
  onLike,
  onOpenComments,
  onShare,
}) => {
  const [likeAnimating, setLikeAnimating] = useState(false);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 300);
    onLike();
  };

  return (
    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-neutral-800/80">
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Like Button */}
        <button
          onClick={handleLikeClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            hasLiked
              ? 'text-rose-600 dark:text-rose-500 bg-rose-50 dark:bg-rose-950/30'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/60'
          }`}
          title={hasLiked ? 'Unlike' : 'Like'}
        >
          <Heart
            className={`w-4 h-4 transition-transform ${
              hasLiked ? 'fill-current text-rose-500' : ''
            } ${likeAnimating ? 'scale-125' : 'scale-100'}`}
          />
          <span>{likeCount}</span>
        </button>

        {/* Comment Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenComments();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
          title="Open comments"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{commentCount}</span>
        </button>
      </div>

      {/* Share Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onShare();
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
        title="Share post"
      >
        <Share2 className="w-4 h-4" />
        <span className="hidden xs:inline">Share</span>
      </button>
    </div>
  );
};
