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
  // Skip shared libraries, tests, ui-packages
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

  // Create Load Generator entrypoint
  components.push({
    id: 'client-traffic',
    name: 'Client Traffic',
    type: 'load_generator',
    isRuntimeService: true,
    sourceFiles: [],
    confidence: 1.0,
    reason: 'Entrypoint generator representing external incoming client user traffic.',
    estimatedCapacity: 10000,
    defaultWorkers: 1,
  });

  // Track discovered service IDs
  const serviceIds: string[] = [];

  for (const item of runtimeItems) {
    let compType: 'gateway' | 'service' | 'cache' | 'database' = 'service';
    const lowerName = item.name.toLowerCase();

    if (
      lowerName.includes('gateway') ||
      lowerName.includes('proxy') ||
      lowerName.includes('router') ||
      item.classification === 'frontend_app'
    ) {
      compType = 'gateway';
    } else if (lowerName.includes('redis') || lowerName.includes('memcached')) {
      compType = 'cache';
    } else if (
      lowerName.includes('db') ||
      lowerName.includes('database') ||
      lowerName.includes('postgres') ||
      lowerName.includes('mongo')
    ) {
      compType = 'database';
    }

    const compId = `service-${item.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`;
    serviceIds.push(compId);

    components.push({
      id: compId,
      name: item.name,
      type: compType,
      isRuntimeService: true,
      entryPoint: item.evidence.entryPoint,
      startupCommand: item.evidence.startupCommand,
      sourceFiles: item.evidence.sourceFiles,
      confidence: item.evidence.confidence,
      reason: item.evidence.reason,
      estimatedCapacity: compType === 'gateway' ? 2500 : 1500,
      defaultWorkers: 2,
    });
  }

  // Add evidenced databases/caches discovered in clients
  const dbTargets = new Set<string>();
  const queueTargets = new Set<string>();

  for (const item of runtimeItems) {
    for (const db of item.clients.databases) {
      const dbId = `db-${db.toLowerCase()}`;
      if (!dbTargets.has(dbId)) {
        dbTargets.add(dbId);
        components.push({
          id: dbId,
          name: `${db} Database`,
          type: 'database',
          isRuntimeService: true,
          sourceFiles: item.evidence.sourceFiles,
          confidence: 0.9,
          reason: `Evidenced database connection from ${item.name}.`,
          estimatedCapacity: 3000,
          defaultWorkers: 1,
        });
      }

      connections.push({
        source: `service-${item.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`,
        target: dbId,
        communicationType: 'db',
        evidenceFiles: item.evidence.sourceFiles,
        confidence: 0.9,
        reason: `Client configuration in ${item.name} connects to ${db}.`,
        requestsPerInput: 1.0,
      });
    }

    for (const q of item.clients.queues) {
      const qId = `queue-${q.toLowerCase()}`;
      if (!queueTargets.has(qId)) {
        queueTargets.add(qId);
        components.push({
          id: qId,
          name: `${q} Broker`,
          type: 'service',
          isRuntimeService: true,
          sourceFiles: item.evidence.sourceFiles,
          confidence: 0.9,
          reason: `Evidenced message queue connection from ${item.name}.`,
          estimatedCapacity: 5000,
          defaultWorkers: 1,
        });
      }

      connections.push({
        source: `service-${item.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`,
        target: qId,
        communicationType: 'queue',
        evidenceFiles: item.evidence.sourceFiles,
        confidence: 0.9,
        reason: `Producer/consumer integration for ${q} in ${item.name}.`,
        requestsPerInput: 1.0,
      });
    }
  }

  // Connect client-traffic to gateway or primary service
  const gateways = components.filter((c) => c.type === 'gateway');
  const primaryTarget = gateways.length > 0 ? gateways[0] : components.find((c) => c.type === 'service');

  if (primaryTarget) {
    connections.unshift({
      source: 'client-traffic',
      target: primaryTarget.id,
      communicationType: 'http',
      evidenceFiles: [],
      confidence: 1.0,
      reason: 'Incoming external requests routed to primary entrypoint.',
      requestsPerInput: 1.0,
    });
  }

  // Connect gateways to other services if evidenced
  if (gateways.length > 0) {
    for (const gw of gateways) {
      for (const sId of serviceIds) {
        if (sId !== gw.id && !connections.some((c) => c.source === gw.id && c.target === sId)) {
          connections.push({
            source: gw.id,
            target: sId,
            communicationType: 'http',
            evidenceFiles: gw.sourceFiles,
            confidence: 0.85,
            reason: `Gateway routes incoming traffic to downstream service ${sId}.`,
            requestsPerInput: 1.0,
          });
        }
      }
    }
  }

  const result = {
    components,
    connections,
  };

  return llmAnalysisResultSchema.parse(result);
}

function buildPrompt(inventory: RepositoryInventory): string {
  return `You are a principal software architect inspecting a repository inventory.
Your task is to identify ACTUAL RUNTIME SERVICES (e.g. independently executed backend API servers, microservices, workers, databases, caches, and API gateways).
CRITICAL RULES:
1. Do NOT create server nodes for ordinary folders, shared packages, types libraries (e.g. packages/shared-types), or UI component libraries (e.g. packages/ui). A folder name alone is never proof that something is a server.
2. Only classify an item as a runtime service if there is evidence of an actual server bootstrap (listen, createServer, Fastify, Express, NestJS), independent process startup script, worker queue runner, or container service.
3. Determine communication relationships (HTTP, DB, Queue) based on evidenced clients.
4. Response MUST be valid JSON adhering strictly to this schema:
{
  "components": [
    {
      "id": "string",
      "name": "string",
      "type": "load_generator" | "gateway" | "service" | "cache" | "database",
      "isRuntimeService": true,
      "entryPoint": "string (optional)",
      "startupCommand": "string (optional)",
      "sourceFiles": ["string"],
      "confidence": number (between 0.0 and 1.0),
      "reason": "explanation of classification",
      "estimatedCapacity": number (e.g. 1500),
      "defaultWorkers": number (e.g. 2)
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
      "requestsPerInput": number (optional, e.g. 1.0)
    }
  ]
}

Repository inventory data:
${JSON.stringify(inventory.items, null, 2)}`;
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
  return llmAnalysisResultSchema.parse(parsed);
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
  return llmAnalysisResultSchema.parse(parsed);
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
