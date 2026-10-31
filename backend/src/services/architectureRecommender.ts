import {
  ArchitectureRecommendation,
  RecommenderInput,
  architectureRecommendationSchema,
  ArchitecturePattern,
  TechnologyRecommendation,
  TradeoffDecision,
} from './recommenderTypes.js';
import { ArchitectureNode, ArchitectureEdge } from '../simulation/types.js';
import { validateGraphAcyclic } from '../simulation/validation.js';

export interface LLMConfig {
  provider?: string;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  groqApiKey?: string;
  groqModel?: string;
}

/**
 * Recommends an optimal system architecture based on project requirements.
 * Tries LLM if configured; otherwise uses deterministic expert synthesis.
 */
export async function recommendArchitecture(
  input: RecommenderInput
): Promise<ArchitectureRecommendation> {
  // 1. Resolve LLM configuration from input or environment
  const provider =
    input.llmConfig?.provider ||
    process.env.LLM_PROVIDER ||
    (process.env.OPENAI_API_KEY
      ? 'openai'
      : process.env.GEMINI_API_KEY
      ? 'gemini'
      : process.env.ANTHROPIC_API_KEY
      ? 'anthropic'
      : 'openai');

  const apiKey =
    input.llmConfig?.apiKey ||
    process.env.LLM_API_KEY ||
    (provider === 'openai'
      ? process.env.OPENAI_API_KEY
      : provider === 'gemini'
      ? process.env.GEMINI_API_KEY
      : process.env.ANTHROPIC_API_KEY);

  const model =
    input.llmConfig?.model ||
    process.env.LLM_MODEL ||
    (provider === 'gemini'
      ? 'gemini-1.5-flash'
      : provider === 'anthropic'
      ? 'claude-3-5-sonnet-20241022'
      : 'gpt-4o-mini');

  const config: LLMConfig = {
    provider,
    apiKey,
    model,
    baseUrl: input.llmConfig?.baseUrl,
  };

  // 2. If API Key is present, attempt LLM call
  if (config.apiKey || (provider === 'other' && config.baseUrl)) {
    try {
      let llmResult: any = null;
      if (provider === 'gemini') {
        llmResult = await callGeminiRecommender(input, config);
      } else if (provider === 'anthropic') {
        llmResult = await callAnthropicRecommender(input, config);
      } else {
        llmResult = await callOpenAIRecommender(input, config);
      }

      if (llmResult) {
        const validated = validateAndSanitizeRecommendation(llmResult, input);
        if (validated) {
          return validated;
        }
      }
    } catch (err) {
      console.warn(
        `[Architecture Recommender] LLM call failed (${provider}), falling back to expert synthesis:`,
        err
      );
    }
  }

  // 3. Fallback to expert deterministic recommendation engine
  return synthesizeExpertRecommendation(input);
}

/**
 * Builds the LLM system prompt and user instructions for architecture recommendation.
 */
