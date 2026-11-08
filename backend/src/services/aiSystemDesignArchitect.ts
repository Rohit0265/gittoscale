import { ArchitectureNode, ArchitectureEdge } from '../simulation/types.js';
import { LLMConfig } from './architectureRecommender.js';

export interface SystemDesignArchitectInput {
  mode?: 'mode_a' | 'mode_b' | 'mode_c';
  // Mode A — Repository-Based Design
  repositoryUrl?: string;
  repositoryAnalysis?: any;
  // Mode B — Prompt-Based Design
  systemDescription?: string;
  functionalRequirements?: string[];
  nonFunctionalRequirements?: string[];
  technologyStack?: string[];
  // Mode C — Repository + Scaling Requirements
  scalingTarget?: string;
  requiredImprovements?: string[];
  // Shared
  expectedTraffic?: string;
  additionalRequirements?: string;
  llmConfig?: LLMConfig;
}

export interface SystemDesignReportResult {
  title: string;
  systemOverview: string;
  mermaidDiagram: string;
  componentResponsibilities: Array<{ component: string; layer: string; responsibility: string }>;
  requestFlow: string[];
  capacityEstimation: {
    dailyRequests: number;
    averageRps: number;
    peakMultiplier: number;
    peakRps: number;
    networkBandwidthMbps: number;
    databaseStorageGbPerMonth: number;
    narrative: string;
  };
  keyDecisions: Array<{ decision: string; reason: string; tradeoffs?: string }>;
  assumptions: string[];
  fullMarkdownReport: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}

/**
 * System Prompt — AI System Design Architect
 */
