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
}

export const Fotter: React.FC<FotterProps> = ({ brandName = 'GitToScale' }) => {
  const viewBoxWidth = Math.max(600, (brandName || 'GitToScale').length * 115);

  return (
    <footer className="gts-footer-container">
      <div className="gts-footer-inner">
        {/* Centered Top Brand Logo & Navigation */}
        <div className="gts-minimal-top">
          {/* Brand Logo & Name */}
          <div className="gts-minimal-brand">
            <div className="gts-minimal-logo" aria-hidden="true">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="6" y1="3" x2="6" y2="15"></line>
                <circle cx="18" cy="6" r="3"></circle>
                <circle cx="6" cy="18" r="3"></circle>
                <path d="M18 9a9 9 0 0 1-9 9"></path>
              </svg>
            </div>
            <span className="gts-minimal-name">{brandName}</span>
          </div>

          {/* Centered Horizontal Links */}
          <nav className="gts-minimal-nav" aria-label="Footer navigation">
            {NAV_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="gts-minimal-nav-link">
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Dotted Divider */}
        <div className="gts-dotted-divider" />

        {/* Bottom Bar: Copyright on Left, Social Icons on Right */}
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
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="gts-minimal-social-icon"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="gts-minimal-social-icon"
              aria-label="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="gts-minimal-social-icon"
              aria-label="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="gts-minimal-social-icon"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
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
              textLength={viewBoxWidth * 0.96}
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
