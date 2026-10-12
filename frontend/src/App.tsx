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
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  // Fixture states
  const [defaultArchitecture, setDefaultArchitecture] = useState<ArchitectureFixture | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioFixture[]>([]);
  const [currentScenarioId, setCurrentScenarioId] = useState<string>('normal-traffic');

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

  // Baseline comparison
  const [baseline, setBaseline] = useState<BaselineSnapshot | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);

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

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedNodeResult = selectedNodeId ? simulationResult?.nodeResults[selectedNodeId] : undefined;

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
        hasBaseline={baseline !== null}
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
            className="flex items-center gap-1 font-semibold text-red-800 hover:underline"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* 3. Three-Section Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Panel: Component List & Traffic Controls */}
        <LeftSidebar
          incomingTrafficRate={incomingTrafficRate}
          onChangeTrafficRate={handleTrafficChange}
          durationSeconds={durationSeconds}
          onChangeDuration={handleDurationChange}
          nodes={nodes}
          edges={edges}
          nodeResults={simulationResult?.nodeResults || {}}
          selectedNodeId={selectedNodeId}
          onSelectNode={(id) => setSelectedNodeId(id)}
          onAddNode={handleAddNode}
          onDeleteNode={handleDeleteNode}
          onToggleNode={handleToggleNode}
          onRestoreOriginal={handleRestoreOriginal}
        />

        {/* Center Canvas: Interactive Architecture Diagram */}
        <main className="flex-1 h-full relative overflow-hidden bg-slate-50">
          <ArchitectureCanvas
            nodes={nodes}
            edges={edges}
            nodeResults={simulationResult?.nodeResults || {}}
            edgeResults={simulationResult?.edgeResults || {}}
            selectedNodeId={selectedNodeId}
            onSelectNode={(id) => setSelectedNodeId(id)}
            onNodesChangePosition={handleNodesPositionChange}
            onAddEdge={handleAddEdge}
            onToggleEdge={handleToggleEdge}
          />
        </main>

        {/* Right Panel: Selected Component Inspector OR Results & Bottlenecks */}
        <aside className="w-80 bg-white border-l border-slate-200 h-full flex flex-col shrink-0 z-10 overflow-hidden shadow-xs">
          {selectedNode ? (
            <ComponentInspector
              node={selectedNode}
              result={selectedNodeResult}
              edges={edges}
              onClose={() => setSelectedNodeId(null)}
              onUpdateNode={handleUpdateNode}
              onUpdateEdgeMultiplier={handleUpdateEdgeMultiplier}
              onChangeIncomingTrafficRate={
                selectedNode.type === 'load_generator' ? handleTrafficChange : undefined
              }
              incomingTrafficRate={incomingTrafficRate}
            />
          ) : (
            <BottleneckList
              simulationResult={simulationResult}
              nodes={nodes}
              onSelectNode={(id) => setSelectedNodeId(id)}
              selectedNodeId={selectedNodeId}
            />
          )}
        </aside>
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
    </div>
  );
};

