import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Sun,
  Moon,
  Cpu,
  Layers,
  ShieldCheck,
  Compass,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  LogIn,
  UserPlus,
  History,
  ExternalLink,
} from 'lucide-react';
import { Fotter } from './Fotter';
import { FloatingFeedbackButton } from './FloatingFeedbackButton';
import NewOne from './newOne';
import WorkflowSteps from './WorkflowSteps';
import FrequentlyAskedQuestions from './ui/frequently-asked-questions-with-accordion';
import { PenHighlight } from './ui/PenShadowLine';
import { ShareDesignFeedSection } from './ShareDesignFeedSection';
import { useSmoothScroll } from '../utils/useSmoothScroll';

interface LandingPageProps {
  onSelectTestSite: () => void;
  onSelectUseRepository: () => void;
  onOpenRecommender?: () => void;
  onOpenAuth?: () => void;
  onOpenSignUp?: () => void;
  onStartProject?: (prompt: string) => void;
  onStartBlankProject?: () => void;
  children?: React.ReactNode;
  isDark?: boolean;
  onToggleTheme?: () => void;
  isAppDomain?: boolean;
  user?: any;
  onSignOut?: () => void;
  onNavigate?: (route: string) => void;
  onOpenHistory?: () => void;
}

const checkIsAppDomain = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  return (
    host === 'app.gittoscale.tech' ||
    host.startsWith('app.') ||
    window.location.pathname.startsWith('/app') ||
    search.has('app') ||
    search.has('demo') ||
    search.has('repo')
  );
};

const PAGES = ['top', 'features', 'community-feed', 'use-cases', 'faq'];

const PAGE_LABELS: Record<string, string> = {
  top: 'Home',
  features: 'Features',
  'community-feed': 'Community',
  'use-cases': 'Use Cases',
  faq: 'FAQ',
};

const GITOSCALE_FAQS = [
  {
    question: "Can I generate system designs from text prompts or only from repositories?",
    answer:
      "Both! You can type any prompt (such as 'Design a video streaming pipeline with CDN and transcoder workers') to generate interactive system architectures from scratch, or import any public GitHub repository to auto-discover existing architecture.",
  },
  {
    question: "How does Text to System Design work in GitToScale?",
    answer:
      "Our AI Architect parses your requirements, estimates throughput and storage needs, and automatically constructs services, databases, queues, and gateways with realistic traffic paths, latencies, and capacities ready for live simulation.",
  },
  {
    question: "Can I simulate high traffic spikes without deploying to production?",
    answer:
      "Yes! GitToScale lets you configure synthetic request rates, stress-test microservices, trace latency across every network hop, and pinpoint bottlenecks and single points of failure (SPOFs) before shipping to production.",
  },
  {
    question: "How does the AI Architect generate scaling recommendations?",
    answer:
      "The AI Architect analyzes node resource utilization, saturated queues, and query latency under simulated load, providing concrete actionable scaling patterns—such as read-replicas, caching tiers, and event-driven decoupled queues.",
  },
  {
    question: "Is my repository source code or architecture design stored or exposed?",
    answer:
      "No. GitToScale only parses configuration manifests and dependency graphs to extract topology. Your proprietary source code and architecture designs are never permanently stored or shared with third parties.",
  },
];


