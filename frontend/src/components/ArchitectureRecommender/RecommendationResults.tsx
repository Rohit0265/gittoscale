import React, { useState } from 'react';
import {
  Zap,
  RotateCcw,
  Download,
  Shield,
  TrendingUp,
  Cpu,
  Layers,
  HelpCircle,
  Send,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  ArchitectureRecommendation,
  ArchitectureNode,
  ArchitectureEdge,
} from '../../types';
import { ArchitectureCanvas } from '../Canvas/ArchitectureCanvas';

interface RecommendationResultsProps {
  recommendation: ArchitectureRecommendation;
  onSimulate: (nodes: ArchitectureNode[], edges: ArchitectureEdge[]) => void;
  onEditPrompt: () => void;
  onRefine: (refinementText: string) => void;
  isRefining: boolean;
  isDark?: boolean;
}

type TabType = 'diagram' | 'tech' | 'flows' | 'security' | 'tradeoffs';

export const RecommendationResults: React.FC<RecommendationResultsProps> = ({
  recommendation,
  onSimulate,
  onEditPrompt,
  onRefine,
  isRefining,
  isDark = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('diagram');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [refinementInput, setRefinementInput] = useState('');

  const selectedNode = recommendation.nodes.find((n) => n.id === selectedNodeId);

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(recommendation, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${recommendation.projectName.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}-architecture.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRefineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinementInput.trim() || isRefining) return;
    onRefine(refinementInput.trim());
    setRefinementInput('');
  };

  const handleQuickRefine = (text: string) => {
    if (isRefining) return;
    onRefine(text);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate-50 dark:bg-[#090B10]">
      {/* Top Header Bar */}
      <div className="border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0C] px-4 py-3 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onEditPrompt}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
            title="Edit requirements prompt"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-md">
                {recommendation.projectName}
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                {recommendation.architecturePattern}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 line-clamp-1 max-w-2xl">
              {recommendation.summary}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all cursor-pointer"
            title="Download machine-readable architecture JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>

          <button
            onClick={() => onSimulate(recommendation.nodes, recommendation.edges)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer"
            title="Load this architecture into GitToScale's live traffic simulator"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Simulate Architecture</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-neutral-800 bg-slate-100/70 dark:bg-[#0D0E12] px-4 sm:px-6 flex items-center justify-between shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 sm:gap-2">
          {[
            { id: 'diagram', label: 'System Diagram', icon: Layers },
            { id: 'tech', label: 'Technology Stack', icon: Cpu },
            { id: 'flows', label: 'Data Flows', icon: Zap },
            { id: 'security', label: 'Security & Scaling', icon: Shield },
            { id: 'tradeoffs', label: 'Trade-offs & Assumptions', icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                    : 'border-transparent text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400 py-1">
          <span>{recommendation.nodes.length} Components</span>
          <span>•</span>
          <span>{recommendation.edges.length} Connections</span>
        </div>
      </div>

      {/* Main Tab Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* Tab 1: Interactive System Diagram */}
        {activeTab === 'diagram' && (
          <div className="w-full h-full relative">
            <ArchitectureCanvas
              nodes={recommendation.nodes}
              edges={recommendation.edges}
              nodeResults={{}}
              edgeResults={{}}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onNodesChangePosition={() => {}}
              onAddEdge={() => {}}
              onToggleEdge={() => {}}
              isDark={isDark}
              isRunning={false}
            />

            {/* Selected Node Details Floating Drawer */}
            {selectedNode && (
              <div className="absolute top-4 right-4 z-20 w-80 max-w-[calc(100vw-32px)] rounded-xl border border-slate-200 dark:border-neutral-800 bg-white/95 dark:bg-[#0E0E12]/95 backdrop-blur-md p-4 shadow-xl text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {selectedNode.name}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2 text-slate-600 dark:text-neutral-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type:</span>
                    <span className="font-semibold capitalize text-slate-800 dark:text-neutral-200">
                      {selectedNode.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Est. Capacity:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                      {selectedNode.capacityPerSecond} req/s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Worker Units:</span>
                    <span className="font-mono">{selectedNode.workerCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Baseline Latency:</span>
                    <span className="font-mono">{Number(selectedNode.config.baselineLatencyMs ?? 10)}ms</span>
                  </div>

                  {Boolean(selectedNode.config.reason) && (
                    <div className="pt-2 border-t border-slate-100 dark:border-neutral-800/80">
                      <span className="text-[11px] text-slate-400 block mb-0.5">Architecture Purpose:</span>
                      <p className="text-[11px] text-slate-700 dark:text-neutral-300 leading-relaxed">
                        {String(selectedNode.config.reason)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Technology Stack & Trade-offs */}
        {activeTab === 'tech' && (
          <div className="w-full h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="mb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Recommended Technology Stack
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
                  Carefully selected components with architectural justification, explicit trade-offs, and reasonable alternatives.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendation.technologies.map((tech, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0C] p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {tech.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100 mb-1.5">
                      {tech.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed mb-3">
                      {tech.reason}
                    </p>

                    <div className="space-y-2 text-xs border-t border-slate-100 dark:border-neutral-800/80 pt-2.5">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 block mb-1">
                          Key Trade-offs:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-neutral-400 text-[11px]">
                          {tech.tradeoffs.map((to, i) => (
                            <li key={i}>{to}</li>
                          ))}
                        </ul>
                      </div>

                      {tech.alternatives.length > 0 && (
                        <div>
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 block mb-1">
                            Viable Alternatives:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {tech.alternatives.map((alt, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800/70 text-slate-600 dark:text-neutral-400 text-[10px]"
                              >
                                {alt}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Data Flows */}
        {activeTab === 'flows' && (
          <div className="w-full h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="mb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Core System Data Flows
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
                  Step-by-step traversal journeys illustrating how critical requests move through the architecture.
                </p>
              </div>

              <div className="space-y-4">
                {recommendation.dataFlows.map((flow) => (
                  <div
                    key={flow.id}
                    className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0C] p-5 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-slate-700 dark:text-neutral-300 shrink-0" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {flow.name}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 mb-4">
                      {flow.description}
                    </p>

                    <div className="space-y-2 border-l-2 border-indigo-500/30 dark:border-indigo-500/20 pl-4 ml-1">
                      {flow.steps.map((step, idx) => (
                        <div key={idx} className="relative">
                          <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500" />
                          <p className="text-xs text-slate-700 dark:text-neutral-200 font-medium">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Security & Scalability */}
        {activeTab === 'security' && (
          <div className="w-full h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Security Section */}
              <div className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0C] p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-slate-700 dark:text-neutral-300 shrink-0" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Security & Data Protection Architecture
                  </h3>
                </div>
                <ul className="space-y-2">
                  {recommendation.securityConsiderations.map((sec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-neutral-300">
                      <CheckCircle2 className="w-4 h-4 text-slate-700 dark:text-neutral-300 shrink-0 mt-0.5" />
                      <span>{sec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Scalability Section */}
              <div className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0C] p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-slate-700 dark:text-neutral-300 shrink-0" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Evolutionary Scaling Roadmap
                  </h3>
                </div>
                <div className="space-y-3">
                  {recommendation.scalingStrategy.map((strat, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-100 dark:border-neutral-800/80 bg-slate-50/50 dark:bg-neutral-900/30"
                    >
                      <p className="text-xs text-slate-700 dark:text-neutral-200 font-medium">
                        {strat}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Trade-offs & Assumptions */}
        {activeTab === 'tradeoffs' && (
          <div className="w-full h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Pattern Rationale */}
              <div className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0C] p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  Why {recommendation.architecturePattern}?
                </h3>
                <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
                  {recommendation.patternReasoning}
                </p>
              </div>

              {/* Trade-offs Matrix */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                  Key Architectural Trade-offs
                </h3>
                {recommendation.tradeoffs.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0C] p-4 shadow-sm"
                  >
                    <div className="font-semibold text-xs text-slate-900 dark:text-white mb-2">
                      {item.decision}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
                          Benefits (Pros)
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-emerald-800 dark:text-emerald-300 text-[11px]">
                          {item.pros.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                        <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block mb-1">
                          Compromises (Cons)
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-amber-800 dark:text-amber-300 text-[11px]">
                          {item.cons.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Assumptions & Unresolved Questions */}
              {recommendation.requirements.assumptions.length > 0 && (
                <div className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0C] p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-slate-400" />
                    <h3 className="text-xs font-bold text-slate-800 dark:text-neutral-200">
                      Assumptions Made During Evaluation
                    </h3>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 dark:text-neutral-400">
                    {recommendation.requirements.assumptions.map((ass, i) => (
                      <li key={i}>{ass}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Refinement Bar (Section 8: Handle Follow-up Changes) */}
      <div className="border-t border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0C] p-3 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Quick Refine Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-medium text-slate-400 shrink-0">Refine:</span>
            {[
              'Switch to Serverless architecture',
              'Reduce infrastructure costs',
              'Add Redis caching tier',
              'Scale for 10x traffic spike',
              'Decompose to microservices',
            ].map((pill, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickRefine(pill)}
                disabled={isRefining}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/60 text-slate-600 dark:text-neutral-300 hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
              >
                + {pill}
              </button>
            ))}
          </div>

          {/* Refine Custom Input */}
          <form onSubmit={handleRefineSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={refinementInput}
              onChange={(e) => setRefinementInput(e.target.value)}
              placeholder="Ask for an architectural modification (e.g. 'Use Kafka for real-time order streams' or 'Replace Mongo with Postgres')..."
              disabled={isRefining}
              className="flex-1 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-[#121214] px-3.5 py-2 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
            <button
              type="submit"
              disabled={!refinementInput.trim() || isRefining}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer ${
                !refinementInput.trim() || isRefining
                  ? 'bg-slate-300 dark:bg-neutral-800 cursor-not-allowed text-slate-500'
                  : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              {isRefining ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Refine</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
