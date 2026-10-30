import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  ArrowRight,
  BarChart3,
  TrendingUp,
  Box,
  Database,
  Hexagon,
  Github,
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
} from 'lucide-react';
import { Fotter } from './Fotter';
import { GitHubStarButton } from './GitHubStarButton';
import NewOne from './newOne';
import FrequentlyAskedQuestions from './ui/frequently-asked-questions-with-accordion';

interface LandingPageProps {
  onSelectTestSite: () => void;
  onSelectUseRepository: () => void;
  onOpenRecommender?: () => void;
  onOpenAuth?: () => void;
  onOpenSignUp?: () => void;
  onStartProject?: (prompt: string) => void;
  children?: React.ReactNode;
  isDark?: boolean;
  onToggleTheme?: () => void;
  isAppDomain?: boolean;
  user?: any;
  onSignOut?: () => void;
  onNavigate?: (route: string) => void;
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

const PAGES = [
  'top',
  'demo',
  'step-1',
  'step-2',
  'step-3',
  'step-4',
  'use-cases',
  'faq',
  'footer',
];

const PAGE_LABELS: Record<string, string> = {
  top: 'Overview',
  demo: 'Project Overview',
  'step-1': 'Step 01: Discover',
  'step-2': 'Step 02: Simulate',
  'step-3': 'Step 03: Detect',
  'step-4': 'Step 04: Scale',
  'use-cases': 'Use Cases',
  faq: 'FAQ',
  footer: 'Footer',
};

const GITOSCALE_FAQS = [
  {
    question: "How does GitToScale discover system architecture from a repository?",
    answer:
      "GitToScale statically analyzes your repository to identify services, databases, message queues, API gateways, and their communication protocols. It auto-generates a living interactive topology graph representing your entire distributed system.",
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
    question: "What Git hosting providers and repositories are supported?",
    answer:
      "You can import public or private repositories from GitHub, GitLab, and Bitbucket, or enter a prompt directly to generate custom greenfield system architectures from scratch.",
  },
  {
    question: "Is my repository source code stored or exposed?",
    answer:
      "No. GitToScale only parses configuration manifests and dependency graphs to extract topology. Your proprietary source code is never permanently stored or shared with third parties.",
  },
];

const steps = [
  {
    tag: 'Automatic Codebase Scanning',
    title: 'Discover Architecture',
    body: 'Deeply inspect repository structures, microservices, databases, and message queues to auto-construct accurate topology.',
  },
  {
    tag: 'High-Throughput Synthetic Load',
    title: 'Simulate Distributed Traffic',
    body: 'Stress-test services with realistic user requests, spike traffic, and multi-tier network dependencies in real time.',
  },
  {
    tag: 'Latency & Failure Analysis',
    title: 'Pinpoint Bottlenecks',
    body: 'Trace every hop to surface slow queries, saturated queues and single points of failure before they hit production.',
  },
  {
    tag: 'Actionable Recommendations',
    title: 'Scale With Confidence',
    body: 'Get concrete suggestions — caching, sharding, replicas — and validate each change against the same simulated load.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function PageDots({ active }: { active: number }) {
  return (
    <div className="fixed right-4 sm:right-6 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-2.5 md:flex">
      {PAGES.map((id, i) => (
        <div key={id} className="relative group flex items-center justify-end">
          <div className="absolute right-6 px-2.5 py-1 rounded-md bg-slate-900 text-white dark:bg-white dark:text-neutral-950 text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-md z-50">
            {PAGE_LABELS[id] || id}
          </div>
          <button
            aria-label={`Go to ${PAGE_LABELS[id] || id}`}
            onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
            className={`w-2 rounded-full transition-all cursor-pointer ${
              i === active
                ? 'h-6 bg-slate-900 dark:bg-white'
                : 'h-2 bg-slate-400/40 dark:bg-neutral-600/40 hover:bg-slate-600 dark:hover:bg-neutral-400'
            }`}
          />
        </div>
      ))}
    </div>
  );
}

export function HeroDiagram() {
  const services = [
    { Icon: Box, dot: 'bg-slate-400 dark:bg-neutral-500', text: 'text-slate-700 dark:text-neutral-300', y: 70 },
    { Icon: Database, dot: 'bg-slate-400 dark:bg-neutral-500', text: 'text-slate-700 dark:text-neutral-300', y: 160 },
    { Icon: Hexagon, dot: 'bg-slate-400 dark:bg-neutral-500', text: 'text-slate-700 dark:text-neutral-300', y: 250 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="relative mx-auto h-72 sm:h-80 w-full max-w-sm sm:max-w-md select-none"
    >
      <svg
        viewBox="0 0 440 320"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full text-slate-300 dark:text-neutral-800 pointer-events-none"
        fill="none"
      >
        <path d="M18 40 V140" stroke="currentColor" strokeWidth="1.5" />
        {services.map((s, i) => (
          <motion.path
            key={i}
            d={`M172 160 C 220 160, 220 ${s.y}, 282 ${s.y}`}
            stroke="currentColor"
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.6 + i * 0.15 }}
          />
        ))}
      </svg>

      {/* Top Left Telemetry Card */}
      <div className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#141416] text-slate-500 dark:text-neutral-400 shadow-xs">
        <BarChart3 className="h-4 w-4" />
      </div>

      {/* Top Right Telemetry Card */}
      <div className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#141416] text-slate-500 dark:text-neutral-400 shadow-xs">
        <TrendingUp className="h-4 w-4" />
      </div>

      {/* Center Left GitHub Card */}
      <div className="absolute left-[7%] top-1/2 flex h-14 w-[32%] -translate-y-1/2 items-center gap-2.5 sm:gap-3 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#141416] px-3 shadow-xs">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 dark:bg-white text-white dark:text-neutral-950 shrink-0">
          <Github className="h-4 w-4 fill-current" />
        </span>
        <span className="flex-1 space-y-1.5">
          <span className="block h-1.5 w-full rounded bg-slate-200 dark:bg-neutral-800" />
          <span className="block h-1.5 w-2/3 rounded bg-slate-200 dark:bg-neutral-800" />
        </span>
      </div>

      {/* Right Column Services */}
      {services.map(({ Icon, dot, text, y }, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 + i * 0.15 }}
          style={{ top: `${(y / 320) * 100}%`, translateY: '-50%' }}
          className="absolute right-[4%] flex h-11 w-[33%] items-center gap-2 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#141416] px-3 shadow-xs"
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 dark:bg-neutral-800/80 ${text} shrink-0`}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="flex-1 space-y-1">
            <span className="block h-1.5 w-full rounded bg-slate-200 dark:bg-neutral-800" />
            <span className="block h-1.5 w-1/2 rounded bg-slate-200 dark:bg-neutral-800" />
          </span>
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
            className={`h-2 w-2 rounded-full ${dot} shrink-0`}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

const DEMO_IMAGES = [
  {
    src: '/demo-basic.png',
    title: 'Basic Architecture View',
    subtitle: 'High-level microservices, cache tiers, and load balancers',
    alt: 'GitToScale Basic Architecture Simulation View',
  },
  {
    src: '/demo-detailed.png',
    title: 'Detailed Fleet & Bottleneck View',
    subtitle: 'Deep dive into queue saturation, latencies, and constrained nodes',
    alt: 'GitToScale Detailed Fleet and Bottleneck Analysis View',
  },
  {
    src: '/demo-import.png',
    title: 'Automated Codebase Scanner',
    subtitle: 'Auto-construct interactive topology from any GitHub repository',
    alt: 'GitToScale AI Ingestion and Architecture Extraction',
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
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        {/* Big High-Resolution Image Canvas Frame */}
        <div
          onClick={onLaunch}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="relative flex-1 min-w-0 w-full overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-slate-950 shadow-2xl cursor-pointer group flex items-center justify-center"
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={activeSlide}
              src={DEMO_IMAGES[activeSlide].src}
              alt={DEMO_IMAGES[activeSlide].alt}
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
            <ArrowRight className="w-3.5 h-3.5" />
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
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
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

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectTestSite,
  onSelectUseRepository,
  onOpenRecommender,
  onOpenAuth,
  onOpenSignUp,
  onStartProject,
  children,
  isDark = false,
  onToggleTheme,
  isAppDomain: isAppDomainProp,
  user,
  onSignOut,
  onNavigate,
}) => {
  const isApp = isAppDomainProp !== undefined ? isAppDomainProp : checkIsAppDomain();
  const [active, setActive] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [scrollDir, setScrollDir] = useState<'forward' | 'backward'>('forward');
  const containerRef = useRef<HTMLDivElement>(null);
  const stepsSectionRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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

  const updateStep = useCallback((newStep: number) => {
    setCurrentStep((prev) => {
      if (newStep !== prev) {
        setScrollDir(newStep >= prev ? 'forward' : 'backward');
        return newStep;
      }
      return prev;
    });
  }, []);

  // Scroll position observer to update active step in sync
  const handleScroll = useCallback(() => {
    if (!stepsSectionRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const stepsRect = stepsSectionRef.current.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const relativeTop = stepsRect.top - containerRect.top;
    const scrollableRange = stepsRect.height - containerRect.height;

    if (scrollableRange > 0 && relativeTop <= 20 && relativeTop >= -scrollableRange) {
      const progress = Math.max(0, Math.min(0.999, -relativeTop / scrollableRange));
      const stepIdx = Math.min(3, Math.floor(progress * 4));
      updateStep(stepIdx);
      setActive(2 + stepIdx);
    }

    // Activate footer dot when user scrolls to the bottom
    if (container.scrollHeight - container.scrollTop - container.clientHeight < 80) {
      setActive(PAGES.indexOf('footer'));
    }
  }, [updateStep]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = PAGES.indexOf(e.target.id);
            if (idx !== -1) {
              setActive(idx);
              if (e.target.id.startsWith('step-')) {
                const stepNum = parseInt(e.target.id.replace('step-', ''), 10) - 1;
                if (!isNaN(stepNum) && stepNum >= 0 && stepNum < steps.length) {
                  updateStep(stepNum);
                }
              }
            }
          }
        });
      },
      { root: container, threshold: 0.2 }
    );

    PAGES.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      obs.disconnect();
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, updateStep]);

  return (
    <div
      ref={containerRef}
      className="h-screen w-full snap-y snap-proximity overflow-y-scroll overflow-x-hidden scroll-smooth bg-slate-50 dark:bg-[#020202] text-slate-800 dark:text-slate-100 transition-colors"
    >
      <PageDots active={active} />

      {/* Section 1: Hero Header & Content (#top) */}
      <header
        id="top"
        className="relative flex min-h-screen snap-start flex-col justify-between bg-slate-50 dark:bg-[#020202]"
      >
        {/* Top Navbar Header */}
        <div
          className={`w-full z-30 transition-all duration-300 ${
            isApp
              ? 'border-b border-slate-200/80 dark:border-neutral-800 bg-white/90 dark:bg-[#020202]/90 backdrop-blur px-3 sm:px-6 md:px-8 h-16 flex items-center justify-between'
              : 'pt-3 sm:pt-4 px-3 sm:px-6 flex items-center justify-center gap-2 sm:gap-3'
          }`}
        >
          {/* Centered Floating Pill Navbar */}
          <div
            className={`flex items-center justify-between transition-all duration-300 ${
              isApp
                ? 'h-full flex-1 max-w-none'
                : 'h-12 sm:h-13 w-full max-w-4xl px-3 sm:px-5 rounded-full border border-slate-200/90 dark:border-neutral-800/90 bg-white/85 dark:bg-[#020202]/85 backdrop-blur-md shadow-md shadow-slate-200/40 dark:shadow-black/50'
            }`}
          >
            {/* Left: Brand Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <img
                src={isDark ? '/logo.png' : '/logo-light.png'}
                alt="GitToScale"
                className={`w-auto object-contain cursor-pointer transition-all ${
                  isApp ? 'h-8 sm:h-9 md:h-10' : 'h-6 sm:h-7'
                }`}
              />
            </div>

            {/* Right: Actions inside Navbar */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Test Demo Site */}
              <button
                onClick={onSelectTestSite}
                className={`flex items-center gap-1.5 border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#141416] text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#1e1e22] transition-colors shadow-xs cursor-pointer shrink-0 ${
                  isApp ? 'px-2.5 sm:px-3 py-1.5 rounded-lg' : 'px-2.5 sm:px-3 py-1 rounded-full'
                }`}
                title="Test Demo Site"
              >
                <Play className="h-3 w-3 fill-current opacity-80" />
                <span className="hidden sm:inline">Test Demo Site</span>
                <span className="sm:hidden">Demo</span>
              </button>

              <GitHubStarButton className="hidden md:inline-flex" />
            </div>
          </div>

          {/* Standalone Profile Button & Dropdown Outside Navbar */}
          <div ref={profileRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              aria-label="Profile, Authentication and Appearance settings"
              title={user ? (user.user_metadata?.full_name || user.email || 'Profile') : 'Profile & Settings'}
              className={`border border-slate-200/90 dark:border-neutral-800/90 bg-white/85 dark:bg-[#0A0A0A]/85 backdrop-blur-md shadow-md shadow-slate-200/40 dark:shadow-black/50 hover:bg-slate-100 dark:hover:bg-[#141416] text-slate-700 dark:text-neutral-200 transition-all cursor-pointer flex items-center justify-center shrink-0 relative ${
                isApp ? 'p-2 rounded-lg h-10 w-10' : 'p-2.5 rounded-full h-12 w-12 sm:h-13 sm:w-13'
              }`}
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-neutral-200" />
              {user && (
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0A0A0A]" />
              )}
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

                      {onSignOut && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            onSignOut();
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-slate-600 dark:text-neutral-400" />
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
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#141416] text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#1e1e22] transition-colors cursor-pointer shadow-xs"
                        >
                          <LogIn className="w-3.5 h-3.5" />
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
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
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
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            !isDark
                              ? 'bg-white text-slate-900 shadow-xs font-semibold'
                              : 'text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white'
                          }`}
                        >
                          <Sun className="w-3.5 h-3.5 text-slate-700 dark:text-neutral-300" />
                          <span>Light</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (!isDark) onToggleTheme();
                          }}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            isDark
                              ? 'bg-[#1e1e22] text-white shadow-xs font-semibold'
                              : 'text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white'
                          }`}
                        >
                          <Moon className="w-3.5 h-3.5 text-slate-700 dark:text-neutral-300" />
                          <span>Dark</span>
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>


        {/* New UI Section */}
        <NewOne
          onSelectTestSite={onSelectTestSite}
          onSelectUseRepository={onSelectUseRepository}
          onOpenRecommender={onOpenRecommender}
          onOpenAuth={onOpenAuth}
          onStartProject={onStartProject}
          isDark={isDark}
        />

        {/* Hero Body Grid */}
  

        {/* Subtle Bottom Spacer */}
        <div className="h-4" />
      </header>

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


      {/* Sections 3–6: Interactive Pinned Steps Journey */}
      <div ref={stepsSectionRef} id="steps-section" className="relative h-[400vh]">
        {/* Invisible snap targets for the 4 steps */}
        <div id="step-1" className="absolute top-0 h-screen w-full pointer-events-none snap-start" />
        <div id="step-2" className="absolute top-[100vh] h-screen w-full pointer-events-none snap-start" />
        <div id="step-3" className="absolute top-[200vh] h-screen w-full pointer-events-none snap-start" />
        <div id="step-4" className="absolute top-[300vh] h-screen w-full pointer-events-none snap-start" />

        {/* Pinned Sticky Stage */}
        <div className="sticky top-0 h-screen w-full flex items-center justify-center px-6 sm:px-10 py-12">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-8 md:gap-14 md:grid-cols-[1fr_auto_1fr]">
            {/* Stationary Giant Number with in-place transition */}
            <div className="relative h-[24vw] md:h-[15vw] flex items-center justify-center md:justify-start overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={currentStep}
                  initial={{ y: scrollDir === 'forward' ? 50 : -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: scrollDir === 'forward' ? -50 : 50, opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="outline-text select-none text-[26vw] md:text-[16vw] font-black leading-none block text-center md:text-left"
                >
                  0{currentStep + 1}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Vertical Animated Progress Divider */}
            <div className="relative hidden h-64 w-px bg-slate-200 dark:bg-neutral-800 md:block">
              <motion.div
                className="absolute top-0 w-px bg-slate-900 dark:bg-white"
                animate={{ height: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            {/* Only the Text in Front Re-renders and Transitions */}
            <div className="max-w-md mx-auto md:mx-0 min-h-[240px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{
                    opacity: 0,
                    y: scrollDir === 'forward' ? 20 : -20,
                    filter: 'blur(4px)',
                  }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{
                    opacity: 0,
                    y: scrollDir === 'forward' ? -20 : 20,
                    filter: 'blur(4px)',
                  }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {steps[currentStep].title}
                  </h2>
                  <p className="mt-2 font-mono text-xs uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                    {steps[currentStep].tag}
                  </p>
                  <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-neutral-400">
                    {steps[currentStep].body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Section 7: Use Cases (#use-cases) */}
      <section
        id="use-cases"
        className="relative flex min-h-screen snap-start flex-col justify-center px-6 sm:px-10 py-20"
      >
        <div className="mx-auto w-full max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ amount: 0.2 }}
            variants={fadeUp}
            className="mb-12 max-w-2xl"
          >
            {/* <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Target Audiences</span>
            </div> */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Who benefits from GitToScale
            </h2>
            <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-neutral-400">
              Discover how distributed system architects, DevOps engineers, and engineering managers prevent outages before production deployments.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xs hover:border-slate-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 flex items-center justify-center mb-4">
                  <Compass className="w-5 h-5 text-slate-700 dark:text-neutral-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  System Architects
                </h3>
                <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed mb-4">
                  Validate proposed microservice topologies, database sharding strategies, and message broker backpressure before writing a single line of infrastructure code.
                </p>
              </div>
              {/* <div className="pt-4 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-neutral-400">
                <span>Outcome: Zero unexpected cascading faults</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Pre-production</span>
              </div> */}
            </motion.div>

            {/* Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xs hover:border-slate-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 flex items-center justify-center mb-4">
                  <Cpu className="w-5 h-5 text-slate-700 dark:text-neutral-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  DevOps & Platform Teams
                </h3>
                <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed mb-4">
                  Diagnose whether downstream DB connection pools or queue worker threads saturate first during 10x traffic spikes, pinpointing root bottlenecks instantly.
                </p>
              </div>
              {/* <div className="pt-4 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-neutral-400">
                <span>Outcome: Queue & latency safety thresholds</span>
                <span className="text-sky-600 dark:text-sky-400 font-semibold">Capacity Planning</span>
              </div> */}
            </motion.div>

            {/* Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xs hover:border-slate-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5 text-slate-700 dark:text-neutral-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Tech Leads & Engineering VPs
                </h3>
                <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed mb-4">
                  Make data-backed infrastructure budget decisions. Compare baseline vs. scaled configurations side-by-side to justify cloud spend and replica counts.
                </p>
              </div>
              {/* <div className="pt-4 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-neutral-400">
                <span>Outcome: Eliminate over-provisioning spend</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Cost Efficiency</span>
              </div> */}
            </motion.div>

            {/* Card 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xs hover:border-slate-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 flex items-center justify-center mb-4">
                  <Layers className="w-5 h-5 text-slate-700 dark:text-neutral-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  System Design Learners
                </h3>
                <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed mb-4">
                  Move beyond static whiteboard diagrams. Test caching layers, load balancers, rate limiters, and failover mechanics interactively under synthetic loads.
                </p>
              </div>
              {/* <div className="pt-4 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-neutral-400">
                <span>Outcome: Hands-on distributed system mastery</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">Interactive Learning</span>
              </div> */}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Optional Children */}
      {children}

      {/* Section 11: Frequently Asked Questions (#faq) */}
      <div id="faq" className="relative w-full border-t border-slate-200/80 dark:border-neutral-800/80 bg-slate-50/50 dark:bg-[#020202]">
        <FrequentlyAskedQuestions
          title="Frequently Asked Questions"
          description="Everything you need to know about GitToScale architecture scanning, distributed simulation, and AI recommendations."
          data={GITOSCALE_FAQS}
          supportEmail="support@gittoscale.tech"
        />
      </div>

      {/* Section 12: Global Footer (#footer) */}
      <div id="footer" className="relative w-full">
        <Fotter brandName="GitToScale" isDark={isDark} onNavigate={onNavigate} />
      </div>
    </div>
  );
};

export default LandingPage;
