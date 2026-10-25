import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { validateGraphAcyclic } from '../src/simulation/validation.js';

describe('AI Architecture Recommender API Tests', () => {
  const app = createApp();

  it('POST /api/recommend returns structured architecture recommendation for valid description', async () => {
    const res = await request(app)
      .post('/api/recommend')
      .send({
        projectDescription:
          'A scalable e-commerce platform with high volume flash sales, shopping carts, and Stripe payments.',
        expectedScale: '100k DAU',
        budgetConstraint: 'medium',
        preferredTech: ['Node.js', 'PostgreSQL', 'Redis'],
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.projectName).toBeDefined();
    expect(res.body.summary).toBeDefined();
    expect(res.body.architecturePattern).toBeDefined();
    expect(res.body.patternReasoning).toBeDefined();

    // Requirements
    expect(res.body.requirements).toBeDefined();
    expect(Array.isArray(res.body.requirements.functional)).toBe(true);
    expect(Array.isArray(res.body.requirements.nonFunctional)).toBe(true);

    // Tech recommendations
    expect(Array.isArray(res.body.technologies)).toBe(true);
    expect(res.body.technologies.length).toBeGreaterThan(0);
    for (const tech of res.body.technologies) {
      expect(tech.name).toBeDefined();
      expect(tech.category).toBeDefined();
      expect(tech.reason).toBeDefined();
      expect(Array.isArray(tech.tradeoffs)).toBe(true);
      expect(Array.isArray(tech.alternatives)).toBe(true);
    }

    // Graph Nodes & Edges
    expect(Array.isArray(res.body.nodes)).toBe(true);
    expect(res.body.nodes.length).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(res.body.edges)).toBe(true);
    expect(res.body.edges.length).toBeGreaterThanOrEqual(2);

    // Verify all edges point to existing nodes
    const nodeIds = new Set(res.body.nodes.map((n: any) => n.id));
    for (const edge of res.body.edges) {
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);
      expect(edge.source).not.toBe(edge.target);
    }

    // Verify graph is acyclic for discrete simulation
    const acyclicCheck = validateGraphAcyclic(res.body.nodes, res.body.edges);
    expect(acyclicCheck.hasCycle).toBe(false);

    // Data flows, security & scaling
    expect(Array.isArray(res.body.dataFlows)).toBe(true);
    expect(Array.isArray(res.body.securityConsiderations)).toBe(true);
    expect(Array.isArray(res.body.scalingStrategy)).toBe(true);
    expect(Array.isArray(res.body.tradeoffs)).toBe(true);
  });

  it('POST /api/recommend selects Event-Driven or Microservices for IoT telemetry stream', async () => {
    const res = await request(app)
      .post('/api/recommend')
      .send({
        projectDescription:
          'High throughput IoT sensor telemetry ingestion platform processing 50,000 events per second with time-series analytics.',
        expectedScale: 'hyper-scale',
        deploymentPreference: 'cloud containers',
      });

    expect(res.status).toBe(200);
    expect(['Event-Driven', 'Microservices']).toContain(res.body.architecturePattern);
    const techNames = res.body.technologies.map((t: any) => t.name.toLowerCase());
    expect(techNames.some((t: string) => t.includes('kafka') || t.includes('timescale') || t.includes('clickhouse') || t.includes('redis'))).toBe(true);
  });

  it('POST /api/recommend respects Serverless preference', async () => {
    const res = await request(app)
      .post('/api/recommend')
      .send({
        projectDescription:
          'Simple webhook processing micro-app for event alerts with low initial traffic.',
        deploymentPreference: 'serverless',
      });

    expect(res.status).toBe(200);
    expect(res.body.architecturePattern).toBe('Serverless');
  });

  it('POST /api/recommend rejects short or missing descriptions with 400', async () => {
    const res = await request(app)
      .post('/api/recommend')
      .send({
        projectDescription: 'too short', // < 10 characters
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });

  it('POST /api/recommend supports refinement requests', async () => {
    const res = await request(app)
      .post('/api/recommend')
      .send({
        projectDescription: 'A multi-tenant B2B customer support portal.',
        refinementRequest: 'Switch to microservices and add Redis caching',
      });

    expect(res.status).toBe(200);
    expect(res.body.architecturePattern).toBe('Microservices');
    const hasCache = res.body.nodes.some((n: any) => n.type === 'cache');
    expect(hasCache).toBe(true);
  });

  it('Recommended architecture can be directly submitted to POST /api/simulate', async () => {
    // 1. Get recommendation
    const recRes = await request(app)
      .post('/api/recommend')
      .send({
        projectDescription: 'Collaborative document editing platform like Google Docs with real-time sync.',
      });

    expect(recRes.status).toBe(200);
    const { nodes, edges } = recRes.body;

    // 2. Submit recommended nodes and edges directly to the GitToScale simulator
    const simRes = await request(app)
      .post('/api/simulate')
      .send({
        nodes,
        edges,
        incomingTrafficRate: 1500,
        durationSeconds: 30,
      });

    expect(simRes.status).toBe(200);
    expect(simRes.body.metrics).toBeDefined();
    expect(simRes.body.metrics.totalOfferedTraffic).toBe(1500);
    expect(simRes.body.nodeResults).toBeDefined();
  });
});

