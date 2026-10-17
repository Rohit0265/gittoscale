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
  Copy,
  Check,
  Cpu,
  Server,
  Layers,
  Sparkles,
  ShieldCheck,
  Compass,
  Milestone,
  Clock,
  ExternalLink,
  GitCommit,
  Tag,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { Fotter } from './Fotter';

interface LandingPageProps {
  onSelectTestSite: () => void;
  onSelectUseRepository: () => void;
  children?: React.ReactNode;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

const PAGES = [
  'top',
  'demo',
  'step-1',
  'step-2',
  'step-3',
  'step-4',
  'use-cases',
  'tech-stack',
  'github',
  'roadmap',
  'changelog',
  'footer',
];

const PAGE_LABELS: Record<string, string> = {
  top: 'Overview',
  demo: 'Live Demo',
  'step-1': 'Step 01: Discover',
  'step-2': 'Step 02: Simulate',
  'step-3': 'Step 03: Detect',
  'step-4': 'Step 04: Scale',
  'use-cases': 'Use Cases',
  'tech-stack': 'Tech Stack',
  github: 'GitHub Activity',
  roadmap: 'Roadmap',
  changelog: 'Changelog',
  footer: 'Footer',
};

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

function HeroDiagram() {
  const services = [
    { Icon: Box, dot: 'bg-emerald-500', text: 'text-emerald-500 dark:text-emerald-400', y: 70 },
    { Icon: Database, dot: 'bg-amber-500', text: 'text-amber-500 dark:text-amber-400', y: 160 },
    { Icon: Hexagon, dot: 'bg-rose-500', text: 'text-rose-500 dark:text-rose-400', y: 250 },
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

function Demo({ onLaunch }: { onLaunch: () => void }) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 text-center p-6 bg-slate-50/50 dark:bg-[#0A0A0A]/50">
      <motion.button
        type="button"
        onClick={onLaunch}
        aria-label="Launch simulator demo"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
        className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-slate-900 dark:border-white shadow-md cursor-pointer hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors group"
      >
        <Play className="ml-1 h-8 w-8 fill-slate-900 dark:fill-white text-slate-900 dark:text-white group-hover:scale-105 transition-transform" />
      </motion.button>
      <div className="space-y-1">
        <p className="text-lg font-semibold text-slate-800 dark:text-neutral-100">Project demo ready to explore</p>
        <p className="font-mono text-xs text-slate-400 dark:text-neutral-500">Tap to run interactive system simulation · 16:9</p>
      </div>
    </div>
  );
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectTestSite,
  onSelectUseRepository,
  children,
  isDark = false,
  onToggleTheme,
}) => {
  const [active, setActive] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [scrollDir, setScrollDir] = useState<'forward' | 'backward'>('forward');
  const [copiedClone, setCopiedClone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const stepsSectionRef = useRef<HTMLDivElement>(null);

  const updateStep = useCallback((newStep: number) => {
    setCurrentStep((prev) => {
      if (newStep !== prev) {
        setScrollDir(newStep >= prev ? 'forward' : 'backward');
        return newStep;
      }
      return prev;
    });
  }, []);

  const handleCopyClone = () => {
    navigator.clipboard.writeText('git clone https://github.com/gitoscale/gitoscale.git');
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2200);
  };

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
      { root: container, threshold: 0.3 }
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
      className="h-screen w-full snap-y snap-mandatory overflow-y-scroll overflow-x-hidden scroll-smooth bg-slate-50 dark:bg-[#0A0A0A] text-slate-800 dark:text-slate-100 transition-colors"
    >
      <PageDots active={active} />

      {/* Section 1: Hero Header & Content (#top) */}
      <header
        id="top"
        className="relative flex min-h-screen snap-start flex-col justify-between bg-slate-50 dark:bg-[#0A0A0A]"
      >
        {/* Preserved Top Header */}
        <div className="h-16 border-b border-slate-200/80 dark:border-neutral-800 bg-white/90 dark:bg-[#0A0A0A]/90 backdrop-blur px-4 sm:px-6 md:px-8 flex items-center justify-between shadow-xs transition-colors w-full z-20">
          <div className="flex items-center gap-3">
            <img
              src={isDark ? '/logo.png' : '/logo-light.png'}
              alt="GitToScale"
              className="h-8 sm:h-9 md:h-10 w-auto object-contain cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-3">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="p-2 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#141414] hover:text-slate-900 dark:hover:text-white transition-all shadow-xs cursor-pointer flex items-center justify-center"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Hero Body Grid */}
        <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 sm:gap-12 px-6 py-10 md:grid-cols-2 my-auto">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.08] tracking-tight text-slate-900 dark:text-white"
            >
              Scale your system{' '}
              <span className="block text-slate-500 dark:text-neutral-400 font-extrabold">
                before disaster.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-md text-base sm:text-lg text-slate-600 dark:text-neutral-400 leading-relaxed"
            >
              Import your GitHub repository and instantly analyze your architecture, discover bottlenecks,
              and understand how your system behaves under load.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3.5">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onSelectUseRepository}
                className="flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-5 sm:px-6 py-3 text-sm font-semibold text-white dark:text-neutral-950 transition-opacity hover:opacity-90 shadow-sm cursor-pointer group"
              >
                <Github className="h-4 w-4 fill-current" />
                <span>Import Repository</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onSelectTestSite}
                className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-neutral-800 bg-white dark:bg-[#141416] px-5 sm:px-6 py-3 text-sm font-semibold text-slate-800 dark:text-neutral-200 transition-colors hover:bg-slate-100 dark:hover:bg-[#1e1e22] shadow-xs cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-current opacity-80" />
                <span>Open Test Site</span>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Hero Architecture Visual */}
          <div className="flex items-center justify-center">
            <HeroDiagram />
          </div>
        </div>

        {/* Subtle Bottom Spacer */}
        <div className="h-4" />
      </header>

      {/* Section 2: Live Demo (#demo) */}
      <section
        id="demo"
        className="relative flex min-h-screen snap-start items-center px-4 sm:px-6 py-16"
      >
        <motion.div
          className="mx-auto w-full max-w-4xl"
          initial="hidden"
          whileInView="show"
          viewport={{ amount: 0.3 }}
          variants={fadeUp}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
                Live demo
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-neutral-400">
                Experience simulated stress tests and discrete-event load distribution in real time.
              </p>
            </div>
            <button
              onClick={onSelectTestSite}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer"
            >
              <span>Launch Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xl">
            {/* macOS Chrome Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 px-4 py-3 bg-slate-50/80 dark:bg-[#0A0A0A]/80">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 font-mono text-xs text-slate-500 dark:text-neutral-400">
                  gittoscale://demo
                </span>
              </div>
              <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Engine Active
              </span>
            </div>
            <Demo onLaunch={onSelectTestSite} />
          </div>
        </motion.div>
      </section>

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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Target Audiences</span>
            </div>
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
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  System Architects
                </h3>
                <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed mb-4">
                  Validate proposed microservice topologies, database sharding strategies, and message broker backpressure before writing a single line of infrastructure code.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-neutral-400">
                <span>Outcome: Zero unexpected cascading faults</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Pre-production</span>
              </div>
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
                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  DevOps & Platform Teams
                </h3>
                <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed mb-4">
                  Diagnose whether downstream DB connection pools or queue worker threads saturate first during 10x traffic spikes, pinpointing root bottlenecks instantly.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-neutral-400">
                <span>Outcome: Queue & latency safety thresholds</span>
                <span className="text-sky-600 dark:text-sky-400 font-semibold">Capacity Planning</span>
              </div>
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
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Tech Leads & Engineering VPs
                </h3>
                <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed mb-4">
                  Make data-backed infrastructure budget decisions. Compare baseline vs. scaled configurations side-by-side to justify cloud spend and replica counts.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-neutral-400">
                <span>Outcome: Eliminate over-provisioning spend</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Cost Efficiency</span>
              </div>
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
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  System Design Learners
                </h3>
                <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed mb-4">
                  Move beyond static whiteboard diagrams. Test caching layers, load balancers, rate limiters, and failover mechanics interactively under synthetic loads.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-neutral-400">
                <span>Outcome: Hands-on distributed system mastery</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">Interactive Learning</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 8: Tech Stack (#tech-stack) */}
      <section
        id="tech-stack"
        className="relative flex min-h-screen snap-start flex-col justify-center px-6 sm:px-10 py-20 bg-slate-100/50 dark:bg-[#070708]"
      >
        <div className="mx-auto w-full max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ amount: 0.2 }}
            variants={fadeUp}
            className="mb-12 max-w-2xl"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 mb-3">
              <Server className="w-3.5 h-3.5" />
              <span>Core Stack</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              The technologies behind GitToScale
            </h2>
            <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-neutral-400">
              Engineered with modern, high-performance distributed architecture and visualization libraries.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Tech 1 */}
            <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xs">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Canvas Visualization
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 mb-2">
                @xyflow/react
              </h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                Hardware-accelerated node graph canvas with custom SVG bezier edge routing, bidirectional packets, and seamless pan/zoom camera controls.
              </p>
            </div>

            {/* Tech 2 */}
            <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xs">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Simulation Engine
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 mb-2">
                Node.js & Express
              </h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                High-throughput discrete-event simulation model calculating queue backpressure, latency accumulation, and worker saturation in deterministic time.
              </p>
            </div>

            {/* Tech 3 */}
            <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xs">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                AI Topology Extractor
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 mb-2">
                Multi-LLM AST Analyzer
              </h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                Connects with Google Gemini, OpenAI, Anthropic, or local Ollama endpoints to parse repository codebases and synthesize accurate service graphs.
              </p>
            </div>

            {/* Tech 4 */}
            <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xs">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Frontend Framework
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 mb-2">
                React 18 & TypeScript
              </h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                Strict type safety, custom hook pipelines, and modular state management ensuring predictable execution and zero runtime UI crashes.
              </p>
            </div>

            {/* Tech 5 */}
            <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xs">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Motion Physics
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 mb-2">
                Framer Motion
              </h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                Spring physics animations, directional number roll transitions, and smooth scroll progress indicators that stay performant at 60 FPS.
              </p>
            </div>

            {/* Tech 6 */}
            <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xs">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Styling & Tokens
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 mb-2">
                Tailwind CSS 3.4
              </h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                System-wide dark and light mode tokens, fluid responsive typography, and sub-pixel alignment across mobile, tablet, and widescreen displays.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 9: GitHub Activity (#github) */}
      <section
        id="github"
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 mb-3">
              <Github className="w-3.5 h-3.5 fill-current" />
              <span>Open Source</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              GitHub activity & community
            </h2>
            <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-neutral-400">
              GitToScale is free, open source, and built transparently for engineers around the world.
            </p>
          </motion.div>

          {/* Activity Cards & Quick Clone Terminal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Quick Clone Terminal Card */}
            <div className="lg:col-span-2 p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                    <span className="text-xs font-mono font-semibold text-slate-700 dark:text-neutral-300">
                      Quick Start CLI
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                    MIT License
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-[#262833] bg-slate-900 text-slate-100 p-4 font-mono text-xs sm:text-sm flex items-center justify-between gap-3 shadow-inner">
                  <span className="truncate text-slate-200">
                    git clone https://github.com/gitoscale/gitoscale.git
                  </span>
                  <button
                    onClick={handleCopyClone}
                    title="Copy command to clipboard"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    {copiedClone ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-neutral-800 text-center">
                    <div className="text-lg font-bold text-slate-900 dark:text-white">v1.2.0</div>
                    <div className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">Latest Release</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-neutral-800 text-center">
                    <div className="text-lg font-bold text-slate-900 dark:text-white">100%</div>
                    <div className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">Open Source</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-neutral-800 text-center">
                    <div className="text-lg font-bold text-slate-900 dark:text-white">0ms</div>
                    <div className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">Local Latency</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-neutral-800 text-center">
                    <div className="text-lg font-bold text-slate-900 dark:text-white">MIT</div>
                    <div className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">Free License</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-500 dark:text-neutral-400">
                  Star us on GitHub to support active development
                </span>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-950 transition-colors shadow-xs"
                >
                  <Github className="w-4 h-4 fill-current" />
                  <span>Star on GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Recent Contributions Card */}
            <div className="p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <GitCommit className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Recent Commit Highlights
                  </h3>
                </div>

                <div className="space-y-3.5">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-neutral-800">
                    <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">feat(canvas)</span>
                    <p className="text-xs text-slate-700 dark:text-neutral-300 mt-0.5 font-medium">
                      Bi-directional edge styles with active pulse markers
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-neutral-800">
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">feat(ai)</span>
                    <p className="text-xs text-slate-700 dark:text-neutral-300 mt-0.5 font-medium">
                      Custom OpenAI endpoint provider with local Ollama support
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0A0A] border border-slate-200/80 dark:border-neutral-800">
                    <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400">perf(ui)</span>
                    <p className="text-xs text-slate-700 dark:text-neutral-300 mt-0.5 font-medium">
                      Responsive viewports & mobile sidebar overlay containment
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 font-mono">
                <span>main branch</span>
                <span className="text-emerald-600 dark:text-emerald-400">All tests passing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 10: Roadmap (#roadmap) */}
      <section
        id="roadmap"
        className="relative flex min-h-screen snap-start flex-col justify-center px-6 sm:px-10 py-20 bg-slate-100/50 dark:bg-[#070708]"
      >
        <div className="mx-auto w-full max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ amount: 0.2 }}
            variants={fadeUp}
            className="mb-12 max-w-2xl"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 mb-3">
              <Milestone className="w-3.5 h-3.5" />
              <span>Project Trajectory</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              What we plan to build next
            </h2>
            <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-neutral-400">
              Upcoming milestones and feature releases planned on the GitToScale engineering roadmap.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Milestone 1 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 dark:text-neutral-500">Q1 2026</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    In Progress
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  Multi-Region Latency & Geo-DNS
                </h3>
                <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                  Simulate cross-continental packet delay, edge CDN cache hit ratios, and latency-routed failovers across AWS, GCP, and Azure zones.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-neutral-800/80">
                <div className="w-full bg-slate-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 dark:bg-indigo-500 h-full w-2/3 rounded-full" />
                </div>
              </div>
            </div>

            {/* Milestone 2 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 dark:text-neutral-500">Q2 2026</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    Planned
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  Chaos Engineering Simulator
                </h3>
                <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                  Inject artificial packet drop, partition internal service networks, trigger replica crashes, and evaluate circuit breaker trip response.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-neutral-800/80">
                <div className="w-full bg-slate-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-1/3 rounded-full" />
                </div>
              </div>
            </div>

            {/* Milestone 3 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 dark:text-neutral-500">Q3 2026</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    Upcoming
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  Terraform & Helm IaC Export
                </h3>
                <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                  Export tested scale architectures directly into production-ready Terraform HCL scripts or Kubernetes Helm charts with one click.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-neutral-800/80">
                <div className="w-full bg-slate-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-1/6 rounded-full" />
                </div>
              </div>
            </div>

            {/* Milestone 4 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 dark:text-neutral-500">Q4 2026</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700">
                    Research
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  Prometheus & APM Ingestion
                </h3>
                <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                  Ingest real production metrics from Prometheus or OpenTelemetry to calibrate synthetic simulation parameters against live user habits.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-neutral-800/80">
                <div className="w-full bg-slate-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-slate-400 dark:bg-neutral-600 h-full w-1/12 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 11: Changelog (#changelog) */}
      <section
        id="changelog"
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 mb-3">
              <Tag className="w-3.5 h-3.5" />
              <span>Release History</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Recent improvements & releases
            </h2>
            <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-neutral-400">
              Track the latest release notes, capability upgrades, and fixes implemented in GitToScale.
            </p>
          </motion.div>

          <div className="space-y-6">
            {/* Release 1 */}
            <div className="p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">v1.2.0</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    Latest Stable
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>October 2026</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-neutral-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Bi-Directional Edges:</strong> Added bi-directional communication channels with marching dash indicators for asynchronous queues.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Custom LLM Provider Config:</strong> Seamless configuration for OpenAI-compatible endpoints (Ollama/vLLM) with validation and key protection.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Universal Responsive Overhaul:</strong> Completely responsive across mobile (320px), tablet, and ultrawide screens with overlay mutual exclusion.</span>
                </li>
              </ul>
            </div>

            {/* Release 2 */}
            <div className="p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">v1.1.0</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700">
                    Stable
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>September 2026</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-neutral-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Dynamic Load Throttle:</strong> Interactive traffic rate controls up to 50,000 requests/sec with debounced real-time recalculation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Baseline Snapshot Diffing:</strong> Save architecture snapshots and run comparative analysis against current configurations.</span>
                </li>
              </ul>
            </div>

            {/* Release 3 */}
            <div className="p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">v1.0.0</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700">
                    Initial Release
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>August 2026</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-neutral-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Core Canvas & AST Pipeline:</strong> Initial public launch with GitHub repo import and real-time stress testing simulator.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Optional Children */}
      {children}

      {/* Section 12: Global Footer (#footer) */}
      <div id="footer" className="relative flex min-h-screen snap-start flex-col justify-end">
        <Fotter brandName="GitToScale" isDark={isDark} />
      </div>
    </div>
  );
};

export default LandingPage;
