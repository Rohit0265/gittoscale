import React from 'react';
import { Twitter, Linkedin, Github, Facebook, Instagram } from 'lucide-react';
import './Fotter.css';

export interface FooterNavLink {
  label: string;
  href: string;
}

const NAV_LINKS: FooterNavLink[] = [
  { label: 'Products', href: '#' },
  { label: 'Studio', href: '#' },
  { label: 'Clients', href: '#' },
  { label: 'Pricing', href: '#' },
  { label: 'Blog', href: '#' },
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
];

export interface FotterProps {
  brandName?: string;
  isDark?: boolean;
}

export const Fotter: React.FC<FotterProps> = ({ brandName = 'GitToScale', isDark }) => {
  const viewBoxWidth = Math.max(600, (brandName || 'GitToScale').length * 115);
  const isDarkMode =
    isDark !== undefined
      ? Boolean(isDark)
      : typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <footer className="gts-footer-container">
      <div className="gts-footer-inner">
        {/* Centered Top Brand Logo & Navigation */}
        {/* <div className="gts-minimal-top"> */}
          {/* Brand Logo (Mark only, no company text) */}
          {/* <div className="gts-minimal-brand">
            <img
              src={isDarkMode ? '/logo-mark.png' : '/logo-mark-dark.png'}
              alt="GitToScale Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
            />
          </div> */}

          {/* Centered Horizontal Links */}
          {/* <nav className="gts-minimal-nav" aria-label="Footer navigation">
            {NAV_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="gts-minimal-nav-link">
                {link.label}
              </a>
            ))}
          </nav>
        </div> */}

        {/* Dotted Divider */}
        {/* <div className="gts-dotted-divider" /> */}

        {/* Bottom Bar: Copyright and Social Icons */}
        <div className="gts-minimal-bottom">
          <p className="gts-minimal-copyright">
            &copy; 2026 {brandName} LLC. All rights reserved.
          </p>

          <div className="gts-minimal-socials" aria-label="Social media links">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="gts-minimal-social-icon"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="gts-minimal-social-icon"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="gts-minimal-social-icon"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="gts-minimal-social-icon"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="gts-minimal-social-icon"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
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
              y="105%"              textAnchor="middle"
              className="gts-watermark-text"
              textLength={viewBoxWidth * 0.98}
              lengthAdjust="spacingAndGlyphs"
            >
              {brandName}
            </text>
          </svg>
        </div>
      </div>
    </footer>
  );
};

export default Fotter;
