import React from 'react';
import { Linkedin, Github, Mail } from 'lucide-react';
import './Fotter.css';

/**
 * Props for the Fotter component.
 */
export interface FotterProps {
  /** Brand display name rendered in the copyright and giant background watermark */
  brandName?: string;
  /** Explicit dark mode flag */
  isDark?: boolean;
  /** Navigation callback */
  onNavigate?: (route: string) => void;
}

/**
 * Global application footer component.
 *
 * Features:
 * - Cookie, Privacy Policy, and Terms & Conditions legal links
 * - Social & professional links (LinkedIn, GitHub, Email)
 * - Responsive SVG typographic background watermark
 */
export const Fotter: React.FC<FotterProps> = ({ brandName = 'GitToScale', onNavigate }) => {
  const handleLegalClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <footer className="gts-footer-container">
      <div className="gts-footer-inner">
        {/* Bottom Bar: Legal Links, Copyright, and Social Links */}
        <div className="gts-minimal-bottom">
          {/* Legal / Policy Navigation Links */}
          <nav className="gts-legal-links" aria-label="Legal & Policies">
            <a
              href="/cookie"
              onClick={(e) => handleLegalClick(e, '/cookie')}
              className="gts-legal-link"
            >
              Cookie Policy
            </a>
            <span className="gts-legal-dot" aria-hidden="true">&bull;</span>
            <a
              href="/privacy"
              onClick={(e) => handleLegalClick(e, '/privacy')}
              className="gts-legal-link"
            >
              Privacy Policy
            </a>
            <span className="gts-legal-dot" aria-hidden="true">&bull;</span>
            <a
              href="/terms"
              onClick={(e) => handleLegalClick(e, '/terms')}
              className="gts-legal-link"
            >
              Terms &amp; Conditions
            </a>
          </nav>

          <p className="gts-minimal-copyright">
            &copy; 2026 {brandName} LLC. All rights reserved.
          </p>

          <div className="gts-minimal-socials" aria-label="Social media links">
            <a
              href="https://linkedin.com/in/rohitmathur95"
              target="_blank"
              rel="noreferrer"
              className="gts-minimal-social-icon group"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5 text-slate-600 dark:text-neutral-400 group-hover:text-[#0A66C2] transition-colors" />
            </a>
            <a
              href="https://github.com/Rohit0265"
              target="_blank"
              rel="noreferrer"
              className="gts-minimal-social-icon group"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5 text-slate-600 dark:text-neutral-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
            </a>
            <a
              href="mailto:rohit@myportfolio-rsm.in"
              target="_blank"
              rel="noreferrer"
              className="gts-minimal-social-icon group"
              aria-label="Email"
            >
              <Mail className="w-5 h-5 text-slate-600 dark:text-neutral-400 group-hover:text-rose-500 transition-colors" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Fotter;