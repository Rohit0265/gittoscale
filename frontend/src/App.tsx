import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './services/api';
import {
  ArchitectureFixture,
  ScenarioFixture,
  ArchitectureNode,
  ArchitectureEdge,
  SimulationResult,
  BaselineSnapshot,
  ComponentType,
  RecommenderInput,
} from './types';
import { Header } from './components/Header';
import { MetricsStrip } from './components/MetricsStrip';
import { ContextualQuerySidebar } from './components/ProjectWorkspace/ContextualQuerySidebar';
import { ArchitectureCanvas } from './components/Canvas/ArchitectureCanvas';
import { RightSidebar } from './components/RightSidebar';
import { BaselineComparisonModal } from './components/BaselineComparisonModal';
import { RepositoryImportModal } from './components/RepositoryImportModal';
import { LandingPage } from './components/LandingPage';
import { ArchitectureRecommenderPage } from './components/ArchitectureRecommender/ArchitectureRecommenderPage';
import { ProjectWorkspace } from './components/ProjectWorkspace/ProjectWorkspace';
import ModernLoginSignup from './components/ui/modern-login-signup';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { AuthCallback } from './components/auth/AuthCallback';
import { HistoryDashboard } from './components/history/HistoryDashboard';
import { useAuth } from './contexts/AuthContext';
import { toVerticalTree } from './utils/treeLayout';
import { AlertCircle, RefreshCw, PanelLeftOpen, PanelRightOpen, Sparkles } from 'lucide-react';

const APP_SUBDOMAIN_URL = 'https://app.gittoscale.tech';
const LANDING_DOMAIN_URL = 'https://gittoscale.tech';

export interface ProjectRouteInfo {
  projectId: string;
  prompt?: string;
}

const getProjectRouteInfo = (): ProjectRouteInfo | null => {
  if (typeof window === 'undefined') return null;
  const match = window.location.pathname.match(/\/project\/([a-zA-Z0-9_-]+)/);
  const search = new URLSearchParams(window.location.search);
  const promptQuery = search.get('prompt') || undefined;
  if (match && match[1]) {
    return {
      projectId: match[1],
      prompt: promptQuery,
    };
  }
  const projectQuery = search.get('project');
  if (projectQuery) {
    return {
      projectId: projectQuery,
      prompt: promptQuery,
    };
  }
  return null;
};

const isCustomDomain = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.toLowerCase().includes('gittoscale.tech');
};

const isAuthUrl = () => {
  if (typeof window === 'undefined') return false;
  const search = new URLSearchParams(window.location.search);
  return (
    search.has('auth') ||
    search.has('login') ||
    search.has('signup') ||
    window.location.pathname.startsWith('/auth') ||
    window.location.pathname.startsWith('/login')
  );
};

const isRecommenderUrl = () => {
  if (typeof window === 'undefined') return false;
  const search = new URLSearchParams(window.location.search);
  return (
    search.has('architect') ||
    search.has('recommender') ||
    window.location.pathname.startsWith('/architect') ||
    window.location.pathname.startsWith('/recommender')
  );
};

const isAppDomain = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  return (
    host === 'app.gittoscale.tech' ||
    host.startsWith('app.') ||
    window.location.pathname.startsWith('/app') ||
    search.has('app') ||
    search.has('repo') ||
    search.has('demo')
  );
};

export type AppView =
  | 'landing'
  | 'simulator'
  | 'recommender'
  | 'projectWorkspace'
  | 'signup'
  | 'signin'
  | 'forgot-password'
  | 'auth-callback'
  | 'history';

const getInitialView = (): AppView => {
  if (typeof window === 'undefined') return 'landing';
  const path = window.location.pathname;
  if (path === '/signup') return 'signup';
  if (path === '/signin') return 'signin';
  if (path === '/forgot-password') return 'forgot-password';
  if (path.startsWith('/auth/callback')) return 'auth-callback';
  if (path === '/history') return 'history';
  if (getProjectRouteInfo()) return 'simulator';
  if (isRecommenderUrl()) return 'recommender';
  if (isAppDomain()) return 'simulator';
  return 'landing';
};

