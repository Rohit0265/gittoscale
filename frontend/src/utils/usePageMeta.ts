import { useEffect } from 'react';
import type { AppView } from '../App';

interface PageMeta {
  title: string;
  description: string;
}

const META: Record<AppView, PageMeta> = {
  landing: {
    title: 'GitToScale — Turn Code into Interactive System Architectures & Capacity Simulations',
    description:
      'Turn any GitHub repository into an interactive, simulated system architecture. Simulate high-concurrency traffic, discover bottlenecks, and test system resilience before production.',
  },
  simulator: {
    title: 'System Design Simulator — GitToScale',
    description:
      'Simulate high-concurrency traffic against your architecture, spot queue bottlenecks, and pressure-test resilience before you deploy.',
  },
  recommender: {
    title: 'AI System Architect — GitToScale',
    description:
      'Describe your system and get an AI-recommended architecture — then simulate it, find bottlenecks, and iterate before production.',
  },
  projectWorkspace: {
    title: 'Project Workspace — GitToScale',
    description:
      'Design, collaborate on, and simulate a system architecture in a real-time shared workspace.',
  },
  signup: {
    title: 'Sign Up — GitToScale',
    description: 'Create a free GitToScale account and start designing and simulating system architectures.',
  },
  signin: {
    title: 'Sign In — GitToScale',
    description: 'Sign in to GitToScale to access your architectures, history, and community feed.',
  },
  'forgot-password': {
    title: 'Reset Password — GitToScale',
    description: 'Reset your GitToScale account password.',
  },
  'auth-callback': {
    title: 'GitToScale',
    description: 'Completing sign-in to GitToScale.',
  },
  history: {
    title: 'Project History — GitToScale',
    description: 'Your saved architectures and past simulations on GitToScale.',
  },
  'cookie-policy': {
    title: 'Cookie Policy — GitToScale',
    description: 'How GitToScale uses cookies and similar technologies.',
  },
  'privacy-policy': {
    title: 'Privacy Policy — GitToScale',
    description: 'How GitToScale collects, uses, and protects your data.',
  },
  terms: {
    title: 'Terms of Service — GitToScale',
    description: 'The terms governing your use of GitToScale.',
  },
  'not-found': {
    title: 'Page Not Found — GitToScale',
    description: 'The page you are looking for does not exist.',
  },
  unverified: {
    title: 'Unverified Project — GitToScale',
    description: 'This project link has not been verified.',
  },
  feed: {
    title: 'Community Feed — GitToScale',
    description: 'Browse system architectures and design simulations shared by the GitToScale community.',
  },
  'feed-profile': {
    title: 'Profile — GitToScale',
    description: 'Community member profile and shared system designs on GitToScale.',
  },
  'collab-landing': {
    title: 'Collaborative Design Meetings — GitToScale',
    description: 'Host real-time collaborative design meetings to co-architect systems on a shared canvas.',
  },
  'collab-meeting': {
    title: 'Design Meeting — GitToScale',
    description: 'Join a real-time collaborative system design meeting on GitToScale.',
  },
  payment: {
    title: 'Pricing — GitToScale',
    description: 'GitToScale plans and pricing for system design, simulation, and collaboration.',
  },
  'payment-history': {
    title: 'Payment History & Subscriptions — GitToScale',
    description: 'Manage your GitToScale billing, review transaction history, and view active plan status.',
  },
  admin: {
    title: 'Admin — GitToScale',
    description: 'GitToScale administration.',
  },
};

function setMeta(selector: string, attr: string, value: string) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

export function usePageMeta(view: AppView) {
  useEffect(() => {
    const meta = META[view];
    if (!meta) return;

    document.title = meta.title;
    setMeta('meta[name="description"]', 'content', meta.description);
    setMeta('meta[property="og:title"]', 'content', meta.title);
    setMeta('meta[property="og:description"]', 'content', meta.description);
    setMeta('meta[name="twitter:title"]', 'content', meta.title);
    setMeta('meta[name="twitter:description"]', 'content', meta.description);

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', `${window.location.origin}${window.location.pathname}`);
    }
  }, [view]);
}
