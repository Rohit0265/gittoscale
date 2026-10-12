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
};

