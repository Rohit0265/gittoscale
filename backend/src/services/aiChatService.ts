import { LLMConfig } from './architectureRecommender.js';

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

  return `You are GitToScale's AI Principal Systems Architect and Live Playground Copilot.
You have direct, real-time access and control over the user's interactive architecture canvas.

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

### Behavior Guidelines:
1. Provide authentic, deeply technical, and conversational AI answers in clean GitHub-flavored Markdown.
2. Directly answer whatever the user asks: architecture patterns, database design, caching tradeoffs, distributed consistency, Kafka/queues, resilience, cloud cost, or latency profiling.
3. Reference their actual current nodes and traffic where relevant to make the advice feel concrete and grounded in their live system.
4. If the user's input is a command to change or add to the system, explain clearly what change should be made and the architectural trade-offs.
5. If the user input is unclear, brief, or random characters (e.g. "hkuhjkjkh"), politely acknowledge that you didn't understand and invite them to ask an architecture question or request canvas modifications.
6. NEVER return generic canned robotic responses (e.g. do NOT say "I've analyzed your instruction... What change would you like me to execute?"). Always speak like a thoughtful senior cloud architect.`;
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
 * Extracts and formats the last 25 turns of conversation history so models
 * retain complete memory of what is being built, user preferences, and prior decisions.
 */
function extractRelevantConversationHistory(history?: any[]): { role: 'user' | 'assistant'; content: string }[] {
  if (!Array.isArray(history)) return [];
  const result: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const msg of history.slice(-25)) {
    if (msg.text && !msg.isThinking) {
      result.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
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
    'llama-3.3-70b-versatile';

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
    const timeoutId = setTimeout(() => controller.abort(), 18000);

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

    // Auto-fallback if the specified Groq model is deprecated or not found (404)
    if (res.status === 404 && groqModel !== 'llama-3.3-70b-versatile') {
      console.warn(`[AI Chat Service] Groq model "${groqModel}" returned 404 (model not found). Retrying with active model "llama-3.3-70b-versatile"...`);
      try {
        const fallbackRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
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
        console.warn('[AI Chat Service] Groq 404 fallback retry failed:', retryErr?.message);
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

/**
 * Handles LLM API calls with graceful fallback and seamless Gemini -> Groq failover
 */
export async function generateAIChatReply(input: ArchitectureChatInput): Promise<ArchitectureChatOutput> {
  const provider =
    input.llmConfig?.provider ||
    process.env.LLM_PROVIDER ||
    (process.env.GEMINI_API_KEY
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
    (provider === 'gemini'
      ? process.env.GEMINI_API_KEY
      : provider === 'groq'
      ? process.env.GROQ_API_KEY
      : provider === 'anthropic'
      ? process.env.ANTHROPIC_API_KEY
      : process.env.OPENAI_API_KEY);

  const model =
    input.llmConfig?.model ||
    process.env.LLM_MODEL ||
    (provider === 'gemini'
      ? 'gemini-1.5-flash'
      : provider === 'groq'
      ? (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile')
      : provider === 'anthropic'
      ? 'claude-3-5-sonnet-20241022'
      : 'gpt-4o-mini');

  const systemPrompt = buildSystemPrompt(input.architectureContext);

  if (apiKey || process.env.GROQ_API_KEY || (provider === 'other' && input.llmConfig?.baseUrl)) {
    try {
      if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const chatContents: any[] = [];

        const priorHistory = extractRelevantConversationHistory(input.history);
        for (const msg of priorHistory) {
          chatContents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          });
        }

        // Add current user message
        chatContents.push({
          role: 'user',
          parts: [{ text: input.message }],
        });

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
            return { reply: replyText.trim() };
          }
        }

        // Check if rate limited (429 / 503 / RESOURCE_EXHAUSTED / quota / overloaded)
        const status = res.status;
        const errText = await res.text().catch(() => '');
        const isRateLimit =
          status === 429 ||
          status === 503 ||
          errText.toLowerCase().includes('resource_exhausted') ||
          errText.toLowerCase().includes('rate limit') ||
          errText.toLowerCase().includes('quota') ||
          errText.toLowerCase().includes('too many requests') ||
          errText.toLowerCase().includes('overloaded');

        if (isRateLimit) {
          console.info(
            `[AI Chat Service] Gemini rate limit (HTTP ${status} / quota) detected. Seamlessly transferring request to Groq in background...`
          );

          // Failover to Groq in background without notifying frontend
          const groqRes = await callGroqChat(input, systemPrompt);
          if (groqRes.ok && groqRes.reply) {
            console.info('[AI Chat Service] Request successfully completed by Groq in background.');
            return { reply: groqRes.reply };
          }

          // If Groq also failed (or rate limited / unavailable)
          console.warn(
            '[AI Chat Service] Groq failover also failed. Returning traffic overload message:',
            groqRes.error
          );
          return { reply: 'Traffic is more than expected. Please retry later.' };
        }
      } else if (provider === 'groq') {
        const groqRes = await callGroqChat(input, systemPrompt);
        if (groqRes.ok && groqRes.reply) {
          return { reply: groqRes.reply };
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

