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
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  requestsPerInput: number;
  enabled: boolean;
}

export interface ArchitectureFixture {
  description: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
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

export interface SimulationParams {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  incomingTrafficRate: number;
  durationSeconds: number;
  scenarioId?: string;
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