function buildRecommenderPrompt(input: RecommenderInput): string {
  const optionalSections = [];
  if (input.expectedScale) optionalSections.push(`- Expected Scale: ${input.expectedScale}`);
  if (input.budgetConstraint) optionalSections.push(`- Budget Constraint: ${input.budgetConstraint}`);
  if (input.preferredTech && input.preferredTech.length > 0)
    optionalSections.push(`- Preferred Technologies: ${input.preferredTech.join(', ')}`);
  if (input.deploymentPreference)
    optionalSections.push(`- Deployment Preference: ${input.deploymentPreference}`);
  if (input.reliabilityRequirement)
    optionalSections.push(`- Reliability/Availability: ${input.reliabilityRequirement}`);
  if (input.securityRequirement)
    optionalSections.push(`- Security & Compliance: ${input.securityRequirement}`);
  if (input.teamSize) optionalSections.push(`- Team Size & Constraints: ${input.teamSize}`);
  if (input.refinementRequest)
    optionalSections.push(`- User Refinement Request: ${input.refinementRequest}`);

  return `You are a Principal Distributed Systems Architect.
Analyze the following project description and optional constraints, then recommend a tailored, production-ready system architecture.

PROJECT DESCRIPTION:
"""
${input.projectDescription}
"""

${optionalSections.length > 0 ? 'CONSTRAINTS & PREFERENCES:\n' + optionalSections.join('\n') : ''}

CRITICAL ARCHITECTURE RULES:
1. Do NOT default to microservices. Choose the simplest architecture pattern that satisfies the requirements (Modular Monolith, Monolith, Serverless, Microservices, Event-Driven, or Hybrid). Justify complex patterns only when scale, team boundaries, or concurrency strictly demand it.
2. Produce a directed graph of nodes and edges that can be simulated:
   - Node types MUST be one of: "load_generator", "gateway", "service", "cache", "database".
   - Include a "load_generator" (e.g. User Traffic / Clients) as the root entry point.
   - Edges MUST connect existing node IDs with "source" and "target".
   - The graph MUST be a valid directed acyclic request flow.
3. For each technology recommendation, provide category, name, reason, trade-offs, and viable alternatives.
4. Provide structured data flows, security considerations, scaling strategy, and key trade-off decisions.

OUTPUT FORMAT:
Respond with ONLY valid JSON (no markdown formatting, no code fences, no extra commentary) matching this exact schema:
{
  "id": "rec-${Date.now()}",
  "projectName": "Short Title",
  "summary": "2-3 sentence executive architecture summary",
  "architecturePattern": "Monolith" | "Modular Monolith" | "Microservices" | "Event-Driven" | "Serverless" | "Hybrid",
  "patternReasoning": "Why this specific architecture pattern fits the requirements",
  "requirements": {
    "functional": ["Core feature 1", "Core feature 2"],
    "nonFunctional": ["Latency < 200ms", "99.9% availability"],
    "assumptions": ["Assumed volume", "Assumed read-to-write ratio"],
    "constraints": ["Budget/time constraints"]
  },
  "technologies": [
    {
      "category": "Frontend | API Layer | Primary Database | Cache | Message Broker | Storage | Auth | Hosting",
      "name": "Technology name",
      "reason": "Why chosen",
      "tradeoffs": ["Advantage 1", "Downside 1"],
      "alternatives": ["Alternative 1", "Alternative 2"]
    }
  ],
  "nodes": [
    {
      "id": "node-client",
      "name": "User Traffic",
      "type": "load_generator",
      "position": {"x": 100, "y": 250},
      "capacityPerSecond": 5000,
      "workerCount": 1,
      "enabled": true,
      "config": {"baselineLatencyMs": 0, "maxQueueSize": 5000, "overflowPolicy": "reject", "isSource": true}
    },
    {
      "id": "node-gateway",
      "name": "API Gateway",
      "type": "gateway",
      "position": {"x": 400, "y": 250},
      "capacityPerSecond": 4000,
      "workerCount": 4,
      "enabled": true,
      "config": {"baselineLatencyMs": 5, "maxQueueSize": 3000, "overflowPolicy": "reject"}
    }
  ],
  "edges": [
    {
      "id": "edge-client-gateway",
      "source": "node-client",
      "target": "node-gateway",
      "requestsPerInput": 1.0,
      "enabled": true,
      "label": "HTTPS API Calls"
    }
  ],
  "dataFlows": [
    {
      "id": "flow-1",
      "name": "Core Request Flow",
      "description": "How a primary user request traverses the system",
      "steps": ["Step 1: User hits API Gateway", "Step 2: Service queries DB", "Step 3: Response returned"]
    }
  ],
  "securityConsiderations": ["JWT authentication", "TLS termination", "Rate limiting"],
  "scalingStrategy": ["Horizontal pod autoscaling", "Read-replicas for database"],
  "tradeoffs": [
    {
      "decision": "PostgreSQL over MongoDB",
      "pros": ["ACID compliance", "Relational integrity"],
      "cons": ["Manual sharding for ultra-high write scale"]
    }
  ],
  "futureImprovements": ["Add Redis cache when traffic exceeds 10k RPS", "Introduce Kafka for event streaming"]
}`;
}

