import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit3, Trash2, Flag, EyeOff, Copy } from 'lucide-react';

interface PostMenuProps {
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCopyLink: () => void;
  onReport?: () => void;
  onHide?: () => void;
}

export const PostMenu: React.FC<PostMenuProps> = ({
  isOwner,
  onEdit,
  onDelete,
  onCopyLink,
  onReport,
  onHide,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        title="More options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0E0F12] p-1 shadow-lg flex flex-col gap-0.5 animate-in fade-in-50 zoom-in-95 duration-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onCopyLink();
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-left"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Copy Link</span>
          </button>

          {isOwner ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onEdit();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-left"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Post</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onDelete();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Post</span>
              </button>
            </>
          ) : (
            <>
              {onHide && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    onHide();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-left"
                >
                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Hide Post</span>
                </button>
              )}
              {onReport && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    onReport();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer text-left"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report Post</span>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

