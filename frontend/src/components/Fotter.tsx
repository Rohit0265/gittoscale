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
    <footer className="relative overflow-hidden bg-white px-4 py-10 md:px-8 dark:bg-neutral-950 border-t border-gray-100 dark:border-neutral-800">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-7">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title} className="col-span-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Brand Info Column */}
          <div className="col-span-2 mt-8 lg:col-span-2 lg:mt-0">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-black text-white shadow-sm dark:bg-white dark:text-black">
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
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {brandName}
              </span>
            </div>

            <p className="mt-4 max-w-xs text-sm text-gray-600 dark:text-gray-400">
              Interactive architecture design & distributed systems simulator under load. Built with React and TypeScript.
            </p>

            <div className="mt-6 flex items-center gap-4">
              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                aria-label="LinkedIn"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 128 128"
                  className="size-6"
                >
                  <path
                    fill="#0076b2"
                    d="M116 3H12a8.91 8.91 0 00-9 8.8v104.42a8.91 8.91 0 009 8.78h104a8.93 8.93 0 009-8.81V11.77A8.93 8.93 0 00116 3z"
                  />
                  <path
                    fill="#fff"
                    d="M21.06 48.73h18.11V107H21.06zm9.06-29a10.5 10.5 0 11-10.5 10.49 10.5 10.5 0 0110.5-10.49M50.53 48.73h17.36v8h.24c2.42-4.58 8.32-9.41 17.13-9.41C103.6 47.28 107 59.35 107 75v32H88.89V78.65c0-6.75-.12-15.44-9.41-15.44s-10.87 7.36-10.87 15V107H50.53z"
                  />
                </svg>
              </a>

              {/* Twitter */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                aria-label="Twitter"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 128 128"
                  className="size-6"
                >
                  <path
                    fill="#1d9bf0"
                    d="M114.896 37.888c.078 1.129.078 2.257.078 3.396 0 34.7-26.417 74.72-74.72 74.72v-.02A74.343 74.343 0 0 1 0 104.21c2.075.25 4.16.375 6.25.38a52.732 52.732 0 0 0 32.615-11.263A26.294 26.294 0 0 1 14.331 75.09c3.937.76 7.993.603 11.857-.453-12.252-2.475-21.066-13.239-21.066-25.74v-.333a26.094 26.094 0 0 0 11.919 3.287C5.5 44.139 1.945 28.788 8.913 16.787a74.535 74.535 0 0 0 54.122 27.435 26.277 26.277 0 0 1 7.598-25.09c10.577-9.943 27.212-9.433 37.154 1.139a52.696 52.696 0 0 0 16.677-6.376A26.359 26.359 0 0 1 112.92 28.42 52.227 52.227 0 0 0 128 24.285a53.35 53.35 0 0 1-13.104 13.603z"
                  />
                </svg>
              </a>

              {/* Slack */}
              <a
                href="https://slack.com"
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                aria-label="Slack"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 128 128"
                  className="size-6"
                >
                  <path
                    d="M27.255 80.719c0 7.33-5.978 13.317-13.309 13.317C6.616 94.036.63 88.049.63 80.719s5.987-13.317 13.317-13.317h13.309zm6.709 0c0-7.33 5.987-13.317 13.317-13.317s13.317 5.986 13.317 13.317v33.335c0 7.33-5.986 13.317-13.317 13.317-7.33 0-13.317-5.987-13.317-13.317zm0 0"
                    fill="#de1c59"
                  />
                  <path
                    d="M47.281 27.255c-7.33 0-13.317-5.978-13.309-13.309C33.964 6.616 39.951.63 47.281.63s13.317 5.987 13.317 13.317v13.309zm0 6.709c7.33 0 13.317 5.987 13.317 13.317s-5.986 13.317-13.317 13.317H13.946C6.616 60.598.63 54.612.63 47.281c0-7.33 5.987-13.317 13.317-13.317zm0 0"
                    fill="#35c5f0"
                  />
                  <path
                    d="M100.745 47.281c0-7.33 5.978-13.317 13.309-13.317 7.33 0 13.317 5.987 13.317 13.317s-5.987 13.317-13.317 13.317h-13.309zm-6.709 0c0 7.33-5.987 13.317-13.317 13.317s-13.317-5.986-13.317-13.317V13.946C67.402 6.616 73.388.63 80.719.63c7.33 0 13.317 5.987 13.317 13.317zm0 0"
                    fill="#2eb57d"
                  />
                  <path
                    d="M80.719 100.745c7.33 0 13.317 5.978 13.317 13.309 0 7.33-5.987 13.317-13.317 13.317s-13.317-5.987-13.317-13.317v-13.309zm0-6.709c-7.33 0-13.317-5.987-13.317-13.317s5.986-13.317 13.317-13.317h33.335c7.33 0 13.317 5.986 13.317 13.317 0 7.33-5.987 13.317-13.317 13.317zm0 0"
                    fill="#ebb02e"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Divider & Copyright */}
        <div className="mt-12 border-t border-gray-200 pt-8 dark:border-neutral-800">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; 2026 {brandName}. All rights reserved.
          </p>
        </div>
      </div>

      {/* Big text bottom company watermark */}
      <div className="pointer-events-none relative mx-auto -mb-4 sm:-mb-6 flex w-full max-w-7xl items-center justify-center gap-2 px-2 pt-6 pb-2 text-center leading-none font-black duration-200 ease-in-out">
        <div className="animate-[pulse_4s_infinite] compos-big-text text-[clamp(2.75rem,11.5vw,13.5rem)]">
          {brandName}
        </div>
        <div className="absolute bottom-0 left-0 z-10 h-8 w-full bg-gradient-to-b from-transparent via-white/80 to-white dark:via-neutral-950/80 dark:to-neutral-950 pointer-events-none" />
      </div>
    </footer>
  );
};

export default Fotter;