async function callOpenAIRecommender(input: RecommenderInput, config: LLMConfig): Promise<any> {
  const prompt = buildRecommenderPrompt(input);
  let endpoint = 'https://api.openai.com/v1/chat/completions';
  if (config.baseUrl) {
    const cleanBase = config.baseUrl.replace(/\/+$/, '');
    endpoint = cleanBase.endsWith('/chat/completions')
      ? cleanBase
      : `${cleanBase}/chat/completions`;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API failed: ${res.status} ${await res.text()}`);
  }

  const data: any = await res.json();
  const rawText = data.choices[0].message.content;
  return JSON.parse(rawText);
}

async function callGeminiRecommender(input: RecommenderInput, config: LLMConfig): Promise<any> {
  const prompt = buildRecommenderPrompt(input);
  const model = config.model || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API failed: ${res.status} ${await res.text()}`);
  }

  const data: any = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty response from Gemini');
  return JSON.parse(rawText);
}

async function callAnthropicRecommender(input: RecommenderInput, config: LLMConfig): Promise<any> {
  const prompt = buildRecommenderPrompt(input);
  const model = config.model || 'claude-3-5-sonnet-20241022';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API failed: ${res.status} ${await res.text()}`);
  }

  const data: any = await res.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error('Empty response from Anthropic');
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON object found in Anthropic response');
  return JSON.parse(jsonMatch[0]);
}

/**
 * Validates, post-processes, and ensures structural acyclicity of recommendation nodes and edges.
 */
function validateAndSanitizeRecommendation(
  raw: any,
  input: RecommenderInput
): ArchitectureRecommendation | null {
  try {
    if (!raw.id) raw.id = `rec-${Date.now()}`;
    if (!raw.projectName) {
      raw.projectName = input.projectDescription.slice(0, 40) + '...';
    }

    // Ensure valid nodes & edges
    const rawNodes: ArchitectureNode[] = Array.isArray(raw.nodes) ? raw.nodes : [];
    const validNodeIds = new Set<string>();

    const sanitizedNodes: ArchitectureNode[] = rawNodes.map((node: any, idx: number) => {
      const id = String(node.id || `node-${idx}`).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      validNodeIds.add(id);

      const validTypes = ['load_generator', 'gateway', 'service', 'cache', 'database'] as const;
      const type = validTypes.includes(node.type) ? node.type : 'service';

      return {
        id,
        name: String(node.name || `Component ${idx + 1}`),
        type,
        position: {
          x: typeof node.position?.x === 'number' ? node.position.x : 100 + (idx % 3) * 320,
          y: typeof node.position?.y === 'number' ? node.position.y : 100 + Math.floor(idx / 3) * 160,
        },
        capacityPerSecond: Number(node.capacityPerSecond) || (type === 'cache' ? 8000 : type === 'database' ? 3000 : 2000),
        workerCount: Number(node.workerCount) || (type === 'gateway' ? 4 : 2),
        enabled: node.enabled !== false,
        config: {
          baselineLatencyMs: Number(node.config?.baselineLatencyMs) || (type === 'database' ? 15 : type === 'cache' ? 2 : 10),
          maxQueueSize: Number(node.config?.maxQueueSize) || 2000,
          overflowPolicy: node.config?.overflowPolicy === 'drop' ? 'drop' : 'reject',
          isSource: type === 'load_generator',
          defaultTrafficRate: type === 'load_generator' ? 1000 : undefined,
          ...(node.config || {}),
        },
      };
    });

    // Ensure at least one load_generator node exists for simulation capability
    const hasSource = sanitizedNodes.some((n) => n.type === 'load_generator');
    if (!hasSource && sanitizedNodes.length > 0) {
      const sourceId = 'node-client-traffic';
      sanitizedNodes.unshift({
        id: sourceId,
        name: 'Client Traffic',
        type: 'load_generator',
        position: { x: 50, y: sanitizedNodes[0].position.y },
        capacityPerSecond: 5000,
        workerCount: 1,
        enabled: true,
        config: {
          baselineLatencyMs: 0,
          maxQueueSize: 5000,
          overflowPolicy: 'reject',
          isSource: true,
          defaultTrafficRate: 1000,
        },
      });
      validNodeIds.add(sourceId);
    }

    // Filter edges to only those connecting existing nodes
    const rawEdges: any[] = Array.isArray(raw.edges) ? raw.edges : [];
    const sanitizedEdges: ArchitectureEdge[] = [];
    const edgePairs = new Set<string>();

    for (const edge of rawEdges) {
      const source = String(edge.source || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const target = String(edge.target || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-');

      if (source && target && source !== target && validNodeIds.has(source) && validNodeIds.has(target)) {
        const pair = `${source}->${target}`;
        if (!edgePairs.has(pair)) {
          edgePairs.add(pair);
          sanitizedEdges.push({
            id: String(edge.id || `edge-${source}-${target}`),
            source,
            target,
            requestsPerInput: typeof edge.requestsPerInput === 'number' ? edge.requestsPerInput : 1.0,
            enabled: edge.enabled !== false,
            label: edge.label || 'Request',
            dataFlowDescription: edge.dataFlowDescription || edge.description,
          });
        }
      }
    }

    // Ensure acyclic edges
    const safeEdges: ArchitectureEdge[] = [];
    for (const e of sanitizedEdges) {
      safeEdges.push(e);
      const validation = validateGraphAcyclic(sanitizedNodes, safeEdges);
      if (validation.hasCycle) {
        safeEdges.pop();
      }
    }

    raw.nodes = sanitizedNodes;
    raw.edges = safeEdges;

    return architectureRecommendationSchema.parse(raw);
  } catch (err) {
    console.warn('[Architecture Recommender] Validation error on LLM response:', err);
    return null;
  }
}

/**
 * Intelligent deterministic rule-based architect recommendation engine.
 * Generates an end-to-end, tailored architecture based on keyword intent, scale, and constraints.
 */
export function synthesizeExpertRecommendation(
  input: RecommenderInput
): ArchitectureRecommendation {
  const desc = input.projectDescription.toLowerCase();
  const scale = (input.expectedScale || '').toLowerCase();
  const budget = (input.budgetConstraint || '').toLowerCase();
  const deployment = (input.deploymentPreference || '').toLowerCase();
  const refinement = (input.refinementRequest || '').toLowerCase();

  // 1. Identify Domain Archetype
  const isRealtime = desc.includes('chat') || desc.includes('socket') || desc.includes('message') || desc.includes('collaborat') || desc.includes('notification');
  const isEcommerce = desc.includes('e-commerce') || desc.includes('ecommerce') || desc.includes('shop') || desc.includes('store') || desc.includes('checkout') || desc.includes('cart') || desc.includes('payment');
  const isSaaS = desc.includes('saas') || desc.includes('b2b') || desc.includes('crm') || desc.includes('multi-tenant') || desc.includes('dashboard') || desc.includes('analytics');
  const isIoTOrStreaming = desc.includes('iot') || desc.includes('stream') || desc.includes('telemetry') || desc.includes('sensor') || desc.includes('event');
  const isAIApp = desc.includes('ai') || desc.includes('llm') || desc.includes('agent') || desc.includes('rag') || desc.includes('embedding') || desc.includes('vector');

  // 2. Determine Architecture Pattern
  let pattern: ArchitecturePattern = 'Modular Monolith';
  let patternReasoning = '';

  if (refinement.includes('serverless') || deployment.includes('serverless')) {
    pattern = 'Serverless';
    patternReasoning = 'Event-driven serverless architecture chosen based on explicit deployment preferences to minimize idle infrastructure costs and scale down to zero.';
  } else if (refinement.includes('microservice') || scale.includes('hyper') || desc.includes('hyper-scale')) {
    pattern = 'Microservices';
    patternReasoning = 'Microservices architecture selected to decouple domain bounded contexts (Auth, Processing, Payments, Analytics) and allow independent service scaling under high concurrency.';
  } else if (isIoTOrStreaming || (isRealtime && scale.includes('growth'))) {
    pattern = 'Event-Driven';
    patternReasoning = 'Event-Driven architecture selected with message brokers to asynchronously buffer high-volume write spikes, decouple real-time producers from consumers, and prevent database saturation.';
  } else if (scale.includes('mvp') || budget.includes('low') || (input.teamSize && input.teamSize.includes('solo'))) {
    pattern = 'Monolith';
    patternReasoning = 'A lean monolithic architecture is optimal for MVP stage and small teams: eliminates distributed systems operational overhead, simplifies deployments, and maximizes delivery speed.';
  } else {
    pattern = 'Modular Monolith';
    patternReasoning = 'Modular Monolith provides the optimal balance of clear domain boundaries and transactional simplicity without premature microservices complexity. It can cleanly decompose into microservices later when needed.';
  }

  // 3. Extract Project Title & Summary
  const firstSentence = input.projectDescription.split(/[.\n]/)[0].trim();
  const projectName =
    firstSentence.length > 5 && firstSentence.length < 50
      ? firstSentence
      : isEcommerce
      ? 'Next-Gen E-Commerce Platform'
      : isRealtime
      ? 'Real-Time Collaborative System'
      : isIoTOrStreaming
      ? 'Real-Time Telemetry & Event Ingestion Engine'
      : isAIApp
      ? 'Intelligent AI Agent & Workflow Platform'
      : isSaaS
      ? 'Multi-Tenant Cloud Platform'
      : 'Modern Scalable Web Application';

  const summary = `Tailored ${pattern} architecture designed for ${projectName.toLowerCase()}. Focuses on low-latency request handling, data consistency, and graceful horizontal scaling under growing workloads.`;

  // 4. Technology Stack Selection with Trade-offs & Alternatives
  const techStack: TechnologyRecommendation[] = [];

  // Frontend
  techStack.push({
    category: 'Frontend',
    name: 'Next.js (React / TypeScript)',
    reason: 'Server-Side Rendering (SSR) for SEO and initial load speed, coupled with fast client-side reactivity for interactive dashboards.',
    tradeoffs: [
      'High performance and excellent developer ecosystem',
      'Requires Node.js runtime for dynamic SSR routes compared to static SPAs',
    ],
    alternatives: ['Vite + React SPA', 'SvelteKit', 'Nuxt.js'],
  });

  // API / Gateway Layer
  if (pattern === 'Serverless') {
    techStack.push({
      category: 'API & Gateway',
      name: 'AWS API Gateway + Lambda (or Cloudflare Workers)',
      reason: 'Serverless request routing with automated global scaling, edge routing, and built-in rate-limiting.',
      tradeoffs: ['Zero server management overhead and cost scales to zero', 'Potential cold start latency on infrequently used functions'],
      alternatives: ['Fastify / Node.js on ECS', 'Go (Gin) on Cloud Run'],
    });
  } else {
    techStack.push({
      category: 'API & Gateway',
      name: 'Nginx / Kong Gateway',
      reason: 'High-performance reverse proxy handling SSL termination, global rate limiting, and request routing to backend services.',
      tradeoffs: ['Sub-millisecond routing and strong security posture', 'Requires configuration and cluster management'],
      alternatives: ['Envoy Proxy', 'Traefik', 'AWS ALB'],
    });
  }

  // Primary Database
  if (isIoTOrStreaming) {
    techStack.push({
      category: 'Primary Database',
      name: 'TimescaleDB / ClickHouse',
      reason: 'Optimized for high-volume time-series ingestion, compression, and ultra-fast analytical queries over historical data.',
      tradeoffs: ['Exceptional columnar aggregation speed', 'Not designed for transactional document mutations'],
      alternatives: ['PostgreSQL + Citus', 'Cassandra / ScyllaDB'],
    });
  } else {
    techStack.push({
      category: 'Primary Database',
      name: 'PostgreSQL 16 (Relational DB)',
      reason: 'Rock-solid ACID compliance, robust indexing (B-Tree, GIN), rich JSONB document support, and extensive ecosystem support.',
      tradeoffs: ['Guaranteed data consistency and relational integrity', 'Vertical scaling ceiling before requiring read-replicas or partitioning'],
      alternatives: ['MySQL 8.0', 'MongoDB (if strictly unstructured)', 'PlanetScale'],
    });
  }

  // Cache Tier
  techStack.push({
    category: 'Cache & Session Store',
    name: 'Redis 7 (Cluster)',
    reason: 'In-memory key-value cache to absorb frequent read traffic, handle distributed user session tokens, and power rate limit counters.',
    tradeoffs: ['Sub-millisecond response times and built-in pub/sub', 'In-memory storage cost requires eviction policies (LRU)'],
    alternatives: ['DragonflyDB', 'Memcached', 'AWS ElastiCache'],
  });

  // Event Broker / Queue (if not pure monolith)
  if (isIoTOrStreaming || isRealtime || isEcommerce || pattern === 'Event-Driven' || pattern === 'Microservices') {
    techStack.push({
      category: 'Message Broker & Queue',
      name: isIoTOrStreaming ? 'Apache Kafka / Redpanda' : 'RabbitMQ / AWS SQS',
      reason: 'Asynchronous event decoupling for non-blocking operations such as background jobs, payment verification, and notification delivery.',
      tradeoffs: ['Buffers sudden traffic spikes and guarantees message delivery', 'Requires consumer monitoring and dead-letter queue management'],
      alternatives: ['Redis Streams', 'NATS.io', 'Google Cloud Pub/Sub'],
    });
  }

  // Auth & Security
  techStack.push({
    category: 'Auth & Identity',
    name: 'OAuth2 / OpenID Connect + JWT',
    reason: 'Stateless JSON Web Tokens with short-lived access tokens and Redis-backed refresh tokens for secure, scalable authentication.',
    tradeoffs: ['Stateless validation at gateway level without database roundtrips', 'Token revocation requires blacklist or version check in cache'],
    alternatives: ['Clerk / Auth0', 'Supabase Auth', 'NextAuth / Lucia'],
  });

  // Observability
  techStack.push({
    category: 'Observability & Metrics',
    name: 'OpenTelemetry + Prometheus & Grafana',
    reason: 'End-to-end distributed tracing across microservices, metric collection, and proactive alerting for latency spikes and 5xx errors.',
    tradeoffs: ['Vendor-neutral instrumentation and deep visibility', 'Storage footprint for long-term trace retention'],
    alternatives: ['Datadog', 'New Relic', 'CloudWatch'],
  });

  // 5. Generate Nodes & Edges (Interactive Visual Flow Graph)
  const nodes: ArchitectureNode[] = [];
  const edges: ArchitectureEdge[] = [];

  // Root Client Traffic (load generator)
  nodes.push({
    id: 'node-client',
    name: 'User Traffic',
    type: 'load_generator',
    position: { x: 60, y: 220 },
    capacityPerSecond: 5000,
    workerCount: 1,
    enabled: true,
    config: {
      baselineLatencyMs: 0,
      maxQueueSize: 5000,
      overflowPolicy: 'reject',
      isSource: true,
      defaultTrafficRate: 1000,
    },
  });

  // API Gateway
  nodes.push({
    id: 'node-gateway',
    name: 'API Gateway',
    type: 'gateway',
    position: { x: 340, y: 220 },
    capacityPerSecond: 4500,
    workerCount: 4,
    enabled: true,
    config: {
      baselineLatencyMs: 6,
      maxQueueSize: 3000,
      overflowPolicy: 'reject',
    },
  });

  edges.push({
    id: 'edge-client-gateway',
    source: 'node-client',
    target: 'node-gateway',
    requestsPerInput: 1.0,
    enabled: true,
    label: 'HTTPS / WSS',
    dataFlowDescription: 'Incoming user requests over TLS',
  });

  // Core Services
  if (pattern === 'Microservices' || pattern === 'Event-Driven') {
    // Auth Service
    nodes.push({
      id: 'node-svc-auth',
      name: 'Auth & User Service',
      type: 'service',
      position: { x: 640, y: 100 },
      capacityPerSecond: 2500,
      workerCount: 2,
      enabled: true,
      config: { baselineLatencyMs: 12, maxQueueSize: 1500, overflowPolicy: 'reject' },
    });

    // Core Domain Service
    const domainName = isEcommerce ? 'Orders & Checkout' : isRealtime ? 'Chat & Messaging' : isIoTOrStreaming ? 'Ingestion Engine' : 'Core Business Logic';
    nodes.push({
      id: 'node-svc-core',
      name: domainName,
      type: 'service',
      position: { x: 640, y: 240 },
      capacityPerSecond: 2000,
      workerCount: 3,
      enabled: true,
      config: { baselineLatencyMs: 18, maxQueueSize: 2000, overflowPolicy: 'reject' },
    });

    // Background Worker Service
    nodes.push({
      id: 'node-svc-worker',
      name: 'Async Background Worker',
      type: 'service',
      position: { x: 640, y: 380 },
      capacityPerSecond: 1800,
      workerCount: 2,
      enabled: true,
      config: { baselineLatencyMs: 25, maxQueueSize: 3000, overflowPolicy: 'drop' },
    });

    edges.push(
      {
        id: 'edge-gw-auth',
        source: 'node-gateway',
        target: 'node-svc-auth',
        requestsPerInput: 0.3,
        enabled: true,
        label: 'Auth Verify',
      },
      {
        id: 'edge-gw-core',
        source: 'node-gateway',
        target: 'node-svc-core',
        requestsPerInput: 0.8,
        enabled: true,
        label: 'Core Transactions',
      },
      {
        id: 'edge-core-worker',
        source: 'node-svc-core',
        target: 'node-svc-worker',
        requestsPerInput: 0.4,
        enabled: true,
        label: 'Async Events',
      }
    );
  } else {
    // Monolith / Modular Monolith
    nodes.push({
      id: 'node-svc-monolith',
      name: 'Core Application Service',
      type: 'service',
      position: { x: 640, y: 220 },
      capacityPerSecond: 3000,
      workerCount: 4,
      enabled: true,
      config: {
        baselineLatencyMs: 15,
        maxQueueSize: 2500,
        overflowPolicy: 'reject',
      },
    });

    edges.push({
      id: 'edge-gw-monolith',
      source: 'node-gateway',
      target: 'node-svc-monolith',
      requestsPerInput: 1.0,
      enabled: true,
      label: 'API Dispatch',
    });
  }

  // Data Tier: Redis Cache
  nodes.push({
    id: 'node-cache',
    name: 'Redis Cache & Session',
    type: 'cache',
    position: { x: 960, y: 140 },
    capacityPerSecond: 9000,
    workerCount: 2,
    enabled: true,
    config: {
      baselineLatencyMs: 2,
      maxQueueSize: 5000,
      overflowPolicy: 'reject',
    },
  });

  // Data Tier: Primary Database
  const dbName = isIoTOrStreaming ? 'TimescaleDB Cluster' : 'PostgreSQL Primary DB';
  nodes.push({
    id: 'node-db',
    name: dbName,
    type: 'database',
    position: { x: 960, y: 320 },
    capacityPerSecond: 3200,
    workerCount: 2,
    enabled: true,
    config: {
      baselineLatencyMs: 16,
      maxQueueSize: 3000,
      overflowPolicy: 'reject',
    },
  });

  // Connect service(s) to cache & db
  const mainServiceId = nodes.find((n) => n.id === 'node-svc-core' || n.id === 'node-svc-monolith')?.id || 'node-gateway';

  edges.push(
    {
      id: `edge-${mainServiceId}-cache`,
      source: mainServiceId,
      target: 'node-cache',
      requestsPerInput: 0.7,
      enabled: true,
      label: 'Cache Hit/Query',
    },
    {
      id: `edge-${mainServiceId}-db`,
      source: mainServiceId,
      target: 'node-db',
      requestsPerInput: 0.4,
      enabled: true,
      label: 'Persistent Store',
    }
  );

  // 6. Data Flows
  const dataFlows = [
    {
      id: 'flow-auth-read',
      name: 'Read & Verification Flow',
      description: 'End-to-end traversal for authenticated user actions and cached data retrieval.',
      steps: [
        '1. Client initiates an HTTPS request with Bearer JWT token to API Gateway.',
        '2. Gateway validates TLS, applies IP rate-limiting, and routes to backend service.',
        '3. Service checks Redis cache for session state or cached entities (sub-2ms response).',
        '4. On cache miss, queries primary database via connection pool, populates cache, and returns response.',
      ],
    },
    {
      id: 'flow-mutation',
      name: 'Transactional Mutation Flow',
      description: 'Write path ensuring ACID guarantees and event notifications.',
      steps: [
        '1. User submits state mutation (order, chat message, or resource update).',
        '2. Service executes transactional write in PostgreSQL with row-level locks.',
        '3. Cache entries are invalidated or updated with fresh data.',
        '4. Asynchronous event dispatched for background notifications and audit logging.',
      ],
    },
  ];

  // 7. Security Considerations
  const securityConsiderations = [
    'Enforce TLS 1.3 encryption for all external and service-to-service transit.',
    'Stateless authentication via cryptographic JWT with short 15-minute expiry and sliding-window refresh tokens in Redis.',
    'API Gateway rate-limiting (token bucket algorithm) to prevent DDoS and credential stuffing.',
    'Parameterized database queries using an ORM/Query Builder to eliminate SQL injection vectors.',
    'Principle of least privilege for database roles and environment secrets managed via secrets manager.',
  ];

  // 8. Scaling Strategy
  const scalingStrategy = [
    'Phase 1 (<50k DAU): Single app instance cluster behind Nginx with vertical PostgreSQL scaling and Redis caching.',
    'Phase 2 (100k - 500k DAU): Horizontal autoscaling of stateless API containers; separate PostgreSQL read-replicas for heavy reporting queries.',
    'Phase 3 (1M+ DAU): Database table partitioning (e.g. by tenant or date range) and asynchronous message queue buffering for bursty workloads.',
  ];

  // 9. Trade-offs Analysis
  const tradeoffs: TradeoffDecision[] = [
    {
      decision: `${pattern} pattern over microservices swarm`,
      pros: [
        'Significantly lower operational complexity and zero network latency between modules',
        'Atomic database transactions without two-phase commit overhead',
        'Faster iteration velocity for small-to-medium development teams',
      ],
      cons: [
        'All domain modules must deploy together initially',
        'Requires disciplined module boundaries to prevent spaghetti coupling',
      ],
    },
    {
      decision: 'Relational PostgreSQL with Redis over pure NoSQL document store',
      pros: [
        'Guaranteed transactional integrity (ACID) for financial, user, and business data',
        'Ability to execute complex JOINs and analytics without data duplication',
      ],
      cons: [
        'Requires migration schemas as domain entities evolve',
      ],
    },
  ];

  // 10. Future Improvements
  const futureImprovements = [
    'Introduce read-replicas for PostgreSQL when read/write ratio exceeds 8:1.',
    'Implement OpenTelemetry distributed tracing when debugging cross-service latency.',
    'Add an S3-compatible object storage tier with CloudFront CDN for user file uploads.',
    'Adopt Apache Kafka or AWS SQS for guaranteed background event delivery as volume scales.',
  ];

  return {
    id: `rec-${Date.now()}`,
    projectName,
    summary,
    architecturePattern: pattern,
    patternReasoning,
    requirements: {
      functional: [
        'User registration, authentication, and secure session management',
        isEcommerce
          ? 'Catalog browsing, shopping cart, and transactional checkout flow'
          : isRealtime
          ? 'Real-time WebSocket connection handling and instant message broadcast'
          : isIoTOrStreaming
          ? 'High-throughput time-series event ingestion and telemetry logging'
          : 'Core CRUD workflows and data management',
        'Administrative dashboard and reporting analytics',
      ],
      nonFunctional: [
        scale.includes('hyper') ? 'P99 latency < 50ms at 50,000+ RPS' : 'P99 latency < 200ms under standard load',
        'High availability (99.9% uptime target)',
        'Data durability with automated point-in-time database backups',
      ],
      assumptions: [
        'Assumes standard HTTPS / WebSocket client communication protocols',
        'Read traffic substantially exceeds write mutations (estimated 70:30 ratio)',
      ],
      constraints: [
        budget.includes('low') ? 'Optimized for low-cost hosting without complex cloud vendor lock-in' : 'Engineered for standard cloud provider deployment',
        'Team emphasizes clean code separation and maintainable operations',
      ],
    },
    technologies: techStack,
    nodes,
    edges,
    dataFlows,
    securityConsiderations,
    scalingStrategy,
    tradeoffs,
    futureImprovements,
    clarifyingQuestions: [
      'What is your target peak concurrent user count during peak hours?',
      'Do you require multi-region disaster recovery, or is a single-region high-availability cluster sufficient?',
    ],
  };
}

