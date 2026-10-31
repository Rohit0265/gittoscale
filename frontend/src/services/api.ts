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

export const api = {
  async getHealth() {
    const res = await axios.get(`${API_BASE}/health`);
    return res.data;
  },

  async getArchitecture(mode?: 'basic' | 'detailed'): Promise<ArchitectureFixture & {
    basicGraph?: ArchitectureFixture;
    detailedGraph?: ArchitectureFixture;
  }> {
    const res = await axios.get(`${API_BASE}/architecture${mode ? `?mode=${mode}` : ''}`);
    return res.data;
  },

  async getScenarios(): Promise<ScenarioFixture[]> {
    const res = await axios.get(`${API_BASE}/scenarios`);
    return res.data;
  },

  async simulate(params: {
    nodes: ArchitectureNode[];
    edges: ArchitectureEdge[];
    incomingTrafficRate: number;
    durationSeconds: number;
    scenarioId?: string;
  }): Promise<SimulationResult> {
    const res = await axios.post(`${API_BASE}/simulate`, params);
    return res.data;
  },

  async analyzeRepository(params: {
    repoUrl?: string;
    localPath?: string;
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

  async getLLMStatus(): Promise<{ hasKey: boolean; provider: string; model?: string }> {
    const res = await axios.get(`${API_BASE}/repository/llm-status`);
    return res.data;
  },

  /**
   * Generates a recommended system architecture based on natural language project requirements.
   */
  async recommendArchitecture(params: RecommenderInput): Promise<ArchitectureRecommendation> {
    const res = await axios.post(`${API_BASE}/recommend`, params);
    return res.data;
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

  async getAuthSession(): Promise<{
    success: boolean;
    authenticated: boolean;
    user?: { id: string; email: string; name: string };
  }> {
    const res = await axios.get(`${API_BASE}/auth/me`);
    return res.data;
  },

  // =========================================================================
  // History Endpoints (Architecture & Repository)
  // =========================================================================

  async getArchitectureHistory(
    token?: string | null,
    params?: { q?: string; status?: string; limit?: number; offset?: number }
  ): Promise<{ success: boolean; data: any[]; total: number }> {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.get(`${API_BASE}/history/architectures`, { headers, params });
    return res.data;
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
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.post(`${API_BASE}/history/architectures`, data, { headers });
    return res.data;
  },

  async deleteArchitectureHistory(token: string | null, id: string): Promise<{ success: boolean }> {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.delete(`${API_BASE}/history/architectures/${id}`, { headers });
    return res.data;
  },

  async getRepositoryHistory(
    token?: string | null,
    params?: { q?: string; status?: string; limit?: number; offset?: number }
  ): Promise<{ success: boolean; data: any[]; total: number }> {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.get(`${API_BASE}/history/repositories`, { headers, params });
    return res.data;
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
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.post(`${API_BASE}/history/repositories`, data, { headers });
    return res.data;
  },

  async deleteRepositoryHistory(token: string | null, id: string): Promise<{ success: boolean }> {
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
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.post(`${API_BASE}/chat/message`, data, { headers });
    return res.data;
  },
};

