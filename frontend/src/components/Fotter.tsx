import React, { useState } from 'react';
import { Linkedin, Github, Mail, MessageSquarePlus } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';
import './Fotter.css';

/**
 * Props for the Fotter component.
 */
export interface FotterProps {
  /** Brand display name rendered in the copyright and giant background watermark */
  brandName?: string;
  /** Explicit dark mode flag */
  isDark?: boolean;
}

/**
 * Global application footer component.
 *
 * Features:
 * - Direct "Feedback & Bug Report" interactive modal launcher
 * - Social & professional links (LinkedIn, GitHub, Email)
 * - Responsive SVG typographic background watermark
 */
export const Fotter: React.FC<FotterProps> = ({ brandName = 'GitToScale' }) => {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const viewBoxWidth = Math.max(600, (brandName || 'GitToScale').length * 115);

  return (
    <footer className="gts-footer-container">
      <div className="gts-footer-inner">
        {/* Bottom Bar: Feedback Button, Copyright, and Social Links */}
        <div className="gts-minimal-bottom">
          <div className="gts-feedback-row">
            <button
              type="button"
              onClick={() => setIsFeedbackOpen(true)}
              className="gts-feedback-pill"
              aria-label="Give feedback or report a bug"
            >
              <MessageSquarePlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Feedback &amp; Bug Report</span>
              {/* <span className="gts-feedback-badge">Share idea</span> */}
            </button>
          </div>

          <p className="gts-minimal-copyright">
            &copy; 2026 {brandName} LLC. All rights reserved.
          </p>

          <div className="gts-minimal-socials" aria-label="Social media links">
            <a
              href="https://linkedin.com/in/rohitmathur95"
              target="_blank"
              rel="noreferrer"
              className="gts-minimal-social-icon"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href="https://github.com/Rohit0265"
              target="_blank"
              rel="noreferrer"
              className="gts-minimal-social-icon"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="mailto:rohit@myportfolio-rsm.in"
              target="_blank"
              rel="noreferrer"
              className="gts-minimal-social-icon"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Giant Watermark Background Text (Preserved at bottom) */}
        <div className="gts-watermark-wrapper" aria-hidden="true">
          <svg
            viewBox={`0 0 ${viewBoxWidth} 230`}
            className="gts-watermark-svg"
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="gtsDarkWatermarkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#282828" />
                <stop offset="25%" stopColor="#202020" />
                <stop offset="65%" stopColor="#161616" />
                <stop offset="100%" stopColor="#0d0d0d" />
              </linearGradient>

              <linearGradient id="gtsLightWatermarkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#e2e8f0" />
              </linearGradient>

              <filter id="gtsDarkWatermarkFilter" x="-20%" y="-30%" width="140%" height="170%">
                <feDropShadow dx="0" dy="-1.5" stdDeviation="1" floodColor="#ffffff" floodOpacity="0.16" />
                <feDropShadow dx="0" dy="16" stdDeviation="16" floodColor="#000000" floodOpacity="0.95" />
                <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#000000" floodOpacity="0.8" />
              </filter>

              <filter id="gtsLightWatermarkFilter" x="-20%" y="-30%" width="140%" height="170%">
                <feDropShadow dx="0" dy="-1" stdDeviation="0.8" floodColor="#ffffff" floodOpacity="0.9" />
                <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#94a3b8" floodOpacity="0.22" />
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#94a3b8" floodOpacity="0.12" />
              </filter>
            </defs>

            <text
              x="50%"
              y="105%"
              textAnchor="middle"
              className="gts-watermark-text"
              textLength={viewBoxWidth * 0.98}
              lengthAdjust="spacingAndGlyphs"
            >
              {brandName}
            </text>
          </svg>
        </div>
      </div>

      {/* Feedback Modal Dialog */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </footer>
  );
};

export default Fotter;