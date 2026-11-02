import axios from 'axios';
import {
  ArchitectureFixture,
  ScenarioFixture,
  SimulationResult,
  ArchitectureNode,
  ArchitectureEdge,
  ArchitectureRecommendation,
  RecommenderInput,
} from '../types';

const RAW_BACKEND_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '').trim();
const CLEAN_URL = RAW_BACKEND_URL.replace(/\/+$/, '');
const API_BASE = CLEAN_URL
  ? (CLEAN_URL.endsWith('/api') ? CLEAN_URL : `${CLEAN_URL}/api`)
  : '/api';

// Safe default timeout (30 seconds) to prevent infinite pending state on slow mobile networks
axios.defaults.timeout = 30000;

// =========================================================================
// In-Flight Request Deduplication & Cache Layer
// Prevents duplicate concurrent API calls, race conditions, and double-fetching
// =========================================================================

const inFlightRequests = new Map<string, Promise<any>>();
const cacheStore = new Map<string, { data: any; expiry: number }>();

function getCached<T>(key: string): T | null {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cacheStore.delete(key);
    return null;
  }
  return entry.data;
}

function setCached<T>(key: string, data: T, ttlMs: number = 15000): void {
  cacheStore.set(key, { data, expiry: Date.now() + ttlMs });
}

export function clearApiCache(prefix?: string): void {
  if (!prefix) {
    cacheStore.clear();
    return;
  }
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
    }
  }
}

/**
 * Executes a GET request with automatic single-flight coalescing and optional short-lived TTL caching
 */
