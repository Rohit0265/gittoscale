import fs from 'node:fs';
import path from 'node:path';
import {
  RepositoryInventory,
  InventoryItem,
  CandidateClassification,
  ConnectionEvidence,
} from './repoAnalysisTypes.js';

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage',
  '.cache',
  'vendor',
  'tmp',
  'temp',
]);

const SERVER_BOOTSTRAP_INDICATORS = [
  'express()',
  'nestfactory.create',
  'fastify(',
  'app.listen(',
  'server.listen(',
  'createserver(',
  'koa()',
  'gin.default()',
  'actix_web',
  'springapplication.run',
];

const WORKER_BOOTSTRAP_INDICATORS = [
  'cron.schedule',
  'agenda.define',
  'bullmq',
  'new worker(',
  'rabbitmq',
  'kafka.consumer',
  'sqs.receivemessage',
  'startworker',
];

const FRONTEND_BOOTSTRAP_INDICATORS = [
  'reactdom.createroot',
  'reactdom.render',
  'createapp(',
  '@angular/platform-browser',
  'next/app',
  'vite',
];

const DB_CLIENT_INDICATORS = [
  { name: 'PostgreSQL', keys: ['pg', 'typeorm', 'prisma', 'knex', 'sequelize', 'postgres'] },
  { name: 'MySQL', keys: ['mysql', 'mysql2', 'sequelize'] },
  { name: 'MongoDB', keys: ['mongoose', 'mongodb'] },
  { name: 'Redis', keys: ['ioredis', 'redis'] },
];

const QUEUE_CLIENT_INDICATORS = [
  { name: 'Kafka', keys: ['kafkajs', 'kafka'] },
  { name: 'RabbitMQ', keys: ['amqplib', 'rabbitmq'] },
  { name: 'SQS', keys: ['@aws-sdk/client-sqs', 'sqs'] },
];

/**
 * Builds a deterministic repository inventory by inspecting project files,
 * entry points, manifests, and Docker Compose configurations.
 */
