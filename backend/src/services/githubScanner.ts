import { RepositoryInventory, InventoryItem } from './repoAnalysisTypes.js';
import path from 'node:path';

/**
 * Builds a structured inventory from a GitHub repository tree by inspecting
 * directory paths, manifests, and package setups.
 * Captures repository metadata (defaultBranch, commitSha, README summary).
 */
export async function buildGitHubRepositoryInventory(repoUrl: string): Promise<RepositoryInventory> {
  const cleanUrl = repoUrl.trim().replace(/\.git$/, '').replace(/\/$/, '');
  const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    throw new Error('Invalid GitHub URL format. Please provide: https://github.com/owner/repository');
  }

  const [, owner, repo] = match;
  let treeData: any = null;
  let resolvedBranch = 'main';
  let commitSha: string | undefined;

  const reqHeaders: Record<string, string> = {
    'User-Agent': 'System-Design-Playground',
    Accept: 'application/vnd.github.v3+json',
  };
  const githubToken = process.env.GITHUB_TOKEN?.trim();
  if (githubToken) {
    reqHeaders['Authorization'] = `Bearer ${githubToken}`;
  }

  // 1. Fetch repo metadata (default branch)
  try {
    const metaResp = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: reqHeaders,
    });
    if (metaResp.ok) {
      const meta: any = await metaResp.json();
      if (meta.default_branch) {
        resolvedBranch = meta.default_branch;
      }
    }
  } catch {
    // fallback to main
  }

  // 2. Fetch recursive tree
  const branchCandidates = [resolvedBranch, 'main', 'master', 'develop'];
  for (const b of branchCandidates) {
    try {
      const resp = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${b}?recursive=1`,
        {
          headers: reqHeaders,
        }
      );
      if (resp.ok) {
        treeData = await resp.json();
        commitSha = treeData.sha;
        resolvedBranch = b;
        break;
      }
    } catch {
      // ignore
    }
  }

  const analyzedFiles: string[] = [];
  const skippedFiles: string[] = [];
  const items: InventoryItem[] = [];

  if (!treeData || !Array.isArray(treeData.tree)) {
    return {
      repoName: repo,
      defaultBranch: resolvedBranch,
      frameworks: [],
      analyzedFiles: [],
      skippedFiles: [],
      items: [],
      connections: [],
    };
  }

  const allPaths: string[] = treeData.tree.map((t: any) => t.path);

  // 3. Fetch README summary if present
  let readmeSummary: string | undefined;
  const readmePath = allPaths.find((p) => /readme\.md$/i.test(p));
  if (readmePath) {
    try {
      const readmeResp = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${resolvedBranch}/${readmePath}`
      );
      if (readmeResp.ok) {
        const text = await readmeResp.text();
        readmeSummary = text.slice(0, 800);
        analyzedFiles.push(readmePath);
      }
    } catch {
      // ignore
    }
  }

  // 4. Group paths into candidate directories
  // Filter out noisy paths
  const cleanPaths = allPaths.filter(
    (p) =>
      !p.includes('node_modules/') &&
      !p.includes('.git/') &&
      !p.includes('dist/') &&
      !p.includes('build/') &&
      !p.includes('.next/') &&
      !p.includes('coverage/')
  );

  const discoveredFolders = new Set<string>();

  // Check common monorepo patterns and subdirectories
  for (const p of cleanPaths) {
    const parts = p.split('/');
    // backend/gateway, backend/services/auth, backend/services/chat, backend/shared/redis
    if (parts.length >= 3 && (parts[0] === 'backend' || parts[0] === 'server')) {
      if (['services', 'apps', 'packages', 'shared'].includes(parts[1])) {
        discoveredFolders.add(`${parts[0]}/${parts[1]}/${parts[2]}`);
      } else {
        discoveredFolders.add(`${parts[0]}/${parts[1]}`);
      }
    } else if (parts.length >= 2 && ['services', 'apps', 'packages', 'microservices'].includes(parts[0])) {
      discoveredFolders.add(`${parts[0]}/${parts[1]}`);
    } else if (parts.length >= 2 && ['frontend', 'client', 'web', 'ui'].includes(parts[0])) {
      discoveredFolders.add(parts[0]);
    } else if (parts.length > 1) {
      const topDir = parts[0];
      if (!topDir.startsWith('.')) {
        discoveredFolders.add(topDir);
      }
    }
  }

  // If subfolders under backend/services exist, also ensure backend itself isn't treated as a single monolith
  const hasSubServices = Array.from(discoveredFolders).some(
    (f) => f.startsWith('backend/') || f.startsWith('services/')
  );
  if (hasSubServices && discoveredFolders.has('backend')) {
    discoveredFolders.delete('backend');
  }

  for (const folder of discoveredFolders) {
    const folderName = path.basename(folder);
    const lower = folderName.toLowerCase();
    const folderLower = folder.toLowerCase();

    const folderFiles = cleanPaths.filter((p) => p.startsWith(folder + '/'));
    analyzedFiles.push(...folderFiles.slice(0, 15));

    // Check server indicators in paths
    const hasServer =
      folderFiles.some(
        (f) =>
          f.endsWith('server.ts') ||
          f.endsWith('server.js') ||
          f.endsWith('main.ts') ||
          f.endsWith('main.go') ||
          f.endsWith('app.ts') ||
          f.endsWith('app.js') ||
          f.endsWith('index.js') ||
          f.endsWith('index.ts') ||
          f.includes('router') ||
          f.includes('controller')
      ) && !folderLower.includes('shared');

    const hasWorker = folderFiles.some(
      (f) => f.includes('worker') || f.includes('queue') || f.includes('job') || f.includes('consumer')
    );

    const hasFrontend = folderFiles.some(
      (f) =>
        f.includes('index.html') ||
        f.includes('vite.config') ||
        f.includes('next.config') ||
        f.endsWith('App.tsx') ||
        f.endsWith('App.jsx') ||
        f.includes('components/') ||
        f.includes('pages/')
    );

    const isSharedLib =
      folderLower.includes('shared') ||
      folderLower.includes('types') ||
      folderLower.includes('common') ||
      lower.includes('utils') ||
      lower.includes('logger') ||
      lower === 'tests' ||
      lower === 'test';

    let classification: InventoryItem['classification'] = 'unknown';
    let isRuntimeService = false;
    let confidence = 0.7;
    let reason = `Directory "${folder}" discovered in repository tree.`;

    if (folderLower.includes('redis')) {
      classification = 'cache';
      isRuntimeService = true;
      confidence = 0.95;
      reason = `Discovered session cache / Redis store configuration in "${folder}".`;
    } else if (folderLower.includes('gateway')) {
      classification = 'backend_service';
      isRuntimeService = true;
      confidence = 0.95;
      reason = `Discovered API gateway and request routing controllers in "${folder}".`;
    } else if (isSharedLib && !hasServer && !hasWorker) {
      classification = 'shared_library';
      isRuntimeService = false;
      confidence = 0.95;
      reason = `Folder "${folder}" contains shared utilities or libraries rather than an independent server process.`;
    } else if (hasServer) {
      classification = 'backend_service';
      isRuntimeService = true;
      confidence = 0.92;
      reason = `Discovered service bootstrap files and controllers in "${folder}".`;
    } else if (hasWorker) {
      classification = 'worker';
      isRuntimeService = true;
      confidence = 0.88;
      reason = `Discovered background agent/worker queue consumers in "${folder}".`;
    } else if (hasFrontend) {
      classification = 'frontend_app';
      isRuntimeService = true;
      confidence = 0.92;
      reason = `Discovered interactive frontend web client in "${folder}".`;
    }

    const detectedDbs: string[] = [];
    if (folderFiles.some((f) => f.includes('redis'))) detectedDbs.push('Redis');
    if (folderFiles.some((f) => f.includes('mongo') || f.includes('db.js') || f.includes('model'))) detectedDbs.push('MongoDB');
    if (folderFiles.some((f) => f.includes('postgres') || f.includes('prisma'))) detectedDbs.push('PostgreSQL');

    items.push({
      path: folder,
      name: folderName,
      hasServerBootstrap: hasServer,
      hasWorkerBootstrap: hasWorker,
      hasFrontendBootstrap: hasFrontend,
      entryFiles: folderFiles.slice(0, 3),
      dockerfiles: folderFiles.filter((f) => f.toLowerCase().includes('dockerfile')),
      dockerComposeServices: [],
      routes: folderFiles.filter((f) => f.includes('route') || f.includes('controller')),
      clients: {
        databases: detectedDbs,
        queues: folderFiles.some((f) => f.includes('kafka') || f.includes('rabbit') || f.includes('sqs')) ? ['Kafka'] : [],
        httpTargets: [],
      },
      classification,
      evidence: {
        entryPoint: folderFiles.find((f) => f.endsWith('index.js') || f.endsWith('index.ts') || f.endsWith('server.js') || f.endsWith('App.jsx') || f.endsWith('Home.jsx')) || folderFiles[0],
        sourceFiles: folderFiles.slice(0, 8),
        confidence,
        reason,
        isRuntimeService,
      },
    });
  }

  return {
    repoName: repo,
    defaultBranch: resolvedBranch,
    commitSha,
    readmeSummary,
    frameworks: [],
    analyzedFiles,
    skippedFiles,
    items,
    connections: [],
  };
}
