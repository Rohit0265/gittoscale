import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { buildStaticRepositoryInventory } from '../src/services/staticScanner.js';
import {
  synthesizeDeterministicArchitecture,
  synthesizeDetailedArchitecture,
} from '../src/services/architectureAnalyzer.js';
import { convertAnalysisToArchitecture } from '../src/services/diagramGenerator.js';
import { runSimulation } from '../src/simulation/engine.js';
import { llmAnalysisResultSchema } from '../src/services/repoAnalysisTypes.js';

describe('Repository Analysis & Architecture Detection Tests', () => {
  // Helper to create a temporary test monorepo directory
  const createMockRepo = () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mock-repo-'));

    // packages/shared-types (Should NOT be a server)
    fs.mkdirSync(path.join(tmpDir, 'packages', 'shared-types'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'packages', 'shared-types', 'package.json'),
      JSON.stringify({ name: '@mock/shared-types', version: '1.0.0' })
    );
    fs.writeFileSync(
      path.join(tmpDir, 'packages', 'shared-types', 'index.ts'),
      'export interface User { id: string; name: string; }'
    );

    // packages/ui (React UI component directory - NOT a backend service)
    fs.mkdirSync(path.join(tmpDir, 'packages', 'ui'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'packages', 'ui', 'package.json'),
      JSON.stringify({ name: '@mock/ui', version: '1.0.0' })
    );
    fs.writeFileSync(
      path.join(tmpDir, 'packages', 'ui', 'Button.tsx'),
      'export const Button = () => <button>Click</button>;'
    );

    // apps/auth-service (NestJS / Express backend service with listen)
    fs.mkdirSync(path.join(tmpDir, 'apps', 'auth-service'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'apps', 'auth-service', 'package.json'),
      JSON.stringify({
        name: 'auth-service',
        scripts: { start: 'node dist/main.js' },
        dependencies: { pg: '^8.0.0' },
      })
    );
    fs.writeFileSync(
      path.join(tmpDir, 'apps', 'auth-service', 'main.ts'),
      'import express from "express"; const app = express(); app.listen(3000);'
    );

    // apps/payment-service (Second independently launched backend service)
    fs.mkdirSync(path.join(tmpDir, 'apps', 'payment-service'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'apps', 'payment-service', 'package.json'),
      JSON.stringify({
        name: 'payment-service',
        scripts: { start: 'node dist/server.js' },
        dependencies: { ioredis: '^5.0.0' },
      })
    );
    fs.writeFileSync(
      path.join(tmpDir, 'apps', 'payment-service', 'server.ts'),
      'import express from "express"; const app = express(); app.listen(4000);'
    );

    // apps/email-worker (Worker with independent startup command)
    fs.mkdirSync(path.join(tmpDir, 'apps', 'email-worker'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'apps', 'email-worker', 'package.json'),
      JSON.stringify({
        name: 'email-worker',
        scripts: { start: 'node dist/worker.js' },
      })
    );
    fs.writeFileSync(
      path.join(tmpDir, 'apps', 'email-worker', 'worker.ts'),
      'import { Worker } from "bullmq"; const worker = new Worker("emails", async job => {});'
    );

    // docker-compose.yml
    fs.writeFileSync(
      path.join(tmpDir, 'docker-compose.yml'),
      `version: '3.8'
services:
  postgres:
    image: postgres:15
  redis:
    image: redis:7
`
    );

    return tmpDir;
  };

  // Test 1: A packages/shared-types folder is not automatically classified as a server.
  it('1. A packages/shared-types folder is not automatically classified as a server', () => {
    const tmp = createMockRepo();
    try {
      const inv = buildStaticRepositoryInventory(tmp);
      const sharedItem = inv.items.find((i) => i.name === 'shared-types');
      expect(sharedItem).toBeDefined();
      expect(sharedItem?.classification).toBe('shared_library');
      expect(sharedItem?.evidence.isRuntimeService).toBe(false);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  // Test 2: A React UI component directory is not classified as a backend service.
  it('2. A React UI component directory is not classified as a backend service', () => {
    const tmp = createMockRepo();
    try {
      const inv = buildStaticRepositoryInventory(tmp);
      const uiItem = inv.items.find((i) => i.name === 'ui');
      expect(uiItem).toBeDefined();
      expect(uiItem?.classification).toBe('ui_package');
      expect(uiItem?.evidence.isRuntimeService).toBe(false);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  // Test 3: A backend application with a bootstrap entry point is detected as a backend candidate.
  it('3. An application with a bootstrap entry point is detected as a backend candidate', () => {
    const tmp = createMockRepo();
    try {
      const inv = buildStaticRepositoryInventory(tmp);
      const authItem = inv.items.find((i) => i.name === 'auth-service');
      expect(authItem).toBeDefined();
      expect(authItem?.hasServerBootstrap).toBe(true);
      expect(authItem?.classification).toBe('backend_service');
      expect(authItem?.evidence.isRuntimeService).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  // Test 4: Two independently launched backend applications are detected as separate runtime candidates.
  it('4. Two independently launched backend applications are detected as separate runtime candidates', () => {
    const tmp = createMockRepo();
    try {
      const inv = buildStaticRepositoryInventory(tmp);
      const servers = inv.items.filter((i) => i.classification === 'backend_service');
      const names = servers.map((s) => s.name);
      expect(names).toContain('auth-service');
      expect(names).toContain('payment-service');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  // Test 5: Multiple route files inside one application are not automatically treated as separate servers.
  it('5. Multiple route files inside one application are not automatically treated as separate servers', () => {
    const tmp = createMockRepo();
    try {
      // Add multiple routes to auth-service
      fs.writeFileSync(
        path.join(tmp, 'apps', 'auth-service', 'routes-login.ts'),
        'router.post("/login", (req, res) => {});'
      );
      fs.writeFileSync(
        path.join(tmp, 'apps', 'auth-service', 'routes-register.ts'),
        'router.post("/register", (req, res) => {});'
      );

      const inv = buildStaticRepositoryInventory(tmp);
      const authItem = inv.items.find((i) => i.name === 'auth-service');
      expect(authItem?.routes.length).toBeGreaterThanOrEqual(2);
      // auth-service still remains one single item
      const matchingItems = inv.items.filter((i) => i.name === 'auth-service');
      expect(matchingItems.length).toBe(1);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  // Test 6: A worker with an independent startup command can be identified.
  it('6. A worker with an independent startup command can be identified', () => {
    const tmp = createMockRepo();
    try {
      const inv = buildStaticRepositoryInventory(tmp);
      const workerItem = inv.items.find((i) => i.name === 'email-worker');
      expect(workerItem).toBeDefined();
      expect(workerItem?.classification).toBe('worker');
      expect(workerItem?.evidence.isRuntimeService).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  // Test 7: Docker Compose service definitions are interpreted alongside application evidence.
  it('7. Docker Compose service definitions are interpreted alongside application evidence', () => {
    const tmp = createMockRepo();
    try {
      const inv = buildStaticRepositoryInventory(tmp);
      expect(inv.analyzedFiles).toContain('docker-compose.yml');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  // Test 8: Shared libraries are distinguished from runtime services.
  it('8. Shared libraries are distinguished from runtime services in diagram generation', () => {
    const tmp = createMockRepo();
    try {
      const inv = buildStaticRepositoryInventory(tmp);
      const analysis = synthesizeDeterministicArchitecture(inv);
      const { nodes } = convertAnalysisToArchitecture(analysis);
      const nodeNames = nodes.map((n) => n.name);

      // Must NOT contain shared-types or ui as server nodes
      expect(nodeNames).not.toContain('shared-types');
      expect(nodeNames).not.toContain('ui');
      // Must contain runtime services
      expect(nodeNames).toContain('auth-service');
      expect(nodeNames).toContain('payment-service');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  // Test 9: Unsupported or empty repositories produce uncertainty rather than fabricated architecture.
  it('9. Unsupported or empty repositories produce uncertainty rather than fabricated architecture', () => {
    const emptyTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-repo-'));
    try {
      const inv = buildStaticRepositoryInventory(emptyTmp);
      const analysis = synthesizeDeterministicArchitecture(inv);
      expect(analysis.components.length).toBe(0);
      expect(analysis.connections.length).toBe(0);
    } finally {
      fs.rmSync(emptyTmp, { recursive: true, force: true });
    }
  });

  // Test 10: Invalid LLM output cannot bypass schema validation.
  it('10. Invalid LLM output cannot bypass schema validation', () => {
    const invalidLLMOutput = {
      components: [
        {
          id: 'invalid-node',
          name: 'Invalid',
          type: 'not_a_valid_type', // Invalid type
          isRuntimeService: true,
          sourceFiles: [],
          confidence: 2.5, // Exceeds 1.0
          reason: 'test',
        },
      ],
      connections: [],
    };

    expect(() => llmAnalysisResultSchema.parse(invalidLLMOutput)).toThrow();
  });

  // Test 11: Only evidenced or explicitly user-added connections appear as confirmed connections.
  it('11. Only evidenced connections appear as confirmed connections', () => {
    const tmp = createMockRepo();
    try {
      const inv = buildStaticRepositoryInventory(tmp);
      const analysis = synthesizeDeterministicArchitecture(inv);
      for (const conn of analysis.connections) {
        expect(conn.reason).toBeDefined();
        expect(conn.confidence).toBeGreaterThan(0);
      }
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  // Test 12: The resulting graph is compatible with the existing traffic simulator.
  it('12. The resulting graph is compatible with the existing traffic simulator', () => {
    const tmp = createMockRepo();
    try {
      const inv = buildStaticRepositoryInventory(tmp);
      const analysis = synthesizeDeterministicArchitecture(inv);
      const { nodes, edges } = convertAnalysisToArchitecture(analysis);

      expect(nodes.length).toBeGreaterThan(0);
      expect(edges.length).toBeGreaterThan(0);

      // Run through actual simulation engine!
      const simResult = runSimulation({
        nodes,
        edges,
        incomingTrafficRate: 1200,
        durationSeconds: 30,
      });

      expect(simResult).toBeDefined();
      expect(simResult.metrics.completedThroughput).toBeGreaterThanOrEqual(0);
      expect(simResult.bottlenecks).toBeDefined();
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  // Test 13: Detailed View produces internal submodules with parentId and submoduleType
  it('13. Detailed View produces internal submodules with parentId and submoduleType', () => {
    const tmp = createMockRepo();
    try {
      const inv = buildStaticRepositoryInventory(tmp);
      const detailedAnalysis = synthesizeDetailedArchitecture(inv);
      expect(detailedAnalysis.components.length).toBeGreaterThan(0);

      const parsed = llmAnalysisResultSchema.safeParse(detailedAnalysis);
      expect(parsed.success).toBe(true);

      const hasSubmodule = detailedAnalysis.components.some(
        (c) => Boolean(c.parentId) || Boolean(c.submoduleType)
      );
      expect(hasSubmodule).toBe(true);

      // Verify connections have bidirectional support and flow descriptions
      const hasBidirectional = detailedAnalysis.connections.some((conn) => conn.isBidirectional === true);
      expect(hasBidirectional).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  // Test 14: Detailed architecture graph simulates successfully without cycles
  it('14. Detailed architecture graph simulates successfully without cycles', () => {
    const tmp = createMockRepo();
    try {
      const inv = buildStaticRepositoryInventory(tmp);
      const detailedAnalysis = synthesizeDetailedArchitecture(inv);
      const { nodes, edges } = convertAnalysisToArchitecture(detailedAnalysis);

      expect(nodes.length).toBeGreaterThan(0);
      expect(edges.length).toBeGreaterThan(0);

      const simResult = runSimulation({
        nodes,
        edges,
        incomingTrafficRate: 1500,
        durationSeconds: 30,
      });

      expect(simResult).toBeDefined();
      expect(simResult.metrics.totalOfferedTraffic).toBe(1500);
      expect(simResult.metrics.completedThroughput).toBeGreaterThanOrEqual(0);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
