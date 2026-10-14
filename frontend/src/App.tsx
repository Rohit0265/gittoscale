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
} from './types';
import { Header } from './components/Header';
import { MetricsStrip } from './components/MetricsStrip';
import { LeftSidebar } from './components/LeftSidebar';
import { ArchitectureCanvas } from './components/Canvas/ArchitectureCanvas';
import { ComponentInspector } from './components/ComponentInspector';
import { BottleneckList } from './components/BottleneckList';
import { BaselineComparisonModal } from './components/BaselineComparisonModal';
import { RepositoryImportModal } from './components/RepositoryImportModal';
import { LandingPage } from './components/LandingPage';
import { ScrollTimeline } from './components/lightswind/scroll-timeline';
import { AlertCircle, RefreshCw, PanelLeftOpen, PanelRightOpen } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation mode: 'landing' | 'simulator'
  const [currentView, setCurrentView] = useState<'landing' | 'simulator'>('landing');

  // Sidebar collapse states
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(false);

  // Fixture states
  const [defaultArchitecture, setDefaultArchitecture] = useState<ArchitectureFixture | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioFixture[]>([]);
  const [currentScenarioId, setCurrentScenarioId] = useState<string>('normal-traffic');

  // Architecture view mode: 'basic' (default) | 'detailed'
  const [viewMode, setViewMode] = useState<'basic' | 'detailed'>('basic');

  // Caches for instant switching between Basic and Detailed views
  const basicGraphCacheRef = useRef<{ nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } | null>(null);
  const detailedGraphCacheRef = useRef<{ nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } | null>(null);

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
      if (id && isRightCollapsed) {
        setIsRightCollapsed(false);
      }
    },
    [isRightCollapsed]
  );

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

        // Populate basic & detailed cache
        basicGraphCacheRef.current = { nodes: arch.nodes, edges: arch.edges };
        if (arch.detailedGraph) {
          detailedGraphCacheRef.current = {
            nodes: arch.detailedGraph.nodes,
            edges: arch.detailedGraph.edges,
          };
        }

        // Apply normal traffic scenario by default
        applyScenario('normal-traffic', arch, scens);
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

  // 3. Apply scenario logic
  const applyScenario = (
    scenarioId: string,
    archFixture = defaultArchitecture,
    scensList = scenarios
  ) => {
    if (!archFixture) return;
    const scen = scensList.find((s) => s.id === scenarioId);
    if (!scen) return;

    setCurrentScenarioId(scenarioId);
    const targetRate = scen.incomingTrafficRate;
    const targetDuration = scen.durationSeconds;
    setIncomingTrafficRate(targetRate);
    setDurationSeconds(targetDuration);

    // Deep clone nodes and edges from fixture
    let newNodes: ArchitectureNode[] = JSON.parse(JSON.stringify(archFixture.nodes));
    let newEdges: ArchitectureEdge[] = JSON.parse(JSON.stringify(archFixture.edges));

    // Apply node overrides
    if (scen.nodeOverrides) {
      newNodes = newNodes.map((node) => {
        const override = scen.nodeOverrides?.[node.id];
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
    if (scen.edgeOverrides) {
      newEdges = newEdges.map((edge) => {
        const override = scen.edgeOverrides?.[edge.id];
        if (override) {
          return { ...edge, ...override };
        }
        return edge;
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
    triggerSimulation(newNodes, newEdges, targetRate, targetDuration);
  };

  // 4. Parameter handlers
  const handleTrafficChange = (newRate: number) => {
    setIncomingTrafficRate(newRate);
    queueSimulation(nodes, edges, newRate, durationSeconds);
  };

  const handleDurationChange = (newDuration: number) => {
    setDurationSeconds(newDuration);
    queueSimulation(nodes, edges, incomingTrafficRate, newDuration);
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
    const updated = [...edges, newEdge];
    setEdges(updated);
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

  const handleUpdateEdgeMultiplier = (edgeId: string, multiplier: number) => {
    const updated = edges.map((e) =>
      e.id === edgeId ? { ...e, requestsPerInput: multiplier } : e
    );
    setEdges(updated);
    queueSimulation(nodes, updated, incomingTrafficRate, durationSeconds);
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
  const handleImportArchitecture = (
    newNodes: ArchitectureNode[],
    newEdges: ArchitectureEdge[],
    _repoName: string,
    basicGraph?: { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] },
    detailedGraph?: { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] }
  ) => {
    if (basicGraph) basicGraphCacheRef.current = basicGraph;
    if (detailedGraph) detailedGraphCacheRef.current = detailedGraph;

    setViewMode('basic');
    const nodesToRender = basicGraph ? basicGraph.nodes : newNodes;
    const edgesToRender = basicGraph ? basicGraph.edges : newEdges;
    setNodes(nodesToRender);
    setEdges(edgesToRender);
    setSelectedNodeId(null);
    triggerSimulation(nodesToRender, edgesToRender, incomingTrafficRate, durationSeconds);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedNodeResult = selectedNodeId ? simulationResult?.nodeResults[selectedNodeId] : undefined;

  if (currentView === 'landing') {
    return (
      <div className="min-h-screen w-full flex flex-col">
        <LandingPage
          onSelectTestSite={() => {
            setCurrentView('simulator');
            if (defaultArchitecture && nodes.length === 0) {
              applyScenario('normal-traffic', defaultArchitecture, scenarios);
            }
          }}
          onSelectUseRepository={() => {
            setIsImportRepoOpen(true);
          }}
        >
          {/* Scroll Timeline Component */}
          <section className="w-full py-8 border-t border-slate-200/80 bg-slate-50/50">
            <ScrollTimeline
              title="Simulation & Scaling Journey"
              subtitle="Scroll down to explore how GitToScale maps architectures, injects traffic, and pinpoints system bottlenecks"
              cardEffect="shadow"
              cardVariant="elevated"
            />
          </section>
        </LandingPage>
        <RepositoryImportModal
          isOpen={isImportRepoOpen}
          onClose={() => setIsImportRepoOpen(false)}
          onImportArchitecture={(newNodes, newEdges, repoName, basicGraph, detailedGraph) => {
            handleImportArchitecture(newNodes, newEdges, repoName, basicGraph, detailedGraph);
            setCurrentView('simulator');
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans">
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
        hasBaseline={baseline !== null}
        onGoHome={() => setCurrentView('landing')}
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        isLeftCollapsed={isLeftCollapsed}
        isRightCollapsed={isRightCollapsed}
        onToggleLeft={() => setIsLeftCollapsed(!isLeftCollapsed)}
        onToggleRight={() => setIsRightCollapsed(!isRightCollapsed)}
      />

      {/* 2. Top Metrics Strip */}
      <MetricsStrip metrics={simulationResult?.metrics} loading={loading} />

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between text-xs text-red-700 z-20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => triggerSimulation(nodes, edges, incomingTrafficRate, durationSeconds)}
            className="flex items-center gap-1 font-semibold text-red-800 hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* 3. Three-Section Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Panel: Component List & Traffic Controls */}
        <div
          className={`transition-all duration-300 ease-in-out flex shrink-0 z-10 overflow-hidden ${
            isLeftCollapsed ? 'w-0' : 'w-72'
          }`}
        >
          <div className="w-72 h-full flex flex-col">
            <LeftSidebar
              incomingTrafficRate={incomingTrafficRate}
              onChangeTrafficRate={handleTrafficChange}
              durationSeconds={durationSeconds}
              onChangeDuration={handleDurationChange}
              nodes={nodes}
              edges={edges}
              nodeResults={simulationResult?.nodeResults || {}}
              selectedNodeId={selectedNodeId}
              onSelectNode={handleSelectNode}
              onAddNode={handleAddNode}
              onDeleteNode={handleDeleteNode}
              onToggleNode={handleToggleNode}
              onRestoreOriginal={handleRestoreOriginal}
              onOpenImportRepo={() => setIsImportRepoOpen(true)}
              onToggleCollapse={() => setIsLeftCollapsed(true)}
            />
          </div>
        </div>

        {/* Center Canvas: Interactive Architecture Diagram */}
        <main className="flex-1 h-full relative overflow-hidden bg-slate-50">
          {/* Floating trigger to expand left sidebar when collapsed */}
          {isLeftCollapsed && (
            <button
              onClick={() => setIsLeftCollapsed(false)}
              className="absolute left-3 top-3 z-30 flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 backdrop-blur-xs border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 rounded-lg shadow-sm hover:shadow transition-all text-xs font-semibold cursor-pointer group"
              title="Expand Traffic & Components panel"
            >
              <PanelLeftOpen className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
              <span>Traffic & Components</span>
            </button>
          )}

          {/* Floating trigger to expand right sidebar when collapsed */}
          {isRightCollapsed && (
            <button
              onClick={() => setIsRightCollapsed(false)}
              className="absolute right-3 top-3 z-30 flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 backdrop-blur-xs border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 rounded-lg shadow-sm hover:shadow transition-all text-xs font-semibold cursor-pointer group"
              title="Expand Analysis & Bottlenecks panel"
            >
              <span>{selectedNode ? 'Component Inspector' : 'Analysis & Bottlenecks'}</span>
              <PanelRightOpen className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
            </button>
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
            viewMode={viewMode}
            onToggleViewMode={handleToggleViewMode}
          />
        </main>

        {/* Right Panel: Selected Component Inspector OR Results & Bottlenecks */}
        <div
          className={`transition-all duration-300 ease-in-out flex shrink-0 z-10 overflow-hidden ${
            isRightCollapsed ? 'w-0' : 'w-80'
          }`}
        >
          <aside className="w-80 bg-white border-l border-slate-200 h-full flex flex-col shrink-0 overflow-hidden shadow-xs">
            {selectedNode ? (
              <ComponentInspector
                node={selectedNode}
                result={selectedNodeResult}
                edges={edges}
                onClose={() => setSelectedNodeId(null)}
                onUpdateNode={handleUpdateNode}
                onUpdateEdgeMultiplier={handleUpdateEdgeMultiplier}
                onDeleteEdge={handleDeleteEdge}
                onChangeIncomingTrafficRate={
                  selectedNode.type === 'load_generator' ? handleTrafficChange : undefined
                }
                incomingTrafficRate={incomingTrafficRate}
                onNavigateToParent={handleNavigateToParent}
                viewMode={viewMode}
                allNodes={nodes}
                onToggleCollapse={() => setIsRightCollapsed(true)}
              />
            ) : (
              <BottleneckList
                simulationResult={simulationResult}
                nodes={nodes}
                onSelectNode={handleSelectNode}
                selectedNodeId={selectedNodeId}
                onToggleCollapse={() => setIsRightCollapsed(true)}
              />
            )}
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
        onImportArchitecture={handleImportArchitecture}
      />
    </div>
  );
};