export const SYSTEM_DESIGN_ARCHITECT_PROMPT = `# System Prompt — AI System Design Architect

## ROLE
You are a Senior Software Architect and Distributed Systems Engineer specializing in large-scale system design, repository architecture analysis, cloud infrastructure, and scalable backend systems.

Your task is to transform a GitHub repository, a system idea, or a set of requirements into a professional, production-oriented system architecture diagram using Mermaid.

Your architecture diagrams must be:
- Technically accurate
- Well explained
- Visually organized
- Easy to understand
- Scalable and production-oriented
- Suitable for technical presentations and system design interviews

Do not generate generic diagrams. Every architecture must be tailored to the provided repository or system requirements.

---

# INPUT
The user may provide one of the following:
### Mode A — Repository-Based Design
- GitHub Repository URL: {{repository_url}}
- Repository Analysis: {{repository_analysis}}
- Expected Traffic: {{expected_traffic}}
- Additional Requirements: {{additional_requirements}}

### Mode B — Prompt-Based Design
- System Description: {{system_description}}
- Expected Traffic: {{expected_traffic}}
- Functional Requirements: {{functional_requirements}}
- Non-Functional Requirements: {{non_functional_requirements}}
- Preferred Technology Stack: {{technology_stack}}

### Mode C — Repository + Scaling Requirements
- Repository URL: {{repository_url}}
- Repository Analysis: {{repository_analysis}}
- Scaling Target: {{scaling_target}}
- Required Improvements: {{required_improvements}}

---

# PHASE 1: UNDERSTAND THE SYSTEM
1. Identify the project purpose.
2. Analyze directory structure and components.
3. Distinguish frontend, backend, and infrastructure.
4. Identify APIs, services, and communication mechanisms.
5. Identify databases, caching, queues, and storage.
6. Identify external integrations.
7. Identify deployment and infrastructure configurations.
8. Understand dependencies and relationships.
9. Identify architecture patterns.
10. Identify bottlenecks and scaling limitations.
Use actual repository evidence whenever available. Do not invent components.

---

# PHASE 2: ARCHITECTURE DESIGN (7 LAYERS)
Layer 1 — Client Layer (Web, Mobile, Admin, Developer Clients)
Layer 2 — Edge and Ingress Layer (DNS, CDN, WAF, DDoS Protection, Load Balancer, API Gateway)
Layer 3 — Application Layer (Logical services based on functionality; avoid unnecessary microservices)
Layer 4 — Processing Layer (Message Broker, Event Bus, Background Workers, Task Queue)
Layer 5 — Data Layer (Relational, Caching, Object Storage, Read Replicas)
Layer 6 — Infrastructure Layer (Containers, Autoscaling, Multi-AZ)
Layer 7 — Observability Layer (Metrics, Logs, Distributed Tracing)

---

# PHASE 3: SCALABILITY AND CAPACITY ESTIMATION
Calculate request rates:
Average RPS = Daily Requests / 86,400
Peak RPS = Average RPS * Peak Multiplier (label multiplier explicitly)
Calculate storage, bandwidth, connection pooling, and worker sizing.

---

# PHASE 4: GENERATE THE MERMAID DIAGRAM
Generate a single primary Mermaid architecture diagram using:
flowchart TB
Use top-to-bottom architecture.
Organize into logical layers using subgraphs:
- Client Layer
- Edge and Ingress Layer
- Application Layer
- Cache and Messaging Layer
- Data Layer
- External Services
- Observability
Use rounded nodes (["..."]) for clients/external, rectangular nodes ["..."] for services, cylinder nodes [("...")] for databases.
Keep clean, readable, with directed arrows (-->) and dashed arrows (-.->) for observability.

---

# PHASE 5: REQUEST FLOW
Explain the primary request flow in 5–10 numbered steps.

---

# PHASE 6: ARCHITECTURAL DECISIONS
Table of decisions with rationale and trade-offs.

---

# PHASE 7: FINAL OUTPUT FORMAT
Respond with valid JSON matching this exact structure:
{
  "title": "Short Descriptive Title",
  "systemOverview": "Concise explanation of the system...",
  "mermaidDiagram": "flowchart TB\\n...",
  "componentResponsibilities": [
    { "component": "Component Name", "layer": "Layer Name", "responsibility": "Specific role" }
  ],
  "requestFlow": [
    "1. Step description...",
    "2. Step description..."
  ],
  "capacityEstimation": {
    "dailyRequests": 50000000,
    "averageRps": 579,
    "peakMultiplier": 10,
    "peakRps": 5790,
    "networkBandwidthMbps": 1160,
    "databaseStorageGbPerMonth": 300,
    "narrative": "Detailed breakdown..."
  },
  "keyDecisions": [
    { "decision": "Decision", "reason": "Reason", "tradeoffs": "Trade-offs" }
  ],
  "assumptions": [
    "Assumption 1...",
    "Assumption 2..."
  ],
  "nodes": [
    {
      "id": "node_id",
      "name": "Node Display Name",
      "type": "load_generator" | "gateway" | "service" | "cache" | "database",
      "workerCount": 2,
      "capacityPerSecond": 2000
    }
  ],
  "edges": [
    {
      "source": "source_node_id",
      "target": "target_node_id",
      "label": "Interaction label",
      "requestsPerInput": 1.0
    }
  ]
}`;

/**
 * Builds user prompt for LLM based on input mode
 */
