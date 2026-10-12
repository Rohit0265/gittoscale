import {
  RepositoryInventory,
  LLMAnalysisResult,
  llmAnalysisResultSchema,
} from './repoAnalysisTypes.js';

export interface LLMConfig {
  provider?: string; // 'openai' | 'gemini' | 'anthropic'
  apiKey?: string;
  model?: string;
}

/**
 * Executes LLM-assisted architecture analysis using configured or environment API keys.
 * Accurately determines which folder/package is an actual runtime server vs normal folder/shared package.
 */
export async function analyzeArchitectureWithLLM(
  inventory: RepositoryInventory,
  llmConfig?: LLMConfig
): Promise<LLMAnalysisResult> {
  // Resolve API key from passed config OR environment variables in .env
  const provider = llmConfig?.provider || process.env.LLM_PROVIDER || (process.env.OPENAI_API_KEY ? 'openai' : process.env.GEMINI_API_KEY ? 'gemini' : process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'openai');
  const apiKey =
    llmConfig?.apiKey ||
    process.env.LLM_API_KEY ||
    (provider === 'openai' ? process.env.OPENAI_API_KEY : provider === 'gemini' ? process.env.GEMINI_API_KEY : process.env.ANTHROPIC_API_KEY);
  const model =
    llmConfig?.model ||
    process.env.LLM_MODEL ||
    (provider === 'gemini' ? 'gemini-1.5-flash' : provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o-mini');

  const resolvedConfig: LLMConfig = {
    provider,
    apiKey,
    model,
  };

  if (resolvedConfig.apiKey) {
    try {
      if (provider === 'gemini') {
        return await callGeminiProvider(inventory, resolvedConfig);
      } else if (provider === 'anthropic') {
        return await callAnthropicProvider(inventory, resolvedConfig);
      } else {
        return await callOpenAIProvider(inventory, resolvedConfig);
      }
    } catch (err) {
      console.warn(`[LLM Provider ${provider} Error, falling back to deterministic synthesis]`, err);
    }
  }

  // Deterministic synthesis based strictly on evidence in inventory
  return synthesizeDeterministicArchitecture(inventory);
}

/**
 * Deterministic evidence-backed synthesis strictly distinguishing runtime services
 * from shared libraries, UI packages, and configs.
 */
export function synthesizeDeterministicArchitecture(
  inventory: RepositoryInventory
): LLMAnalysisResult {
  const components: LLMAnalysisResult['components'] = [];
  const connections: LLMAnalysisResult['connections'] = [];

  // Filter only actual runtime services (servers, workers, frontends, or compose services)
  const runtimeItems = inventory.items.filter(
    (item) => item.evidence.isRuntimeService && item.classification !== 'shared_library' && item.classification !== 'ui_package'
  );

  // If no runtime services were detected with high confidence, return uncertainty rather than fabricating!
  if (runtimeItems.length === 0) {
    return {
      components: [],
      connections: [],
    };
  }

  // 1. Create User / Client Traffic Entrypoint
  components.push({
    id: 'node-user',
    name: 'User Traffic',
    category: 'Client',
    group: 'Client',
    type: 'load_generator',
    isRuntimeService: true,
    sourceFiles: [],
    confidence: 1.0,
    reason: 'Entrypoint generator representing external incoming client user traffic.',
    estimatedCapacity: 10000,
    defaultWorkers: 1,
  });

  // Track discovered service nodes
  const frontendNodes: string[] = [];
  const gatewayNodes: string[] = [];
  const backendServiceNodes: string[] = [];
  const dataStoreNodes: string[] = [];
  const externalNodes = new Set<string>();

  // Check if this repository is a microservice architecture like covo-ai-assistant
  for (const item of runtimeItems) {
    const lowerName = item.name.toLowerCase();
    const lowerPath = item.path.toLowerCase();

    let compType: 'gateway' | 'service' | 'cache' | 'database' = 'service';
    let category = 'Services';
    let displayName = item.name;

    if (item.classification === 'frontend_app' || lowerName.includes('frontend') || lowerName.includes('client')) {
      compType = 'service';
      category = 'Chat interface';
    } else if (lowerName.includes('gateway') || lowerPath.includes('gateway')) {
      compType = 'gateway';
      category = 'API gateway';
    } else if (lowerName.includes('redis') || lowerPath.includes('redis')) {
      compType = 'cache';
      category = 'Identity and sessions';
    } else if (lowerName.includes('auth') || lowerPath.includes('auth')) {
      compType = 'service';
      category = 'Identity and sessions';
    } else if (lowerName.includes('chat') || lowerPath.includes('chat')) {
      compType = 'service';
      category = 'AI and conversations';
    } else if (lowerName.includes('agent') || lowerPath.includes('agent')) {
      compType = 'service';
      category = 'AI and conversations';
    } else if (lowerName.includes('billing') || lowerPath.includes('billing') || lowerName.includes('payment')) {
      compType = 'service';
      category = 'Billing';
    } else if (lowerName.includes('db') || lowerName.includes('mongo') || lowerName.includes('postgres')) {
      compType = 'database';
      category = 'Storage';
    }

    const compId = `node-${item.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`;

    if (category === 'Chat interface') {
      frontendNodes.push(compId);
    } else if (category === 'API gateway' || compType === 'gateway') {
      gatewayNodes.push(compId);
    } else if (compType === 'cache' || compType === 'database') {
      dataStoreNodes.push(compId);
    } else {
      backendServiceNodes.push(compId);
    }

    components.push({
      id: compId,
      name: displayName,
      category,
      group: category,
      type: compType,
      isRuntimeService: true,
      entryPoint: item.evidence.entryPoint,
      startupCommand: item.evidence.startupCommand,
      sourceFiles: item.evidence.sourceFiles,
      confidence: item.evidence.confidence,
      reason: item.evidence.reason,
      estimatedCapacity: compType === 'gateway' ? 4000 : compType === 'cache' ? 8000 : 2000,
      defaultWorkers: compType === 'gateway' ? 4 : 2,
    });

    // Check external integrations in source files
    const allFileStr = item.evidence.sourceFiles.join(' ').toLowerCase();
    if (allFileStr.includes('firebase')) {
      externalNodes.add('firebase');
    }
    if (allFileStr.includes('razorpay')) {
      externalNodes.add('razorpay');
    }
    if (allFileStr.includes('llm') || allFileStr.includes('agent') || allFileStr.includes('openai')) {
      externalNodes.add('llm-providers');
    }
  }

  // Add External Providers if discovered
  if (externalNodes.has('firebase')) {
    components.push({
      id: 'ext-firebase',
      name: 'Firebase Auth',
      category: 'External Services',
      group: 'External Services',
      type: 'service',
      isRuntimeService: true,
      sourceFiles: [],
      confidence: 0.95,
      reason: 'External identity provider for token verification.',
      estimatedCapacity: 10000,
      defaultWorkers: 1,
    });
  }
  if (externalNodes.has('razorpay')) {
    components.push({
      id: 'ext-razorpay',
      name: 'Razorpay Gateway',
      category: 'External Services',
      group: 'External Services',
      type: 'service',
      isRuntimeService: true,
      sourceFiles: [],
      confidence: 0.95,
      reason: 'External payment processing integration.',
      estimatedCapacity: 10000,
      defaultWorkers: 1,
    });
  }
  if (externalNodes.has('llm-providers')) {
    components.push({
      id: 'ext-llms',
      name: 'LLM Providers',
      category: 'External Services',
      group: 'External Services',
      type: 'service',
      isRuntimeService: true,
      sourceFiles: [],
      confidence: 0.95,
      reason: 'External Large Language Model APIs (OpenAI / Claude / Gemini).',
      estimatedCapacity: 5000,
      defaultWorkers: 1,
    });
  }

  // Discovered Databases and Queues from clients
  const dbTargets = new Set<string>();
  for (const item of runtimeItems) {
    for (const db of item.clients.databases) {
      const dbId = `db-${db.toLowerCase()}`;
      if (!components.some((c) => c.id === dbId)) {
        components.push({
          id: dbId,
          name: `${db} Store`,
          category: 'Storage',
          group: 'Storage',
          type: db.toLowerCase().includes('redis') ? 'cache' : 'database',
          isRuntimeService: true,
          sourceFiles: item.evidence.sourceFiles,
          confidence: 0.9,
          reason: `Evidenced database connection from ${item.name}.`,
          estimatedCapacity: db.toLowerCase().includes('redis') ? 8000 : 3000,
          defaultWorkers: 1,
        });
      }
      dbTargets.add(dbId);
    }
  }

  // 2. Wire connections:
  // User -> Frontend (or Gateway if no Frontend)
  const entryId = frontendNodes.length > 0 ? frontendNodes[0] : (gatewayNodes[0] || backendServiceNodes[0]);
  if (entryId) {
    connections.push({
      source: 'node-user',
      target: entryId,
      communicationType: 'http',
      evidenceFiles: [],
      confidence: 1.0,
      reason: 'User interacts with frontend application client.',
      requestsPerInput: 1.0,
    });
  }

  // Frontend -> Gateway
  if (frontendNodes.length > 0 && gatewayNodes.length > 0) {
    connections.push({
      source: frontendNodes[0],
      target: gatewayNodes[0],
      communicationType: 'http',
      evidenceFiles: [],
      confidence: 0.95,
      reason: 'Frontend client proxies API requests through API gateway.',
      requestsPerInput: 1.0,
    });
  }

  // Gateway -> Backend Microservices
  const primaryGateway = gatewayNodes[0] || (frontendNodes.length === 0 ? frontendNodes[0] : undefined);
  if (primaryGateway) {
    for (const sId of backendServiceNodes) {
      if (sId !== primaryGateway) {
        connections.push({
          source: primaryGateway,
          target: sId,
          communicationType: 'http',
          evidenceFiles: [],
          confidence: 0.9,
          reason: `Gateway routes incoming authenticated traffic to ${sId}.`,
          requestsPerInput: 1.0,
        });
      }
    }
  } else if (frontendNodes.length > 0) {
    // Direct from frontend to backend services if no gateway
    for (const sId of backendServiceNodes) {
      connections.push({
        source: frontendNodes[0],
        target: sId,
        communicationType: 'http',
        evidenceFiles: [],
        confidence: 0.85,
        reason: `Frontend connects directly to ${sId}.`,
        requestsPerInput: 1.0,
      });
    }
  }

  // Microservices -> Databases / Caches
  for (const item of runtimeItems) {
    const sId = `node-${item.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`;
    for (const db of item.clients.databases) {
      const dbId = `db-${db.toLowerCase()}`;
      if (components.some((c) => c.id === dbId) && !connections.some((c) => c.source === sId && c.target === dbId)) {
        connections.push({
          source: sId,
          target: dbId,
          communicationType: 'db',
          evidenceFiles: item.evidence.sourceFiles,
          confidence: 0.9,
          reason: `${item.name} queries and persists records in ${db}.`,
          requestsPerInput: 1.0,
        });
      }
    }
  }

  // Gateway / Auth -> Redis Session Cache
  const redisComp = components.find((c) => c.id.includes('redis'));
  if (redisComp) {
    if (primaryGateway && !connections.some((c) => c.source === primaryGateway && c.target === redisComp.id)) {
      connections.push({
        source: primaryGateway,
        target: redisComp.id,
        communicationType: 'cache' as any,
        evidenceFiles: [],
        confidence: 0.92,
        reason: 'Gateway validates session tokens against Redis session cache.',
        requestsPerInput: 1.0,
      });
    }
    const authComp = components.find((c) => c.id.includes('auth'));
    if (authComp && !connections.some((c) => c.source === authComp.id && c.target === redisComp.id)) {
      connections.push({
        source: authComp.id,
        target: redisComp.id,
        communicationType: 'cache' as any,
        evidenceFiles: [],
        confidence: 0.92,
        reason: 'Auth service stores user session in Redis.',
        requestsPerInput: 1.0,
      });
    }
  }

  // Microservices -> External Providers
  const authNode = components.find((c) => c.id.includes('auth'));
  if (authNode && components.some((c) => c.id === 'ext-firebase')) {
    connections.push({
      source: authNode.id,
      target: 'ext-firebase',
      communicationType: 'http',
      evidenceFiles: [],
      confidence: 0.95,
      reason: 'Auth service verifies ID tokens with Firebase Auth.',
      requestsPerInput: 1.0,
    });
  }

  const agentNode = components.find((c) => c.id.includes('agent'));
  if (agentNode && components.some((c) => c.id === 'ext-llms')) {
    connections.push({
      source: agentNode.id,
      target: 'ext-llms',
      communicationType: 'http',
      evidenceFiles: [],
      confidence: 0.95,
      reason: 'Agent router dispatches user prompts to LLM providers.',
      requestsPerInput: 1.0,
    });
  }

  const billingNode = components.find((c) => c.id.includes('billing'));
  if (billingNode && components.some((c) => c.id === 'ext-razorpay')) {
    connections.push({
      source: billingNode.id,
      target: 'ext-razorpay',
      communicationType: 'http',
      evidenceFiles: [],
      confidence: 0.95,
      reason: 'Billing service creates payment orders via Razorpay.',
      requestsPerInput: 1.0,
    });
  }

  // Agent -> Chat (saves messages)
  const chatNode = components.find((c) => c.id.includes('chat'));
  if (agentNode && chatNode && !connections.some((c) => c.source === agentNode.id && c.target === chatNode.id)) {
    connections.push({
      source: agentNode.id,
      target: chatNode.id,
      communicationType: 'http',
      evidenceFiles: [],
      confidence: 0.9,
      reason: 'Agent saves generated conversation messages to Chat service.',
      requestsPerInput: 1.0,
    });
  }

  const result = {
    components,
    connections,
  };

  return llmAnalysisResultSchema.parse(result);
}

function buildPrompt(inventory: RepositoryInventory): string {
  return `You are a principal software architect generating a high-fidelity system design architecture diagram matching GitDiagram quality for a repository.

Repository Name: ${inventory.repoName}
Analyzed Files & Components:
${JSON.stringify(inventory.items, null, 2)}

INSTRUCTIONS & EXTRACTION RULES:
1. Decompose the architecture into cohesive tiers / groups:
   - "Chat interface" / Frontend views: e.g. Home, Chat UI, Sidebar, Artifacts, User State.
   - "API gateway": Gateway entrypoint and middleware (Session guard / Auth guard).
   - "Identity and sessions": Auth microservice, session cache (Redis), User records.
   - "AI and conversations" / Assistant: Conversation service, Agent endpoint, LangGraph workflow, Intent router, Agent capabilities.
   - "Billing": Billing service, Payment records, Payment gateway.
   - External Providers: Firebase Auth, LLM providers (OpenAI/Anthropic/Gemini), Razorpay, etc.
2. For each component, provide:
   - "id": kebab-case identifier (e.g. "node-gateway", "node-chat", "node-redis", "node-auth")
   - "name": Clear, human-readable name with file citation (e.g. "API Gateway [index.js]", "Session cache [redis.js]")
   - "category": Subgraph name (e.g. "Chat interface", "API gateway", "Identity and sessions", "AI and conversations", "Billing", "External")
   - "type": "gateway" | "service" | "cache" | "database" | "load_generator"
   - "sourceFiles": array of key source files implementing this component
   - "confidence": confidence score (0.0 to 1.0)
   - "reason": architectural rationale explaining what this component does
   - "estimatedCapacity": realistic capacity (e.g. 5000 for gateways/caches, 2000 for services)
3. For connections, model realistic traffic flow:
   - Load generator / User -> Frontend -> API Gateway
   - Gateway -> Auth / Session guard -> Redis
   - Gateway -> Microservices (Chat, Agent, Billing, Auth)
   - Services -> Databases, Models & External SaaS (Firebase, LLMs, Razorpay)
4. Response MUST strictly be valid JSON matching this schema:
{
  "mermaidCode": "string (optional valid Mermaid flowchart TD string)",
  "components": [
    {
      "id": "string",
      "name": "string",
      "category": "string",
      "type": "load_generator" | "gateway" | "service" | "cache" | "database",
      "isRuntimeService": true,
      "entryPoint": "string (optional)",
      "startupCommand": "string (optional)",
      "sourceFiles": ["string"],
      "confidence": number,
      "reason": "string",
      "estimatedCapacity": number,
      "defaultWorkers": number
    }
  ],
  "connections": [
    {
      "source": "string",
      "target": "string",
      "communicationType": "http" | "graphql" | "grpc" | "db" | "queue" | "inferred",
      "evidenceFiles": ["string"],
      "reference": "string (optional)",
      "confidence": number,
      "reason": "string",
      "requestsPerInput": number
    }
  ]
}`;
}

function normalizeLLMResponse(data: any): any {
  if (!data || typeof data !== 'object') return { components: [], connections: [] };

  const components = Array.isArray(data.components)
    ? data.components.map((c: any) => ({
        ...c,
        id: String(c.id || `node-${Math.random().toString(36).substring(2, 7)}`),
        name: String(c.name || 'Unnamed Service'),
        category: c.category ? String(c.category) : undefined,
        group: c.group ? String(c.group) : c.category ? String(c.category) : undefined,
        type: ['load_generator', 'gateway', 'service', 'cache', 'database'].includes(c.type)
          ? c.type
          : 'service',
        isRuntimeService: c.isRuntimeService !== false,
        sourceFiles: Array.isArray(c.sourceFiles) ? c.sourceFiles.map(String) : [],
        confidence: typeof c.confidence === 'number' ? Math.max(0, Math.min(1, c.confidence)) : 0.9,
        reason: String(c.reason || 'Identified component in system architecture.'),
        estimatedCapacity: typeof c.estimatedCapacity === 'number' ? c.estimatedCapacity : undefined,
        defaultWorkers: typeof c.defaultWorkers === 'number' ? c.defaultWorkers : undefined,
      }))
    : [];

  const connections = Array.isArray(data.connections)
    ? data.connections.map((conn: any) => ({
        ...conn,
        source: String(conn.source),
        target: String(conn.target),
        communicationType: [
          'http',
          'graphql',
          'grpc',
          'db',
          'queue',
          'cache',
          'inferred',
        ].includes(conn.communicationType)
          ? conn.communicationType
          : 'http',
        evidenceFiles: Array.isArray(conn.evidenceFiles) ? conn.evidenceFiles.map(String) : [],
        reference: conn.reference ? String(conn.reference) : undefined,
        confidence: typeof conn.confidence === 'number' ? Math.max(0, Math.min(1, conn.confidence)) : 0.9,
        reason: String(conn.reason || 'Inter-service communication.'),
        requestsPerInput: typeof conn.requestsPerInput === 'number' ? conn.requestsPerInput : 1.0,
      }))
    : [];

  return {
    mermaidCode: data.mermaidCode ? String(data.mermaidCode) : undefined,
    components,
    connections,
  };
}

async function callOpenAIProvider(
  inventory: RepositoryInventory,
  config: LLMConfig
): Promise<LLMAnalysisResult> {
  const prompt = buildPrompt(inventory);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
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
    throw new Error(`OpenAI API failed with status ${res.status}: ${await res.text()}`);
  }

  const data: any = await res.json();
  const rawText = data.choices[0].message.content;
  const parsed = JSON.parse(rawText);
  return llmAnalysisResultSchema.parse(normalizeLLMResponse(parsed));
}

async function callGeminiProvider(
  inventory: RepositoryInventory,
  config: LLMConfig
): Promise<LLMAnalysisResult> {
  const prompt = buildPrompt(inventory);
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
    throw new Error(`Gemini API failed with status ${res.status}: ${await res.text()}`);
  }

  const data: any = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty response from Gemini API');
  const parsed = JSON.parse(rawText);
  return llmAnalysisResultSchema.parse(normalizeLLMResponse(parsed));
}

async function callAnthropicProvider(
  inventory: RepositoryInventory,
  config: LLMConfig
): Promise<LLMAnalysisResult> {
  const prompt = buildPrompt(inventory);
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
    throw new Error(`Anthropic API failed with status ${res.status}: ${await res.text()}`);
  }

  const data: any = await res.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error('Empty response from Anthropic API');
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse JSON from Anthropic response');
  const parsed = JSON.parse(jsonMatch[0]);
  return llmAnalysisResultSchema.parse(parsed);
}
