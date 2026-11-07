import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
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
import { executeArchitectureCommand, isArchitectureGenerationRequest } from '../../services/aiAgentExecutor';
import { toVerticalTree } from '../../utils/treeLayout';
import { buildDetailedArchitecture } from '../../utils/detailedArchitecture';
import { useAuth } from '../../contexts/AuthContext';
import {
  usePlaygroundPersistence,
  loadPlaygroundFromBrowserStorage,
} from '../../services/playgroundPersistence';
import { AutoSaveIndicator } from '../common/AutoSaveIndicator';
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

  // View mode: 'detailed' (only detailed design)
  const [viewMode, setViewMode] = useState<'basic' | 'detailed'>('detailed');

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

  const { user, getAuthToken } = useAuth();

  // Universal Auto-Save: Automatically saves playground edits to browser storage immediately,
  // then debounces persistence to the real database to prevent data loss upon PC shutdown.
  const { saveStatus, lastSaved, forceSyncNow } = usePlaygroundPersistence({
    projectId,
    prompt,
    title: recommendation?.projectName,
    nodes: activeNodes,
    edges: activeEdges,
    incomingTrafficRate: 1000,
    viewMode,
    selectedAnswers,
    basicGraph,
    detailedGraph,
    user,
    getAuthToken,
    enabled: viewState === 'hydrated' && activeNodes.length > 0,
  });

  // Restore from browser storage on mount (instant recovery upon PC shutdown / reload)
  useEffect(() => {
    const saved = loadPlaygroundFromBrowserStorage(projectId);
    if (saved && saved.nodes && saved.nodes.length > 0) {
      if (saved.basicGraph?.nodes?.length) {
        setBasicGraph(saved.basicGraph);
      } else {
        const vertical = toVerticalTree(saved.nodes, saved.edges || []);
        setBasicGraph({ nodes: vertical, edges: saved.edges || [] });
      }
      if (saved.detailedGraph?.nodes?.length) {
        setDetailedGraph(saved.detailedGraph);
      } else {
        const detailed = buildDetailedArchitecture(saved.nodes, saved.edges || [], saved.prompt || prompt);
        setDetailedGraph({ nodes: toVerticalTree(detailed.nodes, detailed.edges), edges: detailed.edges });
      }
      if (saved.viewMode) setViewMode(saved.viewMode);
      if (saved.selectedAnswers) setSelectedAnswers(saved.selectedAnswers);
      if (saved.prompt) setPrompt(saved.prompt);
      setViewState('hydrated');
      return;
    }

    // Secondary recovery from Cloud Database if user is logged in
    const token = getAuthToken ? getAuthToken() : null;
    if (token && projectId) {
      api.getArchitectureHistoryById(token, projectId)
        .then((res) => {
          if (res?.success && res?.data?.architecture_data?.nodes?.length > 0) {
            const archData = res.data.architecture_data;
            const genConfig = res.data.generation_config;
            const vNodes = toVerticalTree(archData.nodes, archData.edges || []);
            const bGraph = archData.basicGraph || { nodes: vNodes, edges: archData.edges || [] };
            setBasicGraph(bGraph);
            if (archData.detailedGraph) {
              setDetailedGraph(archData.detailedGraph);
            } else {
              const detailed = buildDetailedArchitecture(archData.nodes, archData.edges || [], res.data.prompt || prompt);
              setDetailedGraph({ nodes: toVerticalTree(detailed.nodes, detailed.edges), edges: detailed.edges });
            }
            if (genConfig?.viewMode) setViewMode(genConfig.viewMode);
            if (genConfig?.selectedAnswers) setSelectedAnswers(genConfig.selectedAnswers);
            if (res.data.prompt) setPrompt(res.data.prompt);
            setViewState('hydrated');
          }
        })
        .catch(() => {});
    }
  }, [projectId]);

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

      const preferredTech: string[] = [];
      if (selectedAnswers?.consistency === 'consistency_eventual') {
        preferredTech.push('Event-Driven Queue');
      } else if (selectedAnswers?.consistency === 'consistency_strong') {
        preferredTech.push('Strong Consistency ACID');
      }
      if (selectedAnswers?.region === 'deploy_multiregion') {
        preferredTech.push('Global Multi-Region');
      }

      const payload: RecommenderInput = {
        projectDescription: customRefinement || prompt || 'Scalable distributed cloud architecture',
        expectedScale: selectedAnswers.scale ? scaleMap[selectedAnswers.scale] : undefined,
        budgetConstraint: selectedAnswers.budget ? budgetMap[selectedAnswers.budget] : undefined,
        preferredTech: preferredTech.length > 0 ? preferredTech : undefined,
        deploymentPreference:
          selectedAnswers.region === 'deploy_multiregion'
            ? 'Multi-Region Active/Active'
            : undefined,
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
    chatHistory: any[],
    onToken?: (token: string, fullText: string) => void
  ): Promise<{ reply: string; actionDone?: string; updatedAnswers?: any } | void> => {
    // 1. Analyze command (DO NOT mutate canvas state yet!)
    const execResult = executeArchitectureCommand(
      command,
      activeNodes,
      activeEdges,
      1000,
      null,
      chatHistory,
      viewMode
    );

    const isSystemGeneration = !execResult.executed && isArchitectureGenerationRequest(command, activeNodes.length);
    let targetPrompt = command;
    let generationPromise: Promise<any> | null = null;

    if (isSystemGeneration) {
      const lowerCmd = command.toLowerCase();
      const isMetaCanvasQuery =
        lowerCmd.includes('didnt show') ||
        lowerCmd.includes("didn't show") ||
        lowerCmd.includes('show the architect') ||
        lowerCmd.includes('show the architecture') ||
        lowerCmd.includes('show architecture') ||
        lowerCmd.includes('in the canvas') ||
        lowerCmd.includes('on the canvas') ||
        lowerCmd.includes('on canvas') ||
        lowerCmd.includes('canvas didnt update') ||
        lowerCmd.includes("canvas didn't update");

      if (isMetaCanvasQuery) {
        if (prompt && prompt.trim().length > 0) {
          targetPrompt = prompt;
        } else {
          const pastUserMsg = [...chatHistory]
            .reverse()
            .find(
              (m: any) =>
                m.sender === 'user' &&
                m.text &&
                !m.text.toLowerCase().includes('canvas') &&
                !m.text.toLowerCase().includes('didnt show') &&
                !m.text.toLowerCase().includes("didn't show")
            );
          targetPrompt =
            pastUserMsg?.text ||
            'Scalable distributed cloud architecture with API Gateway, microservices, and database';
        }
      }

      setPrompt((prev) => (prev ? `${prev} • ${targetPrompt}` : targetPrompt));
      generationPromise = api
        .recommendArchitecture({
          projectDescription: targetPrompt,
        })
        .catch((err) => {
          console.warn('[ProjectWorkspace] Generation error:', err);
          return null;
        });
    }

    const isRefinementInstruction =
      !isSystemGeneration &&
      (/(?:add|remove|delete|scale|connect|disconnect|update|change|increase|decrease|optimize|refine|improve|tune|set|modify|replace|insert|attach|put|deploy|provision|integrate|include)\s+/i.test(
        command
      ) ||
      /(?:more|higher|lower|less|better)\s+(?:capacity|workers|traffic|load|latency|throughput|cache|replicas)/i.test(
        command
      ));

    let refinementPromise: Promise<any> | null = null;
    if (isRefinementInstruction) {
      refinementPromise = api
        .recommendArchitecture({
          projectDescription: prompt || 'System Blueprint',
          refinementRequest: command,
        })
        .catch((err) => {
          console.warn('[ProjectWorkspace] Architecture refinement error:', err);
          return null;
        });
    }

    // 2. Stream AI response with zero premature canvas mutation
    const REFUSAL_TEST_REGEX = /(?:my apologies|as an ai(?: assistant)?|don'?t have (?:direct )?programmatic control|you are the one driving|click the (?:add node|create component))/i;
    let streamedRefusalDetected = false;
    const fallbackExecExplanation = (execResult.executed && execResult.explanation) ? execResult.explanation : '';

    try {
      const aiResponse = await api.streamChatMessage(
        null,
        {
          message: command,
          history: chatHistory,
          architectureContext: {
            nodes: activeNodes,
            edges: activeEdges,
            trafficRate: 1000,
            bottlenecks: [],
            projectDescription: prompt || projectId || undefined,
            activePrompt: prompt || undefined,
          },
        },
        (tokenChunk, fullText) => {
          if (REFUSAL_TEST_REGEX.test(fullText)) {
            streamedRefusalDetected = true;
            if (fallbackExecExplanation) {
              onToken?.('', fallbackExecExplanation);
            }
            return;
          }
          if (!streamedRefusalDetected) {
            onToken?.(tokenChunk, fullText);
          }
        }
      );

      // 3. AI response stream has now COMPLETELY ENDED. Apply canvas topology updates!
      if (generationPromise) {
        const gen = await generationPromise;
        if (gen?.nodes?.length > 0) {
          const verticalBasicNodes = toVerticalTree(gen.nodes, gen.edges);
          setBasicGraph({ nodes: verticalBasicNodes, edges: gen.edges });
          const detailed = buildDetailedArchitecture(gen.nodes, gen.edges, targetPrompt);
          const verticalDetailedNodes = toVerticalTree(detailed.nodes, detailed.edges);
          setDetailedGraph({ nodes: verticalDetailedNodes, edges: detailed.edges });
          setViewState('hydrated');
        }
      } else if (refinementPromise) {
        const refined = await refinementPromise;
        if (refined?.nodes?.length > 0) {
          const verticalBasicNodes = toVerticalTree(refined.nodes, refined.edges);
          setBasicGraph({ nodes: verticalBasicNodes, edges: refined.edges });
          const detailed = buildDetailedArchitecture(refined.nodes, refined.edges, prompt);
          const verticalDetailedNodes = toVerticalTree(detailed.nodes, detailed.edges);
          setDetailedGraph({ nodes: verticalDetailedNodes, edges: detailed.edges });
          setViewState('hydrated');
        }
      } else if (execResult.executed) {
        if (execResult.targetViewMode && execResult.targetViewMode !== viewMode) {
          setViewMode(execResult.targetViewMode);
        }

        if (execResult.updatedNodes && execResult.updatedEdges) {
          if (execResult.targetViewMode === 'detailed' || viewMode === 'detailed') {
            setDetailedGraph({ nodes: execResult.updatedNodes, edges: execResult.updatedEdges });

            if (execResult.actionType === 'delete_node' && execResult.reflectedDeletedTypes) {
              const delTypes = new Set(execResult.reflectedDeletedTypes);
              setBasicGraph((prev) => {
                const remNodes = prev.nodes.filter((n) => !delTypes.has(n.type));
                const remIds = new Set(remNodes.map((n) => n.id));
                const remEdges = prev.edges.filter((e) => remIds.has(e.source) && remIds.has(e.target));
                return { nodes: remNodes, edges: remEdges };
              });
            }
          } else {
            setBasicGraph({ nodes: execResult.updatedNodes, edges: execResult.updatedEdges });

            if (execResult.actionType !== 'delete_node') {
              const detailed = buildDetailedArchitecture(execResult.updatedNodes, execResult.updatedEdges, command);
              const verticalDetailedNodes = toVerticalTree(detailed.nodes, detailed.edges);
              setDetailedGraph({ nodes: verticalDetailedNodes, edges: detailed.edges });
            }

            if (execResult.actionType === 'delete_node' && execResult.reflectedDeletedTypes) {
              const delTypes = new Set(execResult.reflectedDeletedTypes);
              setDetailedGraph((prev) => {
                const remNodes = prev.nodes.filter((n) => !delTypes.has(n.type));
                const remIds = new Set(remNodes.map((n) => n.id));
                const remEdges = prev.edges.filter((e) => remIds.has(e.source) && remIds.has(e.target));
                return { nodes: remNodes, edges: remEdges };
              });
            }
          }
        }
      }

      const effectiveReply =
        ((streamedRefusalDetected || REFUSAL_TEST_REGEX.test(aiResponse?.reply || '')) && fallbackExecExplanation)
          ? fallbackExecExplanation
          : (aiResponse?.reply || fallbackExecExplanation);

      if (effectiveReply) {
        return {
          reply: effectiveReply,
          actionDone: execResult.executed ? execResult.actionType : aiResponse?.actionDone,
        };
      }
    } catch (e) {
      console.warn('[ProjectWorkspace] AI Chat failed:', e);
      const errMsg = fallbackExecExplanation || 'Traffic is more than expected. Please retry later.';
      onToken?.(errMsg, errMsg);
      return {
        reply: errMsg,
        actionDone: execResult.executed ? execResult.actionType : undefined,
      };
    }

    const fallbackMsg = fallbackExecExplanation || 'Traffic is more than expected. Please retry later.';
    onToken?.(fallbackMsg, fallbackMsg);
    return {
      reply: fallbackMsg,
      actionDone: execResult.executed ? execResult.actionType : undefined,
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
            className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white text-xs font-medium transition-colors cursor-pointer shrink-0"
            title="Return to Landing Page"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 group-hover:text-indigo-500 transition-all" />
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
          {/* Universal Auto-Save Status Indicator */}
          {activeNodes.length > 0 && (
            <AutoSaveIndicator
              status={saveStatus}
              lastSaved={lastSaved}
              onForceSync={forceSyncNow}
            />
          )}

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
            className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-indigo-500 transition-colors cursor-pointer hidden md:flex"
            title="Export architecture as JSON"
          >
            <Download className="w-4 h-4 hover:text-indigo-500 transition-colors" />
          </button>

          {/* Theme Toggle */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-slate-700 dark:text-neutral-300 hover:text-amber-400 transition-colors" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 dark:text-neutral-300 hover:text-blue-400 transition-colors" />
              )}
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Workspace Split View */}
      <div className="flex-1 flex w-full overflow-hidden">
        {/* Left Sidebar: ChatGPT-style Conversational Assistant */}
        <ContextualQuerySidebar
          projectId={projectId}
          activePrompt={prompt}
          selectedAnswers={selectedAnswers}
          onAnswerSelected={handleAnswerSelected}
          onApplyRefinements={handleHydrateArchitecture}
          onResetQuestions={handleResetQuestions}
          onSendCustomMessage={handleCustomChatMessage}
          onExecuteChatCommand={handleExecuteWorkspaceChatCommand}
          nodes={activeNodes}
          edges={activeEdges}
          incomingTrafficRate={1000}
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