function PageDots({
  active,
  onSelect,
}: {
  active: number;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="fixed right-2 sm:right-4 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-1 md:flex">
      {PAGES.map((id, i) => (
        <div key={id} className="relative group flex items-center justify-end">
          <div className="absolute right-10 px-2.5 py-1 rounded-md bg-slate-900 text-white dark:bg-white dark:text-neutral-950 text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-md z-50">
            {PAGE_LABELS[id] || id}
          </div>
          <button
            type="button"
            aria-label={`Go to ${PAGE_LABELS[id] || id}`}
            onClick={() => onSelect(id)}
            className="w-11 h-11 flex items-center justify-center cursor-pointer p-0 rounded-full focus:outline-hidden"
          >
            <span
              className={`w-2 rounded-full transition-all block ${
                i === active
                  ? 'h-6 bg-slate-900 dark:bg-white'
                  : 'h-2 bg-slate-500/60 dark:bg-neutral-400/60 hover:bg-slate-800 dark:hover:bg-white'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}

const DEMO_IMAGES = [
  {
    src: '/demo-basic.png',
    title: 'Interactive System Architecture Canvas',
    subtitle: 'Text-to-design generation, microservices, cache tiers, and load balancers',
    alt: 'GitToScale System Architecture Simulation View',
  },
  {
    src: '/demo-detailed.png',
    title: 'Detailed Fleet & Bottleneck View',
    subtitle: 'Deep dive into queue saturation, latencies, and constrained nodes under load',
    alt: 'GitToScale Detailed Fleet and Bottleneck Analysis View',
  },
  {
    src: '/demo-import.png',
    title: 'Text Prompt & Codebase Scanner',
    subtitle: 'Generate system designs from text prompts or auto-construct from GitHub repositories',
    alt: 'GitToScale Text to System Design and Codebase Ingestion',
  },
];

export function Demo({ onLaunch }: { onLaunch: () => void }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Automatically cycle through images every 4 seconds, pause when hovering/touching
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev === DEMO_IMAGES.length - 1 ? 0 : prev + 1));
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused, activeSlide]);

  const handlePrev = useCallback(() => {
    setActiveSlide((prev) => (prev === 0 ? DEMO_IMAGES.length - 1 : prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setActiveSlide((prev) => (prev === DEMO_IMAGES.length - 1 ? 0 : prev + 1));
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  // Touch swipe handling for mobile and tablet
  const minSwipeDistance = 45;
  const onTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const distance = touchStartX.current - touchEndX.current;
      if (distance > minSwipeDistance) {
        handleNext();
      } else if (distance < -minSwipeDistance) {
        handlePrev();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
    setTimeout(() => setIsPaused(false), 2000);
  };

  return (
    <div
      className="w-full flex flex-col items-center select-none outline-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Project Overview Slides"
    >
      {/* Interactive Showcase Frame with Responsive Layout */}
      <div className="relative flex items-center justify-center gap-2 sm:gap-4 md:gap-6 w-full max-w-6xl">
        {/* Left Arrow Button:
            - Desktop (sm:): comfortably flanked outside the image
            - Mobile (<sm): floating sleek control with high contrast & touch target */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          aria-label="Previous image"
          className="absolute sm:static left-2 sm:left-auto top-1/2 -translate-y-1/2 sm:translate-y-0 z-20 shrink-0 flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-white/95 dark:bg-[#18181b]/95 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-800 dark:text-neutral-100 border border-slate-200/90 dark:border-neutral-700/80 transition-all hover:scale-105 active:scale-95 shadow-lg backdrop-blur-sm cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 hover:text-indigo-500 transition-colors" />
        </button>

        {/* Big High-Resolution Image Canvas Frame */}
        <div
          onClick={onLaunch}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="relative flex-1 min-w-0 w-full overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-slate-100 dark:bg-slate-950 shadow-2xl cursor-pointer group flex items-center justify-center"
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={activeSlide}
              src={DEMO_IMAGES[activeSlide].src}
              alt={DEMO_IMAGES[activeSlide].alt}
              width="1280"
              height="720"
              initial={{ opacity: 0, scale: 0.995 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.995 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="w-full h-auto max-h-[58vh] sm:max-h-[64vh] md:max-h-[68vh] lg:max-h-[72vh] object-contain block mx-auto select-none"
              draggable={false}
            />
          </AnimatePresence>

          {/* Sleek Hover/Touch Badge to indicate clickability */}
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-medium border border-white/10 shadow-lg">
            <span>Explore live demo</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:text-amber-400 transition-all" />
          </div>
        </div>

        {/* Right Arrow Button:
            - Desktop (sm:): comfortably flanked outside the image
            - Mobile (<sm): floating sleek control with high contrast & touch target */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          aria-label="Next image"
          className="absolute sm:static right-2 sm:right-auto top-1/2 -translate-y-1/2 sm:translate-y-0 z-20 shrink-0 flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-white/95 dark:bg-[#18181b]/95 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-800 dark:text-neutral-100 border border-slate-200/90 dark:border-neutral-700/80 transition-all hover:scale-105 active:scale-95 shadow-lg backdrop-blur-sm cursor-pointer"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 hover:text-indigo-500 transition-colors" />
        </button>
      </div>

      {/* Slide Information & Description Header */}
      <div className="mt-4 sm:mt-5 text-center px-4 max-w-xl">
        <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-neutral-100 tracking-tight transition-all">
          {DEMO_IMAGES[activeSlide].title}
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
          {DEMO_IMAGES[activeSlide].subtitle}
        </p>
      </div>

      {/* Clean Dots Indicator with 44px Accessible Touch Target */}
      <div className="flex justify-center items-center mt-2 sm:mt-3 gap-1">
        {DEMO_IMAGES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveSlide(idx);
            }}
            aria-label={`Go to slide ${idx + 1}`}
            className="p-2.5 flex items-center justify-center cursor-pointer touch-manipulation group"
          >
            <span
              className={`h-2 rounded-full transition-all duration-300 block ${
                activeSlide === idx
                  ? 'w-7 bg-indigo-600 dark:bg-indigo-400 shadow-xs'
                  : 'w-2 bg-slate-300 hover:bg-slate-400 dark:bg-neutral-700 dark:hover:bg-neutral-600 group-hover:scale-110'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

const LandingPageComponent: React.FC<LandingPageProps> = ({
  onSelectTestSite,
  onSelectUseRepository,
  onOpenRecommender,
  onOpenAuth,
  onOpenSignUp,
  onStartProject,
  onStartBlankProject,
  children,
  isDark = true,
  onToggleTheme,
  isAppDomain: isAppDomainProp,
  user,
  onSignOut,
  onNavigate,
  onOpenHistory,
}) => {
  const isApp = isAppDomainProp !== undefined ? isAppDomainProp : checkIsAppDomain();
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Inertia-damped smooth scrolling for landing page container (GSAP/Lenis feel)
  useSmoothScroll({
    targetRef: containerRef,
    lerp: 0.085,
    enabled: true,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsProfileOpen(false);
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isProfileOpen]);

  // Programmatic smooth scroll to align target section below sticky header
  const scrollToSection = useCallback((id: string) => {
    const container = containerRef.current;
    if (!container) return;

    if (id === 'top') {
      container.scrollTo({ top: 0, behavior: 'smooth' });
      setActive(0);
      return;
    }

    const el = document.getElementById(id);
    if (!el) return;

    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const targetScrollTop = elRect.top - containerRect.top + container.scrollTop - 76;

    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth',
    });
  }, []);

  // Scroll position observer to update active section in header in sync
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check if user scrolled near bottom
    if (container.scrollHeight - container.scrollTop - container.clientHeight < 80) {
      setActive(PAGES.length - 1);
      return;
    }

    const containerTop = container.getBoundingClientRect().top;
    const headerOffset = 130; // sticky header + cushion

    let currentActive = 0;
    for (let i = 0; i < PAGES.length; i++) {
      const id = PAGES[i];
      const el = document.getElementById(id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const relativeTop = rect.top - containerTop;
      if (relativeTop <= headerOffset) {
        currentActive = i;
      }
    }
    setActive(currentActive);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    handleScroll();
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return (
    <div
      ref={containerRef}
      className="h-screen w-full overflow-y-scroll overflow-x-hidden bg-slate-50 dark:bg-[#020202] text-slate-800 dark:text-slate-100 transition-colors"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-slate-900 focus:font-semibold focus:rounded-lg focus:shadow-xl focus:border focus:border-slate-300"
      >
        Skip to main content
      </a>

      <PageDots active={active} onSelect={scrollToSection} />

      {/* Sticky Top Navbar Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 pointer-events-none ${
          isApp
            ? 'border-b border-slate-200/80 dark:border-neutral-800 bg-white/90 dark:bg-[#020202]/90 backdrop-blur px-3 sm:px-6 md:px-8 h-16 flex items-center justify-between pointer-events-auto'
            : 'pt-3 sm:pt-4 px-3 sm:px-6 flex items-center justify-center gap-2 sm:gap-3'
        }`}
      >
        {/* Centered Floating Pill Navbar */}
        <div
          className={`pointer-events-auto flex items-center justify-between transition-all duration-300 ${
            isApp
              ? 'h-full flex-1 max-w-none'
              : 'h-12 sm:h-13 w-full max-w-4xl px-3 sm:px-5 rounded-full border border-slate-200/90 dark:border-neutral-800/90 bg-white/85 dark:bg-[#020202]/85 backdrop-blur-md shadow-md shadow-slate-200/40 dark:shadow-black/50'
          }`}
        >
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <img
              src={isDark ? '/logo.png' : '/logo-light.png'}
              alt="GitToScale Logo"
              width="140"
              height="36"
              onClick={() => scrollToSection('top')}
              className={`w-auto object-contain cursor-pointer transition-all ${
                isApp ? 'h-8 sm:h-9 md:h-10' : 'h-6 sm:h-7'
              }`}
            />
          </div>

          {/* Right: Feed with external icon */}
          <nav className="flex items-center">
            <a
              href="/feed"
              onClick={(e) => {
                if (onNavigate && !e.metaKey && !e.ctrlKey) {
                  e.preventDefault();
                  onNavigate('/feed');
                }
              }}
              className="group min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 dark:text-neutral-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/80 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Open Community Feed"
            >
              <span>Feed</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </a>
          </nav>
        </div>

          {/* Standalone Profile Button & Dropdown Outside Navbar */}
          <div ref={profileRef} className="pointer-events-auto relative shrink-0">
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              aria-label="Profile, Authentication and Appearance settings"
              title={user ? (user.user_metadata?.full_name || user.email || 'Profile') : 'Profile & Settings'}
              className={`group border border-slate-200/90 dark:border-neutral-800/90 bg-white/85 dark:bg-[#0A0A0A]/85 backdrop-blur-md shadow-md shadow-slate-200/40 dark:shadow-black/50 hover:bg-slate-100 dark:hover:bg-[#141416] text-slate-700 dark:text-neutral-200 transition-all cursor-pointer flex items-center justify-center shrink-0 relative min-h-[44px] min-w-[44px] ${
                isApp ? 'p-2 rounded-lg h-10 w-10' : 'p-2.5 rounded-full h-12 w-12 sm:h-13 sm:w-13'
              }`}
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-neutral-200 group-hover:text-indigo-500 transition-colors" />
            </button>

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border border-slate-200/90 dark:border-neutral-800/90 bg-white/95 dark:bg-[#0C0C0E]/95 backdrop-blur-xl shadow-xl shadow-slate-300/40 dark:shadow-black/70 p-3.5 z-50 flex flex-col gap-3"
                >
                  {/* Account / User Section */}
                  {user ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-100/70 dark:bg-neutral-900/60 border border-slate-200/60 dark:border-neutral-800/60">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 flex items-center justify-center font-bold text-sm shrink-0">
                          {(user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {user.user_metadata?.full_name || user.email?.split('@')[0]}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                            {user.email}
                          </span>
                        </div>
                      </div>

                      {/* History Option */}
                      {(onOpenHistory || onNavigate) && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            if (onOpenHistory) {
                              onOpenHistory();
                            } else {
                              onNavigate?.('history');
                            }
                          }}
                          className="group flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-left"
                        >
                          <History className="w-4 h-4 text-slate-500 dark:text-neutral-400 group-hover:text-indigo-500 transition-colors" />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="truncate">History</span>
                            <span className="text-[10px] font-normal text-slate-500 dark:text-neutral-400 truncate">
                              Saved systems &amp; snapshots
                            </span>
                          </div>
                        </button>
                      )}

                      {onSignOut && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            onSignOut();
                          }}
                          className="group flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-slate-600 dark:text-neutral-400 group-hover:text-red-500 transition-colors" />
                          <span>Sign Out</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 p-1">
                      <div className="px-1 pb-1">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">Account</p>
                        <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                          Sign in to simulate load & save architectures
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Login Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            onOpenAuth?.();
                          }}
                          className="group flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#141416] text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#1e1e22] transition-colors cursor-pointer shadow-xs"
                        >
                          <LogIn className="w-3.5 h-3.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                          <span>Log In</span>
                        </button>

                        {/* Sign Up Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            if (onOpenSignUp) {
                              onOpenSignUp();
                            } else if (onOpenAuth) {
                              onOpenAuth();
                            }
                          }}
                          className="group flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                          <span>Sign Up</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Theme Switcher Section */}
                  {onToggleTheme && (
                    <div className="border-t border-slate-200/80 dark:border-neutral-800/80 pt-2.5 flex flex-col gap-1.5">
                      <div className="px-1 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600 dark:text-neutral-400">Appearance</span>
                        <span className="text-[11px] font-medium text-slate-400 dark:text-neutral-500">
                          {isDark ? 'Dark Theme' : 'Light Theme'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100/70 dark:bg-neutral-900/60 border border-slate-200/60 dark:border-neutral-800/60">
                        <button
                          type="button"
                          onClick={() => {
                            if (isDark) onToggleTheme();
                          }}
                          className={`group flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            !isDark
                              ? 'bg-white text-slate-900 shadow-xs font-semibold'
                              : 'text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white'
                          }`}
                        >
                          <Sun className="w-3.5 h-3.5 text-slate-700 dark:text-neutral-300 group-hover:text-amber-500 transition-colors" />
                          <span>Light</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (!isDark) onToggleTheme();
                          }}
                          className={`group flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            isDark
                              ? 'bg-[#1e1e22] text-white shadow-xs font-semibold'
                              : 'text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white'
                          }`}
                        >
                          <Moon className="w-3.5 h-3.5 text-slate-700 dark:text-neutral-300 group-hover:text-blue-400 transition-colors" />
                          <span>Dark</span>
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Main Landmark for Accessibility and SEO */}
        <main id="main-content" className="flex-1 w-full flex flex-col">
          {/* Section 1: Hero Header & Content (#top) */}
          <section
            id="top"
            className="relative flex min-h-screen flex-col justify-between bg-white dark:bg-[#060709] pt-16 sm:pt-20"
          >
            {/* New UI Section */}
            <NewOne
              onSelectTestSite={onSelectTestSite}
              onSelectUseRepository={onSelectUseRepository}
              onOpenRecommender={onOpenRecommender}
              onOpenAuth={onOpenAuth}
              onStartProject={onStartProject}
              onStartBlankProject={onStartBlankProject}
              isDark={isDark}
            />

          {/* Hero Body Grid */}
    

          {/* Subtle Bottom Spacer */}
          <div className="h-4" />
        </section>

      {/* Section 2: Project Overview (#demo) */}
      {/* <section
        id="demo"
        className="relative flex min-h-screen snap-start items-center justify-center px-3 sm:px-6 lg:px-10 py-10 sm:py-16 md:py-20"
      >
        <motion.div
          className="mx-auto w-full max-w-7xl flex flex-col items-center"
          initial="hidden"
          whileInView="show"
          viewport={{ amount: 0.2 }}
          variants={fadeUp}
        >
          <Demo onLaunch={onSelectTestSite} />
        </motion.div>
      </section> */}


      {/* Sections 3–5: Interactive Workflow Steps Journey (01 Discover, 02 Simulate, 03 Detect) */}
      <div id="features" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 800px' }}>
        <WorkflowSteps
          onSelectTestSite={onSelectTestSite}
          onSelectUseRepository={onSelectUseRepository}
          onOpenRecommender={onOpenRecommender}
          isDark={isDark}
        />
      </div>

      {/* Community Feed Showcase: Share Your Design to Others */}
      <ShareDesignFeedSection
        onNavigate={onNavigate}
        onSelectTestSite={onSelectTestSite}
        isDark={isDark}
      />

      {/* Section 7: Use Cases (#use-cases) */}
      <section
        id="use-cases"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 700px' }}
        className="relative flex min-h-screen flex-col justify-center px-6 sm:px-10 py-20"
      >
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-[0.94] tracking-tight text-slate-900 dark:text-white">
              {/* Mobile View (< sm): separate highlight per line */}
              <span className="sm:hidden flex flex-col items-start">
                <PenHighlight className="block w-fit" highlightClassName="bg-slate-400/85 dark:bg-neutral-500/85">
                  Who benefits
                </PenHighlight>
                <PenHighlight className="mt-1 block w-fit" highlightClassName="bg-slate-400/85 dark:bg-neutral-500/85">
                  from GitToScale
                </PenHighlight>
              </span>
              {/* Desktop View (>= sm) */}
              <span className="hidden sm:block">
                <PenHighlight className="block w-fit" highlightClassName="bg-slate-400/85 dark:bg-neutral-500/85">
                  Who benefits from
                </PenHighlight>
                <PenHighlight className="mt-1 block w-fit" highlightClassName="bg-slate-400/85 dark:bg-neutral-500/85">
                  GitToScale
                </PenHighlight>
              </span>
            </h2>
            <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-neutral-400">
              Whether generating greenfield architectures from text or stress-testing existing production codebases, GitToScale helps teams prevent outages before deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1 */}
            <div className="group p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xs hover:border-slate-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 flex items-center justify-center mb-4">
                  <Compass className="w-5 h-5 text-slate-700 dark:text-neutral-300 group-hover:text-indigo-500 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  System Architects
                </h3>
                <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed mb-4">
                  Generate complete system designs from text prompts in seconds, or validate proposed microservice topologies, database sharding strategies, and broker backpressure before writing a line of code.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xs hover:border-slate-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 flex items-center justify-center mb-4">
                  <Cpu className="w-5 h-5 text-slate-700 dark:text-neutral-300 group-hover:text-sky-500 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  DevOps & Platform Teams
                </h3>
                <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed mb-4">
                  Stress-test text-generated blueprints or imported architectures to diagnose whether downstream DB connection pools or queue worker threads saturate first during 10x traffic surges.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xs hover:border-slate-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5 text-slate-700 dark:text-neutral-300 group-hover:text-emerald-500 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Tech Leads & Engineering VPs
                </h3>
                <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed mb-4">
                  Draft, simulate, and compare multiple architectural approaches side-by-side to make data-backed infrastructure budget decisions and justify cloud spend.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="group p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xs hover:border-slate-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 flex items-center justify-center mb-4">
                  <Layers className="w-5 h-5 text-slate-700 dark:text-neutral-300 group-hover:text-amber-500 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  System Design Learners
                </h3>
                <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed mb-4">
                  Practice designing real-world distributed systems (Uber, Netflix, WhatsApp) from text prompts. Test caching tiers, load balancers, rate limiters, and failover mechanics interactively under synthetic loads.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Optional Children */}
      {children}

      {/* Section 11: Frequently Asked Questions (#faq) */}
      <div
        id="faq"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 600px' }}
        className="relative w-full border-t border-slate-200/80 dark:border-neutral-800/80 bg-slate-50/50 dark:bg-[#020202]"
      >
        <FrequentlyAskedQuestions
          title="Frequently Asked Questions"
          description="Everything you need to know about GitToScale text-to-system design, repository architecture scanning, and distributed load simulation."
          data={GITOSCALE_FAQS}
        />
      </div>
    </main>

    {/* Section 12: Global Footer (#footer) */}
    <div id="footer" className="relative w-full">
        <Fotter brandName="GitToScale" isDark={isDark} onNavigate={onNavigate} />
      </div>

      {/* Sticky Floating Feedback & Recommendation Button */}
      <FloatingFeedbackButton />
    </div>
  );
};

export const LandingPage = React.memo(LandingPageComponent);
export default LandingPage;
