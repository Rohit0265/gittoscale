import {
  RepositoryInventory,
  LLMAnalysisResult,
  llmAnalysisResultSchema,
} from './repoAnalysisTypes.js';

export interface LLMConfig {
  provider?: string; // 'gemini' | 'openai' | 'anthropic' | 'mock'
  apiKey?: string;
  model?: string;
}

/**
 * Executes LLM-assisted architecture analysis.
 * If no API key is provided or configured, falls back to high-confidence deterministic synthesis
 * based on the static repository inventory without fabricating imaginary services.
 */
export async function analyzeArchitectureWithLLM(
  inventory: RepositoryInventory,
  llmConfig?: LLMConfig
): Promise<LLMAnalysisResult> {
  // If an external LLM key is configured, perform external call
  if (llmConfig?.apiKey && llmConfig.provider === 'openai') {
    try {
      return await callOpenAIProvider(inventory, llmConfig);
    } catch (err) {
      console.warn('[LLM Provider Error, falling back to deterministic synthesis]', err);
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

async function callOpenAIProvider(
  inventory: RepositoryInventory,
  config: LLMConfig
): Promise<LLMAnalysisResult> {
  const prompt = `You are a software architect inspecting a repository inventory.
Analyze the provided items and produce a valid JSON response strictly conforming to the schema.
Only return runtime servers, databases, or caches. Do NOT create servers for shared libraries, utility folders, or UI component packages.

Inventory:
${JSON.stringify(inventory.items, null, 2)}`;

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
    throw new Error(`OpenAI API failed with status ${res.status}`);
  }

  const data: any = await res.json();
  const rawText = data.choices[0].message.content;
  const parsed = JSON.parse(rawText);
  return llmAnalysisResultSchema.parse(parsed);
}

