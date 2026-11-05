import React, { useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';

interface ShareModalProps {
  title: string;
  shareUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  title,
  shareUrl,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: shareUrl,
        });
        onClose();
      } catch {
        // User dismissed share
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0c0d10] p-6 shadow-2xl flex flex-col animate-in fade-in-50 zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Share</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-3">
          Share this with your network or copy the direct link below:
        </p>

        <div className="mt-3 flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/60">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="w-full bg-transparent text-xs text-slate-800 dark:text-neutral-200 font-mono select-all focus:outline-hidden"
          />
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={handleNativeShare}
            className="mt-3 w-full py-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#141416] hover:bg-slate-50 dark:hover:bg-neutral-800 text-xs font-semibold text-slate-700 dark:text-neutral-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Open System Share Dialog</span>
          </button>
        )}
      </div>
    </div>
  );
};

