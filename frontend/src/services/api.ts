import axios from 'axios';
import { ArchitectureFixture, ScenarioFixture, SimulationResult, ArchitectureNode, ArchitectureEdge } from '../types';

const API_BASE = '/api';

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

  async submitFeedback(data: {
    name: string;
    email: string;
    type: 'recommendation' | 'bug';
    message: string;
  }): Promise<{ success: boolean; message: string; id?: string }> {
    const res = await axios.post(`${API_BASE}/feedback`, data);
    return res.data;
  },
};

