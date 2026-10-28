import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  DollarSign,
  Database,
  Globe,
  Play,
  Download,
  Sun,
  Moon,
  AlertCircle,
} from 'lucide-react';
import { ContextualQuerySidebar, ContextualQuestion } from './ContextualQuerySidebar';
import { SkeletonCanvas } from './SkeletonCanvas';
import { ArchitectureCanvas } from '../Canvas/ArchitectureCanvas';
import { api } from '../../services/api';
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

const DEFAULT_QUESTIONS: ContextualQuestion[] = [
  {
    id: 'scale_concurrency',
    category: 'scale',
    title: 'Peak Traffic & Concurrency Target',
    description: 'Determine the request throughput your architecture must withstand without degraded latency.',
    icon: <TrendingUp className="w-4 h-4 text-sky-500" />,
    options: [
      {
        id: 'scale_mvp',
        label: 'MVP / Startup (< 1,000 req/s)',
        detail: 'Single instance database with lightweight caching.',
        architecturalImpact: 'Standard Monolithic API + PostgreSQL',
      },
      {
        id: 'scale_growth',
        label: 'Growth Tier (10,000 req/s)',
        detail: 'Horizontally scaled services with Redis cache & read replicas.',
        architecturalImpact: '+ Redis Cluster & Read Replicas',
      },
      {
        id: 'scale_burst',
        label: 'Flash Sale Burst (50,000+ req/s)',
        detail: 'Asynchronous event streaming and partitioned database shards.',
        architecturalImpact: '+ Apache Kafka Event Stream & Sharding',
      },
    ],
    selectedOptionId: 'scale_growth',
  },
  {
    id: 'budget_constraints',
    category: 'budget',
    title: 'Infrastructure Budget & Maintenance',
    description: 'Balance operational overhead against cloud infrastructure expenditure.',
    icon: <DollarSign className="w-4 h-4 text-emerald-500" />,
    options: [
      {
        id: 'budget_frugal',
        label: 'Serverless Frugal (< $100/mo)',
        detail: 'Pay-per-request serverless functions and managed databases.',
        architecturalImpact: 'Cloudflare Workers + Serverless Postgres',
      },
      {
        id: 'budget_balanced',
        label: 'Balanced Cloud ($500–$2,000/mo)',
        detail: 'Containerized microservices on AWS ECS / Google Cloud Run.',
        architecturalImpact: 'Managed Multi-AZ RDS & Container Fleet',
      },
      {
        id: 'budget_enterprise',
        label: 'Enterprise Dedicated ($5,000+/mo)',
        detail: 'Dedicated Kubernetes cluster with multi-region active replication.',
        architecturalImpact: 'Kubernetes (EKS) + Multi-Region Aurora',
      },
    ],
    selectedOptionId: 'budget_balanced',
  },
  {
    id: 'data_consistency',
    category: 'storage',
    title: 'Data Consistency & Storage Model',
    description: 'Define your transactional integrity requirements under write contention.',
    icon: <Database className="w-4 h-4 text-amber-500" />,
    options: [
      {
        id: 'consistency_acid',
        label: 'Strict ACID Compliance',
        detail: 'Zero financial discrepancies; row-level locking with WAL.',
        architecturalImpact: 'PostgreSQL 16 Primary with Synchronous Standby',
      },
      {
        id: 'consistency_eventual',
        label: 'High Ingestion / Eventual Consistency',
        detail: 'Optimized for high-throughput writes and append-only ledgers.',
        architecturalImpact: 'Event-Sourced Kafka + DynamoDB / Cassandra',
      },
    ],
    selectedOptionId: 'consistency_acid',
  },
  {
    id: 'deployment_region',
    category: 'cloud',
    title: 'Geographic Deployment & DR',
    description: 'Select latency SLA boundaries and disaster recovery replication.',
    icon: <Globe className="w-4 h-4 text-purple-500" />,
    options: [
      {
        id: 'deploy_single',
        label: 'Single Region (High-Availability)',
        detail: 'Multi-AZ replication within primary cloud region.',
        architecturalImpact: '3 Availability Zones failover',
      },
      {
        id: 'deploy_multiregion',
        label: 'Global Multi-Region Active/Active',
        detail: 'Edge routing with geo-distributed database replicas.',
        architecturalImpact: 'Anycast DNS + Global Read Replicas',
      },
    ],
    selectedOptionId: 'deploy_single',
  },
];

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  projectId,
  initialPrompt,
  onGoHome,
  onSimulate,
  isDark = true,
  onToggleTheme,
}) => {
  const [prompt] = useState<string>(() => {
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

  const [questions, setQuestions] = useState<ContextualQuestion[]>(DEFAULT_QUESTIONS);
  const [viewState, setViewState] = useState<'skeleton' | 'hydrated'>('skeleton');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<ArchitectureRecommendation | null>(null);

  // Canvas selection & interactive state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<ArchitectureNode[]>([]);
  const [edges, setEdges] = useState<ArchitectureEdge[]>([]);

  // Compute refinement completion percentage
  const answeredCount = questions.filter((q) => q.selectedOptionId).length;
  const refinementProgress = Math.round((answeredCount / questions.length) * 100);

  // Save prompt cache
  useEffect(() => {
    if (prompt && typeof window !== 'undefined') {
      localStorage.setItem(`gitoscale_project_${projectId}`, prompt);
    }
  }, [projectId, prompt]);

  // Generate / Hydrate architecture from prompt and answered questions
  const handleHydrateArchitecture = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    const scaleAns = questions.find((q) => q.id === 'scale_concurrency')?.selectedOptionId;
    const budgetAns = questions.find((q) => q.id === 'budget_constraints')?.selectedOptionId;
    const consistencyAns = questions.find((q) => q.id === 'data_consistency')?.selectedOptionId;
    const regionAns = questions.find((q) => q.id === 'deployment_region')?.selectedOptionId;

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
      expectedScale: scaleMap[scaleAns || 'scale_growth'],
      budgetConstraint: budgetMap[budgetAns || 'budget_balanced'],
      preferredTech: [
        consistencyAns === 'consistency_eventual' ? 'Apache Kafka' : 'Redis Cache',
        regionAns === 'deploy_multiregion' ? 'Global Multi-Region' : 'Multi-AZ RDS',
      ],
      deploymentPreference: regionAns === 'deploy_multiregion' ? 'Multi-Region Active/Active' : 'AWS Cloud',
    };

    try {
      const res = await api.recommendArchitecture(payload);
      setRecommendation(res);
      setNodes(res.nodes);
      setEdges(res.edges);
      setViewState('hydrated');
    } catch (err: any) {
      console.error('Error hydrating architecture:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to hydrate architecture.');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, questions]);

  // Handle answering question in left sidebar
  const handleAnswerQuestion = (questionId: string, optionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, selectedOptionId: optionId } : q))
    );
  };

  const handleResetQuestions = () => {
    setQuestions((prev) => prev.map((q) => ({ ...q, selectedOptionId: undefined })));
    setViewState('skeleton');
  };

  const handleExportJSON = () => {
    if (!recommendation && nodes.length === 0) return;
    const exportData = recommendation || { projectId, prompt, nodes, edges };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `project-${projectId}-architecture.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const projectName = recommendation?.projectName || 'Scalable System Architecture';

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
          {/* Skeleton vs Hydrated View Toggle */}
          <div className="flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-900 text-xs">
            <button
              type="button"
              onClick={() => setViewState('skeleton')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewState === 'skeleton'
                  ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              Skeleton
            </button>
            <button
              type="button"
              onClick={() => {
                if (nodes.length === 0) {
                  handleHydrateArchitecture();
                } else {
                  setViewState('hydrated');
                }
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                viewState === 'hydrated'
                  ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Hydrated</span>
            </button>
          </div>

          {/* Simulate Load Button */}
          <button
            type="button"
            onClick={() => {
              if (nodes.length > 0) {
                onSimulate(nodes, edges);
              } else {
                handleHydrateArchitecture().then(() => {
                  if (nodes.length > 0) onSimulate(nodes, edges);
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
            className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer hidden sm:flex"
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
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Workspace Split View */}
      <div className="flex-1 flex w-full overflow-hidden">
        {/* Left Sidebar: Dynamic Contextual Queries */}
        <ContextualQuerySidebar
          questions={questions}
          onAnswerQuestion={handleAnswerQuestion}
          onApplyRefinements={handleHydrateArchitecture}
          onResetQuestions={handleResetQuestions}
          isGenerating={isGenerating}
          refinementProgress={refinementProgress}
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
                onClick={handleHydrateArchitecture}
                className="font-semibold underline ml-2 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          <div className="flex-1 w-full h-full relative overflow-hidden">
            {viewState === 'skeleton' || nodes.length === 0 ? (
              <SkeletonCanvas
                projectName={projectName}
                activePrompt={prompt}
                onHydrateClick={handleHydrateArchitecture}
                isDark={isDark}
              />
            ) : (
              <ArchitectureCanvas
                nodes={nodes}
                edges={edges}
                nodeResults={{}}
                edgeResults={{}}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                onNodesChangePosition={(updated) => setNodes(updated)}
                onAddEdge={(newEdge) => setEdges((prev) => [...prev, newEdge])}
                onToggleEdge={(edgeId) =>
                  setEdges((prev) =>
                    prev.map((e) => (e.id === edgeId ? { ...e, enabled: !e.enabled } : e))
                  )
                }
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
