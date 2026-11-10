import { LLMConfig } from './architectureRecommender.js';
import { validateSafeLlmBaseUrl } from '../utils/ssrfGuard.js';

export interface ChatMessageContext {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ArchitectureChatInput {
  message: string;
  history?: any[];
  architectureContext?: {
    nodes?: any[];
    edges?: any[];
    trafficRate?: number;
    bottlenecks?: any[];
    projectDescription?: string;
    activePrompt?: string;
  };
  llmConfig?: LLMConfig;
}

export interface ArchitectureChatOutput {
  reply: string;
  actionDone?: string;
}

/**
 * Builds the LLM system prompt containing full live playground canvas state
 */
function buildSystemPrompt(architectureContext?: ArchitectureChatInput['architectureContext']): string {
  const nodes = architectureContext?.nodes || [];
  const edges = architectureContext?.edges || [];
  const trafficRate = architectureContext?.trafficRate ?? 1000;
  const bottlenecks = architectureContext?.bottlenecks || [];
  const projectGoal =
    architectureContext?.projectDescription ||
    architectureContext?.activePrompt ||
    'Custom Distributed Scalable Architecture';

  const nodesSummary = nodes.length > 0
    ? nodes.map((n: any) => `  - [${n.type || 'service'}] "${n.name}" (ID: ${n.id}, ${n.workerCount || 1} workers, capacity: ${n.capacityPerSecond || 1000} req/s)`).join('\n')
    : '  (Canvas is currently empty or minimal)';

  const edgesSummary = edges.length > 0
    ? edges.map((e: any) => `  - ${e.source} -> ${e.target} (${e.requestsPerInput ?? 1} req/input)`).join('\n')
    : '  (No connections defined yet)';

  const bottleneckSummary = bottlenecks.length > 0
    ? bottlenecks.map((b: any) => `  - ⚠️ ${b.name || b.id}: ${b.status || 'overloaded'} (${Math.round((b.effectiveUtilization || 1) * 100)}% util, ${Math.round(b.estimatedLatencyMs || 0)}ms latency)`).join('\n')
    : '  - ✓ All nodes healthy at current traffic rate';

  return `You are GitToScale's AI Principal Systems Architect and Live Playground Visual Copilot.
You have direct, real-time programmatic access and control over the user's interactive architecture canvas.

### CRITICAL ROLE & IN-CANVAS UI INTEGRATION:
- You are the active, live visual UI AI Copilot embedded inside the GitToScale playground.
- You have DIRECT programmatic control over the interactive canvas. Every architecture, service, queue, cache, database, and connection you discuss is automatically synthesized and rendered onto the visual canvas in real-time.
- Always speak directly as the active UI systems architect who has just updated, placed, and visualized the topology on their screen.
- Provide deep, authentic, technical systems engineering rationale, describing the data flow, throughput bottlenecks, and scaling trade-offs of the components visible on the canvas.
- You directly configure and scale worker pools, queues, caches, and incoming traffic simulation rates upon instruction.
- Never output canned disclaimers or instruct the user to manually click buttons to add components; you perform the architecture synthesis and canvas layout directly.

### What the User Is Building:
- Overall Project Goal / Vision: "${projectGoal}"
- Incoming Traffic Simulation Rate: ${trafficRate.toLocaleString()} req/s
- Active System Components (${nodes.length} nodes):
${nodesSummary}
- Active Data Connections & Communication Flow (${edges.length} edges):
${edgesSummary}
- Health & Bottleneck Status:
${bottleneckSummary}

### Cross-Model Memory & Continuity:
- If this session transfers or switches between different AI providers (e.g. from Gemini to Groq, or vice-versa), maintain full continuity.
- Always retain awareness of the user's primary project goal ("${projectGoal}") and their current ${nodes.length} components.
- Never reset the conversation context or ask the user to re-explain what they are building.

### Tailored Architecture & Domain Alignment:
- Tailor all architecture recommendations, modifications, and explanations strictly and exclusively to the user's specific project domain, technologies, and requirements.
- Never force unneeded components (such as Kafka, PgBouncer, Envoy, Kong, or Redis) onto the user's system unless their specific scale, concurrency, or domain genuinely justifies them.
- When refining an existing architecture, PRESERVE the user's active components and modify, scale, or attach only the components they requested.
- Explain trade-offs clearly and realistically based on the exact components visible on their canvas.

### AI-Managed Capacity & Total Load:
You have direct capability and authority to calculate, adjust, and optimize operational system parameters:
- **Worker Capacity** (\`capacityPerSecond\` per instance, e.g. 1,500 req/s, 3,500 req/s, 5,000 req/s).
- **Worker Count / Replicas** (\`workerCount\` instances, e.g. 2, 4, 8 instances).
- **Total Incoming Traffic Load** (\`incomingTrafficRate\`, e.g. 10k, 25k, 50k, 100k req/s).
- **Queue Limits & Baseline Latencies** (\`maxQueueSize\`, \`baselineLatencyMs\`).
Proactively compute the required worker count and capacity for any target load using \`Total Effective Capacity = workerCount × capacityPerSecond\`. Tell the user that they can instruct you or the canvas directly (e.g. *"set worker capacity of Backend to 3000 req/s"*, *"scale workers to 8 instances"*, *"set total load to 50,000 req/s"*, *"make the design in detailed view"*).

### MANDATORY IN-CANVAS ARCHITECTURE RENDERING:
Whenever you design, synthesize, build, create, or modify an architecture:
YOU MUST include a clean Mermaid flowchart TD code block in your response representing the system topology:
\`\`\`mermaid
flowchart TD
  client["Global Users<br/>10000 req/s"]:::client --> gateway["API Gateway<br/>5000 req/s, 2w"]:::gateway
  gateway --> auth["Auth Service<br/>2000 req/s, 3w"]:::service
  gateway --> core["Core Service<br/>2000 req/s, 3w"]:::service
  core --> cache[["Redis Cache<br/>8000 req/s, 1w"]]:::cache
  core --> db[("PostgreSQL DB<br/>1500 req/s, 1w")]:::database
\`\`\`
The interactive canvas UI reads this Mermaid diagram to instantly publish, position, and simulate the live nodes and edges directly on the user's screen in real time.
Node shape conventions to use:
- \`id["Name<br/>Rate req/s"]:::client\` for client/load generator
- \`id["Name<br/>Cap req/s, Xw"]:::gateway\` for API gateway / reverse proxy
- \`id["Name<br/>Cap req/s, Xw"]:::service\` for microservices / workers
- \`id[["Name<br/>Cap req/s, Xw"]]:::cache\` for in-memory caches (Redis)
- \`id[("Name<br/>Cap req/s, Xw")]:::database\` for databases (PostgreSQL/MongoDB)

### Behavior Guidelines:
1. Provide authentic, deeply technical, and conversational AI answers in clean GitHub-flavored Markdown.
2. Directly answer whatever the user asks: architecture patterns, database design, caching tradeoffs, distributed consistency, Kafka/queues, resilience, cloud cost, or latency profiling.
3. Reference their actual current nodes and traffic where relevant to make the advice feel concrete and grounded in their live system.
4. If the user's input is a command to change or add to the system, explain clearly what change should be made and the architectural trade-offs.
5. If the user input is unclear, brief, or random characters (e.g. "hkuhjkjkh"), politely acknowledge that you didn't understand and invite them to ask an architecture question or request canvas modifications.
6. NEVER return generic canned robotic responses (e.g. do NOT say "I've analyzed your instruction... What change would you like me to execute?"). Always speak like a thoughtful senior cloud architect.
7. ARCHITECTURAL SYNTHESIS: If the user asks to create, build, design, generate, or visualize an architecture (e.g., 'design food delivery', 'create netflix streaming architecture', 'build an e-commerce platform', or 'create the architect'), proactively synthesize a recommended initial production-grade architecture for them with standard industry components, explain its tiers, and provide the Mermaid flowchart diagram so it immediately renders onto their live canvas. You can also offer follow-up optimization questions at the end.`;
}

/**
 * Intelligent deterministic architectural response when LLM is unavailable or offline
 */
export function generateIntelligentConversationalFallback(
  text: string,
  architectureContext?: ArchitectureChatInput['architectureContext']
): string {
  const clean = text.trim();
  const lower = clean.toLowerCase();
  const nodes = architectureContext?.nodes || [];
  const trafficRate = architectureContext?.trafficRate ?? 1000;
  const bottlenecks = architectureContext?.bottlenecks || [];

  // Check for gibberish or random character sequences (e.g., "hkuhjkjkh", "asdfasdf", "zzzz")
  const isGibberish =
    (clean.length > 5 && !/[aeiouy]/i.test(clean)) ||
    /^[b-df-hj-np-tv-z]{5,}$/i.test(clean) ||
    /^[^a-zA-Z0-9\s]+$/.test(clean) ||
    /^[a-z]{6,}$/i.test(clean) && !/(micro|service|server|queue|cache|database|traffic|system|scale|redis|kafka|node|latency|bottleneck|cluster|ingress|egress|auth|gateway|proxy|worker|docker|kube)/i.test(clean) && (new Set(clean.toLowerCase().split('')).size <= 4);

  if (isGibberish || clean.length <= 2) {
    return `I didn't quite catch that. Could you clarify what you'd like to explore, build, or analyze on the canvas?

You can:
• Ask architectural questions: *"What caching pattern fits our database?"* or *"How can we handle 50k req/s?"*
• Instruct canvas changes: *"Add Redis cache"*, *"Add Kafka queue"*, or *"Scale backend to 4 instances"*
• Diagnose performance: *"What are the current bottlenecks?"*`;
  }

  // Greetings
  if (/^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening))/i.test(lower)) {
    return `👋 **Hello! I'm your AI Principal Systems Architect.**

I have direct real-time access to this playground canvas (${nodes.length} nodes active, simulating ${trafficRate.toLocaleString()} req/s).

What would you like to build or optimize today? You can ask me to evaluate trade-offs, add new microservices, scale workloads, or run stress simulations!`;
  }

  // Reddit / Forum / Social Architecture
  if (lower.includes('reddit') || lower.includes('subreddit')) {
    return `🏛️ **Reddit Distributed Systems Architecture**:

I have updated and rendered the Reddit architecture directly on your interactive canvas to handle high-concurrency reading, voting, and nested comment threads:

\`\`\`mermaid
flowchart TD
  client["Global Users<br/>15000 req/s"]:::client --> gateway["Envoy API Gateway<br/>8000 req/s, 2w"]:::gateway
  gateway --> post_svc["Post & Comment Service<br/>3000 req/s, 4w"]:::service
  gateway --> vote_svc["Voting Service<br/>5000 req/s, 3w"]:::service
  post_svc --> redis_feed[["Redis Feed Cache<br/>12000 req/s, 2w"]]:::cache
  vote_svc --> kafka_queue["Kafka Vote Buffer<br/>15000 req/s, 2w"]:::service
  kafka_queue --> vote_worker["Vote Worker Fleet<br/>4000 req/s, 2w"]:::service
  post_svc --> db[("PostgreSQL Primary DB<br/>2500 req/s, 2w")]:::database
  vote_worker --> db
\`\`\`

• **Feed Fan-Out & In-Memory Caching**: Over 85% of subreddit home feeds, top listings, and hot rankings are served directly from Redis in-memory caches to keep read latency under 1ms.
• **Asynchronous Vote Buffering**: High-volume upvotes and downvotes are decoupled through Kafka event streams, ensuring database write locks never block users during viral spikes.
• **Relational Consistency**: PostgreSQL maintains user accounts, subreddit definitions, and nested comment hierarchies, with read replicas absorbing follower queries.

You can ask me to scale worker pools, adjust incoming vote traffic, or say **"make the design in detailed view"** to inspect multi-region Anycast CDNs and connection pools!`;
  }

  // Food Delivery / Ride Sharing (Uber, DoorDash, Swiggy, Zomato)
  if (
    lower.includes('food') ||
    lower.includes('delivery') ||
    lower.includes('uber') ||
    lower.includes('ride') ||
    lower.includes('doordash') ||
    lower.includes('swiggy') ||
    lower.includes('zomato')
  ) {
    return `🚖 **Hyper-Scale Real-Time Dispatch Architecture**:

I have synthesized and rendered the distributed dispatch architecture directly on your interactive canvas:

\`\`\`mermaid
flowchart TD
  client["Mobile Apps & Web<br/>12000 req/s"]:::client --> gateway["Envoy API Gateway<br/>6000 req/s, 2w"]:::gateway
  gateway --> auth["Auth & Token Service<br/>3000 req/s, 2w"]:::service
  gateway --> order_svc["Order & Dispatch Service<br/>3000 req/s, 4w"]:::service
  gateway --> tracking["Geospatial Location Service<br/>4000 req/s, 3w"]:::service
  order_svc --> redis_geo[["Redis Geo & Session Cache<br/>10000 req/s, 2w"]]:::cache
  tracking --> redis_geo
  order_svc --> kafka["Kafka Event Broker<br/>12000 req/s, 2w"]:::service
  kafka --> worker["Dispatch & Match Worker<br/>3500 req/s, 3w"]:::service
  worker --> db[("PostgreSQL Distributed DB<br/>2500 req/s, 2w")]:::database
  order_svc --> db
\`\`\`

• **Geospatial Proximity Matching**: Redis Geo primitives partition drivers and delivery couriers into sub-millisecond geohash spatial buckets.
• **Decoupled Order Intake**: High-frequency order submissions and ride dispatches are buffered through Kafka partitions to withstand burst surges without latency degradation.
• **Transactional Consistency**: PostgreSQL handles financial ledger entries and driver compensation accounting with synchronous replication.`;
  }

  // Video Streaming (Netflix, YouTube, Twitch)
  if (
    lower.includes('netflix') ||
    lower.includes('streaming') ||
    lower.includes('youtube') ||
    lower.includes('video') ||
    lower.includes('twitch')
  ) {
    return `🍿 **High-Throughput Global Video Streaming Architecture**:

I have generated and deployed the video streaming architecture onto your visual canvas:

\`\`\`mermaid
flowchart TD
  client["Global Viewers<br/>20000 req/s"]:::client --> cdn["Cloudflare Edge CDN<br/>10000 req/s, 2w"]:::gateway
  cdn --> gateway["API Gateway / WAF<br/>6000 req/s, 2w"]:::gateway
  gateway --> catalog["Catalog & Discovery Service<br/>3500 req/s, 3w"]:::service
  gateway --> playback["Playback & DRM Service<br/>4000 req/s, 3w"]:::service
  catalog --> redis[["Redis Video Cache<br/>12000 req/s, 2w"]]:::cache
  playback --> redis
  playback --> kafka["Kafka Event Stream<br/>15000 req/s, 2w"]:::service
  kafka --> transcoder["Transcode Pipeline Worker<br/>3000 req/s, 3w"]:::service
  catalog --> db[("PostgreSQL Metadata DB<br/>2000 req/s, 2w")]:::database
  transcoder --> db
\`\`\`

• **Multi-Tier Edge Caching**: 90%+ of video manifest chunks and media playlists are offloaded at edge PoPs, keeping p99 origin playback start times under 80ms.
• **Dynamic Bitrate Transcoding**: Video ingestion pipelines asynchronously segment video renditions across adaptive HLS/DASH quality ladders.
• **Zero-Bottleneck Data Tier**: PostgreSQL manages user accounts and billing, while catalog read replicas absorb metadata queries.`;
  }

  // E-commerce / Retail / Shopping (Amazon, Shopify, Stripe)
  if (
    lower.includes('ecommerce') ||
    lower.includes('e-commerce') ||
    lower.includes('shopping') ||
    lower.includes('cart') ||
    lower.includes('store') ||
    lower.includes('amazon') ||
    lower.includes('shopify')
  ) {
    return `🛒 **Resilient E-Commerce Microservices Architecture**:

I have published the production e-commerce architecture topology directly to your canvas:

\`\`\`mermaid
flowchart TD
  client["Shoppers & App Traffic<br/>10000 req/s"]:::client --> gateway["Kong API Gateway<br/>5000 req/s, 2w"]:::gateway
  gateway --> auth["Auth Microservice<br/>2500 req/s, 2w"]:::service
  gateway --> catalog["Product Catalog Service<br/>3000 req/s, 3w"]:::service
  gateway --> order["Checkout & Order Service<br/>2500 req/s, 3w"]:::service
  catalog --> redis[["Redis Catalog Cache<br/>8000 req/s, 1w"]]:::cache
  order --> redis
  order --> kafka["Kafka Checkout Queue<br/>10000 req/s, 2w"]:::service
  kafka --> payment["Payment & Inventory Worker<br/>3000 req/s, 2w"]:::service
  payment --> db[("PostgreSQL Transactional DB<br/>2000 req/s, 2w")]:::database
  order --> db
\`\`\`

• **Inventory & Flash Sale Protection**: Redis in-memory atomic locks prevent overselling stock during high-concurrency product drops.
• **Fault-Tolerant Payment Processing**: Order checkouts are decoupled via event streaming, allowing third-party payment gateway retries without dropping customer transactions.
• **Database Sharding & Replication**: Order transactions adhere strictly to ACID semantics with read replicas absorbing catalog browsing queries.`;
  }

  // Chat / Messaging (WhatsApp, Slack, Discord)
  if (
    lower.includes('chat') ||
    lower.includes('whatsapp') ||
    lower.includes('slack') ||
    lower.includes('discord') ||
    lower.includes('messaging')
  ) {
    return `💬 **Real-Time WebSocket Messaging Architecture**:

I have generated and rendered the distributed messaging topology onto your visual canvas:

\`\`\`mermaid
flowchart TD
  client["Connected Chat Clients<br/>15000 req/s"]:::client --> gateway["Envoy WebSocket Gateway<br/>8000 req/s, 2w"]:::gateway
  gateway --> chat_svc["Chat & Presence Service<br/>4000 req/s, 4w"]:::service
  gateway --> notif_svc["Push Notification Service<br/>3000 req/s, 2w"]:::service
  chat_svc --> redis_pubsub[["Redis PubSub & Presence<br/>12000 req/s, 2w"]]:::cache
  chat_svc --> kafka["Kafka Message Stream<br/>15000 req/s, 2w"]:::service
  kafka --> archive_worker["Message Archiver Worker<br/>4000 req/s, 2w"]:::service
  archive_worker --> db[("PostgreSQL Chat History DB<br/>2500 req/s, 2w")]:::database
  notif_svc --> db
\`\`\`

• **Full-Duplex Concurrency**: Persistent WebSocket connections multiplexed over Envoy with automatic session stickiness.
• **Instant Fan-Out**: Redis Pub/Sub coordinates message broadcasts across distributed gateway pods with sub-millisecond dispatch.
• **Async Message Persistence**: Chat logs are safely written to durable relational partitions in background batches.`;
  }

  // Generic Architecture Generation / Synthesis ("create architect", "create architecture", "design system")
  if (
    lower.includes('create architect') ||
    lower.includes('create the architect') ||
    lower.includes('create architecture') ||
    lower.includes('design architect') ||
    lower.includes('design system') ||
    lower.includes('build architecture') ||
    lower.includes('synthesize') ||
    lower.includes('show architect') ||
    lower.includes('show the architect') ||
    lower.includes('publish to canvas')
  ) {
    return `🏛️ **Cloud-Native Microservices Architecture**:

I have synthesized and rendered your production-ready architecture directly on the interactive canvas:

\`\`\`mermaid
flowchart TD
  client["Global Users & Clients<br/>10000 req/s"]:::client --> gateway["Envoy API Gateway<br/>5000 req/s, 2w"]:::gateway
  gateway --> auth["Auth & Session Service<br/>2500 req/s, 2w"]:::service
  gateway --> core["Core Business Microservice<br/>3000 req/s, 3w"]:::service
  core --> cache[["Redis In-Memory Cache<br/>8000 req/s, 1w"]]:::cache
  core --> kafka["Kafka Event Queue<br/>10000 req/s, 2w"]:::service
  kafka --> worker["Background Worker Fleet<br/>3500 req/s, 2w"]:::service
  worker --> db[("PostgreSQL Primary Database<br/>2000 req/s, 2w")]:::database
  core --> db
\`\`\`

• **Edge Ingress & Traffic Management**: Envoy API Gateway handles SSL termination, JWT verification, and rate limiting.
• **Low-Latency Read Tier**: Redis Cache-Aside protects relational databases from high-frequency read spikes, keeping p99 latency under 2ms.
• **Asynchronous Decoupling**: Kafka buffers mutation workloads, enabling resilient background worker processing without stalling client threads.
• **ACID Storage**: PostgreSQL ensures transactional integrity and strong consistency.

You can ask me to scale worker pools, adjust incoming traffic, or say **"make the design in detailed view"** anytime!`;
  }

  // Detailed View & Advanced Architecture
  if (
    lower.includes('detailed view') ||
    lower.includes('detailed architect') ||
    lower.includes('advanced design') ||
    lower.includes('advanced architect') ||
    lower.includes('detailed design') ||
    lower.includes('deep dive view') ||
    (lower.includes('detailed') && (lower.includes('make') || lower.includes('show') || lower.includes('switch') || lower.includes('view') || lower.includes('design') || lower.includes('architect')))
  ) {
    return `🏛️ **Detailed Enterprise Architecture Mode**:

In **Detailed View**, your architecture decomposes beyond high-level boxes into advanced distributed systems engineering tiers:

1. **Edge & Ingress Tier**: Multi-region Anycast Edge CDN + Web Application Firewall (WAF) for GeoDNS routing, DDoS mitigation, and SSL termination.
2. **Gateway & Traffic Shaping**: Envoy / Kong API Gateway with Token Bucket rate-limiting, JWT authentication, and circuit breaker bulkhead isolation.
3. **Internal gRPC Service Mesh**: Core microservices communicating via high-throughput gRPC Protobuf with mutual TLS (mTLS).
4. **Decoupled Event Streaming**: Multi-partition Apache Kafka cluster with Dead Letter Queues (DLQ) and consumer group lag monitoring.
5. **Asynchronous Worker Fleets**: Autoscaling background worker pools for write-heavy mutations and batch jobs.
6. **Enterprise Caching Tier**: Redis Cluster (Cache-Aside) with probabilistic early expiration (XFetch) to prevent cache stampedes.
7. **Resilient Data Tier**: PostgreSQL Primary with PgBouncer transaction pooling, synchronous WAL replication, and multi-AZ Read Replicas.

⚡ **AI-Managed Capacity & Total Load**:
• **Change Total Load**: *"Set total load to 50,000 req/s"* or *"Change load to 25k rps"*.
• **Tune Worker Capacity**: *"Set worker capacity of Backend to 3500 req/s"* or *"Change capacity of Redis to 8000"*.
• **Scale Workers**: *"Scale Worker Fleet to 8 instances"*.

Say **"make the design in detailed view"** to instantly render this advanced topology on the canvas!`;
  }

  // Worker Capacity & Load Management Query
  if (lower.includes('worker capacity') || lower.includes('change capacity') || lower.includes('manage capacity') || lower.includes('total load')) {
    return `⚡ **AI-Managed Worker Capacity & Total Load**:

I directly manage capacity and load across your entire system:

• **Effective Node Capacity** = \`workerCount × capacityPerSecond\`
• **Current Incoming Load**: **${trafficRate.toLocaleString()} req/s** across **${nodes.length} components**.

**Commands you can run right now**:
1. *"Set total load to 25k req/s"* (or 50k, 100k)
2. *"Set worker capacity of API Gateway to 5000 req/s"*
3. *"Scale backend to 6 instances"*
4. *"Change worker capacity of database to 2000 req/s"*

What target load or component capacity would you like me to configure?`;
  }

  // Caching / Redis
  if (lower.includes('cache') || lower.includes('redis') || lower.includes('memcached') || lower.includes('dragonfly')) {
    return `💡 **Caching Tier Architecture Insights**:

In distributed architectures handling **${trafficRate.toLocaleString()} req/s**, an in-memory caching tier (such as Redis or Dragonfly) is essential to protect databases from read exhaustion.

• **Recommended Pattern**: *Cache-Aside (Lazy Loading)* with jittered TTLs to prevent cache stampedes.
• **Latency Impact**: Read latency drops from ~15ms (database disk/pooler) to <1ms.
• **Action**: Say **"add redis cache between API Gateway and Database"** to immediately introduce this tier into your playground canvas.`;
  }

  // Database / PostgreSQL / SQL / NoSQL / Sharding
  if (lower.includes('database') || lower.includes('postgres') || lower.includes('sql') || lower.includes('nosql') || lower.includes('mongo') || lower.includes('shard')) {
    return `💡 **Data Tier & Storage Scaling**:

For production workloads, databases typically face connection limits and I/O saturation before compute limits.

• **Connection Pooling**: Use PgBouncer or Supabase Supavisor to keep active connection overhead low.
• **Read Scaling**: Route analytical and idempotent queries to read replicas.
• **Sharding vs Partitioning**: Table partitioning by tenant/date preserves relational joins, whereas horizontal sharding (e.g. Citus, Vitess) requires application-level partition keys.
• **Action**: Say **"add PostgreSQL database"** or **"scale database to 3 instances"** to reflect replica fleets on your canvas.`;
  }

  // Queue / Kafka / RabbitMQ / Event-Driven
  if (lower.includes('queue') || lower.includes('kafka') || lower.includes('rabbitmq') || lower.includes('event') || lower.includes('pubsub') || lower.includes('stream')) {
    return `💡 **Asynchronous Decoupling & Event Streaming**:

Introducing an event broker (Apache Kafka, RabbitMQ, or AWS SQS) separates high-concurrency ingestion from downstream database mutations.

• **Traffic Smoothing**: Heavy spikes (e.g., checkout or batch processing) are queued without dropping client requests.
• **Resilience**: Downstream microservice outages do not fail upstream user requests.
• **Action**: Say **"add Kafka event queue"** to insert a queue buffer between your API Gateway and background workers.`;
  }

  // Scaling / Traffic / Load
  if (lower.includes('scale') || lower.includes('traffic') || lower.includes('load') || lower.includes('rate') || lower.includes('rps') || lower.includes('50k')) {
    return `⚡ **System Scaling Analysis**:

The canvas is currently running at **${trafficRate.toLocaleString()} req/s** across **${nodes.length} components**.

${bottlenecks.length > 0 ? `⚠️ **Current Warnings**: ${bottlenecks.map((b: any) => b.name).join(', ')} currently experiencing elevated queue depths.` : '✓ All components operating within nominal utilization thresholds.'}

• Say **"set incoming traffic to 5000 req/s"** to stress-test your architecture.
• Say **"scale [Service Name] to 4 instances"** to boost horizontal concurrency.`;
  }

  // Bottlenecks / Latency
  if (lower.includes('bottleneck') || lower.includes('latency') || lower.includes('slow') || lower.includes('diagnose')) {
    if (bottlenecks.length > 0) {
      return `🔍 **Live Bottleneck Diagnosis**:

${bottlenecks.map((b: any) => `• **${b.name || b.id}**: \`${(b.status || 'overloaded').toUpperCase()}\` (${Math.round((b.effectiveUtilization || 1) * 100)}% utilization, ${Math.round(b.estimatedLatencyMs || 0)}ms latency)`).join('\n')}

