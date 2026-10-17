import React, { useState, useEffect } from 'react';
import { Github, Star } from 'lucide-react';

/**
 * Props for the GitHubStarButton component.
 */
export interface GitHubStarButtonProps {
  /** Target GitHub repository in "owner/repo" format (defaults to "Rohit0265/gittoscale") */
  repo?: string;
  /** Optional custom CSS classes to merge */
  className?: string;
}

/**
 * Minimalist GitHub button displaying the official GitHub logo, a yellow star icon, and the repository star count.
 */
export const GitHubStarButton: React.FC<GitHubStarButtonProps> = ({
  repo = 'Rohit0265/gittoscale',
  className = '',
}) => {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch(`https://api.github.com/repos/${repo}`)
      .then((res) => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then((data) => {
        if (isMounted && typeof data.stargazers_count === 'number') {
          setStars(data.stargazers_count);
        }
      })
      .catch(() => {
        // Fallback gracefully without throwing
      });

    return () => {
      isMounted = false;
    };
  }, [repo]);

  return (
    <a
      href={`https://github.com/${repo}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#141414] hover:text-slate-900 dark:hover:text-white transition-all shadow-xs text-xs font-semibold cursor-pointer ${className}`}
      title="Star repository on GitHub"
      aria-label="Star repository on GitHub"
    >
      <Github className="w-4 h-4 fill-current shrink-0" />
      <span className="inline-flex items-center gap-1">
        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
        {stars !== null && (
          <span className="font-semibold text-xs tabular-nums text-slate-800 dark:text-neutral-200">
            {stars}
          </span>
        )}
      </span>
    </a>
  );
};

export default GitHubStarButton;

