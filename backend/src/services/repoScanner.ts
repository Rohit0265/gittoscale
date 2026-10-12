import fs from 'node:fs';
import path from 'node:path';
import { ArchitectureNode, ArchitectureEdge, ComponentType } from '../simulation/types.js';

interface DiscoveredService {
  name: string;
  type: ComponentType;
  description?: string;
}

export async function scanLocalRepository(dirPath: string): Promise<{
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  detectedServices: string[];
}> {
  const resolvedPath = path.resolve(dirPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Directory path "${dirPath}" does not exist.`);
  }

  const detected: DiscoveredService[] = [];

  // 1. Check for docker-compose files
  const composeCandidates = [
    path.join(resolvedPath, 'docker-compose.yml'),
    path.join(resolvedPath, 'docker-compose.yaml'),
    path.join(resolvedPath, 'compose.yml'),
    path.join(resolvedPath, 'compose.yaml'),
  ];

  for (const composeFile of composeCandidates) {
    if (fs.existsSync(composeFile)) {
      const content = fs.readFileSync(composeFile, 'utf-8');
      const serviceMatches = content.match(/^\s{2}([a-zA-Z0-9_-]+):/gm);
      if (serviceMatches) {
        for (const raw of serviceMatches) {
          const sName = raw.trim().replace(':', '');
          if (!['version', 'services', 'networks', 'volumes'].includes(sName)) {
            detected.push({
              name: sName,
              type: inferComponentType(sName),
            });
          }
        }
      }
      break;
    }
  }

  // 2. Check for microservice subdirectories (e.g. services/*, apps/*, packages/*)
  const subDirsToCheck = ['services', 'apps', 'packages', 'microservices'];
  for (const sub of subDirsToCheck) {
    const fullSub = path.join(resolvedPath, sub);
    if (fs.existsSync(fullSub) && fs.statSync(fullSub).isDirectory()) {
      const entries = fs.readdirSync(fullSub);
      for (const entry of entries) {
        const fullEntry = path.join(fullSub, entry);
        if (fs.statSync(fullEntry).isDirectory() && !entry.startsWith('.')) {
          if (!detected.some(d => d.name.toLowerCase() === entry.toLowerCase())) {
            detected.push({
              name: entry,
              type: inferComponentType(entry),
            });
          }
        }
      }
    }
  }

  // 3. Check root package.json or workspace definitions
  const pkgPath = path.join(resolvedPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.name && !detected.some(d => d.name === pkg.name)) {
        detected.push({
          name: pkg.name.replace(/^@[\w-]+\//, ''),
          type: inferComponentType(pkg.name),
        });
      }
      if (Array.isArray(pkg.workspaces)) {
        for (const ws of pkg.workspaces) {
          const cleanWs = ws.replace('/*', '').replace('*', '');
          const wsPath = path.join(resolvedPath, cleanWs);
          if (fs.existsSync(wsPath) && fs.statSync(wsPath).isDirectory()) {
            const list = fs.readdirSync(wsPath);
            for (const item of list) {
              if (!item.startsWith('.') && !detected.some(d => d.name === item)) {
                detected.push({ name: item, type: inferComponentType(item) });
              }
            }
          }
        }
      }
    } catch {
      // ignore json parse error
    }
  }

  // Fallback if repository has only standard directories
  if (detected.length === 0) {
    const rootItems = fs.readdirSync(resolvedPath);
    for (const item of ['frontend', 'backend', 'api', 'server', 'client', 'auth', 'database', 'db']) {
      if (rootItems.includes(item)) {
        detected.push({ name: item, type: inferComponentType(item) });
      }
    }
  }

  // If still empty, add default services based on repo folder name
  if (detected.length === 0) {
    const folderName = path.basename(resolvedPath);
    detected.push(
      { name: `${folderName}-api`, type: 'gateway' },
      { name: `${folderName}-service`, type: 'service' },
      { name: 'database', type: 'database' }
    );
  }

  return buildArchitectureFromServices(detected);
}

export async function scanGitHubRepository(repoUrl: string): Promise<{
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  detectedServices: string[];
}> {
  // Extract owner and repo from URL, e.g. https://github.com/owner/repo
  const cleanUrl = repoUrl.trim().replace(/\.git$/, '').replace(/\/$/, '');
  const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    throw new Error('Invalid GitHub URL format. Please enter a valid URL like: https://github.com/owner/repository');
  }

  const [, owner, repo] = match;

  const detected: DiscoveredService[] = [];

  try {
    // Fetch repository tree from GitHub Public API
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`, {
      headers: {
        'User-Agent': 'System-Design-Playground',
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    let treeData: any = null;
    if (response.ok) {
      treeData = await response.json();
    } else {
      // Try master branch fallback
      const masterRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`, {
        headers: {
          'User-Agent': 'System-Design-Playground',
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      if (masterRes.ok) {
        treeData = await masterRes.json();
      }
    }

    if (treeData && Array.isArray(treeData.tree)) {
      const paths: string[] = treeData.tree.map((t: any) => t.path);

      for (const p of paths) {
        // Match docker-compose, service directories, etc.
        if (p.includes('docker-compose') || p.endsWith('compose.yml') || p.endsWith('compose.yaml')) {
          const serviceName = path.basename(path.dirname(p));
          if (serviceName && serviceName !== '.') {
            detected.push({ name: serviceName, type: inferComponentType(serviceName) });
          }
        }
        if (p.startsWith('services/') || p.startsWith('apps/') || p.startsWith('packages/')) {
          const parts = p.split('/');
          if (parts.length >= 2) {
            const sName = parts[1];
            if (!detected.some(d => d.name === sName)) {
              detected.push({ name: sName, type: inferComponentType(sName) });
            }
          }
        }
        if (['frontend', 'backend', 'api', 'gateway', 'server', 'auth-service', 'payment'].includes(p)) {
          if (!detected.some(d => d.name === p)) {
            detected.push({ name: p, type: inferComponentType(p) });
          }
        }
      }
    }
  } catch (err) {
    console.warn('[GitHub API Scan Fallback]', err);
  }

  // Fallback heuristics based on repository name
  if (detected.length === 0) {
    detected.push(
      { name: 'api-gateway', type: 'gateway' },
      { name: `${repo}-core`, type: 'service' },
      { name: `${repo}-auth`, type: 'service' },
      { name: 'postgres-db', type: 'database' },
      { name: 'redis-cache', type: 'cache' }
    );
  }

  return buildArchitectureFromServices(detected);
}

function inferComponentType(name: string): ComponentType {
  const lower = name.toLowerCase();
  if (lower.includes('gate') || lower.includes('proxy') || lower.includes('router') || lower.includes('ingress')) {
    return 'gateway';
  }
  if (lower.includes('db') || lower.includes('postgres') || lower.includes('sql') || lower.includes('mongo') || lower.includes('data')) {
    return 'database';
  }
  if (lower.includes('cache') || lower.includes('redis') || lower.includes('memcached')) {
    return 'cache';
  }
  if (lower.includes('client') || lower.includes('load') || lower.includes('traffic')) {
    return 'load_generator';
  }
  return 'service';
}

function buildArchitectureFromServices(discovered: DiscoveredService[]): {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  detectedServices: string[];
} {
  // Ensure we have a load generator client
  const nodes: ArchitectureNode[] = [];
  const edges: ArchitectureEdge[] = [];

  // Add source client node
  nodes.push({
    id: 'client',
    name: 'Client / Traffic Generator',
    type: 'load_generator',
    position: { x: 50, y: 220 },
    capacityPerSecond: 10000,
    workerCount: 1,
    enabled: true,
    config: {
      baselineLatencyMs: 0,
      maxQueueSize: 10000,
      overflowPolicy: 'drop',
      isSource: true,
      defaultTrafficRate: 1000,
    },
  });

  // Segregate components
  let gateways = discovered.filter(d => d.type === 'gateway');
  const services = discovered.filter(d => d.type === 'service');
  const databases = discovered.filter(d => d.type === 'database');
  const caches = discovered.filter(d => d.type === 'cache');

  // If no gateway, promote or create one
  if (gateways.length === 0) {
    gateways = [{ name: 'API Gateway', type: 'gateway' }];
  }

  let currentX = 300;
  let currentY = 100;

  // 1. Layout Gateways
  const gatewayIds: string[] = [];
  for (const gw of gateways) {
    const id = `node-${gw.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`;
    gatewayIds.push(id);
    nodes.push({
      id,
      name: gw.name,
      type: 'gateway',
      position: { x: currentX, y: currentY + 120 },
      capacityPerSecond: 1500,
      workerCount: 2,
      enabled: true,
      config: { baselineLatencyMs: 5, maxQueueSize: 3000, overflowPolicy: 'reject' },
    });
    // Link client to gateway
    edges.push({
      id: `edge-client-${id}`,
      source: 'client',
      target: id,
      requestsPerInput: 1.0,
      enabled: true,
    });
  }

  currentX += 300;

  // 2. Layout Services
  const serviceIds: string[] = [];
  let sY = 60;
  for (const s of services) {
    const id = `node-${s.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`;
    serviceIds.push(id);
    nodes.push({
      id,
      name: s.name,
      type: 'service',
      position: { x: currentX, y: sY },
      capacityPerSecond: 800,
      workerCount: 2,
      enabled: true,
      config: { baselineLatencyMs: 20, maxQueueSize: 2000, overflowPolicy: 'reject' },
    });

    // Link primary gateway to service
    if (gatewayIds.length > 0) {
      edges.push({
        id: `edge-gw-${id}`,
        source: gatewayIds[0],
        target: id,
        requestsPerInput: Math.round((1.0 / Math.max(1, services.length)) * 10) / 10 || 0.5,
        enabled: true,
      });
    }

    sY += 150;
  }

  currentX += 300;

  // 3. Layout Caches & Databases
  const storageNodes = [...caches, ...databases];
  if (storageNodes.length === 0) {
    storageNodes.push({ name: 'Primary Database', type: 'database' });
  }

  let dbY = 120;
  for (const store of storageNodes) {
    const id = `node-${store.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`;
    nodes.push({
      id,
      name: store.name,
      type: store.type,
      position: { x: currentX, y: dbY },
      capacityPerSecond: store.type === 'cache' ? 2500 : 600,
      workerCount: 2,
      enabled: true,
      config: {
        baselineLatencyMs: store.type === 'cache' ? 2 : 30,
        maxQueueSize: store.type === 'cache' ? 5000 : 2000,
        overflowPolicy: 'reject',
      },
    });

    // Link services to storage
    for (const sid of serviceIds) {
      edges.push({
        id: `edge-${sid}-${id}`,
        source: sid,
        target: id,
        requestsPerInput: store.type === 'cache' ? 1.0 : 0.5,
        enabled: true,
      });
    }

    dbY += 160;
  }

  return {
    nodes,
    edges,
    detectedServices: discovered.map(d => d.name),
  };
}