export function buildStaticRepositoryInventory(rootDir: string): RepositoryInventory {
  const analyzedFiles: string[] = [];
  const skippedFiles: string[] = [];
  const items: InventoryItem[] = [];
  const connections: ConnectionEvidence[] = [];

  const resolvedRoot = path.resolve(rootDir);
  const repoName = path.basename(resolvedRoot);

  // 1. Check for docker-compose definitions
  const composeCandidates = [
    'docker-compose.yml',
    'docker-compose.yaml',
    'compose.yml',
    'compose.yaml',
  ];

  const composeServicesMap = new Map<string, { image?: string; build?: string; ports?: string[] }>();

  for (const cName of composeCandidates) {
    const cPath = path.join(resolvedRoot, cName);
    if (fs.existsSync(cPath)) {
      analyzedFiles.push(cName);
      try {
        const content = fs.readFileSync(cPath, 'utf-8');
        // Simple regex parser for compose services
        const lines = content.split('\n');
        let currentService = '';
        let inServices = false;

        for (const line of lines) {
          if (/^services:\s*$/.test(line)) {
            inServices = true;
            continue;
          }
          if (inServices) {
            const serviceMatch = line.match(/^ {2}([a-zA-Z0-9_-]+):\s*$/);
            if (serviceMatch) {
              currentService = serviceMatch[1];
              composeServicesMap.set(currentService, {});
            }
          }
        }
      } catch {
        // ignore
      }
      break;
    }
  }

  // 2. Discover packages / applications / folders
  // Inspect root first
  const rootPkgPath = path.join(resolvedRoot, 'package.json');
  let rootPkg: any = null;
  if (fs.existsSync(rootPkgPath)) {
    analyzedFiles.push('package.json');
    try {
      rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
    } catch {
      // ignore
    }
  }

  // Identify sub-projects or monorepo packages
  const candidateDirs: string[] = [];

  const checkDirs = ['apps', 'services', 'packages', 'src'];
  for (const dir of checkDirs) {
    const fullDir = path.join(resolvedRoot, dir);
    if (fs.existsSync(fullDir) && fs.statSync(fullDir).isDirectory()) {
      try {
        const entries = fs.readdirSync(fullDir);
        for (const entry of entries) {
          const subPath = path.join(fullDir, entry);
          if (fs.statSync(subPath).isDirectory() && !entry.startsWith('.')) {
            candidateDirs.push(path.join(dir, entry));
          }
        }
      } catch {
        // ignore
      }
    }
  }

  // Also if no sub-folders in apps/services, inspect root itself as single application
  if (candidateDirs.length === 0) {
    candidateDirs.push('.');
  }

  // 3. Inspect each candidate directory
  for (const relDir of candidateDirs) {
    const fullDir = path.resolve(resolvedRoot, relDir);
    const itemName = relDir === '.' ? (rootPkg?.name || repoName) : path.basename(relDir);

    // Read package.json if present
    const pkgPath = path.join(fullDir, 'package.json');
    let pkgData: any = null;
    if (fs.existsSync(pkgPath)) {
      analyzedFiles.push(path.join(relDir, 'package.json'));
      try {
        pkgData = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      } catch {}
    } else if (relDir === '.') {
      pkgData = rootPkg;
    }

    // Inspect files inside fullDir (up to depth 2)
    const {
      hasServer,
      hasWorker,
      hasFrontend,
      entryFiles,
      routes,
      detectedDb,
      detectedQueues,
      startupCmd,
    } = inspectCandidateDirectory(fullDir, relDir, analyzedFiles, skippedFiles, pkgData);

    // Classification determination
    let classification: CandidateClassification = 'unknown';
    let confidence = 0.5;
    let reason = 'Insufficient runtime indicators found in directory.';
    let isRuntimeService = false;

    // RULE 1: Specific shared/library directory names are NOT servers
    const lowerName = itemName.toLowerCase();
    const isSharedLibName =
      lowerName.includes('shared') ||
      lowerName.includes('types') ||
      lowerName.includes('common') ||
      lowerName.includes('ui') ||
      lowerName.includes('components') ||
      lowerName.includes('utils') ||
      lowerName.includes('helpers') ||
      lowerName.includes('logger') ||
      relDir.startsWith('packages/');

    if (isSharedLibName && !hasServer && !hasWorker) {
      if (lowerName.includes('ui') || lowerName.includes('component')) {
        classification = 'ui_package';
        reason = `Folder "${itemName}" contains UI components/reusable elements without an independent server bootstrap.`;
      } else {
        classification = 'shared_library';
        reason = `Folder "${itemName}" is a shared library/utility module without independent server process or startup command.`;
      }
      confidence = 0.95;
      isRuntimeService = false;
    } else if (hasServer) {
      classification = 'backend_service';
      reason = `Discovered server bootstrap (${entryFiles.join(', ')}) with executable listen/app entrypoint.`;
      confidence = 0.95;
      isRuntimeService = true;
    } else if (hasWorker) {
      classification = 'worker';
      reason = `Identified independently executed background worker/job runner with startup script.`;
      confidence = 0.9;
      isRuntimeService = true;
    } else if (hasFrontend) {
      classification = 'frontend_app';
      reason = `Identified frontend web application bootstrap (React/Vite/Vue entrypoint).`;
      confidence = 0.9;
      isRuntimeService = true;
    } else if (composeServicesMap.has(itemName)) {
      // Defined in compose
      classification = 'backend_service';
      reason = `Defined as distinct service in Docker Compose manifest.`;
      confidence = 0.85;
      isRuntimeService = true;
    }

    items.push({
      path: relDir,
      name: itemName,
      packageJson: pkgData || undefined,
      hasServerBootstrap: hasServer,
      hasWorkerBootstrap: hasWorker,
      hasFrontendBootstrap: hasFrontend,
      entryFiles,
      dockerfiles: fs.existsSync(path.join(fullDir, 'Dockerfile')) ? ['Dockerfile'] : [],
      dockerComposeServices: composeServicesMap.has(itemName) ? [itemName] : [],
      routes,
      clients: {
        databases: detectedDb,
        queues: detectedQueues,
        httpTargets: [],
      },
      classification,
      evidence: {
        entryPoint: entryFiles[0],
        startupCommand: startupCmd,
        sourceFiles: entryFiles,
        detectedRoutes: routes,
        confidence,
        reason,
        isRuntimeService,
      },
    });

    // Check databases & queues to add connection candidates
    for (const db of detectedDb) {
      connections.push({
        source: itemName,
        target: `${db.toLowerCase()}-db`,
        communicationType: 'db',
        evidenceFiles: entryFiles,
        confidence: 0.9,
        reason: `Client integration for ${db} detected in ${itemName}.`,
        isConfirmed: true,
      });
    }

    for (const q of detectedQueues) {
      connections.push({
        source: itemName,
        target: `${q.toLowerCase()}-queue`,
        communicationType: 'queue',
        evidenceFiles: entryFiles,
        confidence: 0.9,
        reason: `Message broker client integration for ${q} detected in ${itemName}.`,
        isConfirmed: true,
      });
    }
  }

  return {
    repoName,
    frameworks: [],
    analyzedFiles,
    skippedFiles,
    items,
    connections,
  };
}

