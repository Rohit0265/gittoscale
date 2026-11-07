import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import {
  buildArchitectPrompt,
  synthesizeDeterministicReport,
  generateSystemDesignReport,
  formatFullMarkdownReport,
} from '../src/services/aiSystemDesignArchitect.js';

describe('AI System Design Architect Service & Prompts', () => {
  it('builds prompts correctly for Mode A, Mode B, and Mode C', () => {
    const promptA = buildArchitectPrompt({
      mode: 'mode_a',
      repositoryUrl: 'https://github.com/org/payment-gateway',
      repositoryAnalysis: { files: ['server.go', 'worker.go'] },
    });
    expect(promptA).toContain('Mode A — Repository-Based Design');
    expect(promptA).toContain('https://github.com/org/payment-gateway');

    const promptB = buildArchitectPrompt({
      mode: 'mode_b',
      systemDescription: 'Global URL Shortener like Bitly',
      expectedTraffic: '100M reads/day',
    });
    expect(promptB).toContain('Mode B — Prompt-Based Design');
    expect(promptB).toContain('Global URL Shortener like Bitly');

    const promptC = buildArchitectPrompt({
      mode: 'mode_c',
      repositoryUrl: 'https://github.com/org/monolith',
      scalingTarget: '100,000 Peak RPS',
    });
    expect(promptC).toContain('Mode C — Repository + Scaling Requirements');
    expect(promptC).toContain('100,000 Peak RPS');
  });

  it('synthesizes a complete 7-phase system design report deterministically', () => {
    const report = synthesizeDeterministicReport({
      systemDescription: 'Real-time Video Streaming and Transcoding Platform',
    });

    expect(report.title).toBeDefined();
    expect(report.systemOverview).toContain('Video Streaming');
    expect(report.mermaidDiagram).toContain('flowchart TB');
    expect(report.mermaidDiagram).toContain('subgraph INGRESS');
    expect(report.mermaidDiagram).toContain('subgraph DATA');

    expect(report.componentResponsibilities.length).toBeGreaterThan(5);
    expect(report.requestFlow.length).toBeGreaterThanOrEqual(5);

    // Capacity math check: Average RPS = Daily / 86400
    expect(report.capacityEstimation.dailyRequests).toBe(50000000);
    expect(report.capacityEstimation.averageRps).toBe(Math.round(50000000 / 86400));
    expect(report.capacityEstimation.peakRps).toBe(report.capacityEstimation.averageRps * 10);

    expect(report.keyDecisions.length).toBeGreaterThan(2);
    expect(report.assumptions.length).toBeGreaterThan(2);

    // Canvas nodes and edges
    expect(report.nodes.length).toBeGreaterThan(5);
    expect(report.edges.length).toBeGreaterThan(5);

    // Full Markdown Report contains all 7 required Phase headers
    const md = report.fullMarkdownReport;
    expect(md).toContain('## 1. System Overview');
    expect(md).toContain('## 2. Architecture Diagram');
    expect(md).toContain('```mermaid');
    expect(md).toContain('## 3. Component Responsibilities');
    expect(md).toContain('## 4. Request Flow');
    expect(md).toContain('## 5. Capacity Estimation');
    expect(md).toContain('## 6. Key Architecture Decisions');
    expect(md).toContain('## 7. Assumptions');
  });

  it('formats partial data into complete publication-grade markdown', () => {
    const md = formatFullMarkdownReport({
      title: 'Distributed Log Aggregator',
      systemOverview: 'High-throughput real-time log search engine.',
      mermaidDiagram: 'flowchart TB\n  USER(["Agents"]) --> LB["Load Balancer"]',
      componentResponsibilities: [
        { component: 'Ingest Gateway', layer: 'Edge', responsibility: 'Receives log streams' },
      ],
      requestFlow: ['1. Agents push logs', '2. Gateway enqueues to Kafka'],
    });

    expect(md).toContain('# Distributed Log Aggregator');
    expect(md).toContain('## 1. System Overview');
    expect(md).toContain('## 2. Architecture Diagram');
    expect(md).toContain('USER(["Agents"]) --> LB["Load Balancer"]');
    expect(md).toContain('## 3. Component Responsibilities');
    expect(md).toContain('| **Ingest Gateway** | Edge | Receives log streams |');
    expect(md).toContain('## 4. Request Flow');
    expect(md).toContain('## 5. Capacity Estimation');
    expect(md).toContain('## 6. Key Architecture Decisions');
    expect(md).toContain('## 7. Assumptions');
  });

  it('executes generateSystemDesignReport and handles unauthenticated / fallback environments cleanly', async () => {
    const res = await generateSystemDesignReport({
      mode: 'mode_b',
      systemDescription: 'E-commerce Checkout & Inventory Reservation',
    });

    expect(res).toBeDefined();
    expect(res.mermaidDiagram).toContain('flowchart TB');
    expect(res.fullMarkdownReport).toContain('## 1. System Overview');
  });
});

describe('AI System Design Architect API Endpoints', () => {
  const app = createApp();

  it('POST /api/recommend/design-report returns 200 with full 7-phase system design', async () => {
    const res = await request(app)
      .post('/api/recommend/design-report')
      .send({
        mode: 'mode_b',
        systemDescription: 'Distributed Rideshare Matching Service like Uber',
        expectedTraffic: '50M rides/day',
        functionalRequirements: ['Location Tracking', 'Driver Matching', 'Trip Billing'],
      });

    expect(res.status).toBe(200);
    expect(res.body.title).toBeDefined();
    expect(res.body.mermaidDiagram).toContain('flowchart TB');
    expect(res.body.fullMarkdownReport).toContain('## 1. System Overview');
    expect(res.body.fullMarkdownReport).toContain('## 2. Architecture Diagram');
    expect(res.body.fullMarkdownReport).toContain('## 5. Capacity Estimation');
    expect(Array.isArray(res.body.nodes)).toBe(true);
    expect(Array.isArray(res.body.edges)).toBe(true);
  });

  it('POST /api/architecture/design-report returns 200 with repository-based design (Mode A)', async () => {
    const res = await request(app)
      .post('/api/architecture/design-report')
      .send({
        mode: 'mode_a',
        repositoryUrl: 'https://github.com/expressjs/express',
        expectedTraffic: '20M requests/day',
      });

    expect(res.status).toBe(200);
    expect(res.body.mermaidDiagram).toContain('flowchart TB');
    expect(res.body.fullMarkdownReport).toContain('## 6. Key Architecture Decisions');
  });
});