async function dedupedGet<T>(
  url: string,
  config?: { params?: any; headers?: any; ttlMs?: number; forceRefresh?: boolean }
): Promise<T> {
  const key = `GET:${url}:${JSON.stringify(config?.params || {})}:${JSON.stringify(config?.headers || {})}`;

  if (!config?.forceRefresh && config?.ttlMs) {
    const cached = getCached<T>(key);
    if (cached !== null) {
      return cached;
    }
  }

  // If identical request is already in flight, return the active Promise
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key) as Promise<T>;
  }

  const requestPromise = (async () => {
    try {
      const res = await axios.get(`${API_BASE}${url}`, {
        params: config?.params,
        headers: config?.headers,
      });
      if (config?.ttlMs) {
        setCached(key, res.data, config.ttlMs);
      }
      return res.data;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, requestPromise);
  return requestPromise;
}

// Active simulation controller to cancel obsolete in-flight requests and deduplicate identical payloads
let activeSimulationController: AbortController | null = null;
let activeSimulationKey: string | null = null;
let activeSimulationPromise: Promise<SimulationResult> | null = null;

// Recommender deduplication
let activeRecommendKey: string | null = null;
let activeRecommendPromise: Promise<ArchitectureRecommendation> | null = null;

/**
 * Returns the user-configured LLM provider configuration (e.g. Mercury-3) from localStorage if enabled.
 */
export function getActiveLLMConfig(): {
  provider: 'mercury';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
} | undefined {
  try {
    const preferredProvider = localStorage.getItem('gitoscale_preferred_ai_provider');
    if (preferredProvider === 'mercury') {
      const cfgRaw = localStorage.getItem('gitoscale_mercury_config');
      const cfg = cfgRaw ? JSON.parse(cfgRaw) : {};
      return {
        provider: 'mercury',
        apiKey: cfg.apiKey || localStorage.getItem('gitoscale_mercury_api_key') || undefined,
        baseUrl:
          cfg.baseUrl ||
          localStorage.getItem('gitoscale_mercury_base_url') ||
          'https://api.inceptionlabs.ai/v1',
        model: cfg.model || localStorage.getItem('gitoscale_mercury_model') || 'mercury-3',
      };
    }
  } catch {
    // ignore
  }
  return undefined;
}

export const api = {
  clearCache: clearApiCache,

  async getHealth(forceRefresh = false) {
    return dedupedGet<{ status: string; timestamp?: string }>('/health', {
      ttlMs: 10000,
      forceRefresh,
    });
  },

  async getArchitecture(mode?: 'basic' | 'detailed', forceRefresh = false): Promise<ArchitectureFixture & {
    basicGraph?: ArchitectureFixture;
    detailedGraph?: ArchitectureFixture;
  }> {
    return dedupedGet<ArchitectureFixture & {
      basicGraph?: ArchitectureFixture;
      detailedGraph?: ArchitectureFixture;
    }>(`/architecture${mode ? `?mode=${mode}` : ''}`, {
      ttlMs: 30000,
      forceRefresh,
    });
  },

  async getScenarios(forceRefresh = false): Promise<ScenarioFixture[]> {
    return dedupedGet<ScenarioFixture[]>('/scenarios', {
      ttlMs: 30000,
      forceRefresh,
    });
  },

  async simulate(params: {
    nodes: ArchitectureNode[];
    edges: ArchitectureEdge[];
    incomingTrafficRate: number;
    durationSeconds: number;
    scenarioId?: string;
  }): Promise<SimulationResult> {
    // Generate signature to detect identical simulation requests
    const key = JSON.stringify({
      nodes: params.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        cap: n.capacityPerSecond,
        workers: n.workerCount,
        enabled: n.enabled,
      })),
      edges: params.edges.map((e) => ({
        source: e.source,
        target: e.target,
        mult: e.requestsPerInput,
        enabled: e.enabled,
      })),
      rate: params.incomingTrafficRate,
      duration: params.durationSeconds,
      scenario: params.scenarioId,
    });

    // If identical simulation is already in-flight, reuse it
    if (activeSimulationKey === key && activeSimulationPromise) {
      return activeSimulationPromise;
    }

    // If a different simulation was in-flight, cancel obsolete request to save backend capacity
    if (activeSimulationController) {
      activeSimulationController.abort();
    }

    const controller = new AbortController();
    activeSimulationController = controller;
    activeSimulationKey = key;

    activeSimulationPromise = (async () => {
      try {
        const res = await axios.post(`${API_BASE}/simulate`, params, {
          signal: controller.signal,
        });
        return res.data;
      } catch (err: any) {
        // If aborted, don't throw an unhandled error into console
        if (axios.isCancel(err) || err.name === 'CanceledError' || err.name === 'AbortError') {
          return new Promise<SimulationResult>(() => {}); // Keep pending or ignored
        }
        throw err;
      } finally {
        if (activeSimulationKey === key) {
          activeSimulationKey = null;
          activeSimulationPromise = null;
          activeSimulationController = null;
        }
      }
    })();

    return activeSimulationPromise;
  },

  async analyzeRepository(params: {
    repoUrl?: string;
    localPath?: string;
    githubToken?: string;
    viewMode?: 'basic' | 'detailed';
    llmConfig?: {
      provider?: string;
      apiKey?: string;
      model?: string;
    };
  }): Promise<{
    nodes: ArchitectureNode[];
    edges: ArchitectureEdge[];
    basicGraph?: { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] };
    detailedGraph?: { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] };
    detectedServices: string[];
    repoName?: string;
    viewMode?: string;
  }> {
    const res = await axios.post(`${API_BASE}/repository/analyze`, params);
    return res.data;
  },

  async testLLM(params: {
    provider?: string;
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await axios.post(`${API_BASE}/repository/test-llm`, params);
    return res.data;
  },

  async getLLMStatus(forceRefresh = false): Promise<{ hasKey: boolean; provider: string; model?: string }> {
    return dedupedGet<{ hasKey: boolean; provider: string; model?: string }>('/repository/llm-status', {
      ttlMs: 20000,
      forceRefresh,
    });
  },

  /**
   * Generates a recommended system architecture based on natural language project requirements.
   * Deduplicates identical concurrent submissions.
   */
  async recommendArchitecture(params: RecommenderInput): Promise<ArchitectureRecommendation> {
    const effectiveParams: RecommenderInput = { ...params };
    if (!effectiveParams.llmConfig) {
      const activeLLM = getActiveLLMConfig();
      if (activeLLM) effectiveParams.llmConfig = activeLLM;
    }

    const key = JSON.stringify(effectiveParams);
    if (activeRecommendKey === key && activeRecommendPromise) {
      return activeRecommendPromise;
    }

    activeRecommendKey = key;
    activeRecommendPromise = (async () => {
      try {
        const res = await axios.post(`${API_BASE}/recommend`, effectiveParams);
        return res.data;
      } finally {
        activeRecommendKey = null;
        activeRecommendPromise = null;
      }
    })();

    return activeRecommendPromise;
  },

  /**
   * Submits user feedback (recommendation or bug report) to the backend API.
   */
  async submitFeedback(data: {
    name: string;
    email: string;
    type: 'recommendation' | 'bug';
    message: string;
  }): Promise<{ success: boolean; message: string; id?: string }> {
    const res = await axios.post(`${API_BASE}/feedback`, data);
    return res.data;
  },

  /**
   * Mock authentication endpoints (no DB connected)
   */
  async login(data: { email: string }): Promise<{
    success: boolean;
    message: string;
    token?: string;
    user?: { id: string; email: string; name: string };
  }> {
    const res = await axios.post(`${API_BASE}/auth/login`, data);
    return res.data;
  },

  async signup(data: { name?: string; email: string }): Promise<{
    success: boolean;
    message: string;
    token?: string;
    user?: { id: string; email: string; name: string };
  }> {
    const res = await axios.post(`${API_BASE}/auth/signup`, data);
    return res.data;
  },

  async getAuthSession(forceRefresh = false): Promise<{
    success: boolean;
    authenticated: boolean;
    user?: { id: string; email: string; name: string };
  }> {
    return dedupedGet<{
      success: boolean;
      authenticated: boolean;
      user?: { id: string; email: string; name: string };
    }>('/auth/me', {
      ttlMs: 15000,
      forceRefresh,
    });
  },

  // =========================================================================
  // History Endpoints (Architecture & Repository)
  // =========================================================================

  async getArchitectureHistory(
    token?: string | null,
    params?: { q?: string; status?: string; limit?: number; offset?: number },
    forceRefresh = false
  ): Promise<{ success: boolean; data: any[]; total: number }> {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return dedupedGet<{ success: boolean; data: any[]; total: number }>(
      '/history/architectures',
      {
        headers,
        params,
        ttlMs: 5000, // 5s short cache for fast tab/filter switching
        forceRefresh,
      }
    );
  },

  async saveArchitectureHistory(
    token: string | null,
    data: {
      title?: string;
      prompt: string;
      generationConfig?: any;
      architectureData?: any;
      status?: string;
      errorMessage?: string;
    }
  ): Promise<{ success: boolean; data: any }> {
    clearApiCache('GET:/history/architectures');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.post(`${API_BASE}/history/architectures`, data, { headers });
    return res.data;
  },

  async deleteArchitectureHistory(token: string | null, id: string): Promise<{ success: boolean }> {
    clearApiCache('GET:/history/architectures');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.delete(`${API_BASE}/history/architectures/${id}`, { headers });
    return res.data;
  },

  async getRepositoryHistory(
    token?: string | null,
    params?: { q?: string; status?: string; limit?: number; offset?: number },
    forceRefresh = false
  ): Promise<{ success: boolean; data: any[]; total: number }> {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return dedupedGet<{ success: boolean; data: any[]; total: number }>(
      '/history/repositories',
      {
        headers,
        params,
        ttlMs: 5000,
        forceRefresh,
      }
    );
  },

  async saveRepositoryHistory(
    token: string | null,
    data: {
      repositoryUrl: string;
      repositoryOwner?: string;
      repositoryName?: string;
      repositoryMetadata?: any;
      scanResult?: any;
      architectureData?: any;
      status?: string;
      errorMessage?: string;
    }
  ): Promise<{ success: boolean; data: any }> {
    clearApiCache('GET:/history/repositories');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.post(`${API_BASE}/history/repositories`, data, { headers });
    return res.data;
  },

  async deleteRepositoryHistory(token: string | null, id: string): Promise<{ success: boolean }> {
    clearApiCache('GET:/history/repositories');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.delete(`${API_BASE}/history/repositories/${id}`, { headers });
    return res.data;
  },

  // =========================================================================
  // AI Agent Chat History & Persistence (Up to 200 Context Messages)
  // =========================================================================

  async saveChatHistory(
    token: string | null,
    data: {
      sessionId?: string;
      projectId?: string;
      prompt: string;
      messages: any[];
      selectedAnswers?: any;
      architectureData?: any;
    }
  ): Promise<{ success: boolean; id: string; count: number }> {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.post(`${API_BASE}/chat/save`, data, { headers });
    return res.data;
  },

  async getChatHistory(
    token: string | null,
    params?: { sessionId?: string; userId?: string }
  ): Promise<{
    success: boolean;
    messages: any[];
    selectedAnswers?: any;
    prompt?: string;
    sessionId?: string;
  }> {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.get(`${API_BASE}/chat/history`, { headers, params });
    return res.data;
  },

  async sendChatMessage(
    token: string | null,
    data: {
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
      llmConfig?: any;
    }
  ): Promise<{
    success: boolean;
    reply: string;
    actionDone?: string;
  }> {
    const effectiveData = { ...data };
    if (!effectiveData.llmConfig) {
      const activeLLM = getActiveLLMConfig();
      if (activeLLM) effectiveData.llmConfig = activeLLM;
    }
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.post(`${API_BASE}/chat/message`, effectiveData, { headers });
    return res.data;
  },

  async streamChatMessage(
    token: string | null,
    data: {
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
      llmConfig?: any;
    },
    onToken: (token: string, fullText: string) => void
  ): Promise<{
    success: boolean;
    reply: string;
    actionDone?: string;
  }> {
    const effectiveData = { ...data };
    if (!effectiveData.llmConfig) {
      const activeLLM = getActiveLLMConfig();
      if (activeLLM) effectiveData.llmConfig = activeLLM;
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/chat/message`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...effectiveData, stream: true }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Chat API error (${res.status}): ${errText}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/event-stream')) {
      const json = await res.json();
      onToken(json.reply || '', json.reply || '');
      return { success: true, reply: json.reply || '', actionDone: json.actionDone };
    }

    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error('ReadableStream not supported');
    }

    const decoder = new TextDecoder();
    let accumulated = '';
    let actionDone: string | undefined = undefined;
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
          if (parsed.token) {
            accumulated += parsed.token;
            onToken(parsed.token, accumulated);
          }
          if (parsed.actionDone) {
            actionDone = parsed.actionDone;
          }
          if (parsed.reply && !accumulated) {
            accumulated = parsed.reply;
            onToken(parsed.reply, accumulated);
          }
        } catch {}
      }
    }

    return { success: true, reply: accumulated, actionDone };
  },
};