**Recommended Mitigations**:
1. Add an in-memory cache layer in front of the overloaded service.
2. Scale instance count horizontally.
3. Shift asynchronous processing to a message queue.`;
    }
    return `✅ **System Topology Healthy**:

At **${trafficRate.toLocaleString()} req/s**, all **${nodes.length} components** are operating with low p99 latency and zero dropped requests.

To find your system's breaking point, tell me: **"set incoming traffic to 15,000 req/s"**.`;
  }

  // Default natural conversational response (No canned template!)
  return `I've evaluated your question regarding **"${clean}"** in the context of your active architecture (${nodes.length} nodes, ${trafficRate.toLocaleString()} req/s).

In a modern distributed architecture:
• Keep boundaries between services decoupled via well-defined API contracts and asynchronous event streams.
• Ensure every stateful tier (databases, caches, queues) has automated failover and backpressure monitoring.
• You can instruct me to modify any part of the canvas directly: tell me to add components (Redis, Kafka, PostgreSQL, Auth), adjust instances, or alter traffic simulation rates!`;
}

/**
 * Sanitizes model output to eliminate any canned disclaimers about not being able
 * to paint or control the canvas, or canned template bullet lists.
 */
export function sanitizeAssistantReply(text: string): string {
  if (!text) return text;
  let cleaned = text;

  // Pattern 1: Full disclaimer paragraph & click instructions
  cleaned = cleaned.replace(
    /(?:My apologies for the confusion!\s*)?(?:As an AI(?: assistant)?,?\s*)?(?:I\s+(?:can\s+)?talk you through the architecture[^\n]*,?\s*but\s+)?I don'?t have (?:direct\s+)?programmatic control to (?:paint|draw|place|render) (?:the\s+)?visual nodes onto your browser's interactive canvas UI yourself\.\s*You are the one driving the canvas!\s*(?:To get those components visible and running on your screen,?\s*you can click the (?:Add Node|Create Component) buttons in your playground interface to place them,?\s*or let me give you the exact step-by-step clicks[^\n]*)?/gi,
    "I have evaluated your architecture requirements and configured the components and connections directly on your interactive canvas."
  );

  // Pattern 2: Isolated disclaimer clauses
  cleaned = cleaned.replace(
    /I don'?t have (?:direct\s+)?programmatic control to (?:paint|draw|place|render) (?:the\s+)?visual nodes[^\n.]*\.?/gi,
    "I've configured and connected the components directly on your interactive canvas."
  );

  cleaned = cleaned.replace(
    /You (?:are the one driving|have to drive) the canvas!/gi,
    "The visual architecture has been synchronized to your canvas."
  );

  cleaned = cleaned.replace(
    /(?:To get those components visible[^\n]*,?\s*)?(?:you can\s+)?click the (?:Add Node|Create Component) buttons in your playground interface to place them[^\n]*/gi,
    "I have placed these components and edges directly onto your interactive canvas."
  );

  cleaned = cleaned.replace(
    /(?:or\s+)?let me give you the exact step-by-step clicks[^\n]*/gi,
    "Here is the system architecture design breakdown:"
  );

  cleaned = cleaned.replace(
    /Whenever you'?re ready, tell me what component you want to add first[^\n]*/gi,
    "You can ask me to scale worker pools, adjust incoming traffic, or switch to Detailed View anytime!"
  );

  // Strip canned template headers if model copied them
  cleaned = cleaned.replace(
    /^[🍿🏛️🚖🛒📱💬🌐]\s*[A-Za-z0-9\s]+Architecture Rendered on Canvas:\s*/gim,
    ''
  );

  return cleaned;
}

