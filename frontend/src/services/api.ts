import axios from 'axios';
import { ArchitectureFixture, ScenarioFixture, SimulationResult, ArchitectureNode, ArchitectureEdge } from '../types';

const API_BASE = '/api';

export const api = {
  async getHealth() {
    const res = await axios.get(`${API_BASE}/health`);
    return res.data;
  },

  async getArchitecture(): Promise<ArchitectureFixture> {
    const res = await axios.get(`${API_BASE}/architecture`);
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
    llmConfig?: {
      provider?: string;
      apiKey?: string;
      model?: string;
    };
  }): Promise<{
    nodes: ArchitectureNode[];
    edges: ArchitectureEdge[];
    detectedServices: string[];
    repoName?: string;
  }> {
    const res = await axios.post(`${API_BASE}/repository/analyze`, params);
    return res.data;
  },

  async testLLM(params: { provider: string; apiKey: string }): Promise<{ success: boolean; message: string }> {
    const res = await axios.post(`${API_BASE}/repository/test-llm`, params);
    return res.data;
  },
};

