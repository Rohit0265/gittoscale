import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  CircleDot,
  Cpu,
  Database,
  GitBranch,
  Layers,
  RefreshCw,
  Server,
  Sparkles,
  Zap,
} from 'lucide-react';

export interface WorkflowStepsProps {
  onSelectTestSite?: () => void;
  onSelectUseRepository?: () => void;
  onOpenRecommender?: () => void;
  isDark?: boolean;
}

interface CanvasStepData {
  id: string;
  stepNumber: string;
  tabLabel: string;
  tagline: string;
  title: string;
  description: string;
  canvasTitle: string;
  simStatus: string;
  metrics: {
    label: string;
    value: string;
    trend?: string;
  }[];
  nodes: {
    id: string;
    label: string;
    type: string;
    badge: string;
    status: 'normal' | 'warning' | 'critical' | 'injected';
    latency: string;
    load: string;
    icon: React.ElementType;
    x: number;
    y: number;
  }[];
  connections: {
    from: string;
    to: string;
    flowStatus: 'healthy' | 'stressed' | 'rerouted';
  }[];
  aiRecommendation?: {
    action: string;
    impact: string;
    observed: string;
  };
}

const WORKFLOW_STEPS: CanvasStepData[] = [
  {
    id: 'step-1',
    stepNumber: '01 / MAP',
    tabLabel: '01. Map & Ingest',
    tagline: 'Text to Architecture & Codebase Discovery',
    title: 'Design from text prompt or scan your repo.',
    description:
      'Describe any distributed system in natural language or import a GitHub repository. GitToScale parses topology, service boundaries, and data contracts into an interactive visual canvas.',
    canvasTitle: 'e-commerce-fleet-topology.gts',
    simStatus: 'Topology Synced · 12 Services Mapped',
    metrics: [
      { label: 'Services', value: '12 Active' },
      { label: 'Protocols', value: 'gRPC / HTTPS' },
      { label: 'Graph Depth', value: '4 Tiers' },
    ],
    nodes: [
      {
        id: 'client',
        label: 'Client Traffic',
        type: 'Edge Client',
        badge: 'Global Edge',
        status: 'normal',
        latency: '14ms',
        load: '15.4k rps',
        icon: CircleDot,
        x: 7,
        y: 50,
      },
      {
        id: 'gateway',
        label: 'API Gateway',
        type: 'Kong Envoy',
        badge: 'Load Balancer',
        status: 'normal',
        latency: '22ms',
        load: '15.4k rps',
        icon: GitBranch,
        x: 27,
        y: 50,
      },
      {
        id: 'orders',
        label: 'Order Service',
        type: 'Microservice',
        badge: 'Node / Go',
        status: 'normal',
        latency: '48ms',
        load: '9.2k rps',
        icon: Server,
        x: 58,
        y: 25,
      },
      {
        id: 'payments',
        label: 'Payment Service',
        type: 'Microservice',
        badge: 'Python Worker',
        status: 'normal',
        latency: '62ms',
        load: '6.2k rps',
        icon: Cpu,
        x: 58,
        y: 75,
      },
      {
        id: 'db',
        label: 'Primary Postgres',
        type: 'Relational DB',
        badge: 'Storage',
        status: 'normal',
        latency: '8ms',
        load: '42% Pool',
        icon: Database,
        x: 91,
        y: 50,
      },
    ],
    connections: [
      { from: 'client', to: 'gateway', flowStatus: 'healthy' },
      { from: 'gateway', to: 'orders', flowStatus: 'healthy' },
      { from: 'gateway', to: 'payments', flowStatus: 'healthy' },
      { from: 'orders', to: 'db', flowStatus: 'healthy' },
      { from: 'payments', to: 'db', flowStatus: 'healthy' },
    ],
  },
  {
    id: 'step-2',
    stepNumber: '02 / SIMULATE',
    tabLabel: '02. Stress Simulation',
    tagline: 'Realistic Distributed Load Testing',
    title: 'Stress-test before production does.',
    description:
      'Inject synthetic traffic spikes from 1k to 100k RPS. Trace cascading latency across every network hop and observe queue saturation, rate limits, and database pool depletion live.',
    canvasTitle: 'traffic-surge-simulation-10x.sim',
    simStatus: 'Simulation Active · 45,000 req/s Surge',
    metrics: [
      { label: 'Incoming Load', value: '45,200 RPS', trend: '+900%' },
      { label: 'p95 Latency', value: '380ms', trend: '+420%' },
      { label: 'Error Rate', value: '4.8%', trend: 'Spike' },
    ],
    nodes: [
      {
        id: 'client',
        label: 'Spike Traffic',
        type: 'Synthetic Load',
        badge: '45k RPS Surge',
        status: 'warning',
        latency: '34ms',
        load: '45.2k rps',
        icon: Zap,
        x: 7,
        y: 50,
      },
      {
        id: 'gateway',
        label: 'API Gateway',
        type: 'Kong Envoy',
        badge: 'Rate Limit 80%',
        status: 'warning',
        latency: '82ms',
        load: '45.2k rps',
        icon: GitBranch,
        x: 27,
        y: 50,
      },
      {
        id: 'orders',
        label: 'Order Service',
        type: 'Microservice',
        badge: 'CPU 91%',
        status: 'critical',
        latency: '240ms',
        load: '28.1k rps',
        icon: Server,
        x: 58,
        y: 25,
      },
      {
        id: 'payments',
        label: 'Payment Service',
        type: 'Microservice',
        badge: 'Thread Pool Starved',
        status: 'critical',
        latency: '380ms',
        load: '17.1k rps',
        icon: Cpu,
        x: 58,
        y: 75,
      },
      {
        id: 'db',
        label: 'Primary Postgres',
        type: 'Relational DB',
        badge: 'Conn Pool 96%',
        status: 'critical',
        latency: '112ms',
        load: '96% Pool',
        icon: Database,
        x: 91,
        y: 50,
      },
    ],
    connections: [
      { from: 'client', to: 'gateway', flowStatus: 'stressed' },
      { from: 'gateway', to: 'orders', flowStatus: 'stressed' },
      { from: 'gateway', to: 'payments', flowStatus: 'stressed' },
      { from: 'orders', to: 'db', flowStatus: 'stressed' },
      { from: 'payments', to: 'db', flowStatus: 'stressed' },
    ],
  },
  {
    id: 'step-3',
    stepNumber: '03 / DIAGNOSE',
    tabLabel: '03. Bottleneck Analysis',
    tagline: 'Automated Root-Cause Diagnostics',
    title: 'Find the bottleneck before the outage.',
    description:
      'GitToScale automatically audits your system topology during load, identifying single points of failure (SPOFs), unbuffered synchronous calls, and memory saturation before deployment.',
    canvasTitle: 'root-cause-diagnostics-report.log',
    simStatus: 'Audit Completed · 3 Critical Hazards Found',
    metrics: [
      { label: 'Identified Hazards', value: '3 Bottlenecks' },
      { label: 'SPOF Risk', value: 'Critical (Primary DB)' },
      { label: 'Backpressure', value: 'Unbuffered Sync' },
    ],
    nodes: [
      {
        id: 'client',
        label: 'Client Traffic',
        type: 'Edge Client',
        badge: 'Normal Flow',
        status: 'normal',
        latency: '18ms',
        load: '20.0k rps',
        icon: CircleDot,
        x: 7,
        y: 50,
      },
      {
        id: 'gateway',
        label: 'API Gateway',
        type: 'Kong Envoy',
        badge: 'Passing',
        status: 'normal',
        latency: '24ms',
        load: '20.0k rps',
        icon: GitBranch,
        x: 27,
        y: 50,
      },
      {
        id: 'orders',
        label: 'Order Service',
        type: 'Microservice',
        badge: 'SPOF Warning',
        status: 'warning',
        latency: '140ms',
        load: '12.0k rps',
        icon: Server,
        x: 58,
        y: 25,
      },
      {
        id: 'payments',
        label: 'Payment Service',
        type: 'Microservice',
        badge: 'Queue Required',
        status: 'critical',
        latency: '290ms',
        load: '8.0k rps',
        icon: Cpu,
        x: 58,
        y: 75,
      },
      {
        id: 'db',
        label: 'Primary Postgres',
        type: 'Relational DB',
        badge: 'Connection Starvation',
        status: 'critical',
        latency: '94ms',
        load: '94% Limit',
        icon: Database,
        x: 91,
        y: 50,
      },
    ],
    connections: [
      { from: 'client', to: 'gateway', flowStatus: 'healthy' },
      { from: 'gateway', to: 'orders', flowStatus: 'stressed' },
      { from: 'gateway', to: 'payments', flowStatus: 'stressed' },
      { from: 'orders', to: 'db', flowStatus: 'stressed' },
      { from: 'payments', to: 'db', flowStatus: 'stressed' },
    ],
  },
  {
    id: 'step-4',
    stepNumber: '04 / HEAL',
    tabLabel: '04. AI Auto-Healing',
    tagline: 'Autonomous Architectural Healing & Scale',
    title: 'Design with AI, scale, and auto-heal bottlenecks.',
    description:
      'With one click or conversational prompt, the AI Architect injects Kafka queue buffers, provisioned Redis cache tiers, and auto-scaled read replicas to restore 99.99% availability.',
    canvasTitle: 'ai-healed-resilient-topology.flow',
    simStatus: 'AI Remediation Applied · Zero Dropped Packets',
    metrics: [
      { label: 'Saturation', value: '94% → 14%', trend: '-85%' },
      { label: 'p95 Latency', value: '380ms → 22ms', trend: '-94%' },
      { label: 'Availability', value: '99.99%', trend: 'Restored' },
    ],
    nodes: [
      {
        id: 'client',
        label: 'Client Traffic',
        type: 'Edge Client',
        badge: 'Protected',
        status: 'normal',
        latency: '12ms',
        load: '50.0k rps',
        icon: CircleDot,
        x: 6,
        y: 50,
      },
      {
        id: 'gateway',
        label: 'API Gateway',
        type: 'Kong Envoy',
        badge: 'Healed Routing',
        status: 'normal',
        latency: '16ms',
        load: '50.0k rps',
        icon: GitBranch,
        x: 24,
        y: 50,
      },
      {
        id: 'redis',
        label: 'Redis Cache',
        type: 'In-Memory Tier',
        badge: '⚡ Injected 98% Hit',
        status: 'injected',
        latency: '4ms',
        load: '32k hits',
        icon: Layers,
        x: 50,
        y: 25,
      },
      {
        id: 'kafka',
        label: 'Kafka Queue Buffer',
        type: 'Event Broker',
        badge: '⚡ Decoupled Buffer',
        status: 'injected',
        latency: '8ms',
        load: '18k msgs',
        icon: Boxes,
        x: 50,
        y: 75,
      },
      {
        id: 'workers',
        label: 'Scaled Worker Fleet',
        type: 'Consumer Pool',
        badge: '⚡ Auto-Scaled 4x',
        status: 'injected',
        latency: '18ms',
        load: '18k rps',
        icon: Cpu,
        x: 72,
        y: 75,
      },
      {
        id: 'db',
        label: 'Postgres + Replicas',
        type: 'HA Cluster',
        badge: '1 Primary / 2 Read',
        status: 'normal',
        latency: '9ms',
        load: '14% Healthy',
        icon: Database,
        x: 92,
        y: 50,
      },
    ],
    connections: [
      { from: 'client', to: 'gateway', flowStatus: 'healthy' },
      { from: 'gateway', to: 'redis', flowStatus: 'rerouted' },
      { from: 'gateway', to: 'kafka', flowStatus: 'rerouted' },
      { from: 'kafka', to: 'workers', flowStatus: 'rerouted' },
      { from: 'redis', to: 'db', flowStatus: 'healthy' },
      { from: 'workers', to: 'db', flowStatus: 'healthy' },
    ],
    aiRecommendation: {
      action: 'Injected Kafka queue buffer, Redis read cache, and 2x Postgres Read Replicas',
      impact: 'p95 latency reduced from 380ms to 22ms. Database pool load dropped from 94% to 14%.',
      observed: 'Zero dropped requests at 50,000 RPS peak load.',
    },
  },
];

