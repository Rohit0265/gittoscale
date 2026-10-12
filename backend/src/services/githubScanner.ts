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

  // 1. Fetch repo metadata (default branch)
  try {
    const metaResp = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'User-Agent': 'System-Design-Playground',
        Accept: 'application/vnd.github.v3+json',
      },
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
          headers: {
            'User-Agent': 'System-Design-Playground',
            Accept: 'application/vnd.github.v3+json',
          },
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
  const discoveredFolders = new Set<string>();

  for (const p of allPaths) {
    const parts = p.split('/');
    if (parts.length > 1) {
      const topDir = parts[0];
      if (['services', 'apps', 'packages', 'microservices'].includes(topDir.toLowerCase()) && parts.length > 2) {
        discoveredFolders.add(`${topDir}/${parts[1]}`);
      } else if (!topDir.startsWith('.') && !['node_modules', 'dist', 'build', '.git'].includes(topDir)) {
        discoveredFolders.add(topDir);
      }
    }
  }

  for (const folder of discoveredFolders) {
    const folderName = path.basename(folder);
    const lower = folderName.toLowerCase();

    const folderFiles = allPaths.filter((p) => p.startsWith(folder + '/'));
    analyzedFiles.push(...folderFiles.slice(0, 10));

    // Check server indicators in paths
    const hasServer = folderFiles.some(
      (f) =>
        f.endsWith('server.ts') ||
        f.endsWith('server.js') ||
        f.endsWith('main.ts') ||
        f.endsWith('main.go') ||
        f.endsWith('app.ts') ||
        f.endsWith('app.js') ||
        f.includes('router') ||
        f.includes('controller')
    );

    const hasWorker = folderFiles.some(
      (f) => f.includes('worker') || f.includes('queue') || f.includes('job') || f.includes('consumer')
    );

    const hasFrontend = folderFiles.some(
      (f) => f.includes('index.html') || f.includes('vite.config') || f.includes('next.config') || f.endsWith('App.tsx')
    );

    const isSharedLib =
      lower.includes('shared') ||
      lower.includes('types') ||
      lower.includes('ui') ||
      lower.includes('components') ||
      lower.includes('utils') ||
      lower.includes('logger') ||
      lower === 'tests' ||
      lower === 'test' ||
      lower === 'fixtures';

    let classification: InventoryItem['classification'] = 'unknown';
    let isRuntimeService = false;
    let confidence = 0.6;
    let reason = `Directory "${folder}" discovered in repository.`;

    if (isSharedLib && !hasServer && !hasWorker) {
      classification = lower.includes('ui') ? 'ui_package' : lower.includes('test') ? 'test' : 'shared_library';
      isRuntimeService = false;
      confidence = 0.95;
      reason = `Folder "${folder}" contains shared packages, UI libraries or utilities rather than an independent server process.`;
    } else if (hasServer) {
      classification = 'backend_service';
      isRuntimeService = true;
      confidence = 0.9;
      reason = `Discovered executable server bootstrap files (${folderFiles.filter(f => f.includes('server') || f.includes('main')).slice(0, 2).join(', ')}).`;
    } else if (hasWorker) {
      classification = 'worker';
      isRuntimeService = true;
      confidence = 0.85;
      reason = `Discovered background worker/queue consumer files in "${folder}".`;
    } else if (hasFrontend) {
      classification = 'frontend_app';
      isRuntimeService = true;
      confidence = 0.9;
      reason = `Discovered frontend client application files in "${folder}".`;
    }

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
        databases: folderFiles.some((f) => f.includes('postgres') || f.includes('db') || f.includes('prisma')) ? ['PostgreSQL'] : [],
        queues: folderFiles.some((f) => f.includes('kafka') || f.includes('rabbit') || f.includes('sqs')) ? ['Kafka'] : [],
        httpTargets: [],
      },
      classification,
      evidence: {
        entryPoint: folderFiles[0],
        sourceFiles: folderFiles.slice(0, 5),
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