export function buildArchitectPrompt(input: SystemDesignArchitectInput): string {
  const mode = input.mode || (input.repositoryUrl ? 'mode_a' : 'mode_b');

  if (mode === 'mode_a') {
    return `${SYSTEM_DESIGN_ARCHITECT_PROMPT}

### INPUT DATA (Mode A — Repository-Based Design):
- GitHub Repository URL: ${input.repositoryUrl || 'N/A'}
- Repository Analysis / Evidence:
${typeof input.repositoryAnalysis === 'string' ? input.repositoryAnalysis : JSON.stringify(input.repositoryAnalysis || {}, null, 2)}
- Expected Traffic: ${input.expectedTraffic || '50 Million requests/day (assume 10x peak multiplier)'}
- Additional Requirements: ${input.additionalRequirements || 'Production-grade scalability, observability, and high availability.'}

Generate the complete Phase 7 JSON response now.`;
  }

  if (mode === 'mode_c') {
    return `${SYSTEM_DESIGN_ARCHITECT_PROMPT}

### INPUT DATA (Mode C — Repository + Scaling Requirements):
- GitHub Repository URL: ${input.repositoryUrl || 'N/A'}
- Repository Analysis:
${typeof input.repositoryAnalysis === 'string' ? input.repositoryAnalysis : JSON.stringify(input.repositoryAnalysis || {}, null, 2)}
- Scaling Target: ${input.scalingTarget || '100k Peak RPS with sub-50ms P99 latency'}
- Required Improvements:
${(input.requiredImprovements || ['High availability', 'Eliminate single points of failure', 'Distributed caching', 'Database read replicas']).join('\n- ')}

Generate the complete Phase 7 JSON response now.`;
  }

  // Default: Mode B (Prompt-Based Design)
  return `${SYSTEM_DESIGN_ARCHITECT_PROMPT}

### INPUT DATA (Mode B — Prompt-Based Design):
- System Description: ${input.systemDescription || 'Distributed System Design'}
- Expected Traffic: ${input.expectedTraffic || '50 Million requests/day (10x peak multiplier)'}
- Functional Requirements:
${(input.functionalRequirements || ['User Authentication', 'Core Domain Services', 'Real-time Updates', 'Data Persistence']).join('\n- ')}
- Non-Functional Requirements:
${(input.nonFunctionalRequirements || ['Sub-100ms P99 latency', '99.99% Availability', 'Horizontal Scalability', 'Fault Tolerance']).join('\n- ')}
- Preferred Technology Stack: ${(input.technologyStack || ['Node.js', 'PostgreSQL', 'Redis', 'Docker']).join(', ')}

Generate the complete Phase 7 JSON response now.`;
}

/**
 * Formats a SystemDesignReportResult into a complete, publication-grade Markdown document
 */
export function formatFullMarkdownReport(res: Partial<SystemDesignReportResult>): string {
  const title = res.title || 'System Architecture Design';
  const overview = res.systemOverview || 'Production-grade distributed system architecture.';
  const mermaid = res.mermaidDiagram || 'flowchart TB\n  USER(["Global Users"]) --> APP["Application"]';

  const compRows = (res.componentResponsibilities || [])
    .map(
      (c) =>
        `| **${c.component}** | ${c.layer} | ${c.responsibility} |`
    )
    .join('\n');

  const reqFlowItems = (res.requestFlow || [])
    .map((step, idx) => (step.match(/^\d+\./) ? step : `${idx + 1}. ${step}`))
    .join('\n');

  const cap = res.capacityEstimation || {
    dailyRequests: 50000000,
    averageRps: 579,
    peakMultiplier: 10,
    peakRps: 5790,
    networkBandwidthMbps: 1160,
    databaseStorageGbPerMonth: 300,
    narrative: 'Calculated using standard 86,400-second daily distribution with 10x peak multiplier.',
  };

  const decisionsRows = (res.keyDecisions || [])
    .map(
      (d) =>
        `| **${d.decision}** | ${d.reason} | ${d.tradeoffs || 'Standard distributed systems trade-off'} |`
    )
    .join('\n');

  const assumptionsItems = (res.assumptions || [
    'Graph acyclicity is enforced across all processing chains.',
    'Assumed 10x peak multiplier over average daily traffic.',
    'Edge CDN and distributed Redis caches absorb at least 70-80% of read traffic.',
  ])
    .map((a) => `- ${a}`)
    .join('\n');

  return `# ${title}

## 1. System Overview
${overview}

## 2. Architecture Diagram
\`\`\`mermaid
${mermaid.trim()}
\`\`\`

## 3. Component Responsibilities
| Component | Layer | Primary Responsibility |
|---|---|---|
${compRows || '| **API Gateway** | Edge / Ingress | Routes authenticated traffic and enforces rate limits |'}

## 4. Request Flow
${reqFlowItems || '1. Client sends request to CDN edge.\n2. Ingress API gateway authenticates and routes traffic.\n3. Application service processes business logic.\n4. Database reads/writes commit transaction.\n5. Response returns to client.'}

## 5. Capacity Estimation
### Traffic & Workload Calculations
- **Daily Requests:** ${Number(cap.dailyRequests || 50000000).toLocaleString()} req/day
- **Average Traffic Rate:** ${Number(cap.averageRps || 579).toLocaleString()} req/s ($${Number(cap.dailyRequests || 50000000).toLocaleString()} / 86{,}400$)
- **Peak Multiplier:** ${cap.peakMultiplier || 10}×
- **Peak Traffic Rate:** ${Number(cap.peakRps || 5790).toLocaleString()} req/s
- **Network Bandwidth (Peak):** ~${Number(cap.networkBandwidthMbps || 1160).toLocaleString()} Mbps
- **Database Storage Growth:** ~${Number(cap.databaseStorageGbPerMonth || 300).toLocaleString()} GB/month

${cap.narrative || ''}

## 6. Key Architecture Decisions
| Decision | Rationale | Trade-offs Considered |
|---|---|---|
${decisionsRows || '| **Stateless Services** | Enables linear horizontal scaling | Requires externalized session storage |'}

## 7. Assumptions
${assumptionsItems}
`;
}

