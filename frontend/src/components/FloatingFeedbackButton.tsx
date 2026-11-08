import React, { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';

export interface FloatingFeedbackButtonProps {
  className?: string;
}

/**
 * Floating feedback and recommendation button.
 * Sticks to the bottom-right corner across all views so users can tap anytime.
 * Accepts optional className for contextual positioning (e.g., hovering above MiniMap when sidebar collapses).
 */
export const FloatingFeedbackButton: React.FC<FloatingFeedbackButtonProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        className={`fixed z-40 pointer-events-auto transition-all duration-300 ease-in-out ${
          className || 'bottom-5 right-5 sm:bottom-6 sm:right-6'
        }`}
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Give feedback and recommendations"
          title="Give feedback & recommendations"
          className="group relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-[#18181b] dark:text-neutral-100 dark:hover:bg-[#27272a] border border-slate-700/40 dark:border-neutral-700/80 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-black"
        >
          <MessageSquarePlus className="h-5 w-5 text-white dark:text-neutral-200 group-hover:text-indigo-400 transition-colors" />

          {/* Floating Tooltip */}
          <span className="pointer-events-none absolute right-full mr-2.5 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 dark:bg-neutral-800 dark:text-neutral-200 border border-slate-700/40 dark:border-neutral-700 hidden sm:inline-block">
            Feedback &amp; Ideas
          </span>
        </button>
      </div>

      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default FloatingFeedbackButton;