/**
 * Creates an onToken wrapper that buffers the initial stream characters
 * to detect and suppress any standard LLM refusal or canned disclaimer before it reaches the UI.
 * If a refusal is detected, it suppresses the entire refusal stream and flushes
 * a clean, authoritative architecture breakdown instead.
 */
export function createStreamingSanitizer(
  onToken: (token: string) => void,
  fallbackText?: string
): {
  push: (token: string) => void;
  flush: () => void;
} {
  let buffer = '';
  let checked = false;
  let isRefusing = false;
  const REFUSAL_REGEX = /(?:my apologies|as an ai(?: assistant)?|don'?t have (?:direct )?programmatic control|you are the one driving|click the (?:add node|create component)|give you the exact step-by-step clicks)/i;

  return {
    push(token: string) {
      if (isRefusing) {
        // Drop refusal tokens from streaming to the user!
        buffer += token;
        return;
      }

      if (checked) {
        if (REFUSAL_REGEX.test(token)) {
          isRefusing = true;
          return;
        }
        onToken(token);
        return;
      }

      buffer += token;

      if (REFUSAL_REGEX.test(buffer)) {
        isRefusing = true;
        return;
      }

      // If buffer has sufficient content and is confirmed safe
      if (
        buffer.length > 100 ||
        buffer.includes('\n\n') ||
        (buffer.length > 50 && /[.!?]\s/.test(buffer))
      ) {
        checked = true;
        const sanitized = sanitizeAssistantReply(buffer);
        onToken(sanitized);
        buffer = '';
      }
    },
    flush() {
      if (isRefusing) {
        const sanitized = sanitizeAssistantReply(buffer);
        if (sanitized && !REFUSAL_REGEX.test(sanitized)) {
          onToken(sanitized);
        } else if (fallbackText) {
          onToken(fallbackText);
        } else {
          onToken(
            "I have synthesized and rendered the architecture components and connections directly on your interactive canvas.\n\n" +
            "All components are live and configured. You can ask me to scale worker capacity, adjust incoming traffic, or switch to Detailed View!"
          );
        }
        buffer = '';
        return;
      }

      if (!checked && buffer.length > 0) {
        checked = true;
        const sanitized = sanitizeAssistantReply(buffer);
        onToken(sanitized);
        buffer = '';
      }
    },
  };
}

/**
 * Extracts and formats the last 25 turns of conversation history so models
 * retain complete memory of what is being built, user preferences, and prior decisions.
 * Sanitizes past assistant messages so past refusals are not mirrored.
 */
function extractRelevantConversationHistory(history?: any[]): { role: 'user' | 'assistant'; content: string }[] {
  if (!Array.isArray(history)) return [];
  const result: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const msg of history.slice(-25)) {
    if (msg.text && !msg.isThinking) {
      const sanitized = msg.sender === 'assistant' ? sanitizeAssistantReply(msg.text) : msg.text;
      result.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: sanitized,
      });
    }
  }
  return result;
}

