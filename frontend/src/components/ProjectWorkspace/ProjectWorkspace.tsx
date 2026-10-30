import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Layers,
  Network,
  Play,
  Download,
  Sun,
  Moon,
  AlertCircle,
} from 'lucide-react';
import { ContextualQuerySidebar } from './ContextualQuerySidebar';
import { SkeletonCanvas } from './SkeletonCanvas';
import { ArchitectureCanvas } from '../Canvas/ArchitectureCanvas';
import { api } from '../../services/api';
import { executeArchitectureCommand } from '../../services/aiAgentExecutor';
import {
  ArchitectureNode,
  ArchitectureEdge,
  ArchitectureRecommendation,
  RecommenderInput,
} from '../../types';

export interface ProjectWorkspaceProps {
  projectId: string;
  initialPrompt?: string;
  onGoHome: () => void;
  onSimulate: (nodes: ArchitectureNode[], edges: ArchitectureEdge[]) => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Vertical Tree Auto-Layout
// Takes a flat list of nodes + directed edges and computes top-to-bottom
// BFS-level positions so the canvas renders as a proper tree (root → leaves).
// NODE_W / NODE_H approximate the ReactFlow custom node size.
// ─────────────────────────────────────────────────────────────────────────────
const NODE_W = 220;
const NODE_H = 80;
const H_GAP  = 40;  // horizontal gap between sibling nodes
const V_GAP  = 80;  // vertical gap between levels

function toVerticalTree(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): ArchitectureNode[] {
  if (nodes.length === 0) return nodes;

  // Build adjacency maps
  const children = new Map<string, string[]>();
  const parentCount = new Map<string, number>();
  nodes.forEach((n) => { children.set(n.id, []); parentCount.set(n.id, 0); });
  edges.forEach((e) => {
    if (children.has(e.source) && parentCount.has(e.target)) {
      children.get(e.source)!.push(e.target);
      parentCount.set(e.target, (parentCount.get(e.target) ?? 0) + 1);
    }
  });

  // Find roots (nodes with no incoming edges)
  let roots = nodes.filter((n) => (parentCount.get(n.id) ?? 0) === 0).map((n) => n.id);
  // Fallback: if no roots (cycle), pick first node
  if (roots.length === 0) roots = [nodes[0].id];

  // BFS to assign levels
  const levelOf = new Map<string, number>();
  const queue: string[] = [...roots];
  roots.forEach((r) => levelOf.set(r, 0));
  const visited = new Set<string>(roots);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const lvl = levelOf.get(curr) ?? 0;
    for (const child of (children.get(curr) ?? [])) {
      // Take the maximum level (longest path from any root)
      const existing = levelOf.get(child) ?? -1;
      if (lvl + 1 > existing) levelOf.set(child, lvl + 1);
      if (!visited.has(child)) {
        visited.add(child);
        queue.push(child);
      }
    }
  }

  // Group nodes by level
  const maxLevel = Math.max(...Array.from(levelOf.values()));
  const byLevel: string[][] = Array.from({ length: maxLevel + 1 }, () => []);
  // Nodes not visited (disconnected) go to last level
  nodes.forEach((n) => {
    const lvl = levelOf.get(n.id) ?? maxLevel;
    byLevel[lvl].push(n.id);
  });

  // Assign x,y positions centred around x=0
  const posMap = new Map<string, { x: number; y: number }>();
  byLevel.forEach((levelNodes, lvl) => {
    const totalW = levelNodes.length * NODE_W + (levelNodes.length - 1) * H_GAP;
    const startX = -totalW / 2;
    levelNodes.forEach((id, i) => {
      posMap.set(id, {
        x: startX + i * (NODE_W + H_GAP),
        y: lvl * (NODE_H + V_GAP),
      });
    });
  });

  return nodes.map((n) => ({
    ...n,
    position: posMap.get(n.id) ?? n.position,
  }));
}

/**
 * Builds a decomposed, production-grade Detailed Architecture Graph
 * from high-level basic nodes, expanding gateways into rate limiters,
 * clusters into worker pools, queues into message brokers, and DBs into connection poolers & replicas.
 */
