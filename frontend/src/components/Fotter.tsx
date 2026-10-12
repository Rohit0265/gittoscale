import React from 'react';
import './Fotter.css';

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: 'Pages',
    links: [
      { label: 'Home', href: '#' },
      { label: 'About', href: '#' },
      { label: 'Contact', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Press', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Changelog', href: '#' },
      { label: 'Roadmap', href: '#' },
      { label: 'Pricing', href: '#' },
      { label: 'FAQ', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Cookie Policy', href: '#' },
      { label: 'Refund Policy', href: '#' },
      { label: 'Acceptable Use', href: '#' },
      { label: 'GDPR', href: '#' },
      { label: 'Licenses', href: '#' },
    ],
  },
  {
    title: 'Components',
    links: [
      { label: 'Buttons', href: '#' },
      { label: 'Cards', href: '#' },
      { label: 'Navigation', href: '#' },
      { label: 'Forms', href: '#' },
      { label: 'Modals', href: '#' },
      { label: 'Tables', href: '#' },
      { label: 'Alerts', href: '#' },
      { label: 'Badges', href: '#' },
      { label: 'Avatars', href: '#' },
      { label: 'Tooltips', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'Tutorials', href: '#' },
      { label: 'Examples', href: '#' },
      { label: 'Templates', href: '#' },
      { label: 'Guides', href: '#' },
      { label: 'API Reference', href: '#' },
      { label: 'Community', href: '#' },
      { label: 'Support', href: '#' },
    ],
  },
  {
    title: 'Marketing',
    links: [
      { label: 'Best Place to Market AI Tools', href: '#' },
      { label: 'Product Hunt Launch', href: '#' },
      { label: 'Indie Hackers', href: '#' },
      { label: 'Hacker News', href: '#' },
      { label: 'Twitter Marketing', href: '#' },
      { label: 'Reddit Communities', href: '#' },
      { label: 'Discord Servers', href: '#' },
    ],
  },
];

export interface FotterProps {
  brandName?: string;
}

export const Fotter: React.FC<FotterProps> = ({ brandName = 'GitToScale' }) => {
  return (
    <footer className="gts-footer-container">
      <div className="gts-footer-inner">
        {/* Navigation & Brand Columns */}
        <div className="gts-footer-columns">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title} className="gts-column">
              <h3 className="gts-column-title">{section.title}</h3>
              <ul className="gts-column-list">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="gts-column-link">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Brand Info Column */}
          <div className="gts-brand-col">
            <div className="gts-brand-header">
              <div className="gts-brand-logo" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffffff"
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
              <span className="gts-brand-name">{brandName}</span>
            </div>

            <p className="gts-brand-desc">
              Beautiful UI components and templates for modern web applications. Built with React and Tailwind CSS.
            </p>

            <div className="gts-social-links" aria-label="Social media links">
              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="gts-social-link"
                aria-label="LinkedIn"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#0A66C2">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.8v8.37h-2.8v-8.37M7.86 6.54a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28" />
                </svg>
              </a>

              {/* Twitter */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="gts-social-link"
                aria-label="Twitter"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#1DA1F2">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                </svg>
              </a>

              {/* Slack */}
              <a
                href="https://slack.com"
                target="_blank"
                rel="noreferrer"
                className="gts-social-link"
                aria-label="Slack"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"
                    fill="#E01E5A"
                  />
                  <path
                    d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"
                    fill="#36C5F0"
                  />
                  <path
                    d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"
                    fill="#2EB67D"
                  />
                  <path
                    d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"
                    fill="#ECB22E"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="gts-divider" />

        {/* Copyright */}
        <p className="gts-copyright">
          &copy; 2026 {brandName}. All rights reserved.
        </p>

        {/* Giant Watermark Background Text */}
        <div className="gts-watermark-wrapper" aria-hidden="true">
          <span className="gts-watermark-text">{brandName}</span>
        </div>
      </div>
    </footer>
  );
};

export default Fotter;