function inspectCandidateDirectory(
  fullDir: string,
  relDir: string,
  analyzedFiles: string[],
  skippedFiles: string[],
  pkgData: any
): {
  hasServer: boolean;
  hasWorker: boolean;
  hasFrontend: boolean;
  entryFiles: string[];
  routes: string[];
  detectedDb: string[];
  detectedQueues: string[];
  startupCmd?: string;
} {
  let hasServer = false;
  let hasWorker = false;
  let hasFrontend = false;
  const entryFiles: string[] = [];
  const routes: string[] = [];
  const detectedDbSet = new Set<string>();
  const detectedQueuesSet = new Set<string>();
  let startupCmd: string | undefined;

  // Check package scripts
  if (pkgData?.scripts) {
    const scripts = pkgData.scripts;
    if (scripts.start || scripts.dev || scripts.serve) {
      startupCmd = scripts.start || scripts.dev || scripts.serve;
      const cmdLower = (startupCmd || '').toLowerCase();
      if (cmdLower.includes('worker') || cmdLower.includes('cron') || cmdLower.includes('queue:listen')) {
        hasWorker = true;
      }
    }
  }

  // Scan files up to depth 3
  function walk(current: string, depth: number) {
    if (depth > 3) return;
    try {
      const entries = fs.readdirSync(current);
      for (const entry of entries) {
        if (IGNORED_DIRS.has(entry) || entry.startsWith('.')) {
          skippedFiles.push(path.join(current, entry));
          continue;
        }

        const sub = path.join(current, entry);
        const stat = fs.statSync(sub);
        if (stat.isDirectory()) {
          walk(sub, depth + 1);
        } else if (stat.isFile() && /\.(ts|js|mjs|cjs|go|py|rs|java)$/.test(entry)) {
          // Read excerpt (max 8KB) to avoid reading huge files
          try {
            const buf = Buffer.alloc(8192);
            const fd = fs.openSync(sub, 'r');
            const bytesRead = fs.readSync(fd, buf, 0, 8192, 0);
            fs.closeSync(fd);
            const text = buf.toString('utf-8', 0, bytesRead).toLowerCase();
            const relSub = path.relative(fullDir, sub);

            analyzedFiles.push(path.join(relDir, relSub));

            // Check server bootstrap
            for (const indicator of SERVER_BOOTSTRAP_INDICATORS) {
              if (text.includes(indicator)) {
                hasServer = true;
                if (!entryFiles.includes(relSub)) entryFiles.push(relSub);
                break;
              }
            }

            // Check worker bootstrap
            for (const indicator of WORKER_BOOTSTRAP_INDICATORS) {
              if (text.includes(indicator)) {
                hasWorker = true;
                if (!entryFiles.includes(relSub)) entryFiles.push(relSub);
                break;
              }
            }

            // Check frontend bootstrap
            for (const indicator of FRONTEND_BOOTSTRAP_INDICATORS) {
              if (text.includes(indicator)) {
                hasFrontend = true;
                if (!entryFiles.includes(relSub)) entryFiles.push(relSub);
                break;
              }
            }

            // Check route indicators
            if (
              text.includes('router.get(') ||
              text.includes('router.post(') ||
              text.includes('app.get(') ||
              text.includes('@get(') ||
              text.includes('@post(')
            ) {
              routes.push(relSub);
            }

            // Check DB
            for (const db of DB_CLIENT_INDICATORS) {
              for (const k of db.keys) {
                if (text.includes(k)) {
                  detectedDbSet.add(db.name);
                }
              }
            }

            // Check Queues
            for (const q of QUEUE_CLIENT_INDICATORS) {
              for (const k of q.keys) {
                if (text.includes(k)) {
                  detectedQueuesSet.add(q.name);
                }
              }
            }
          } catch {
            // ignore read error
          }
        }
      }
    } catch {
      // ignore readdir error
    }
  }

  walk(fullDir, 1);

  return {
    hasServer,
    hasWorker,
    hasFrontend,
    entryFiles,
    routes,
    detectedDb: Array.from(detectedDbSet),
    detectedQueues: Array.from(detectedQueuesSet),
    startupCmd,
  };
}