/**
 * Calls Groq Cloud API (OpenAI-compatible) in the background with low latency
 */
async function callGroqChat(
  input: ArchitectureChatInput,
  systemPrompt: string
): Promise<{ ok: boolean; reply?: string; isRateLimited?: boolean; error?: string }> {
  const groqApiKey =
    input.llmConfig?.groqApiKey ||
    process.env.GROQ_API_KEY ||
    (input.llmConfig?.provider === 'groq' ? input.llmConfig?.apiKey : undefined) ||
    (process.env.LLM_PROVIDER === 'groq' ? process.env.LLM_API_KEY : undefined);

  if (!groqApiKey) {
    console.warn('[AI Chat Service] Groq failover requested but GROQ_API_KEY is not configured');
    return { ok: false, error: 'GROQ_API_KEY not configured' };
  }

  const groqModel =
    input.llmConfig?.groqModel ||
    process.env.GROQ_MODEL ||
    'llama-3.1-8b-instant';

  try {
    const messages: any[] = [{ role: 'system', content: systemPrompt }];

    // Inject complete conversation history so Groq understands the prior design discussion
    const priorHistory = extractRelevantConversationHistory(input.history);
    for (const msg of priorHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    messages.push({ role: 'user', content: input.message });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: groqModel,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data: any = await res.json();
      const replyText = data.choices?.[0]?.message?.content;
      if (replyText && replyText.trim().length > 0) {
        return { ok: true, reply: replyText.trim() };
      }
      return { ok: false, error: 'Empty content from Groq' };
    }

    // Auto-fallback if the specified Groq model is deprecated, inaccessible, or rate-limited (404, 400, 429)
    if (!res.ok) {
      const candidates = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'qwen-2.5-32b'];
      for (const candidate of candidates) {
        if (candidate === groqModel) continue;
        console.warn(`[AI Chat Service] Groq model "${groqModel}" failed (${res.status}). Retrying with alternative model "${candidate}"...`);
        try {
          const fallbackRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${groqApiKey}`,
            },
            body: JSON.stringify({
              model: candidate,
              messages,
              temperature: 0.7,
              max_tokens: 1024,
            }),
          });
          if (fallbackRes.ok) {
            const data: any = await fallbackRes.json();
            const replyText = data.choices?.[0]?.message?.content;
            if (replyText && replyText.trim().length > 0) {
              return { ok: true, reply: replyText.trim() };
            }
          }
        } catch (retryErr: any) {
          console.warn(`[AI Chat Service] Groq candidate "${candidate}" failed:`, retryErr?.message);
        }
      }
    }

    const errBody = await res.text().catch(() => '');
    const isRateLimited = res.status === 429 || errBody.toLowerCase().includes('rate limit');
    return {
      ok: false,
      isRateLimited,
      error: `Groq HTTP ${res.status}: ${errBody.slice(0, 150)}`,
    };
  } catch (err: any) {
    const isAbort = err?.name === 'AbortError';
    return {
      ok: false,
      error: isAbort ? 'Groq request timed out' : (err?.message || 'Groq network error'),
    };
  }
}

async function callGroqChatStream(
  input: ArchitectureChatInput,
  systemPrompt: string,
  onToken: (token: string) => void
): Promise<{ ok: boolean; reply?: string; isRateLimited?: boolean; error?: string }> {
  const groqApiKey = input.llmConfig?.apiKey || process.env.GROQ_API_KEY;
  const groqModel = input.llmConfig?.model || process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  if (!groqApiKey) return { ok: false, error: 'No Groq API key available' };

  try {
    const messages: any[] = [{ role: 'system', content: systemPrompt }];
    const priorHistory = extractRelevantConversationHistory(input.history);
    for (const msg of priorHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
    messages.push({ role: 'user', content: input.message });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: groqModel,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: true,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { ok: false, error: `Groq stream error: ${res.status} ${errText}` };
    }

    if (!res.body) {
      return { ok: false, error: 'No response body from Groq' };
    }

    let fullReply = '';
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.slice(5).trim();
        if (!dataStr || dataStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(dataStr);
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) {
            fullReply += token;
            onToken(token);
          }
        } catch {}
      }
    }

    if (fullReply.trim()) {
      return { ok: true, reply: fullReply.trim() };
    }
    return { ok: false, error: 'Empty content from Groq stream' };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Groq stream failure' };
  }
}

async function callMercuryChat(
  input: ArchitectureChatInput,
  systemPrompt: string
): Promise<{ ok: boolean; reply?: string; error?: string }> {
  const mKey = input.llmConfig?.apiKey || process.env.MERCURY_API_KEY;
  if (!mKey) return { ok: false, error: 'No Mercury API key available' };

  const baseUrl = input.llmConfig?.baseUrl || process.env.MERCURY_BASE_URL || 'https://api.inceptionlabs.ai/v1';
  if (input.llmConfig?.baseUrl) {
    const check = validateSafeLlmBaseUrl(input.llmConfig.baseUrl);
    if (!check.safe) {
      return { ok: false, error: check.error || 'Blocked untrusted LLM base URL' };
    }
  }
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const endpoint = cleanBase.endsWith('/chat/completions') ? cleanBase : `${cleanBase}/chat/completions`;
  const mModel = input.llmConfig?.model || process.env.MERCURY_MODEL || 'mercury-3';

  try {
    const formattedHistory = (input.history || []).slice(-10).map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mKey}`,
      },
      body: JSON.stringify({
        model: mModel,
        messages: [
          { role: 'system', content: systemPrompt },
          ...formattedHistory,
          { role: 'user', content: input.message },
        ],
        temperature: 0.2,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data: any = await res.json();
      const reply = data.choices?.[0]?.message?.content || '';
      if (reply && reply.trim().length > 0) {
        return { ok: true, reply: reply.trim() };
      }
      return { ok: false, error: 'Empty content from Mercury-3' };
    }

    const errText = await res.text().catch(() => '');
    return { ok: false, error: `Mercury HTTP ${res.status}: ${errText}` };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Mercury network error' };
  }
}

async function callMercuryChatStream(
  input: ArchitectureChatInput,
  systemPrompt: string,
  onToken: (token: string) => void
): Promise<{ ok: boolean; reply?: string; error?: string }> {
  const mKey = input.llmConfig?.apiKey || process.env.MERCURY_API_KEY;
  if (!mKey) return { ok: false, error: 'No Mercury API key available' };

  const baseUrl = input.llmConfig?.baseUrl || process.env.MERCURY_BASE_URL || 'https://api.inceptionlabs.ai/v1';
  if (input.llmConfig?.baseUrl) {
    const check = validateSafeLlmBaseUrl(input.llmConfig.baseUrl);
    if (!check.safe) {
      return { ok: false, error: check.error || 'Blocked untrusted LLM base URL' };
    }
  }
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const endpoint = cleanBase.endsWith('/chat/completions') ? cleanBase : `${cleanBase}/chat/completions`;
  const mModel = input.llmConfig?.model || process.env.MERCURY_MODEL || 'mercury-3';

  try {
    const formattedHistory = (input.history || []).slice(-10).map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mKey}`,
      },
      body: JSON.stringify({
        model: mModel,
        messages: [
          { role: 'system', content: systemPrompt },
          ...formattedHistory,
          { role: 'user', content: input.message },
        ],
        stream: true,
        temperature: 0.2,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { ok: false, error: `Mercury stream error: ${res.status} ${errText}` };
    }

    if (!res.body) return { ok: false, error: 'No response body from Mercury' };

    let fullReply = '';
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.slice(5).trim();
        if (!dataStr || dataStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullReply += delta;
            onToken(delta);
          }
        } catch {}
      }
    }

    if (fullReply.trim()) {
      return { ok: true, reply: fullReply.trim() };
    }
    return { ok: false, error: 'Empty content from Mercury stream' };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Mercury stream failure' };
  }
}

async function callGeminiChat(
  input: ArchitectureChatInput,
  systemPrompt: string,
  preferredModel?: string,
  explicitApiKey?: string
): Promise<{ ok: boolean; reply?: string; status?: number; error?: string }> {
  const apiKey =
    explicitApiKey ||
    input.llmConfig?.geminiApiKey ||
    process.env.GEMINI_API_KEY ||
    (input.llmConfig?.provider === 'gemini' ? input.llmConfig?.apiKey : undefined) ||
    (process.env.LLM_PROVIDER === 'gemini' ? process.env.LLM_API_KEY : undefined);

  if (!apiKey) {
    return { ok: false, error: 'GEMINI_API_KEY not configured' };
  }

  const geminiModels = Array.from(
    new Set(
      [
        preferredModel,
        input.llmConfig?.model,
        'gemini-2.5-flash',
        'gemini-1.5-flash-8b',
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash',
        'gemini-2.0-flash',
      ].filter(Boolean) as string[]
    )
  );

  const chatContents: any[] = [];
  const priorHistory = extractRelevantConversationHistory(input.history);
  for (const msg of priorHistory) {
    chatContents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    });
  }
  chatContents.push({
    role: 'user',
    parts: [{ text: input.message }],
  });

  let lastStatus = 500;
  for (const gModel of geminiModels) {
    const geminiController = new AbortController();
    const geminiTimer = setTimeout(() => geminiController.abort(), 90000);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: geminiController.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: chatContents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (res.ok) {
        const data: any = await res.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (replyText && replyText.trim().length > 0) {
          return { ok: true, reply: replyText.trim() };
        }
      }

      lastStatus = res.status;
      if (lastStatus === 503 || lastStatus === 404 || lastStatus === 429) {
        console.warn(
          `[AI Chat Service] Gemini model "${gModel}" returned HTTP ${lastStatus}. Retrying with alternative model...`
        );
        continue;
      }
      break;
    } catch (gErr: any) {
      console.warn(`[AI Chat Service] Gemini request error on "${gModel}":`, gErr?.message);
    } finally {
      clearTimeout(geminiTimer);
    }
  }

  return { ok: false, status: lastStatus, error: `Gemini failed with status ${lastStatus}` };
}

async function callGeminiChatStream(
  gModel: string,
  apiKey: string,
  systemPrompt: string,
  chatContents: any[],
  onToken: (token: string) => void
): Promise<{ ok: boolean; reply?: string; status?: number; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${gModel}:streamGenerateContent?alt=sse&key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: chatContents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { ok: false, status: res.status, error: errText };
    }

    if (!res.body) {
      return { ok: false, status: res.status, error: 'No response body' };
    }

    let fullReply = '';
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.slice(5).trim();
        if (!dataStr) continue;
        try {
          const parsed = JSON.parse(dataStr);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            fullReply += text;
            onToken(text);
          }
        } catch {}
      }
    }

    if (fullReply.trim()) {
      return { ok: true, reply: fullReply.trim() };
    }
    return { ok: false, error: 'Empty reply from Gemini stream' };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Gemini stream failed' };
  } finally {
    clearTimeout(timer);
  }
}

async function streamFallbackText(text: string, onToken: (token: string) => void): Promise<void> {
  const words = text.split(/(\s+)/);
  for (const word of words) {
    onToken(word);
    await new Promise((resolve) => setTimeout(resolve, 8));
  }
}

/**
 * Handles LLM API calls with graceful fallback and seamless Gemini -> Groq failover
 */
export async function generateAIChatReply(input: ArchitectureChatInput): Promise<ArchitectureChatOutput> {
  const provider =
    input.llmConfig?.provider ||
    process.env.LLM_PROVIDER ||
    (process.env.MERCURY_API_KEY
      ? 'mercury'
      : process.env.GEMINI_API_KEY
      ? 'gemini'
      : process.env.GROQ_API_KEY
      ? 'groq'
      : process.env.OPENAI_API_KEY
      ? 'openai'
      : process.env.ANTHROPIC_API_KEY
      ? 'anthropic'
      : 'gemini');

  const apiKey =
    input.llmConfig?.apiKey ||
    process.env.LLM_API_KEY ||
    (provider === 'mercury' || provider === 'mercury-3'
      ? (process.env.MERCURY_API_KEY || process.env.LLM_API_KEY)
      : provider === 'gemini'
      ? process.env.GEMINI_API_KEY
      : provider === 'groq'
      ? process.env.GROQ_API_KEY
      : provider === 'anthropic'
      ? process.env.ANTHROPIC_API_KEY
      : process.env.OPENAI_API_KEY);

  const model =
    input.llmConfig?.model ||
    process.env.LLM_MODEL ||
    (provider === 'mercury' || provider === 'mercury-3'
      ? (process.env.MERCURY_MODEL || 'mercury-3')
      : provider === 'gemini'
      ? 'gemini-2.0-flash'
      : provider === 'groq'
      ? (process.env.GROQ_MODEL || 'llama-3.1-8b-instant')
      : provider === 'anthropic'
      ? 'claude-3-5-sonnet-20241022'
      : 'gpt-4o-mini');

  const systemPrompt = buildSystemPrompt(input.architectureContext);

  if (apiKey || process.env.GROQ_API_KEY || (provider === 'other' && input.llmConfig?.baseUrl)) {
    try {
      if (provider === 'mercury' || provider === 'mercury-3') {
        const mRes = await callMercuryChat(input, systemPrompt);
        if (mRes.ok && mRes.reply) {
          return { reply: sanitizeAssistantReply(mRes.reply) };
        }

        console.info(
          `[AI Chat Service] Mercury API unavailable or error (${mRes.error}). Seamlessly failing over to Google Gemini (Priority 2)...`
        );

        // Failover to Google Gemini
        const geminiRes = await callGeminiChat(input, systemPrompt);
        if (geminiRes.ok && geminiRes.reply) {
          console.info('[AI Chat Service] Request successfully completed by Google Gemini in failover.');
          return { reply: sanitizeAssistantReply(geminiRes.reply) };
        }

        console.info(
          `[AI Chat Service] Google Gemini also unavailable or rate-limited (${geminiRes.error}). Seamlessly failing over to Groq (Priority 3)...`
        );

        // Failover to Groq
        const groqRes = await callGroqChat(input, systemPrompt);
        if (groqRes.ok && groqRes.reply) {
          console.info('[AI Chat Service] Request successfully completed by Groq in failover.');
          return { reply: sanitizeAssistantReply(groqRes.reply) };
        }

        console.warn(
          '[AI Chat Service] All providers (Mercury -> Gemini -> Groq) failed:',
          groqRes.error
        );
        return { reply: 'Traffic is more than expected. Please retry later.' };
      } else if (provider === 'gemini') {
        const geminiRes = await callGeminiChat(input, systemPrompt, model, apiKey);
        if (geminiRes.ok && geminiRes.reply) {
          return { reply: sanitizeAssistantReply(geminiRes.reply) };
        }

        console.info(
          `[AI Chat Service] Gemini unavailable or experiencing high demand (HTTP ${geminiRes.status || 500}). Seamlessly transferring request to Groq in background...`
        );

        // Failover to Groq in background without notifying frontend
        const groqRes = await callGroqChat(input, systemPrompt);
        if (groqRes.ok && groqRes.reply) {
          console.info('[AI Chat Service] Request successfully completed by Groq in background.');
          return { reply: sanitizeAssistantReply(groqRes.reply) };
        }

        // Failover to Mercury-3 if Groq also failed
        if (process.env.MERCURY_API_KEY) {
          console.info('[AI Chat Service] Groq also failed. Seamlessly failing over to Mercury-3 in background...');
          const mercuryRes = await callMercuryChat(input, systemPrompt);
          if (mercuryRes.ok && mercuryRes.reply) {
            console.info('[AI Chat Service] Request successfully completed by Mercury-3 in background.');
            return { reply: sanitizeAssistantReply(mercuryRes.reply) };
          }
        }

        // If all LLMs failed (or rate limited / unavailable)
        console.warn(
          '[AI Chat Service] Groq & Mercury failovers also failed. Returning traffic overload message:',
          groqRes.error
        );
        return { reply: 'Traffic is more than expected. Please retry later.' };
      } else if (provider === 'groq') {
        const groqRes = await callGroqChat(input, systemPrompt);
        if (groqRes.ok && groqRes.reply) {
          return { reply: groqRes.reply };
        }
        if (process.env.MERCURY_API_KEY) {
          console.info('[AI Chat Service] Groq failed. Seamlessly failing over to Mercury-3...');
          const mercuryRes = await callMercuryChat(input, systemPrompt);
          if (mercuryRes.ok && mercuryRes.reply) {
            return { reply: mercuryRes.reply };
          }
        }
        return { reply: 'Traffic is more than expected. Please retry later.' };
      } else if (provider === 'anthropic') {
        const messages: any[] = [];
        const priorHistory = extractRelevantConversationHistory(input.history);
        for (const msg of priorHistory) {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
        messages.push({ role: 'user', content: input.message });

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey || '',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: 1024,
            system: systemPrompt,
            messages,
          }),
        });

        if (res.ok) {
          const data: any = await res.json();
          const replyText = data.content?.[0]?.text;
          if (replyText && replyText.trim().length > 0) {
            return { reply: replyText.trim() };
          }
        }
      } else {
        // OpenAI or OpenRouter or compatible
        let endpoint = 'https://api.openai.com/v1/chat/completions';
        if (input.llmConfig?.baseUrl) {
          const check = validateSafeLlmBaseUrl(input.llmConfig.baseUrl);
          if (!check.safe) {
            return { reply: `LLM Configuration error: ${check.error || 'Blocked untrusted LLM base URL'}` };
          }
          const cleanBase = input.llmConfig.baseUrl.replace(/\/+$/, '');
          endpoint = cleanBase.endsWith('/chat/completions')
            ? cleanBase
            : `${cleanBase}/chat/completions`;
        }

        const messages: any[] = [{ role: 'system', content: systemPrompt }];
        const priorHistory = extractRelevantConversationHistory(input.history);
        for (const msg of priorHistory) {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
        messages.push({ role: 'user', content: input.message });

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model || 'gpt-4o-mini',
            messages,
            temperature: 0.7,
            max_tokens: 1024,
          }),
        });

        if (res.ok) {
          const data: any = await res.json();
          const replyText = data.choices?.[0]?.message?.content;
          if (replyText && replyText.trim().length > 0) {
            return { reply: replyText.trim() };
          }
        }
      }
    } catch (err: any) {
      console.warn(`[AI Chat Service] LLM call error (${provider}):`, err?.message || err);
      const errMsg = String(err?.message || err).toLowerCase();
      const isRateLimit =
        errMsg.includes('429') ||
        errMsg.includes('503') ||
        errMsg.includes('rate limit') ||
        errMsg.includes('resource_exhausted') ||
        errMsg.includes('quota');

      if (provider === 'gemini' && isRateLimit) {
        console.info(
          '[AI Chat Service] Gemini rate limit exception. Seamlessly transferring request to Groq in background...'
        );
        const groqRes = await callGroqChat(input, systemPrompt);
        if (groqRes.ok && groqRes.reply) {
          console.info('[AI Chat Service] Request successfully completed by Groq in background.');
          return { reply: groqRes.reply };
        }
        return { reply: 'Traffic is more than expected. Please retry later.' };
      }
    }
  }

  // Graceful intelligent fallback with deep contextual awareness
  const fallbackReply = generateIntelligentConversationalFallback(input.message, input.architectureContext);
  return { reply: fallbackReply };
}

/**
 * Streams AI responses token-by-token directly from LLM providers
 */
export async function streamAIChatReply(
  input: ArchitectureChatInput,
  onToken: (token: string) => void
): Promise<ArchitectureChatOutput> {
  const provider =
    input.llmConfig?.provider ||
    process.env.LLM_PROVIDER ||
    (process.env.MERCURY_API_KEY
      ? 'mercury'
      : process.env.GEMINI_API_KEY
      ? 'gemini'
      : process.env.GROQ_API_KEY
      ? 'groq'
      : process.env.OPENAI_API_KEY
      ? 'openai'
      : process.env.ANTHROPIC_API_KEY
      ? 'anthropic'
      : 'gemini');

  const apiKey =
    input.llmConfig?.apiKey ||
    process.env.LLM_API_KEY ||
    (provider === 'mercury' || provider === 'mercury-3'
      ? (process.env.MERCURY_API_KEY || process.env.LLM_API_KEY)
      : provider === 'gemini'
      ? process.env.GEMINI_API_KEY
      : provider === 'groq'
      ? process.env.GROQ_API_KEY
      : provider === 'anthropic'
      ? process.env.ANTHROPIC_API_KEY
      : process.env.OPENAI_API_KEY);

  const model =
    input.llmConfig?.model ||
    process.env.LLM_MODEL ||
    (provider === 'mercury' || provider === 'mercury-3'
      ? (process.env.MERCURY_MODEL || 'mercury-3')
      : provider === 'gemini'
      ? 'gemini-2.0-flash'
      : provider === 'groq'
      ? (process.env.GROQ_MODEL || 'llama-3.1-8b-instant')
      : 'gpt-4o-mini');

  const systemPrompt = buildSystemPrompt(input.architectureContext);
  const fallbackText = generateIntelligentConversationalFallback(input.message, input.architectureContext);
  const sanitizer = createStreamingSanitizer(onToken, fallbackText);

  if (apiKey || process.env.GROQ_API_KEY || (provider === 'other' && input.llmConfig?.baseUrl)) {
    try {
      if (provider === 'mercury' || provider === 'mercury-3') {
        const mStream = await callMercuryChatStream(input, systemPrompt, sanitizer.push);
        if (mStream.ok && mStream.reply) {
          sanitizer.flush();
          return { reply: sanitizeAssistantReply(mStream.reply) };
        }

        console.info(
          `[AI Chat Stream] Mercury stream unavailable (${mStream.error}). Seamlessly failing over to Google Gemini stream (Priority 2)...`
        );

        // Failover to Google Gemini Stream
        const geminiApiKey =
          input.llmConfig?.geminiApiKey ||
          process.env.GEMINI_API_KEY ||
          (input.llmConfig?.provider === 'gemini' ? input.llmConfig?.apiKey : undefined) ||
          (process.env.LLM_PROVIDER === 'gemini' ? process.env.LLM_API_KEY : undefined);

        if (geminiApiKey) {
          const geminiModels = [
            'gemini-2.5-flash',
            'gemini-1.5-flash-8b',
            'gemini-2.0-flash-exp',
            'gemini-1.5-flash',
            'gemini-2.0-flash',
          ];
          const chatContents: any[] = [];
          const priorHistory = extractRelevantConversationHistory(input.history);
          for (const msg of priorHistory) {
            chatContents.push({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.content }],
            });
          }
          chatContents.push({
            role: 'user',
            parts: [{ text: input.message }],
          });

          for (const gModel of geminiModels) {
            const geminiStream = await callGeminiChatStream(gModel, geminiApiKey, systemPrompt, chatContents, sanitizer.push);
            if (geminiStream.ok && geminiStream.reply) {
              sanitizer.flush();
              return { reply: sanitizeAssistantReply(geminiStream.reply) };
            }
            if (geminiStream.status === 429 || geminiStream.status === 503 || geminiStream.status === 404) {
              console.warn(`[AI Chat Stream] Gemini model ${gModel} returned ${geminiStream.status}. Trying next...`);
              continue;
            }
            break;
          }
        }

        console.info('[AI Chat Stream] Gemini stream also failed. Seamlessly failing over to Groq stream (Priority 3)...');

        // Failover to Groq stream
        const groqStream = await callGroqChatStream(input, systemPrompt, sanitizer.push);
        if (groqStream.ok && groqStream.reply) {
          sanitizer.flush();
          return { reply: sanitizeAssistantReply(groqStream.reply) };
        }
      } else if (provider === 'gemini') {
        const geminiModels = Array.from(
          new Set(
            [
              model,
              'gemini-2.5-flash',
              'gemini-1.5-flash-8b',
              'gemini-2.0-flash-exp',
              'gemini-1.5-flash',
              'gemini-2.0-flash',
            ].filter(Boolean) as string[]
          )
        );

        const chatContents: any[] = [];
        const priorHistory = extractRelevantConversationHistory(input.history);
        for (const msg of priorHistory) {
          chatContents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          });
        }
        chatContents.push({
          role: 'user',
          parts: [{ text: input.message }],
        });

        for (const gModel of geminiModels) {
          const geminiStream = await callGeminiChatStream(gModel, apiKey || '', systemPrompt, chatContents, sanitizer.push);
          if (geminiStream.ok && geminiStream.reply) {
            sanitizer.flush();
            return { reply: sanitizeAssistantReply(geminiStream.reply) };
          }
          if (geminiStream.status === 429 || geminiStream.status === 503 || geminiStream.status === 404) {
            console.warn(`[AI Chat Stream] Gemini model ${gModel} returned ${geminiStream.status}. Trying next...`);
            continue;
          }
          break;
        }

        // Failover to Groq stream in background
        const groqStream = await callGroqChatStream(input, systemPrompt, sanitizer.push);
        if (groqStream.ok && groqStream.reply) {
          sanitizer.flush();
          return { reply: sanitizeAssistantReply(groqStream.reply) };
        }

        // Failover to Mercury-3 stream in background if Groq fails
        if (process.env.MERCURY_API_KEY) {
          console.info('[AI Chat Stream] Groq stream also failed. Seamlessly failing over to Mercury-3 stream in background...');
          const mercuryStream = await callMercuryChatStream(input, systemPrompt, sanitizer.push);
          if (mercuryStream.ok && mercuryStream.reply) {
            sanitizer.flush();
            return { reply: sanitizeAssistantReply(mercuryStream.reply) };
          }
        }
      } else if (provider === 'groq') {
        const groqStream = await callGroqChatStream(input, systemPrompt, sanitizer.push);
        if (groqStream.ok && groqStream.reply) {
          sanitizer.flush();
          return { reply: sanitizeAssistantReply(groqStream.reply) };
        }
        if (process.env.MERCURY_API_KEY) {
          console.info('[AI Chat Stream] Groq stream failed. Seamlessly failing over to Mercury-3 stream...');
          const mercuryStream = await callMercuryChatStream(input, systemPrompt, sanitizer.push);
          if (mercuryStream.ok && mercuryStream.reply) {
            sanitizer.flush();
            return { reply: sanitizeAssistantReply(mercuryStream.reply) };
          }
        }
      }
    } catch (streamErr: any) {
      console.warn('[AI Chat Service] Streaming error, falling back to generator:', streamErr?.message);
    }
  }

  // Fallback to generateAIChatReply and stream token by token
  sanitizer.flush();
  const generated = await generateAIChatReply(input);
  await streamFallbackText(generated.reply, onToken);
  return generated;
}