export const App: React.FC = () => {
  const {
    user,
    isLoading: isAuthLoading,
    savePendingAction,
    pendingAction,
    clearPendingAction,
    getAuthToken,
    signOut,
  } = useAuth();

  const [activeProject, setActiveProject] = useState<ProjectRouteInfo | null>(() => getProjectRouteInfo());

  // Navigation mode
  const [currentView, setCurrentView] = useState<AppView>(() => getInitialView());

  // Modern login/signup modal state
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(() => isAuthUrl());

  // Active prompt for architecture generation
  const [activePromptText, setActivePromptText] = useState<string>(() => {
    const route = getProjectRouteInfo();
    return route?.prompt || '';
  });
  const [isGeneratingArchitecture, setIsGeneratingArchitecture] = useState<boolean>(false);

  // Selected mandatory parameters for AI Architect chat
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

  // Theme state: light | dark with persistence & system preference detection
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gitoscale-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem('gitoscale-theme');
      if (!saved) {
        setIsDark(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleToggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem('gitoscale-theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const handleGoHome = useCallback(() => {
    if (isCustomDomain() && isAppDomain()) {
      window.location.href = LANDING_DOMAIN_URL;
      return;
    }
    window.history.pushState({}, '', '/');
    setActiveProject(null);
    setCurrentView('landing');
  }, []);

  const handleNavigate = useCallback((viewName: string) => {
    if (viewName === 'signup') {
      window.history.pushState({}, '', '/signup');
      setCurrentView('signup');
    } else if (viewName === 'signin') {
      window.history.pushState({}, '', '/signin');
      setCurrentView('signin');
    } else if (viewName === 'forgot-password') {
      window.history.pushState({}, '', '/forgot-password');
      setCurrentView('forgot-password');
    } else if (viewName === 'history') {
      window.history.pushState({}, '', '/history');
      setCurrentView('history');
    } else if (viewName === 'simulator') {
      window.history.pushState({}, '', '/app');
      setCurrentView('simulator');
    } else {
      window.history.pushState({}, '', '/');
      setActiveProject(null);
      setCurrentView('landing');
    }
  }, []);

  // Route Protection: Unauthenticated visitors to /app, /history, /project, or app.gittoscale.tech are redirected to /signup
  useEffect(() => {
    if (isAuthLoading) return;
    const path = window.location.pathname;
    const isAuthRoute =
      path === '/signup' ||
      path === '/signin' ||
      path === '/forgot-password' ||
      path.startsWith('/auth');

    if (isAuthRoute) return;

    const isProtectedRoute =
      path.startsWith('/app') ||
      path.startsWith('/history') ||
      path.startsWith('/project') ||
      (isAppDomain() && path !== '/');

    if (!user && isProtectedRoute) {
      const destination = path + window.location.search;
      window.history.pushState({}, '', `/signup?redirect=${encodeURIComponent(destination)}`);
      setCurrentView('signup');
    }
  }, [user, isAuthLoading]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/signup') {
        setCurrentView('signup');
      } else if (path === '/signin') {
        setCurrentView('signin');
      } else if (path === '/forgot-password') {
        setCurrentView('forgot-password');
      } else if (path.startsWith('/auth/callback')) {
        setCurrentView('auth-callback');
      } else if (path === '/history') {
        setCurrentView('history');
      } else {
        const route = getProjectRouteInfo();
        if (route) {
          setActiveProject(route);
          if (route.prompt) setActivePromptText(route.prompt);
          setCurrentView('simulator');
        } else if (isRecommenderUrl()) {
          setCurrentView('recommender');
        } else if (isAppDomain()) {
          setCurrentView('simulator');
        } else {
          setActiveProject(null);
          setCurrentView('landing');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sidebar collapse states - auto-collapse on smaller screens
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1280;
    }
    return false;
  });

  // Keep sidebars non-colliding on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsLeftCollapsed(true);
        setIsRightCollapsed(true);
      } else if (window.innerWidth < 1024) {
        setIsLeftCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fixture states
  const [defaultArchitecture, setDefaultArchitecture] = useState<ArchitectureFixture | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioFixture[]>([]);
  const [currentScenarioId, setCurrentScenarioId] = useState<string>('normal-traffic');

  // Architecture view mode: 'basic' (default) | 'detailed'
  const [viewMode, setViewMode] = useState<'basic' | 'detailed'>('basic');

  // Caches for instant switching between Basic and Detailed views
  const basicGraphCacheRef = useRef<{ nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } | null>(null);
  const detailedGraphCacheRef = useRef<{ nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } | null>(null);
  // Pristine baseline references to apply scenarios onto without mutating original definitions
  const baseBasicGraphRef = useRef<{ nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } | null>(null);
  const baseDetailedGraphRef = useRef<{ nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } | null>(null);

  // Architecture & simulation state
  const [nodes, setNodes] = useState<ArchitectureNode[]>([]);
  const [edges, setEdges] = useState<ArchitectureEdge[]>([]);
  const [incomingTrafficRate, setIncomingTrafficRate] = useState<number>(1000);
  const [durationSeconds, setDurationSeconds] = useState<number>(60);

  // Results & status
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectNode = useCallback(
    (id: string | null) => {
      setSelectedNodeId(id);
      if (id) {
        setIsRightCollapsed(false);
        if (window.innerWidth < 768) {
          setIsLeftCollapsed(true);
        }
      }
    },
    []
  );

  const handleOpenLeft = useCallback(() => {
    setIsLeftCollapsed(false);
    if (window.innerWidth < 768) {
      setIsRightCollapsed(true);
    }
  }, []);

  const handleOpenRight = useCallback(() => {
    setIsRightCollapsed(false);
    if (window.innerWidth < 768) {
      setIsLeftCollapsed(true);
    }
  }, []);

  // Baseline comparison
  const [baseline, setBaseline] = useState<BaselineSnapshot | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [isImportRepoOpen, setIsImportRepoOpen] = useState<boolean>(false);

  // Debounce ref for sliders
  const simulateDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // 1. Load initial fixtures
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [arch, scens] = await Promise.all([
          api.getArchitecture(),
          api.getScenarios(),
        ]);
        setDefaultArchitecture(arch);
        setScenarios(scens);

        // Populate basic & detailed cache and baseline fixtures
        baseBasicGraphRef.current = { nodes: arch.nodes, edges: arch.edges };
        basicGraphCacheRef.current = { nodes: arch.nodes, edges: arch.edges };
        if (arch.detailedGraph) {
          baseDetailedGraphRef.current = {
            nodes: arch.detailedGraph.nodes,
            edges: arch.detailedGraph.edges,
          };
          detailedGraphCacheRef.current = {
            nodes: arch.detailedGraph.nodes,
            edges: arch.detailedGraph.edges,
          };
        }

        // If URL has ?repo= parameter, automatically load that repository architecture
        const search = new URLSearchParams(window.location.search);
        const repoParam = search.get('repo');
        if (repoParam) {
          try {
            const res = await api.analyzeRepository({ repoUrl: repoParam });
            const repoName =
              res.repoName || repoParam.split('/').pop()?.replace('.git', '') || 'Repository';
            handleImportArchitecture(res.nodes, res.edges, repoName, res.basicGraph, res.detailedGraph);
            return;
          } catch (repoErr) {
            console.error('Failed to auto-load repo from URL parameter:', repoErr);
            setError(`Failed to load repository "${repoParam}". Loaded default architecture.`);
          }
        }

        // Apply normal traffic scenario by default
        applyScenario('normal-traffic', arch, scens, 'basic');
      } catch (err: unknown) {
        console.error('Failed to load initial fixtures:', err);
        setError('Failed to connect to simulation backend. Please ensure the backend is running.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // 2. Trigger simulation calculation
  const triggerSimulation = useCallback(
    async (
      currentNodes: ArchitectureNode[],
      currentEdges: ArchitectureEdge[],
      rate: number,
      duration: number
    ) => {
      if (!isRunning) return;
      try {
        setLoading(true);
        setError(null);
        const res = await api.simulate({
          nodes: currentNodes,
          edges: currentEdges,
          incomingTrafficRate: rate,
          durationSeconds: duration,
        });
        setSimulationResult(res);
      } catch (err: any) {
        console.error('Simulation request error:', err);
        const msg =
          err.response?.data?.message || err.message || 'Error occurred during simulation';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [isRunning]
  );

  // Debounced simulation runner
  const queueSimulation = useCallback(
    (
      currentNodes: ArchitectureNode[],
      currentEdges: ArchitectureEdge[],
      rate: number,
      duration: number
    ) => {
      if (!isRunning) return;
      if (simulateDebounceTimer.current) {
        clearTimeout(simulateDebounceTimer.current);
      }
      simulateDebounceTimer.current = setTimeout(() => {
        triggerSimulation(currentNodes, currentEdges, rate, duration);
      }, 150);
    },
    [isRunning, triggerSimulation]
  );

  // Generate / synthesize architecture directly from a prompt using vertical tree layout
  const handleGenerateFromPrompt = useCallback(
    async (promptText: string, customAnswers = selectedAnswers) => {
      if (!promptText.trim()) return;
      setActivePromptText(promptText);
      setIsGeneratingArchitecture(true);
      setError(null);
      try {
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
          projectDescription: promptText,
          expectedScale: scaleMap[customAnswers.scale || 'scale_growth'],
          budgetConstraint: budgetMap[customAnswers.budget || 'budget_balanced'],
          preferredTech: [
            customAnswers.consistency === 'consistency_eventual' ? 'Apache Kafka' : 'Redis Cache',
            customAnswers.region === 'deploy_multiregion' ? 'Global Multi-Region' : 'Multi-AZ RDS',
          ],
          deploymentPreference:
            customAnswers.region === 'deploy_multiregion' ? 'Multi-Region Active/Active' : 'AWS Cloud',
        };
        const res = await api.recommendArchitecture(payload);
        const verticalNodes = toVerticalTree(res.nodes, res.edges);
        setNodes(verticalNodes);
        setEdges(res.edges);
        baseBasicGraphRef.current = { nodes: verticalNodes, edges: res.edges };
        basicGraphCacheRef.current = { nodes: verticalNodes, edges: res.edges };
        triggerSimulation(verticalNodes, res.edges, incomingTrafficRate, durationSeconds);

        // Persist to architecture history in PostgreSQL if user is authenticated
        if (user) {
          const token = getAuthToken();
          api.saveArchitectureHistory(token, {
            title: promptText.slice(0, 60),
            prompt: promptText,
            generationConfig: customAnswers,
            architectureData: { nodes: verticalNodes, edges: res.edges },
            status: 'completed',
          }).catch((histErr) => {
            console.warn('Could not persist architecture history:', histErr);
          });
        }
      } catch (err: any) {
        console.error('Error generating architecture for prompt:', err);
        setError(err?.response?.data?.message || err?.message || 'Failed to generate architecture for prompt');
      } finally {
        setIsGeneratingArchitecture(false);
      }
    },
    [incomingTrafficRate, durationSeconds, triggerSimulation, selectedAnswers, user, getAuthToken]
  );

  // AI Refine callback from left sidebar
  const handleRefinePrompt = useCallback(
    async (refinement: string) => {
      const updatedPrompt = activePromptText ? `${activePromptText} • ${refinement}` : refinement;
      await handleGenerateFromPrompt(updatedPrompt);
    },
    [activePromptText, handleGenerateFromPrompt]
  );

  // Directly navigate to simulator and generate architecture on prompt submit
  const handleStartProject = useCallback(
    (promptText: string) => {
      if (!user) {
        savePendingAction({
          type: 'prompt',
          prompt: promptText,
          returnUrl: '/app',
          customAnswers: selectedAnswers,
          createdAt: Date.now(),
        });
        window.history.pushState({}, '', '/signup?redirect=/app');
        setCurrentView('signup');
        return;
      }

      const projectId = 'prj_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`gitoscale_project_${projectId}`, promptText);
      }

      if (isCustomDomain() && !isAppDomain()) {
        window.location.href = `${APP_SUBDOMAIN_URL}/app?prompt=${encodeURIComponent(promptText)}`;
        return;
      }

      const projectUrl = `/app?prompt=${encodeURIComponent(promptText)}`;
      window.history.pushState({ projectId, prompt: promptText }, '', projectUrl);
      setActiveProject({ projectId, prompt: promptText });
      setCurrentView('simulator');
      handleGenerateFromPrompt(promptText);
    },
    [user, savePendingAction, selectedAnswers, handleGenerateFromPrompt]
  );

  const handleRequireAuthForRepo = useCallback(
    (repoUrl: string, llmConfig?: any) => {
      savePendingAction({
        type: 'repo',
        repoUrl,
        returnUrl: '/app',
        llmConfig,
        createdAt: Date.now(),
      });
      window.history.pushState({}, '', '/signup?redirect=/app');
      setCurrentView('signup');
    },
    [savePendingAction]
  );

  // Check URL on mount if prompt query is present
  useEffect(() => {
    const route = getProjectRouteInfo();
    if (route?.prompt) {
      handleGenerateFromPrompt(route.prompt);
    }
  }, [handleGenerateFromPrompt]);

  // Helper to apply scenario overrides to any graph without side effects
  const applyScenarioToGraph = (
    baseGraph: { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] },
    scen: ScenarioFixture
  ): { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } => {
    let newNodes: ArchitectureNode[] = JSON.parse(JSON.stringify(baseGraph.nodes));
    let newEdges: ArchitectureEdge[] = JSON.parse(JSON.stringify(baseGraph.edges));

    // Apply node overrides (matching direct node id or parentId for detailed submodules)
    if (scen.nodeOverrides && Object.keys(scen.nodeOverrides).length > 0) {
      newNodes = newNodes.map((node) => {
        const override =
          scen.nodeOverrides?.[node.id] ||
          (node.parentId ? scen.nodeOverrides?.[node.parentId] : undefined);
        if (override) {
          return {
            ...node,
            ...override,
            config: {
              ...node.config,
              ...(override.config || {}),
            },
          };
        }
        return node;
      });
    }

    // Apply edge overrides
    if (scen.edgeOverrides && Object.keys(scen.edgeOverrides).length > 0) {
      newEdges = newEdges.map((edge) => {
        const override = scen.edgeOverrides?.[edge.id];
        if (override) {
          return { ...edge, ...override };
        }
        return edge;
      });
    }

    return { nodes: newNodes, edges: newEdges };
  };

  // 3. Apply scenario logic (respects current viewMode so Detailed View is preserved)
  const applyScenario = (
    scenarioId: string,
    archFixture?: ArchitectureFixture | null,
    scensList = scenarios,
    overrideViewMode?: 'basic' | 'detailed'
  ) => {
    const scen = scensList.find((s) => s.id === scenarioId);
    if (!scen) return;

    setCurrentScenarioId(scenarioId);
    const targetRate = scen.incomingTrafficRate;
    const targetDuration = scen.durationSeconds;
    setIncomingTrafficRate(targetRate);
    setDurationSeconds(targetDuration);

    const activeMode = overrideViewMode || viewMode;

    // 1. Update basic graph cache with this scenario applied to basic baseline
    const basicBase =
      archFixture?.basicGraph ||
      (archFixture && archFixture.nodes ? archFixture : null) ||
      baseBasicGraphRef.current ||
      defaultArchitecture;

    if (basicBase && basicBase.nodes) {
      basicGraphCacheRef.current = applyScenarioToGraph(basicBase, scen);
    }

    // 2. Update detailed graph cache with this scenario applied to detailed baseline
    const detailedBase =
      archFixture?.detailedGraph ||
      baseDetailedGraphRef.current ||
      defaultArchitecture?.detailedGraph;

    if (detailedBase && detailedBase.nodes) {
      detailedGraphCacheRef.current = applyScenarioToGraph(detailedBase, scen);
    }

    // 3. Render the active graph according to the active viewMode
    const activeGraph =
      activeMode === 'detailed'
        ? detailedGraphCacheRef.current
        : basicGraphCacheRef.current;

    if (activeGraph && activeGraph.nodes && activeGraph.nodes.length > 0) {
      setNodes(activeGraph.nodes);
      setEdges(activeGraph.edges);
      triggerSimulation(activeGraph.nodes, activeGraph.edges, targetRate, targetDuration);
    }
  };

  // 4. Parameter handlers
  const handleTrafficChange = (newRate: number) => {
    setIncomingTrafficRate(newRate);
    queueSimulation(nodes, edges, newRate, durationSeconds);
  };

  const handleNodesPositionChange = (updatedNodes: ArchitectureNode[]) => {
    setNodes(updatedNodes);
    // Node position changes do NOT trigger re-simulation
  };

  const handleUpdateNode = (updatedNode: ArchitectureNode) => {
    const updated = nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n));
    setNodes(updated);
    queueSimulation(updated, edges, incomingTrafficRate, durationSeconds);
  };

  const handleToggleNode = (nodeId: string) => {
    const updated = nodes.map((n) => (n.id === nodeId ? { ...n, enabled: !n.enabled } : n));
    setNodes(updated);
    queueSimulation(updated, edges, incomingTrafficRate, durationSeconds);
  };

  const handleDeleteNode = (nodeId: string) => {
    const updatedNodes = nodes.filter((n) => n.id !== nodeId);
    const updatedEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    queueSimulation(updatedNodes, updatedEdges, incomingTrafficRate, durationSeconds);
  };

  const handleAddNode = (type: ComponentType, name: string) => {
    const newId = `${type}-${Date.now().toString().slice(-4)}`;
    const newNode: ArchitectureNode = {
      id: newId,
      name,
      type,
      position: { x: 400 + Math.random() * 200, y: 150 + Math.random() * 200 },
      capacityPerSecond: type === 'database' ? 600 : type === 'cache' ? 2500 : 800,
      workerCount: 2,
      enabled: true,
      config: {
        baselineLatencyMs: type === 'database' ? 30 : type === 'cache' ? 2 : 15,
        maxQueueSize: 2000,
        overflowPolicy: 'reject',
      },
    };
    const updated = [...nodes, newNode];
    setNodes(updated);
    setSelectedNodeId(newId);
    queueSimulation(updated, edges, incomingTrafficRate, durationSeconds);
  };

  const handleAddEdge = (newEdge: ArchitectureEdge) => {
    const edgeWithDefaults: ArchitectureEdge = {
      isBidirectional: true,
      ...newEdge,
    };
    const updated = [...edges, edgeWithDefaults];
    setEdges(updated);
    if (viewMode === 'detailed' && detailedGraphCacheRef.current) {
      detailedGraphCacheRef.current.edges = updated;
    } else if (viewMode === 'basic' && basicGraphCacheRef.current) {
      basicGraphCacheRef.current.edges = updated;
    }
    queueSimulation(nodes, updated, incomingTrafficRate, durationSeconds);
  };

  const handleToggleEdge = (edgeId: string) => {
    const updated = edges.map((e) => (e.id === edgeId ? { ...e, enabled: !e.enabled } : e));
    setEdges(updated);
    queueSimulation(nodes, updated, incomingTrafficRate, durationSeconds);
  };

  const handleDeleteEdge = (edgeId: string) => {
    const updated = edges.filter((e) => e.id !== edgeId);
    setEdges(updated);
    if (viewMode === 'detailed' && detailedGraphCacheRef.current) {
      detailedGraphCacheRef.current.edges = updated;
    } else if (viewMode === 'basic' && basicGraphCacheRef.current) {
      basicGraphCacheRef.current.edges = updated;
    }
    queueSimulation(nodes, updated, incomingTrafficRate, durationSeconds);
  };

  const handleUpdateEdge = useCallback(
    (edgeId: string, updates: Partial<ArchitectureEdge>) => {
      const updated = edges.map((e) => (e.id === edgeId ? { ...e, ...updates } : e));
      setEdges(updated);
      if (viewMode === 'detailed' && detailedGraphCacheRef.current) {
        detailedGraphCacheRef.current.edges = updated;
      } else if (viewMode === 'basic' && basicGraphCacheRef.current) {
        basicGraphCacheRef.current.edges = updated;
      }
      queueSimulation(nodes, updated, incomingTrafficRate, durationSeconds);
    },
    [edges, nodes, incomingTrafficRate, durationSeconds, viewMode, queueSimulation]
  );

  const handleUpdateEdgeMultiplier = (edgeId: string, multiplier: number) => {
    handleUpdateEdge(edgeId, { requestsPerInput: multiplier });
  };

  // 5. Reset to current scenario fixture
  const handleReset = () => {
    applyScenario(currentScenarioId);
  };

  // 6. Restore original default architecture
  const handleRestoreOriginal = () => {
    if (defaultArchitecture) {
      applyScenario('normal-traffic', defaultArchitecture);
    }
  };

  // 7. Baseline handlers
  const handleSaveBaseline = () => {
    if (simulationResult) {
      const currentScen = scenarios.find((s) => s.id === currentScenarioId);
      setBaseline({
        timestamp: new Date().toLocaleTimeString(),
        scenarioName: currentScen?.name || 'Custom Architecture',
        metrics: { ...simulationResult.metrics },
        nodeResults: { ...simulationResult.nodeResults },
      });
    }
  };

  // 8. View Mode Toggle (Basic <-> Detailed)
  const handleToggleViewMode = async (targetMode: 'basic' | 'detailed') => {
    if (targetMode === viewMode) return;
    setViewMode(targetMode);

    if (targetMode === 'detailed') {
      // Save current basic graph into cache
      basicGraphCacheRef.current = { nodes, edges };

      if (detailedGraphCacheRef.current && detailedGraphCacheRef.current.nodes.length > 0) {
        const nextNodes = detailedGraphCacheRef.current.nodes;
        const nextEdges = detailedGraphCacheRef.current.edges;
        setNodes(nextNodes);
        setEdges(nextEdges);
        setSelectedNodeId(null);
        triggerSimulation(nextNodes, nextEdges, incomingTrafficRate, durationSeconds);
      } else {
        try {
          setLoading(true);
          const detailed = await api.getArchitecture('detailed');
          baseDetailedGraphRef.current = { nodes: detailed.nodes, edges: detailed.edges };
          detailedGraphCacheRef.current = { nodes: detailed.nodes, edges: detailed.edges };
          setNodes(detailed.nodes);
          setEdges(detailed.edges);
          setSelectedNodeId(null);
          triggerSimulation(detailed.nodes, detailed.edges, incomingTrafficRate, durationSeconds);
        } catch (err: any) {
          console.error('Failed to load detailed architecture:', err);
          setError('Failed to load detailed architecture.');
        } finally {
          setLoading(false);
        }
      }
    } else {
      // Switching to Basic View
      detailedGraphCacheRef.current = { nodes, edges };

      if (basicGraphCacheRef.current && basicGraphCacheRef.current.nodes.length > 0) {
        const nextNodes = basicGraphCacheRef.current.nodes;
        const nextEdges = basicGraphCacheRef.current.edges;
        setNodes(nextNodes);
        setEdges(nextEdges);
        setSelectedNodeId(null);
        triggerSimulation(nextNodes, nextEdges, incomingTrafficRate, durationSeconds);
      } else if (defaultArchitecture) {
        setNodes(defaultArchitecture.nodes);
        setEdges(defaultArchitecture.edges);
        setSelectedNodeId(null);
        triggerSimulation(defaultArchitecture.nodes, defaultArchitecture.edges, incomingTrafficRate, durationSeconds);
      }
    }
  };

  const handleNavigateToParent = (parentId: string) => {
    handleToggleViewMode('basic');
    setTimeout(() => {
      setSelectedNodeId(parentId);
    }, 150);
  };

  // 9. Repository Import handler
  const handleImportArchitecture = useCallback(
    (
      newNodes: ArchitectureNode[],
      newEdges: ArchitectureEdge[],
      _repoName: string,
      basicGraph?: { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] },
      detailedGraph?: { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] },
      repoUrl?: string
    ) => {
      const basicToUse = basicGraph || { nodes: newNodes, edges: newEdges };
      baseBasicGraphRef.current = JSON.parse(JSON.stringify(basicToUse));
      basicGraphCacheRef.current = JSON.parse(JSON.stringify(basicToUse));

      if (detailedGraph) {
        baseDetailedGraphRef.current = JSON.parse(JSON.stringify(detailedGraph));
        detailedGraphCacheRef.current = JSON.parse(JSON.stringify(detailedGraph));
      } else {
        baseDetailedGraphRef.current = null;
        detailedGraphCacheRef.current = null;
      }

      setViewMode('basic');
      setNodes(basicToUse.nodes);
      setEdges(basicToUse.edges);
      setSelectedNodeId(null);
      triggerSimulation(basicToUse.nodes, basicToUse.edges, incomingTrafficRate, durationSeconds);

      // Persist to repository history if user is authenticated and repoUrl provided
      if (user && repoUrl) {
        const token = getAuthToken();
        api.saveRepositoryHistory(token, {
          repositoryUrl: repoUrl,
          repositoryName: _repoName,
          architectureData: { nodes: newNodes, edges: newEdges },
          status: 'completed',
        }).catch((err) => console.warn('Failed to persist repository history:', err));
      }
    },
    [incomingTrafficRate, durationSeconds, triggerSimulation, user, getAuthToken]
  );

  // Resume pending action after authentication
  useEffect(() => {
    if (user && pendingAction) {
      const action = { ...pendingAction };
      clearPendingAction();

      if (action.type === 'prompt') {
        const dest = action.returnUrl || '/app';
        window.history.pushState({}, '', dest);
        setCurrentView('simulator');
        handleGenerateFromPrompt(action.prompt, action.customAnswers);
      } else if (action.type === 'repo') {
        const dest = action.returnUrl || '/app';
        window.history.pushState({}, '', dest);
        setCurrentView('simulator');
        (async () => {
          try {
            setLoading(true);
            const res = await api.analyzeRepository({
              repoUrl: action.repoUrl,
              llmConfig: action.llmConfig,
            });
            const repoName =
              res.repoName || action.repoUrl.split('/').pop()?.replace('.git', '') || 'Repository';
            handleImportArchitecture(
              res.nodes,
              res.edges,
              repoName,
              res.basicGraph,
              res.detailedGraph,
              action.repoUrl
            );
          } catch (err: any) {
            console.error('Failed to resume repo import:', err);
            setError(err?.message || 'Failed to resume repository import.');
          } finally {
            setLoading(false);
          }
        })();
      }
    }
  }, [user, pendingAction, clearPendingAction, handleGenerateFromPrompt, handleImportArchitecture]);

  const handleOpenArchitectureFromHistory = useCallback(
    (archData: any, prompt: string) => {
      if (!archData) return;
      const rawNodes = archData.nodes || (Array.isArray(archData) ? archData : []);
      const rawEdges = archData.edges || [];
      const verticalNodes = toVerticalTree(rawNodes, rawEdges);
      setNodes(verticalNodes);
      setEdges(rawEdges);
      baseBasicGraphRef.current = { nodes: verticalNodes, edges: rawEdges };
      basicGraphCacheRef.current = { nodes: verticalNodes, edges: rawEdges };
      baseDetailedGraphRef.current = null;
      detailedGraphCacheRef.current = null;
      setViewMode('basic');
      setActivePromptText(prompt || '');
      setSelectedNodeId(null);
      window.history.pushState({}, '', '/app');
      setCurrentView('simulator');
      triggerSimulation(verticalNodes, rawEdges, incomingTrafficRate, durationSeconds);
    },
    [incomingTrafficRate, durationSeconds, triggerSimulation]
  );

  const handleOpenRepositoryFromHistory = useCallback(
    (archData: any, _repoName: string, repoUrl: string) => {
      if (!archData) return;
      const rawNodes = archData.nodes || (Array.isArray(archData) ? archData : []);
      const rawEdges = archData.edges || [];
      setNodes(rawNodes);
      setEdges(rawEdges);
      baseBasicGraphRef.current = { nodes: rawNodes, edges: rawEdges };
      basicGraphCacheRef.current = { nodes: rawNodes, edges: rawEdges };
      baseDetailedGraphRef.current = null;
      detailedGraphCacheRef.current = null;
      setViewMode('basic');
      setSelectedNodeId(null);
      const url = repoUrl ? `/app?repo=${encodeURIComponent(repoUrl)}` : '/app';
      window.history.pushState({}, '', url);
      setCurrentView('simulator');
      triggerSimulation(rawNodes, rawEdges, incomingTrafficRate, durationSeconds);
    },
    [incomingTrafficRate, durationSeconds, triggerSimulation]
  );

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedNodeResult = selectedNodeId ? simulationResult?.nodeResults[selectedNodeId] : undefined;

  if (currentView === 'signup') {
    return (
      <ModernLoginSignup
        initialMode="signup"
        onClose={handleGoHome}
        onNavigate={handleNavigate}
        onSuccess={() => {
          if (!pendingAction) {
            window.history.pushState({}, '', '/app');
            setCurrentView('simulator');
          }
        }}
      />
    );
  }

  if (currentView === 'signin') {
    return (
      <ModernLoginSignup
        initialMode="signin"
        onClose={handleGoHome}
        onNavigate={handleNavigate}
        onSuccess={() => {
          if (!pendingAction) {
            window.history.pushState({}, '', '/app');
            setCurrentView('simulator');
          }
        }}
      />
    );
  }

  if (currentView === 'forgot-password') {
    return <ForgotPasswordPage onNavigate={handleNavigate} isDark={isDark} />;
  }

  if (currentView === 'auth-callback') {
    return <AuthCallback onNavigate={handleNavigate} isDark={isDark} />;
  }

  if (currentView === 'history') {
    return (
      <HistoryDashboard
        onGoHome={handleGoHome}
        onOpenArchitecture={handleOpenArchitectureFromHistory}
        onOpenRepository={handleOpenRepositoryFromHistory}
        onNavigateToSimulator={() => {
          window.history.pushState({}, '', '/app');
          setCurrentView('simulator');
        }}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  if (currentView === 'landing') {
    return (
      <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-[#0A0A0A]">
        <LandingPage
          isDark={isDark}
          isAppDomain={isAppDomain()}
          onToggleTheme={handleToggleTheme}
          onOpenRecommender={() => {
            window.history.pushState({}, '', '/recommender');
            setCurrentView('recommender');
          }}
          onOpenAuth={() => {
            window.history.pushState({}, '', '/signin');
            setCurrentView('signin');
          }}
          onStartProject={handleStartProject}
          onSelectTestSite={() => {
            if (isCustomDomain() && !isAppDomain()) {
              window.location.href = `${APP_SUBDOMAIN_URL}/?demo=true`;
              return;
            }
            window.history.pushState({}, '', '/app');
            setCurrentView('simulator');
            if (defaultArchitecture && nodes.length === 0) {
              applyScenario('normal-traffic', defaultArchitecture, scenarios);
            }
          }}
          onSelectUseRepository={() => {
            setIsImportRepoOpen(true);
          }}
        />
        <RepositoryImportModal
          isOpen={isImportRepoOpen}
          onClose={() => setIsImportRepoOpen(false)}
          isUserAuthenticated={Boolean(user)}
          onRequireAuth={handleRequireAuthForRepo}
          onImportArchitecture={(newNodes, newEdges, repoName, basicGraph, detailedGraph, repoUrl) => {
            if (isCustomDomain() && !isAppDomain() && repoUrl) {
              window.location.href = `${APP_SUBDOMAIN_URL}/?repo=${encodeURIComponent(repoUrl)}`;
              return;
            }
            handleImportArchitecture(newNodes, newEdges, repoName, basicGraph, detailedGraph, repoUrl);
            window.history.pushState({}, '', '/app');
            setCurrentView('simulator');
          }}
        />
        {isAuthOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs">
            <ModernLoginSignup
              onClose={() => setIsAuthOpen(false)}
              onSuccess={(_user) => {
                setTimeout(() => setIsAuthOpen(false), 1200);
              }}
            />
          </div>
        )}
      </div>
    );
  }

  if (currentView === 'projectWorkspace' && activeProject) {
    return (
      <ProjectWorkspace
        projectId={activeProject.projectId}
        initialPrompt={activeProject.prompt}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onGoHome={handleGoHome}
        onSimulate={(_wsNodes, _wsEdges) => {
          window.history.pushState({}, '', '/app');
          setCurrentView('simulator');
        }}
      />
    );
  }

  if (currentView === 'recommender') {
    return (
      <ArchitectureRecommenderPage
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onGoHome={handleGoHome}
        onGoToSimulator={() => {
          window.history.pushState({}, '', '/app');
          setCurrentView('simulator');
        }}
        onSimulate={(recNodes: ArchitectureNode[], recEdges: ArchitectureEdge[]) => {
          const basicToUse = { nodes: recNodes, edges: recEdges };
          baseBasicGraphRef.current = JSON.parse(JSON.stringify(basicToUse));
          basicGraphCacheRef.current = JSON.parse(JSON.stringify(basicToUse));
          baseDetailedGraphRef.current = null;
          detailedGraphCacheRef.current = null;

          setViewMode('basic');
          setNodes(recNodes);
          setEdges(recEdges);
          setSelectedNodeId(null);
          window.history.pushState({}, '', '/app');
          setCurrentView('simulator');
          triggerSimulation(recNodes, recEdges, incomingTrafficRate, durationSeconds);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#090B10] font-sans">
      {/* 1. Header */}
      <Header
        scenarios={scenarios}
        currentScenarioId={currentScenarioId}
        onSelectScenario={(id) => applyScenario(id)}
        isRunning={isRunning}
        onToggleRun={() => {
          const next = !isRunning;
          setIsRunning(next);
          if (next) {
            triggerSimulation(nodes, edges, incomingTrafficRate, durationSeconds);
          }
        }}
        onReset={handleReset}
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenImportRepo={() => setIsImportRepoOpen(true)}
        onOpenRecommender={() => {
          window.history.pushState({}, '', '/recommender');
          setCurrentView('recommender');
        }}
        onOpenHistory={() => {
          window.history.pushState({}, '', '/history');
          setCurrentView('history');
        }}
        user={user}
        onOpenAuth={() => {
          window.history.pushState({}, '', '/signin');
          setCurrentView('signin');
        }}
        onSignOut={signOut}
        hasBaseline={baseline !== null}
        onGoHome={handleGoHome}
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
      />

      {/* 2. Top Metrics Strip */}
      <MetricsStrip metrics={simulationResult?.metrics} loading={loading} />

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/50 px-4 py-2 flex items-center justify-between text-xs text-red-700 dark:text-red-300 z-20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => triggerSimulation(nodes, edges, incomingTrafficRate, durationSeconds)}
            className="flex items-center gap-1 font-semibold text-red-800 dark:text-red-300 hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* 3. Three-Section Workspace */}
      <div className="flex flex-1 overflow-hidden relative w-full h-full">
        {/* Full Canvas: Interactive Architecture Diagram */}
        <main className="w-full h-full absolute inset-0 overflow-hidden bg-slate-50 dark:bg-[#090B10]">
          {isGeneratingArchitecture && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/95 dark:bg-[#0A0A0A]/95 border border-indigo-500/30 dark:border-indigo-500/40 text-slate-900 dark:text-white shadow-lg backdrop-blur-md text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
              <span>Synthesizing system architecture from requirements...</span>
            </div>
          )}
          <ArchitectureCanvas
            nodes={nodes}
            edges={edges}
            nodeResults={simulationResult?.nodeResults || {}}
            edgeResults={simulationResult?.edgeResults || {}}
            selectedNodeId={selectedNodeId}
            onSelectNode={handleSelectNode}
            onNodesChangePosition={handleNodesPositionChange}
            onAddEdge={handleAddEdge}
            onToggleEdge={handleToggleEdge}
            onDeleteEdge={handleDeleteEdge}
            onUpdateEdge={handleUpdateEdge}
            viewMode={viewMode}
            onToggleViewMode={handleToggleViewMode}
            isDark={isDark}
            isRunning={isRunning}
            isLeftCollapsed={isLeftCollapsed}
            isRightCollapsed={isRightCollapsed}
          />
        </main>

        {/* Mobile backdrop for overlay sidebars */}
        {(!isLeftCollapsed || !isRightCollapsed) && (
          <div
            onClick={() => {
              setIsLeftCollapsed(true);
              setIsRightCollapsed(true);
            }}
            className="md:hidden absolute inset-0 bg-black/25 dark:bg-black/50 z-15 backdrop-blur-[1px] transition-opacity cursor-pointer"
          />
        )}

        {/* Left Floating Panel: Whole Left Sidebar for AI Chat */}
        <div
          className={`absolute left-0 top-0 bottom-0 z-20 pointer-events-none transition-all duration-300 ease-in-out ${
            isLeftCollapsed ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'
          }`}
        >
          <div className="w-[calc(100vw-24px)] max-w-[340px] sm:w-[340px] h-full flex flex-col pointer-events-none py-2 sm:py-3.5 px-2 sm:px-3">
            <div className="pointer-events-auto h-full flex flex-col">
              <ContextualQuerySidebar
                activePrompt={activePromptText || 'Scalable distributed cloud architecture'}
                selectedAnswers={selectedAnswers}
                onAnswerSelected={(category, optionId) => {
                  const updated = { ...selectedAnswers, [category]: optionId };
                  setSelectedAnswers(updated);
                  handleGenerateFromPrompt(activePromptText, updated);
                }}
                onApplyRefinements={() => {
                  handleGenerateFromPrompt(activePromptText);
                }}
                onResetQuestions={() => {
                  setSelectedAnswers({});
                }}
                onSendCustomMessage={(msg) => {
                  handleRefinePrompt(msg);
                }}
                isGenerating={isGeneratingArchitecture}
                isHydrated={nodes.length > 0}
                isDark={isDark}
              />
            </div>
          </div>
        </div>

        {/* Re-expand trigger for left sidebar */}
        {isLeftCollapsed && (
          <button
            onClick={handleOpenLeft}
            className="absolute left-2 sm:left-3 top-1/4 -translate-y-1/2 z-30 p-2 sm:p-2.5 bg-white dark:bg-[#0A0A0A] hover:bg-slate-50 dark:hover:bg-[#141414] border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl shadow-none transition-colors cursor-pointer group"
            title="Expand AI Architect Chat"
          >
            <PanelLeftOpen className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100" />
          </button>
        )}

        {/* Re-expand trigger for right sidebar */}
        {isRightCollapsed && (
          <button
            onClick={handleOpenRight}
            className="absolute right-2 sm:right-3 top-1/4 -translate-y-1/2 z-30 p-2 sm:p-2.5 bg-white dark:bg-[#0A0A0A] hover:bg-slate-50 dark:hover:bg-[#141414] border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl shadow-none transition-colors cursor-pointer group"
            title="Expand right sidebar"
          >
            <PanelRightOpen className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100" />
          </button>
        )}

        {/* Right Floating Panel: Unified Tabbed Right Sidebar (Components | Inspector | Bottlenecks) */}
        <div
          className={`absolute right-0 top-0 bottom-0 z-20 pointer-events-none transition-all duration-300 ease-in-out ${
            isRightCollapsed ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
          }`}
        >
          <aside className="w-[calc(100vw-24px)] max-w-[340px] sm:w-[340px] bg-transparent h-full flex flex-col justify-center items-center py-2 sm:py-4 px-2 sm:px-3 shrink-0 overflow-hidden select-none pointer-events-none">
            <div className="pointer-events-auto w-full">
              <RightSidebar
                nodes={nodes}
                edges={edges}
                selectedNodeId={selectedNodeId}
                selectedNode={selectedNode}
                selectedNodeResult={selectedNodeResult}
                simulationResult={simulationResult}
                onSelectNode={handleSelectNode}
                onAddNode={handleAddNode}
                onDeleteNode={handleDeleteNode}
                onToggleNode={handleToggleNode}
                onUpdateNode={handleUpdateNode}
                onRestoreOriginal={handleRestoreOriginal}
                onUpdateEdgeMultiplier={handleUpdateEdgeMultiplier}
                onDeleteEdge={handleDeleteEdge}
                onChangeIncomingTrafficRate={handleTrafficChange}
                incomingTrafficRate={incomingTrafficRate}
                onNavigateToParent={handleNavigateToParent}
                viewMode={viewMode}
                onToggleCollapse={() => setIsRightCollapsed(true)}
              />
            </div>
          </aside>
        </div>
      </div>

      {/* Baseline Comparison Modal */}
      <BaselineComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        baseline={baseline}
        currentResult={simulationResult}
        currentScenarioName={
          scenarios.find((s) => s.id === currentScenarioId)?.name || 'Current Configuration'
        }
        onSaveAsBaseline={handleSaveBaseline}
      />

      {/* Repository Import Modal */}
      <RepositoryImportModal
        isOpen={isImportRepoOpen}
        onClose={() => setIsImportRepoOpen(false)}
        isUserAuthenticated={Boolean(user)}
        onRequireAuth={handleRequireAuthForRepo}
        onImportArchitecture={handleImportArchitecture}
      />

      {/* Modern Login / Signup Modal */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs">
          <ModernLoginSignup
            onClose={() => setIsAuthOpen(false)}
            onSuccess={(_user) => {
              setTimeout(() => setIsAuthOpen(false), 1200);
            }}
          />
        </div>
      )}
    </div>
  );
};

