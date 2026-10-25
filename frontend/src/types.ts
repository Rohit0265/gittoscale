export type ComponentType =
  | 'load_generator'
  | 'gateway'
  | 'service'
  | 'cache'
  | 'database';

export type OverflowPolicy = 'drop' | 'reject';
export type NodeStatus = 'normal' | 'warning' | 'overloaded' | 'disabled';
export type LatencyStatus = 'ok' | 'degraded' | 'unbounded';

export interface NodeConfig {
  baselineLatencyMs: number;
  maxQueueSize: number;
  overflowPolicy: OverflowPolicy;
  isSource?: boolean;
  defaultTrafficRate?: number;
  [key: string]: unknown;
}

export interface ArchitectureNode {
  id: string;
  name: string;
  type: ComponentType;
  position: { x: number; y: number };
  capacityPerSecond: number;
  workerCount: number;
  enabled: boolean;
  config: NodeConfig;
  parentId?: string;
  submoduleType?: string;
  category?: string;
  isGroup?: boolean;
  collapsed?: boolean;
  sourceFiles?: string[];
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  requestsPerInput: number;
  enabled: boolean;
  isBidirectional?: boolean;
  label?: string;
  dataFlowDescription?: string;
  communicationType?: string;
  customColor?: string;
}

export interface ArchitectureFixture {
  description: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  basicGraph?: ArchitectureFixture;
  detailedGraph?: ArchitectureFixture;
}

export interface ScenarioFixture {
  id: string;
  name: string;
  description: string;
  incomingTrafficRate: number;
  durationSeconds: number;
  nodeOverrides?: Record<string, Partial<ArchitectureNode>>;
  edgeOverrides?: Record<string, Partial<ArchitectureEdge>>;
}

export interface NodeSimulationResult {
  id: string;
  name: string;
  type: ComponentType;
  enabled: boolean;
  offeredRequestsPerSecond: number;
  effectiveCapacity: number;
  processedThroughput: number;
  offeredUtilization: number;
  effectiveUtilization: number;
  status: NodeStatus;
  queueLength: number;
  rejectedRequests: number;
  overflowPolicy: OverflowPolicy;
  estimatedLatencyMs: number;
  latencyStatus: LatencyStatus;
  isBottleneck: boolean;
  bottleneckSeverity: 'none' | 'warning' | 'critical';
  bottleneckReason?: string;
}

export interface EdgeSimulationResult {
  id: string;
  source: string;
  target: string;
  enabled: boolean;
  flowRate: number;
}

export interface BottleneckSummary {
  nodeId: string;
  nodeName: string;
  nodeType: ComponentType;
  severity: 'warning' | 'critical';
  offeredLoad: number;
  effectiveCapacity: number;
  utilization: number;
  queueLength: number;
  rejectedRequests: number;
  reason: string;
}

export interface MostConstrainedComponent {
  nodeId: string;
  nodeName: string;
  utilization: number;
  reason: string;
}

export interface TimeSeriesSample {
  time: number;
  offeredThroughput: number;
  completedThroughput: number;
  totalQueueLength: number;
  cumulativeDropped: number;
}

export interface SimulationSummaryMetrics {
  totalOfferedTraffic: number;
  completedThroughput: number;
  overloadedCount: number;
  maxUtilization: number;
  totalDroppedRequests: number;
  totalQueueLength: number;
}

export interface SimulationResult {
  metrics: SimulationSummaryMetrics;
  nodeResults: Record<string, NodeSimulationResult>;
  edgeResults: Record<string, EdgeSimulationResult>;
  bottlenecks: BottleneckSummary[];
  mostConstrainedComponent?: MostConstrainedComponent;
  timeSeries: TimeSeriesSample[];
  durationSeconds: number;
  assumptions: string[];
}

export interface BaselineSnapshot {
  timestamp: string;
  scenarioName: string;
  metrics: SimulationSummaryMetrics;
  nodeResults: Record<string, NodeSimulationResult>;
}

export type ArchitecturePattern =
  | 'Monolith'
  | 'Modular Monolith'
  | 'Microservices'
  | 'Event-Driven'
  | 'Serverless'
  | 'Hybrid';

export interface TechnologyRecommendation {
  category: string;
  name: string;
  reason: string;
  tradeoffs: string[];
  alternatives: string[];
}

export interface DataFlow {
  id: string;
  name: string;
  description: string;
  steps: string[];
}

export interface TradeoffDecision {
  decision: string;
  pros: string[];
  cons: string[];
}

export interface ArchitectureRecommendation {
  id: string;
  projectName: string;
  summary: string;
  architecturePattern: ArchitecturePattern;
  patternReasoning: string;
  requirements: {
    functional: string[];
    nonFunctional: string[];
    assumptions: string[];
    constraints: string[];
  };
  technologies: TechnologyRecommendation[];
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  dataFlows: DataFlow[];
  securityConsiderations: string[];
  scalingStrategy: string[];
  tradeoffs: TradeoffDecision[];
  futureImprovements: string[];
  clarifyingQuestions?: string[];
}

export interface RecommenderInput {
  projectDescription: string;
  expectedScale?: string;
  budgetConstraint?: string;
  preferredTech?: string[];
  deploymentPreference?: string;
  reliabilityRequirement?: string;
  securityRequirement?: string;
  teamSize?: string;
  refinementRequest?: string;
  llmConfig?: {
    provider?: string;
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  };
}