/**
 * Deterministic Expert Synthesis when LLM is unavailable or unconfigured
 */
export function synthesizeDeterministicReport(
  input: SystemDesignArchitectInput
): SystemDesignReportResult {
  const desc =
    input.systemDescription ||
    (input.repositoryUrl ? `Repository at ${input.repositoryUrl}` : 'Distributed Cloud Application');

  const title = input.repositoryUrl
    ? `System Architecture: ${input.repositoryUrl.split('/').pop() || 'Repository'}`
    : `System Architecture: ${desc.slice(0, 45)}`;

  const dailyRequests = 50000000;
  const averageRps = Math.round(dailyRequests / 86400);
  const peakMultiplier = 10;
  const peakRps = averageRps * peakMultiplier;

  const mermaidDiagram = `flowchart TB
    USER(["Global Clients & Users"])

    subgraph INGRESS["Edge & Ingress Layer"]
        CDN["Cloudflare CDN & WAF<br/>Global Edge Caching & Security"]
        GATEWAY["API Gateway & Reverse Proxy<br/>Routing, Rate Limiting & Auth Guard"]
    end

    subgraph APP["Application & Microservices Layer"]
        AUTH_SVC["Auth & Identity Service<br/>JWT & Session Management"]
        CORE_API["Core Domain Service<br/>Primary Business Logic & Orchestration"]
        ASYNC_WORKER["Background Worker Pool<br/>Heavy Computations & Task Processing"]
    end

    subgraph CACHE_MSG["Cache & Messaging Layer"]
        REDIS_CACHE[("Redis Cluster<br/>Cache-Aside & Timeline Caching")]
        MSG_QUEUE["Task & Event Queue<br/>RabbitMQ / Kafka Message Broker"]
    end

    subgraph DATA["Data & Persistence Layer"]
        DB_PRIMARY[("PostgreSQL Primary<br/>ACID Transactions & Writes")]
        DB_REPLICA[("PostgreSQL Read Replicas<br/>Read Pool for High QPS")]
        OBJ_STORAGE[("Cloud Object Storage (S3/R2)<br/>Binary Media & Artifacts")]
    end

    subgraph OBS["Observability Layer"]
        TELEMETRY["Distributed Telemetry & APM<br/>OpenTelemetry & Trace Collection"]
    end

    USER --> CDN
    CDN --> GATEWAY

    GATEWAY --> AUTH_SVC
    GATEWAY --> CORE_API

    CORE_API --> REDIS_CACHE
    CORE_API --> DB_PRIMARY
    CORE_API --> DB_REPLICA
    CORE_API --> MSG_QUEUE

    MSG_QUEUE --> ASYNC_WORKER
    ASYNC_WORKER --> OBJ_STORAGE
    ASYNC_WORKER --> DB_PRIMARY

    DB_PRIMARY --> DB_REPLICA

    GATEWAY -.-> TELEMETRY
    CORE_API -.-> TELEMETRY`;

  const componentResponsibilities = [
    { component: 'Cloudflare CDN & WAF', layer: 'Edge & Ingress', responsibility: 'Edge caching of static assets, DDoS filtering, and TLS termination.' },
    { component: 'API Gateway', layer: 'Edge & Ingress', responsibility: 'Central reverse proxy for routing, token-bucket rate limiting, and request correlation.' },
    { component: 'Auth & Identity Service', layer: 'Application', responsibility: 'Validates credentials, issues JWT sessions, and enforces role-based access.' },
    { component: 'Core Domain Service', layer: 'Application', responsibility: 'Executes core business rules, transactional mutations, and query hydration.' },
    { component: 'Background Worker Pool', layer: 'Application', responsibility: 'Consumes asynchronous tasks from the queue for non-blocking I/O and batch jobs.' },
    { component: 'Redis Cluster', layer: 'Cache & Messaging', responsibility: 'Sub-millisecond latency Cache-Aside store for frequent reads and session state.' },
    { component: 'Task & Event Queue', layer: 'Cache & Messaging', responsibility: 'Buffers burst traffic and decouples synchronous APIs from heavy worker tasks.' },
    { component: 'PostgreSQL Primary', layer: 'Persistence', responsibility: 'Authoritative relational store for writes, foreign key constraints, and transactions.' },
    { component: 'PostgreSQL Read Replicas', layer: 'Persistence', responsibility: 'Serves read-only queries with low replication lag to offload the primary.' },
    { component: 'Cloud Object Storage', layer: 'Persistence', responsibility: 'High-durability, low-cost storage for media, videos, and large payloads.' },
    { component: 'Distributed Telemetry & APM', layer: 'Observability', responsibility: 'Aggregates latency spans, distributed trace IDs, and alerts on slow requests.' },
  ];

  const requestFlow = [
    '1. User sends an HTTPS request which hits the globally distributed CDN & WAF edge.',
    '2. The CDN terminates TLS, filters malicious payloads, and forwards dynamic requests to the API Gateway.',
    '3. The API Gateway validates authorization headers and checks Redis rate limits.',
    '4. The Core Domain Service checks the Redis Cache cluster; if a cache hit occurs, it immediately returns the data.',
    '5. On cache miss, read queries route to PostgreSQL Read Replicas, hydrating the cache before responding.',
    '6. State mutations write directly to the PostgreSQL Primary database with ACID guarantees.',
    '7. Heavy asynchronous jobs (e.g. notifications, media encoding) are enqueued to the Message Queue.',
    '8. Background worker pools consume messages asynchronously and persist completed assets to Object Storage.',
    '9. Telemetry middleware injects X-Trace-Id and records execution timing into the APM tracer.',
  ];

  const capacityEstimation = {
    dailyRequests,
    averageRps,
    peakMultiplier,
    peakRps,
    networkBandwidthMbps: Math.round((peakRps * 25 * 8) / 1000), // ~25KB avg payload
    databaseStorageGbPerMonth: 300,
    narrative: `Designed for ${dailyRequests.toLocaleString()} daily operations with a ${peakMultiplier}x burst factor. In-memory caching absorbs ~80% of read traffic, ensuring the database primary receives manageable write volumes during peak periods.`,
  };

  const keyDecisions = [
    { decision: 'Stateless Application Tier', reason: 'Allows linear horizontal autoscaling behind load balancers with zero session sticky-routing.', tradeoffs: 'Requires externalized Redis session storage.' },
    { decision: 'Cache-Aside with Redis', reason: 'Reduces read strain on database by up to 80% and guarantees sub-5ms read responses.', tradeoffs: 'Requires explicit cache invalidation logic upon updates.' },
    { decision: 'Decoupled Asynchronous Queue', reason: 'Guarantees fast API response times by deferring long-running media and batch tasks.', tradeoffs: 'Introduces eventual consistency and requires queue failure retry handling.' },
    { decision: 'Read/Write Database Splitting', reason: 'Protects transaction throughput on the primary instance during peak read query bursts.', tradeoffs: 'Read queries can observe minor replication lag (<100ms).' },
    { decision: 'Distributed Tracing (X-Trace-Id)', reason: 'Provides end-to-end visibility across services to isolate bottlenecks.', tradeoffs: 'Marginal header overhead on internal HTTP requests.' },
  ];

  const assumptions = [
    'Core request flow forms a Directed Acyclic Graph (DAG) with no circular dependencies.',
    'Estimated peak multiplier of 10x accommodates daily active spikes and marketing events.',
    '80% of total traffic consists of reads, with 20% writes.',
    'CDN and Redis cache hit ratio maintains at least 75-80% under steady load.',
  ];

  // Canvas nodes and edges
  const nodes: ArchitectureNode[] = [
    {
      id: 'node_user',
      name: 'Global Users & Clients',
      type: 'load_generator',
      position: { x: 300, y: 50 },
      workerCount: 1,
      capacityPerSecond: 10000,
      enabled: true,
      config: {
        isSource: true,
        defaultTrafficRate: averageRps,
        baselineLatencyMs: 0,
        maxQueueSize: 10000,
        overflowPolicy: 'reject',
      },
    },
    {
      id: 'node_gateway',
      name: 'API Gateway & Ingress',
      type: 'gateway',
      position: { x: 300, y: 180 },
      workerCount: 4,
      capacityPerSecond: 8000,
      enabled: true,
      config: { baselineLatencyMs: 3, maxQueueSize: 5000, overflowPolicy: 'reject' },
    },
    {
      id: 'node_auth',
      name: 'Auth & Identity Service',
      type: 'service',
      position: { x: 120, y: 320 },
      workerCount: 3,
      capacityPerSecond: 3000,
      enabled: true,
      config: { baselineLatencyMs: 8, maxQueueSize: 2000, overflowPolicy: 'reject' },
    },
    {
      id: 'node_core',
      name: 'Core Domain Service',
      type: 'service',
      position: { x: 480, y: 320 },
      workerCount: 6,
      capacityPerSecond: 5000,
      enabled: true,
      config: { baselineLatencyMs: 15, maxQueueSize: 4000, overflowPolicy: 'reject' },
    },
    {
      id: 'node_cache',
      name: 'Redis Cache Cluster',
      type: 'cache',
      position: { x: 300, y: 460 },
      workerCount: 2,
      capacityPerSecond: 12000,
      enabled: true,
      config: { baselineLatencyMs: 2, maxQueueSize: 10000, overflowPolicy: 'reject' },
    },
    {
      id: 'node_queue',
      name: 'Message & Task Queue',
      type: 'service',
      position: { x: 680, y: 460 },
      workerCount: 2,
      capacityPerSecond: 6000,
      enabled: true,
      config: { baselineLatencyMs: 5, maxQueueSize: 8000, overflowPolicy: 'drop' },
    },
    {
      id: 'node_worker',
      name: 'Async Background Workers',
      type: 'service',
      position: { x: 680, y: 600 },
      workerCount: 4,
      capacityPerSecond: 2500,
      enabled: true,
      config: { baselineLatencyMs: 40, maxQueueSize: 3000, overflowPolicy: 'drop' },
    },
    {
      id: 'node_db',
      name: 'PostgreSQL Primary DB',
      type: 'database',
      position: { x: 200, y: 600 },
      workerCount: 2,
      capacityPerSecond: 4000,
      enabled: true,
      config: { baselineLatencyMs: 12, maxQueueSize: 3000, overflowPolicy: 'reject' },
    },
    {
      id: 'node_replica',
      name: 'PostgreSQL Read Replica',
      type: 'database',
      position: { x: 440, y: 600 },
      workerCount: 2,
      capacityPerSecond: 6000,
      enabled: true,
      config: { baselineLatencyMs: 10, maxQueueSize: 4000, overflowPolicy: 'reject' },
    },
  ];

  const edges: ArchitectureEdge[] = [
    { id: 'edge-user-gateway', source: 'node_user', target: 'node_gateway', requestsPerInput: 1.0, enabled: true, label: 'HTTPS' },
    { id: 'edge-gateway-auth', source: 'node_gateway', target: 'node_auth', requestsPerInput: 0.2, enabled: true, label: 'Auth Token' },
    { id: 'edge-gateway-core', source: 'node_gateway', target: 'node_core', requestsPerInput: 0.8, enabled: true, label: 'API Calls' },
    { id: 'edge-core-cache', source: 'node_core', target: 'node_cache', requestsPerInput: 0.7, enabled: true, label: 'Cache Aside' },
    { id: 'edge-core-queue', source: 'node_core', target: 'node_queue', requestsPerInput: 0.15, enabled: true, label: 'Enqueue' },
    { id: 'edge-queue-worker', source: 'node_queue', target: 'node_worker', requestsPerInput: 1.0, enabled: true, label: 'Consume' },
    { id: 'edge-core-db', source: 'node_core', target: 'node_db', requestsPerInput: 0.25, enabled: true, label: 'Write' },
    { id: 'edge-core-replica', source: 'node_core', target: 'node_replica', requestsPerInput: 0.45, enabled: true, label: 'Read' },
    { id: 'edge-db-replica', source: 'node_db', target: 'node_replica', requestsPerInput: 1.0, enabled: true, label: 'Replication' },
  ];

  const reportData = {
    title,
    systemOverview: `Comprehensive, scalable system architecture designed for "${desc}". The design enforces clean separation of concerns across 7 architectural layers with stateless microservices, asynchronous task offloading, multi-tier caching, and high-availability database replication.`,
    mermaidDiagram,
    componentResponsibilities,
    requestFlow,
    capacityEstimation,
    keyDecisions,
    assumptions,
    nodes,
    edges,
  };

  return {
    ...reportData,
    fullMarkdownReport: formatFullMarkdownReport(reportData),
  };
}