function buildDetailedArchitecture(
  _basicNodes: ArchitectureNode[],
  _basicEdges: ArchitectureEdge[],
  prompt: string
): { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } {
  const isEventDriven =
    prompt.toLowerCase().includes('stream') ||
    prompt.toLowerCase().includes('kafka') ||
    prompt.toLowerCase().includes('burst') ||
    prompt.toLowerCase().includes('event');

  const detailedNodes: ArchitectureNode[] = [
    // 1. Ingress & Edge
    {
      id: 'dt-client',
      name: 'Client Ingress (Web / Mobile)',
      type: 'load_generator',
      position: { x: 40, y: 220 },
      capacityPerSecond: 10000,
      workerCount: 1,
      enabled: true,
      config: {
        baselineLatencyMs: 0,
        maxQueueSize: 10000,
        overflowPolicy: 'reject',
        isSource: true,
        defaultTrafficRate: 2000,
      },
    },
    {
      id: 'dt-cdn',
      name: 'Cloudflare Edge CDN / WAF',
      type: 'gateway',
      position: { x: 240, y: 220 },
      capacityPerSecond: 8000,
      workerCount: 4,
      enabled: true,
      config: {
        baselineLatencyMs: 3,
        maxQueueSize: 8000,
        overflowPolicy: 'reject',
      },
    },

    // 2. Gateway Tier
    {
      id: 'dt-gateway',
      name: 'Kong / Nginx Reverse Proxy',
      type: 'gateway',
      position: { x: 460, y: 150 },
      capacityPerSecond: 6000,
      workerCount: 3,
      enabled: true,
      config: {
        baselineLatencyMs: 5,
        maxQueueSize: 6000,
        overflowPolicy: 'reject',
      },
    },
    {
      id: 'dt-auth-filter',
      name: 'OAuth2 / JWT Token Validator',
      type: 'service',
      position: { x: 460, y: 290 },
      capacityPerSecond: 4500,
      workerCount: 2,
      enabled: true,
      config: {
        baselineLatencyMs: 8,
        maxQueueSize: 4000,
        overflowPolicy: 'reject',
      },
    },

    // 3. App Core Cluster & Worker Fleet
    {
      id: 'dt-app-cluster',
      name: 'Core Application Service (Cluster)',
      type: 'service',
      position: { x: 690, y: 130 },
      capacityPerSecond: 3500,
      workerCount: 4,
      enabled: true,
      config: {
        baselineLatencyMs: 15,
        maxQueueSize: 5000,
        overflowPolicy: 'reject',
      },
    },
    {
      id: 'dt-queue',
      name: isEventDriven ? 'Apache Kafka Event Broker' : 'RabbitMQ Task Queue',
      type: 'service',
      submoduleType: 'queue',
      position: { x: 690, y: 310 },
      capacityPerSecond: 5000,
      workerCount: 2,
      enabled: true,
      config: {
        baselineLatencyMs: 6,
        maxQueueSize: 10000,
        overflowPolicy: 'reject',
      },
    },
    {
      id: 'dt-async-worker',
      name: 'Background Async Worker Fleet',
      type: 'service',
      position: { x: 890, y: 310 },
      capacityPerSecond: 2500,
      workerCount: 3,
      enabled: true,
      config: {
        baselineLatencyMs: 25,
        maxQueueSize: 4000,
        overflowPolicy: 'reject',
      },
    },

    // 4. Cache Tier
    {
      id: 'dt-redis-primary',
      name: 'Redis 7 Master (Write Cache)',
      type: 'cache',
      position: { x: 920, y: 70 },
      capacityPerSecond: 9000,
      workerCount: 2,
      enabled: true,
      config: {
        baselineLatencyMs: 2,
        maxQueueSize: 9000,
        overflowPolicy: 'reject',
      },
    },
    {
      id: 'dt-redis-replica',
      name: 'Redis 7 Read Replica (Read-Through)',
      type: 'cache',
      position: { x: 1120, y: 70 },
      capacityPerSecond: 12000,
      workerCount: 3,
      enabled: true,
      config: {
        baselineLatencyMs: 1,
        maxQueueSize: 12000,
        overflowPolicy: 'reject',
      },
    },

    // 5. Database Tier with Connection Pooling & Read Replicas
    {
      id: 'dt-pgbouncer',
      name: 'PgBouncer Connection Pooler',
      type: 'gateway',
      position: { x: 920, y: 190 },
      capacityPerSecond: 4000,
      workerCount: 2,
      enabled: true,
      config: {
        baselineLatencyMs: 3,
        maxQueueSize: 4000,
        overflowPolicy: 'reject',
      },
    },
    {
      id: 'dt-db-primary',
      name: 'PostgreSQL 16 Primary (Read/Write)',
      type: 'database',
      position: { x: 1130, y: 190 },
      capacityPerSecond: 2500,
      workerCount: 2,
      enabled: true,
      config: {
        baselineLatencyMs: 18,
        maxQueueSize: 3000,
        overflowPolicy: 'reject',
      },
    },
    {
      id: 'dt-db-replica',
      name: 'PostgreSQL 16 Read Replica (Read-Only)',
      type: 'database',
      position: { x: 1130, y: 310 },
      capacityPerSecond: 3500,
      workerCount: 2,
      enabled: true,
      config: {
        baselineLatencyMs: 12,
        maxQueueSize: 3500,
        overflowPolicy: 'reject',
      },
    },
  ];

  const detailedEdges: ArchitectureEdge[] = [
    {
      id: 'e-dt-client-cdn',
      source: 'dt-client',
      target: 'dt-cdn',
      requestsPerInput: 1.0,
      enabled: true,
    },
    {
      id: 'e-dt-cdn-gw',
      source: 'dt-cdn',
      target: 'dt-gateway',
      requestsPerInput: 0.95,
      enabled: true,
    },
    {
      id: 'e-dt-gw-auth',
      source: 'dt-gateway',
      target: 'dt-auth-filter',
      requestsPerInput: 0.8,
      enabled: true,
    },
    {
      id: 'e-dt-auth-app',
      source: 'dt-auth-filter',
      target: 'dt-app-cluster',
      requestsPerInput: 0.9,
      enabled: true,
    },
    {
      id: 'e-dt-gw-app',
      source: 'dt-gateway',
      target: 'dt-app-cluster',
      requestsPerInput: 0.2,
      enabled: true,
    },
    {
      id: 'e-dt-app-cache-r',
      source: 'dt-app-cluster',
      target: 'dt-redis-replica',
      requestsPerInput: 0.65,
      enabled: true,
    },
    {
      id: 'e-dt-app-cache-w',
      source: 'dt-app-cluster',
      target: 'dt-redis-primary',
      requestsPerInput: 0.2,
      enabled: true,
    },
    {
      id: 'e-dt-redis-sync',
      source: 'dt-redis-primary',
      target: 'dt-redis-replica',
      requestsPerInput: 0.2,
      enabled: true,
    },
    {
      id: 'e-dt-app-queue',
      source: 'dt-app-cluster',
      target: 'dt-queue',
      requestsPerInput: 0.35,
      enabled: true,
    },
    {
      id: 'e-dt-queue-worker',
      source: 'dt-queue',
      target: 'dt-async-worker',
      requestsPerInput: 1.0,
      enabled: true,
    },
    {
      id: 'e-dt-app-pgbouncer',
      source: 'dt-app-cluster',
      target: 'dt-pgbouncer',
      requestsPerInput: 0.5,
      enabled: true,
    },
    {
      id: 'e-dt-worker-pgbouncer',
      source: 'dt-async-worker',
      target: 'dt-pgbouncer',
      requestsPerInput: 0.4,
      enabled: true,
    },
    {
      id: 'e-dt-pgb-db-pri',
      source: 'dt-pgbouncer',
      target: 'dt-db-primary',
      requestsPerInput: 0.4,
      enabled: true,
    },
    {
      id: 'e-dt-pgb-db-rep',
      source: 'dt-pgbouncer',
      target: 'dt-db-replica',
      requestsPerInput: 0.6,
      enabled: true,
    },
    {
      id: 'e-dt-db-replication',
      source: 'dt-db-primary',
      target: 'dt-db-replica',
      requestsPerInput: 0.4,
      enabled: true,
    },
  ];

  return { nodes: detailedNodes, edges: detailedEdges };
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  projectId,
  initialPrompt,
  onGoHome,
  onSimulate,
  isDark = true,
  onToggleTheme,
}) => {
  const [prompt, setPrompt] = useState<string>(() => {
    if (initialPrompt) return initialPrompt;
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search);
      const urlPrompt = search.get('prompt');
      if (urlPrompt) return urlPrompt;
      const cached = localStorage.getItem(`gitoscale_project_${projectId}`);
      if (cached) return cached;
    }
    return 'Scalable distributed e-commerce application with high-throughput flash-sale checkout';
  });

  // Selected mandatory parameters (driven by ChatGPT-like sidebar)
  const [selectedAnswers, setSelectedAnswers] = useState<{
    scale?: string;
    budget?: string;
    consistency?: string;
    region?: string;
  }>({
    scale: 'scale_growth',
    budget: 'budget_balanced',
    consistency: 'consistency_acid',
    region: 'deploy_single',
  });

  // View state: 'skeleton' (loading state) | 'hydrated' (concrete diagram)
  const [viewState, setViewState] = useState<'skeleton' | 'hydrated'>('skeleton');

  // View mode: 'basic' | 'detailed'
  const [viewMode, setViewMode] = useState<'basic' | 'detailed'>('basic');

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<ArchitectureRecommendation | null>(null);

  // Cached Graphs
  const [basicGraph, setBasicGraph] = useState<{
    nodes: ArchitectureNode[];
    edges: ArchitectureEdge[];
  }>({ nodes: [], edges: [] });

  const [detailedGraph, setDetailedGraph] = useState<{
    nodes: ArchitectureNode[];
    edges: ArchitectureEdge[];
  }>({ nodes: [], edges: [] });

  // Canvas selection & interactive state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Active nodes & edges on canvas based on viewMode
  const activeNodes = useMemo(() => {
    return viewMode === 'detailed' ? detailedGraph.nodes : basicGraph.nodes;
  }, [viewMode, detailedGraph.nodes, basicGraph.nodes]);

  const activeEdges = useMemo(() => {
    return viewMode === 'detailed' ? detailedGraph.edges : basicGraph.edges;
  }, [viewMode, detailedGraph.edges, basicGraph.edges]);

  // Save prompt cache
  useEffect(() => {
    if (prompt && typeof window !== 'undefined') {
      localStorage.setItem(`gitoscale_project_${projectId}`, prompt);
    }
  }, [projectId, prompt]);

  // Generate / Hydrate architecture from prompt and answered parameters
  const handleHydrateArchitecture = useCallback(
    async (customRefinement?: string) => {
      setIsGenerating(true);
      setError(null);

      const scaleMap: Record<string, string> = {
        scale_mvp: '< 1,000 req/s MVP',
        scale_growth: '10,000 req/s Growth Tier with Read Replicas',
        scale_burst: '50,000+ req/s Flash Sale Burst with Kafka stream',
      };

      const budgetMap: Record<string, string> = {
        budget_frugal: 'Serverless low cost (<$100/mo)',
        budget_balanced: 'Balanced cloud ECS/RDS ($500-$2000/mo)',
        budget_enterprise: 'Dedicated enterprise multi-region ($5000+/mo)',
      };

      const payload: RecommenderInput = {
        projectDescription: prompt,
        expectedScale: scaleMap[selectedAnswers.scale || 'scale_growth'],
        budgetConstraint: budgetMap[selectedAnswers.budget || 'budget_balanced'],
        preferredTech: [
          selectedAnswers.consistency === 'consistency_eventual' ? 'Apache Kafka' : 'Redis Cache',
          selectedAnswers.region === 'deploy_multiregion' ? 'Global Multi-Region' : 'Multi-AZ RDS',
        ],
        deploymentPreference:
          selectedAnswers.region === 'deploy_multiregion'
            ? 'Multi-Region Active/Active'
            : 'AWS Cloud',
        refinementRequest: customRefinement,
      };

      try {
        const res = await api.recommendArchitecture(payload);
        setRecommendation(res);

        // Store Basic Graph organized as a top-to-bottom vertical tree
        const verticalBasicNodes = toVerticalTree(res.nodes, res.edges);
        setBasicGraph({
          nodes: verticalBasicNodes,
          edges: res.edges,
        });

        // Generate Decomposed Detailed Graph organized as a top-to-bottom vertical tree
        const detailed = buildDetailedArchitecture(res.nodes, res.edges, prompt);
        const verticalDetailedNodes = toVerticalTree(detailed.nodes, detailed.edges);
        setDetailedGraph({
          nodes: verticalDetailedNodes,
          edges: detailed.edges,
        });

        setViewState('hydrated');
      } catch (err: any) {
        console.error('Error hydrating architecture:', err);
        setError(
          err?.response?.data?.message || err?.message || 'Failed to synthesize architecture.'
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [prompt, selectedAnswers]
  );

  // Handle answering question in ChatGPT-like left sidebar
  const handleAnswerSelected = (
    category: 'scale' | 'budget' | 'consistency' | 'region',
    optionId: string
  ) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [category]: optionId,
    }));
  };

  const handleResetQuestions = () => {
    setSelectedAnswers({});
    setViewState('skeleton');
    setBasicGraph({ nodes: [], edges: [] });
    setDetailedGraph({ nodes: [], edges: [] });
  };

  const handleCustomChatMessage = (message: string) => {
    setPrompt((prev) => `${prev} • ${message}`);
    handleHydrateArchitecture(message);
  };

  const handleExecuteWorkspaceChatCommand = async (
    command: string,
    chatHistory: any[]
  ): Promise<{ reply: string; actionDone?: string; updatedAnswers?: any } | void> => {
    const execResult = executeArchitectureCommand(
      command,
      activeNodes,
      activeEdges,
      1000,
      null,
      chatHistory
    );

    if (execResult.executed) {
      if (execResult.updatedNodes && execResult.updatedEdges) {
        if (viewMode === 'detailed') {
          setDetailedGraph({ nodes: execResult.updatedNodes, edges: execResult.updatedEdges });
        } else {
          setBasicGraph({ nodes: execResult.updatedNodes, edges: execResult.updatedEdges });
        }
      }
      return {
        reply: execResult.explanation,
        actionDone: execResult.actionType,
      };
    }

    handleCustomChatMessage(command);
    return {
      reply: `🔄 Updated blueprint with: "${command}". Re-synthesising system topology...`,
    };
  };

  const handleExportJSON = () => {
    const exportData = {
      projectId,
      prompt,
      viewMode,
      selectedAnswers,
      recommendation,
      activeGraph: { nodes: activeNodes, edges: activeEdges },
      basicGraph,
      detailedGraph,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `project-${projectId}-${viewMode}-architecture.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const projectName = recommendation?.projectName || 'Production Cloud Architecture';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#07080B] text-slate-900 dark:text-white font-sans">
      {/* 1. Dedicated Workspace Header Bar */}
      <header className="h-14 border-b border-slate-200 dark:border-neutral-800 bg-white/95 dark:bg-[#090A0E]/95 backdrop-blur px-3 sm:px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white text-xs font-medium transition-colors cursor-pointer shrink-0"
            title="Return to Landing Page"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <img
              src={isDark ? '/logo.png' : '/logo-light.png'}
              alt="GitToScale"
              className="h-6 sm:h-7 w-auto object-contain hidden xs:block"
            />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-neutral-800 hidden sm:block shrink-0" />

          {/* Project Title & Route Breadcrumb */}
          <div className="flex items-center gap-2 truncate">
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              {projectName}
            </h1>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 dark:bg-neutral-800/80 text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700/80 shrink-0">
              app.gittoscale.tech/project/{projectId}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Basic View vs Detailed View Toggle */}
          <div className="hidden sm:flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-900 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('basic')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'basic'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
              title="High-level architecture overview"
            >
              <Layers className="w-3 h-3" />
              <span>Basic View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('detailed')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'detailed'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
              title="Decomposed architecture: controllers, pools, worker queues & replicas"
            >
              <Network className="w-3 h-3" />
              <span>Detailed View</span>
            </button>
          </div>

          {/* Simulate Load Button */}
          <button
            type="button"
            onClick={() => {
              if (activeNodes.length > 0) {
                onSimulate(activeNodes, activeEdges);
              } else {
                handleHydrateArchitecture().then(() => {
                  if (activeNodes.length > 0) onSimulate(activeNodes, activeEdges);
                });
              }
            }}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
            title="Simulate live request flow & bottlenecks"
          >
            <Play className="w-3 h-3 fill-current" />
            <span className="hidden sm:inline">Simulate Load</span>
          </button>

          {/* Export JSON */}
          <button
            type="button"
            onClick={handleExportJSON}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer hidden md:flex"
            title="Export architecture as JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Workspace Split View */}
      <div className="flex-1 flex w-full overflow-hidden">
        {/* Left Sidebar: ChatGPT-style Conversational Assistant */}
        <ContextualQuerySidebar
          activePrompt={prompt}
          selectedAnswers={selectedAnswers}
          onAnswerSelected={handleAnswerSelected}
          onApplyRefinements={handleHydrateArchitecture}
          onResetQuestions={handleResetQuestions}
          onSendCustomMessage={handleCustomChatMessage}
          onExecuteChatCommand={handleExecuteWorkspaceChatCommand}
          isGenerating={isGenerating}
          isHydrated={viewState === 'hydrated'}
          isDark={isDark}
        />

        {/* Center Canvas Area: Progressive Architecture Visualization */}
        <main className="flex-1 h-full relative overflow-hidden flex flex-col">
          {error && (
            <div className="m-3 p-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => handleHydrateArchitecture()}
                className="font-semibold underline ml-2 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          <div className="flex-1 w-full h-full relative overflow-hidden">
            {viewState === 'skeleton' || activeNodes.length === 0 ? (
              <SkeletonCanvas
                activePrompt={prompt}
                viewMode={viewMode}
                isDark={isDark}
              />
            ) : (
              <ArchitectureCanvas
                nodes={activeNodes}
                edges={activeEdges}
                nodeResults={{}}
                edgeResults={{}}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                onNodesChangePosition={(updated) => {
                  if (viewMode === 'detailed') {
                    setDetailedGraph((prev) => ({ ...prev, nodes: updated }));
                  } else {
                    setBasicGraph((prev) => ({ ...prev, nodes: updated }));
                  }
                }}
                onAddEdge={(newEdge) => {
                  if (viewMode === 'detailed') {
                    setDetailedGraph((prev) => ({ ...prev, edges: [...prev.edges, newEdge] }));
                  } else {
                    setBasicGraph((prev) => ({ ...prev, edges: [...prev.edges, newEdge] }));
                  }
                }}
                onToggleEdge={(edgeId) => {
                  const updater = (edges: ArchitectureEdge[]) =>
                    edges.map((e) => (e.id === edgeId ? { ...e, enabled: !e.enabled } : e));
                  if (viewMode === 'detailed') {
                    setDetailedGraph((prev) => ({ ...prev, edges: updater(prev.edges) }));
                  } else {
                    setBasicGraph((prev) => ({ ...prev, edges: updater(prev.edges) }));
                  }
                }}
                viewMode={viewMode}
                onToggleViewMode={setViewMode}
                isDark={isDark}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectWorkspace;
