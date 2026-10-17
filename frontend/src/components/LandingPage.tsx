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
    <div
      onClick={onLaunch}
      className="relative w-full aspect-video overflow-hidden cursor-pointer group"
    >
      <img
        src="/demo-preview.png"
        alt="GitToScale simulator preview"
        className="w-full h-full object-cover object-top select-none"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors duration-300 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.07, 1] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-xl"
        >
          <Play className="ml-1 h-7 w-7 fill-slate-900 text-slate-900" />
        </motion.div>
      </div>
      <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <span className="px-3 py-1 rounded-full bg-black/60 text-white text-xs font-medium tracking-wide">
          Launch interactive simulator
        </span>
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
      className="h-screen w-full snap-y snap-proximity overflow-y-scroll overflow-x-hidden scroll-smooth bg-slate-50 dark:bg-[#0A0A0A] text-slate-800 dark:text-slate-100 transition-colors"
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
                <span>Look Demo</span>
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
        className="relative flex min-h-screen snap-start items-center justify-center px-4 sm:px-6 py-16"
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
              <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
                Interactive architecture simulator and traffic bottleneck visualizer
              </p>
            </div>
            <button
              onClick={onSelectTestSite}
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Simulator</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-2xl">
            {/* macOS Chrome Bar */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-neutral-800 px-4 py-3 bg-slate-50/80 dark:bg-[#0A0A0A]/80">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-3 font-mono text-xs text-slate-500 dark:text-neutral-400">
                gittoscale://demo
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

      {/* Section 12: Global Footer (#footer) */}
      <div id="footer" className="relative w-full">
        <Fotter brandName="GitToScale" isDark={isDark} />
      </div>
    </div>
  );
};

export default LandingPage;