/**
 * Main execution function: transforms input into complete 7-phase system design report
 */
export async function generateSystemDesignReport(
  input: SystemDesignArchitectInput
): Promise<SystemDesignReportResult> {
  const provider =
    input.llmConfig?.provider ||
    process.env.LLM_PROVIDER ||
    (process.env.GEMINI_API_KEY ? 'gemini' : process.env.GROQ_API_KEY ? 'groq' : process.env.OPENAI_API_KEY ? 'openai' : 'deterministic');

  const apiKey =
    input.llmConfig?.apiKey ||
    process.env.LLM_API_KEY ||
    (provider === 'gemini' ? process.env.GEMINI_API_KEY : provider === 'groq' ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY);

  // If no API key is available, generate deterministic report
  if (!apiKey && provider !== 'other') {
    return synthesizeDeterministicReport(input);
  }

  const prompt = buildArchitectPrompt(input);

  // Call LLM with fallback
  try {
    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (res.ok) {
        const data: any = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          return {
            ...parsed,
            fullMarkdownReport: formatFullMarkdownReport(parsed),
          };
        }
      }
    } else if (provider === 'groq') {
      const url = 'https://api.groq.com/openai/v1/chat/completions';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: input.llmConfig?.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
      });

      if (res.ok) {
        const data: any = await res.json();
        const rawText = data.choices?.[0]?.message?.content;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          return {
            ...parsed,
            fullMarkdownReport: formatFullMarkdownReport(parsed),
          };
        }
      }
    }
  } catch (err) {
    console.warn('[AI System Design Architect] LLM call failed, falling back to deterministic synthesis:', err);
  }

  return synthesizeDeterministicReport(input);
}
