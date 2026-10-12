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
  { name: 'PostgreSQL', keys: ["from 'pg'", 'require("pg")', 'new pool(', 'new client(', 'createconnection(', 'postgres://'] },
  { name: 'MySQL', keys: ["from 'mysql2'", 'require("mysql2")', 'createpool(', 'mysql://'] },
  { name: 'MongoDB', keys: ["from 'mongoose'", 'mongoose.connect', 'mongoclient', 'mongodb://'] },
  { name: 'Redis', keys: ["from 'ioredis'", "from 'redis'", 'new redis(', 'createredisclient', 'redis://'] },
];

const QUEUE_CLIENT_INDICATORS = [
  { name: 'Kafka', keys: ["from 'kafkajs'", 'new kafka(', 'kafka.producer', 'kafka.consumer'] },
  { name: 'RabbitMQ', keys: ["from 'amqplib'", 'amqp.connect', 'rabbitmq://'] },
  { name: 'SQS', keys: ['@aws-sdk/client-sqs', 'new sqsclient('] },
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

  // Identify sub-projects or monorepo packages by inspecting workspaces and directory tree
  const candidateDirs: string[] = [];

  // Check package workspaces if specified in package.json
  if (rootPkg?.workspaces) {
    const wsPatterns = Array.isArray(rootPkg.workspaces)
      ? rootPkg.workspaces
      : rootPkg.workspaces.packages || [];
    for (const ws of wsPatterns) {
      const cleanPattern = ws.replace(/\/\*$/, '').replace(/\*$/, '');
      const wsDir = path.join(resolvedRoot, cleanPattern);
      if (fs.existsSync(wsDir) && fs.statSync(wsDir).isDirectory()) {
        try {
          const list = fs.readdirSync(wsDir);
          for (const item of list) {
            const sub = path.join(wsDir, item);
            if (fs.statSync(sub).isDirectory() && !item.startsWith('.') && !IGNORED_DIRS.has(item)) {
              candidateDirs.push(path.relative(resolvedRoot, sub));
            }
          }
        } catch {}
      }
    }
  }

  // Next, inspect top-level and nested directories in the repository
  try {
    const rootEntries = fs.readdirSync(resolvedRoot);
    for (const entry of rootEntries) {
      if (entry.startsWith('.') || IGNORED_DIRS.has(entry)) continue;
      const fullPath = path.join(resolvedRoot, entry);
      if (fs.statSync(fullPath).isDirectory()) {
        const lower = entry.toLowerCase();
        // If it's a known container of services (apps, services, packages, microservices), check its children
        if (['apps', 'services', 'packages', 'microservices'].includes(lower)) {
          try {
            const subEntries = fs.readdirSync(fullPath);
            for (const sub of subEntries) {
              const subFull = path.join(fullPath, sub);
              if (fs.statSync(subFull).isDirectory() && !sub.startsWith('.') && !IGNORED_DIRS.has(sub)) {
                const rel = path.join(entry, sub);
                if (!candidateDirs.includes(rel)) candidateDirs.push(rel);
              }
            }
          } catch {}
        } else if (['backend', 'server'].includes(lower)) {
          // Drill into backend/gateway, backend/services, backend/shared
          let foundNested = false;
          try {
            const bEntries = fs.readdirSync(fullPath);
            for (const bSub of bEntries) {
              const bSubFull = path.join(fullPath, bSub);
              if (fs.statSync(bSubFull).isDirectory() && !bSub.startsWith('.') && !IGNORED_DIRS.has(bSub)) {
                if (['services', 'apps', 'packages', 'shared'].includes(bSub.toLowerCase())) {
                  try {
                    const deepEntries = fs.readdirSync(bSubFull);
                    for (const deep of deepEntries) {
                      const deepFull = path.join(bSubFull, deep);
                      if (fs.statSync(deepFull).isDirectory() && !deep.startsWith('.') && !IGNORED_DIRS.has(deep)) {
                        const rel = path.join(entry, bSub, deep);
                        if (!candidateDirs.includes(rel)) candidateDirs.push(rel);
                        foundNested = true;
                      }
                    }
                  } catch {}
                } else if (['gateway', 'api', 'proxy'].includes(bSub.toLowerCase()) || fs.existsSync(path.join(bSubFull, 'package.json'))) {
                  const rel = path.join(entry, bSub);
                  if (!candidateDirs.includes(rel)) candidateDirs.push(rel);
                  foundNested = true;
                }
              }
            }
          } catch {}
          if (!foundNested) {
            if (!candidateDirs.includes(entry)) candidateDirs.push(entry);
          }
        } else {
          // Add this top-level directory as a candidate (e.g. frontend, client, auth, etc.)
          if (!candidateDirs.includes(entry)) {
            candidateDirs.push(entry);
          }
        }
      }
    }
  } catch {}

  // If subfolders under backend/ exist, remove backend itself to prevent collapsing
  const hasSubServices = candidateDirs.some(
    (d) => d.startsWith('backend/') || d.startsWith('server/')
  );
  if (hasSubServices) {
    const idx = candidateDirs.indexOf('backend');
    if (idx !== -1) candidateDirs.splice(idx, 1);
  }

  // If still completely empty, inspect root itself
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

    // RULE 1: Internal subdirectories like src, tests, test, fixtures, docs, config
    const isInternalSubFolder =
      lowerName === 'src' ||
      lowerName === 'tests' ||
      lowerName === 'test' ||
      lowerName === 'fixtures' ||
      lowerName === 'docs' ||
      lowerName === 'config' ||
      lowerName === 'scripts';

    if (isInternalSubFolder) {
      classification = lowerName.includes('test') ? 'test' : lowerName === 'fixtures' ? 'config' : 'shared_library';
      reason = `Folder "${relDir}" is an internal project directory (${lowerName}) rather than an independent standalone server.`;
      confidence = 0.95;
      isRuntimeService = false;
    } else if (isSharedLibName && !hasServer && !hasWorker) {
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