export const WorkflowSteps: React.FC<WorkflowStepsProps> = ({
  onSelectTestSite,
  onSelectUseRepository: _onSelectUseRepository,
  onOpenRecommender: _onOpenRecommender,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const currentStep = WORKFLOW_STEPS[activeStepIndex];

  const handleTriggerSim = () => {
    setIsSimulating(true);
    if (onSelectTestSite) {
      setTimeout(() => {
        onSelectTestSite();
      }, 700);
    } else {
      setTimeout(() => {
        setIsSimulating(false);
      }, 1800);
    }
  };

  // Helper to compute smooth horizontal tree S-curve paths between nodes
  const getPathCoordinates = (
    fromNode: (typeof currentStep.nodes)[0],
    toNode: (typeof currentStep.nodes)[0]
  ) => {
    const x1 = fromNode.x * 10;
    const y1 = fromNode.y * 5;
    const x2 = toNode.x * 10;
    const y2 = toNode.y * 5;

    // Card half-width in 1000x500 coordinates
    const cardHalfWidth = 76;
    const startX = x1 + cardHalfWidth;
    const startY = y1;
    const endX = x2 - cardHalfWidth;
    const endY = y2;

    const dx = Math.max(30, (endX - startX) * 0.5);
    return {
      startX,
      startY,
      endX,
      endY,
      d: `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`,
    };
  };

  return (
    <section
      id="steps-section"
      className="relative overflow-hidden bg-black px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-12 select-none font-sans"
    >
      <div className="relative mx-auto max-w-7xl">
        {/* Top Header Section */}
        <div className="mb-10 sm:mb-14 text-center max-w-3xl mx-auto flex flex-col items-center">

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-[-0.04em] text-white leading-[1.08]">
            Design, simulate, and scale with visual control.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-400 max-w-2xl leading-relaxed">
            A unified visual canvas for drafting distributed architectures from natural language or code,
            stress-testing microservices under synthetic load, and healing bottlenecks with AI.
          </p>
        </div>

        {/* Voiceflow-Style Navigation Tab Switcher */}
        <div className="mb-6 flex items-center justify-center">
          <div className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#0f0f13] border border-neutral-800 shadow-xl max-w-full overflow-x-auto">
            {WORKFLOW_STEPS.map((step, idx) => {
              const isActive = activeStepIndex === idx;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    setActiveStepIndex(idx);
                    setSelectedNodeId(null);
                  }}
                  className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-mono text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-neutral-800 text-white shadow-md border border-neutral-700/80'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-neutral-600'
                    }`}
                  />
                  <span>{step.tabLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Voiceflow-Style Main Workflow Builder Canvas Showcase */}
        <div className="relative rounded-2xl border border-neutral-800 bg-[#0c0c10] shadow-2xl overflow-hidden mb-12 sm:mb-16">
          {/* Canvas Window Chrome / Toolbar Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-[#111116] text-xs font-mono select-none">
            {/* Left: macOS Window Controls & Breadcrumbs */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-3 h-3 rounded-full bg-[#ff5f56]/80 border border-[#e0443e]" />
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e]/80 border border-[#dea123]" />
                <span className="w-3 h-3 rounded-full bg-[#27c93f]/80 border border-[#1aab29]" />
              </div>
              <div className="h-4 w-[1px] bg-neutral-800 mx-1 hidden sm:block" />
              <div className="flex items-center gap-2 text-neutral-400 truncate">
                <span className="text-neutral-500">gitoscale /</span>
                <span className="text-neutral-200 font-semibold truncate">{currentStep.canvasTitle}</span>
              </div>
            </div>

            {/* Right: Live Status Indicator & Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {currentStep.simStatus}
              </span>

              <button
                type="button"
                onClick={handleTriggerSim}
                disabled={isSimulating}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white hover:bg-neutral-200 text-black text-xs font-semibold font-mono transition-all shadow-sm cursor-pointer disabled:opacity-50"
                title="Run synthetic simulation on this canvas"
              >
                <RefreshCw className={`w-3 h-3 ${isSimulating ? 'animate-spin' : ''}`} />
                <span>{isSimulating ? 'Simulating...' : 'Simulate Load'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Canvas Area - Solid Black & Dark Grey Horizontal Tree */}
          <div className="relative bg-[#07070a] p-4 sm:p-6 flex flex-col justify-between" style={{ minHeight: '580px' }}>
            {/* Floating Telemetry Metric Ribbon */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {currentStep.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-800 bg-[#121217]/90 backdrop-blur-md text-xs font-mono shadow-sm"
                  >
                    <span className="text-neutral-500">{metric.label}:</span>
                    <span className="font-semibold text-white">{metric.value}</span>
                    {metric.trend && (
                      <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
                        {metric.trend}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Step indicator tag */}
              <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-neutral-800 bg-[#121217]/80 text-xs font-mono text-neutral-400">
                <span className="font-bold text-neutral-200">{currentStep.stepNumber}</span>
                <span>·</span>
                <span>{currentStep.tagline}</span>
              </div>
            </div>

            {/* Horizontal Hierarchy Flow Stages Ribbon */}
            <div className="relative z-10 hidden md:flex items-center justify-between text-[10px] font-mono text-neutral-500 uppercase tracking-widest px-6 pb-2 border-b border-neutral-800/50 mb-2 select-none">
              <div className="flex items-center gap-2 text-neutral-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>01 · Ingress (Left)</span>
              </div>
              <ArrowRight className="w-3 h-3 text-neutral-600" />
              <div className="text-neutral-400">02 · Routing &amp; Load Balancing</div>
              <ArrowRight className="w-3 h-3 text-neutral-600" />
              <div className="text-neutral-400">03 · Services, Caches &amp; Buffers</div>
              <ArrowRight className="w-3 h-3 text-neutral-600" />
              <div className="flex items-center gap-2 text-neutral-300">
                <span>04 · Persistent Store (Right)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
            </div>

            {/* Horizontal Tree Canvas: sending traffic from left to right */}
            <div className="relative z-10 w-full overflow-x-auto py-2" style={{ minHeight: '480px' }}>
              <div
                className="relative w-full min-w-[850px] max-w-5xl mx-auto select-none"
                style={{ height: '480px', minHeight: '480px' }}
              >
                {/* SVG Tree Connector Lines & Animated Left-to-Right Traffic Packets */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 1000 500"
                  preserveAspectRatio="none"
                >
                  {currentStep.connections.map((conn, idx) => {
                    const fromNode = currentStep.nodes.find((n) => n.id === conn.from);
                    const toNode = currentStep.nodes.find((n) => n.id === conn.to);
                    if (!fromNode || !toNode) return null;

                    const { d, endX, endY } = getPathCoordinates(fromNode, toNode);

                    const isStressed = conn.flowStatus === 'stressed';
                    const isHealed = conn.flowStatus === 'rerouted';

                    const speed = isSimulating ? '0.6s' : isStressed ? '0.8s' : isHealed ? '1.4s' : '1.8s';
                    const delay2 = isSimulating ? '0.3s' : isStressed ? '0.4s' : isHealed ? '0.7s' : '0.9s';

                    const baseStroke = isStressed
                      ? 'rgba(244, 63, 94, 0.3)'
                      : isHealed
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(255, 255, 255, 0.15)';

                    const dashStroke = isStressed
                      ? '#f43f5e'
                      : isHealed
                      ? '#10b981'
                      : '#38bdf8';

                    const particleColor = isStressed
                      ? '#fb7185'
                      : isHealed
                      ? '#34d399'
                      : '#7dd3fc';

                    const pathId = `flow-${conn.from}-${conn.to}-${idx}`;

                    return (
                      <g key={pathId}>
                        {/* Base conduit pipe line */}
                        <path
                          d={d}
                          fill="none"
                          stroke={baseStroke}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />

                        {/* Animated Dash flow moving Left to Right */}
                        <path
                          d={d}
                          fill="none"
                          stroke={dashStroke}
                          strokeWidth="2"
                          strokeDasharray="6 8"
                          strokeOpacity={isStressed ? 0.95 : 0.8}
                          strokeLinecap="round"
                        >
                          <animate
                            attributeName="stroke-dashoffset"
                            from="28"
                            to="0"
                            dur={speed}
                            repeatCount="indefinite"
                          />
                        </path>

                        {/* Direct Arrowhead at destination port (no url markers to avoid CSS errors) */}
                        <polygon
                          points={`${endX - 7},${endY - 4} ${endX},${endY} ${endX - 7},${endY + 4}`}
                          fill={dashStroke}
                        />

                        {/* Primary Traffic Packet moving along the curve from left to right */}
                        <circle r={isStressed ? 4.5 : 4} fill={particleColor}>
                          <animateMotion
                            path={d}
                            dur={speed}
                            begin="0s"
                            repeatCount="indefinite"
                          />
                        </circle>

                        {/* Secondary Traffic Packet trailing behind */}
                        <circle r={isStressed ? 3.5 : 3} fill={particleColor} opacity="0.75">
                          <animateMotion
                            path={d}
                            dur={speed}
                            begin={delay2}
                            repeatCount="indefinite"
                          />
                        </circle>
                      </g>
                    );
                  })}
                </svg>

                {/* Horizontal Tree Node Cards */}
                {currentStep.nodes.map((node) => {
                  const NodeIcon = node.icon;
                  const isSelected = selectedNodeId === node.id;

                  const hasIncoming = currentStep.connections.some((c) => c.to === node.id);
                  const hasOutgoing = currentStep.connections.some((c) => c.from === node.id);

                  const statusStyles = {
                    normal:
                      'border-neutral-800 bg-[#121218]/95 text-neutral-200 hover:border-neutral-600 shadow-md',
                    warning:
                      'border-amber-700/60 bg-[#16120e]/95 text-amber-200 hover:border-amber-500/80 ring-1 ring-amber-500/30 shadow-lg shadow-amber-950/20',
                    critical:
                      'border-rose-700/70 bg-[#180e12]/95 text-rose-200 hover:border-rose-500/90 ring-1 ring-rose-500/40 shadow-lg shadow-rose-950/25',
                    injected:
                      'border-emerald-600/70 bg-[#0c1612]/95 text-emerald-200 hover:border-emerald-400 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-950/30',
                  }[node.status];

                  const badgeStyles = {
                    normal: 'text-neutral-400 bg-neutral-900 border-neutral-800',
                    warning: 'text-amber-300 bg-amber-950/80 border-amber-800/60',
                    critical: 'text-rose-300 bg-rose-950/80 border-rose-800/60',
                    injected: 'text-emerald-300 bg-emerald-950/80 border-emerald-700/60 font-bold',
                  }[node.status];

                  return (
                    <div
                      key={node.id}
                      style={{
                        position: 'absolute',
                        left: `${node.x}%`,
                        top: `${node.y}%`,
                      }}
                      className="-translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto"
                    >
                      <div
                        onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                        className={`w-[145px] sm:w-[155px] p-3 rounded-2xl border backdrop-blur-md cursor-pointer transition-transform duration-150 hover:scale-[1.03] select-none ${statusStyles} ${
                          isSelected ? 'ring-2 ring-white border-white' : ''
                        }`}
                      >
                        {/* Input Port (Left Anchor) */}
                        {hasIncoming && (
                          <span
                            aria-hidden="true"
                            className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 z-30 ${
                              node.status === 'injected'
                                ? 'bg-emerald-500 border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                                : node.status === 'warning'
                                ? 'bg-amber-500 border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                                : node.status === 'critical'
                                ? 'bg-rose-500 border-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                                : 'bg-neutral-800 border-neutral-500'
                            }`}
                          />
                        )}

                        {/* Output Port (Right Anchor) */}
                        {hasOutgoing && (
                          <span
                            aria-hidden="true"
                            className={`absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 z-30 ${
                              node.status === 'injected'
                                ? 'bg-emerald-500 border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                                : node.status === 'warning'
                                ? 'bg-amber-500 border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                                : node.status === 'critical'
                                ? 'bg-rose-500 border-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                                : 'bg-neutral-800 border-neutral-500'
                            }`}
                          />
                        )}

                        {/* Node Header: Icon & Badge */}
                        <div className="flex items-center justify-between gap-1.5 mb-2.5">
                          <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                            <NodeIcon className="w-3.5 h-3.5 text-neutral-300" />
                          </div>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border truncate max-w-[95px] ${badgeStyles}`}
                            title={node.badge}
                          >
                            {node.badge}
                          </span>
                        </div>

                        {/* Node Titles */}
                        <div className="mb-2">
                          <h4 className="text-xs font-bold text-white tracking-tight truncate" title={node.label}>
                            {node.label}
                          </h4>
                          <span className="text-[10px] font-mono text-neutral-400 truncate block">
                            {node.type}
                          </span>
                        </div>

                        {/* Node Telemetry Footer */}
                        <div className="pt-1.5 border-t border-neutral-800/80 flex items-center justify-between text-[9.5px] font-mono text-neutral-400">
                          <span>{node.latency}</span>
                          <span className="font-semibold text-neutral-200">{node.load}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom AI Recommendation / Execution Bar */}
            {currentStep.aiRecommendation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 mt-4 p-3.5 sm:p-4 rounded-xl border border-emerald-800/60 bg-[#0d1612]/90 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono shadow-xl"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">
                      AI Architect Remediation
                    </span>
                    <p className="text-neutral-200 mt-0.5 leading-relaxed font-sans text-xs">
                      {currentStep.aiRecommendation.action}
                    </p>
                    <span className="text-[11px] text-neutral-400 block mt-0.5">
                      {currentStep.aiRecommendation.impact}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 self-end md:self-center">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-bold text-[11px]">
                    {currentStep.aiRecommendation.observed}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* 4 Feature Value Pillars below Canvas (Voiceflow Bento style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {WORKFLOW_STEPS.map((step, idx) => {
            const isCurrent = activeStepIndex === idx;
            return (
              <div
                key={step.id}
                id={step.id}
                onClick={() => {
                  setActiveStepIndex(idx);
                  setSelectedNodeId(null);
                }}
                className={`group p-5 sm:p-6 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                  isCurrent
                    ? 'border-neutral-600 bg-[#121217] shadow-xl'
                    : 'border-neutral-800/80 bg-[#0c0c10] hover:border-neutral-700 hover:bg-[#101014]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-500 group-hover:text-neutral-400 transition-colors">
                      {step.stepNumber}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full transition-all ${
                        isCurrent ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-neutral-700'
                      }`}
                    />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-neutral-800/70 flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-500 group-hover:text-neutral-300 transition-colors">
                    Explore view
                  </span>
                  <ArrowRight
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isCurrent
                        ? 'translate-x-1 text-white'
                        : 'text-neutral-500 group-hover:translate-x-1 group-hover:text-neutral-300'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WorkflowSteps;
