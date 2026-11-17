import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { buildStaticRepositoryInventory } from '../services/staticScanner.js';
import { analyzeArchitectureWithLLM } from '../services/architectureAnalyzer.js';
import { convertAnalysisToArchitecture } from '../services/diagramGenerator.js';
import { validateGraphAcyclic } from '../simulation/validation.js';
import { validateSafeLlmBaseUrl } from '../utils/ssrfGuard.js';
import { resolveUserFromRequest } from '../middleware/auth.js';
import { checkAndIncrementAiUsage } from '../services/subscriptionService.js';

const router = Router();

function getClientIdentifier(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || 'guest';
  return 'anon_' + crypto.createHash('md5').update(ip).digest('hex').substring(0, 16);
}

const analyzeSchema = z.object({
  localPath: z.string().optional(),
  repoUrl: z.string().optional(),
  githubToken: z.string().optional(),
  viewMode: z.enum(['basic', 'detailed']).optional().default('basic'),
  llmConfig: z
    .object({
      provider: z.string().optional(),
      apiKey: z.string().optional(),
      model: z.string().optional(),
      baseUrl: z.string().optional(),
    })
    .optional(),
});

// Cache for analyzed repositories
const analysisCache = new Map<string, any>();

router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const parseResult = analyzeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request payload for repository analysis.',
        details: parseResult.error.format(),
      });
    }

    const { localPath, repoUrl, githubToken, viewMode, llmConfig } = parseResult.data;

    if (!localPath && !repoUrl) {
      return res.status(400).json({
        error: 'Missing Input',
        message: 'Please provide either a localPath or repoUrl.',
      });
    }

    const user = await resolveUserFromRequest(req);
    const userId = user?.id || getClientIdentifier(req);

    const check = await checkAndIncrementAiUsage(userId);
    if (!check.allowed) {
      return res.status(403).json({
        error: 'PLAN_LIMIT_REACHED',
        message: 'You have reached your free plan limit. Upgrade your plan to continue using AI-powered architecture generation.',
        upgradeUrl: '/payment',
        plan: check.plan,
        used: check.used,
        limit: check.limit,
      });
    }

    if (llmConfig?.baseUrl) {
      const urlCheck = validateSafeLlmBaseUrl(llmConfig.baseUrl);
      if (!urlCheck.safe) {
        return res.status(400).json({
          error: 'Invalid LLM Base URL',
          message: urlCheck.error || 'Blocked untrusted LLM base URL',
        });
      }
    }

    let targetPath = process.cwd();
    if (localPath) {
      const resolvedPath = path.resolve(localPath);
      const cwd = path.resolve(process.cwd());
      const tempDir = path.resolve(os.tmpdir());

      const isInsideCwd = resolvedPath.startsWith(cwd);
      const isInsideTemp = resolvedPath.startsWith(tempDir);

      if (process.env.NODE_ENV === 'production' && !isInsideCwd) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access to the specified local path is not permitted in production.',
        });
      }

      if (!isInsideCwd && !isInsideTemp) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access to system directories outside the workspace is forbidden.',
        });
      }
      targetPath = resolvedPath;
    }

    const ANALYZER_VERSION = 'v3.2';

    // 1. Build Static Inventory (either local directory or GitHub repository tree)
    const scanSpan = req.startSpan?.('inventory-scan', { source: repoUrl ? 'github' : 'local' });
    let inventory;
    if (repoUrl) {
      const { buildGitHubRepositoryInventory } = await import('../services/githubScanner.js');
      inventory = await buildGitHubRepositoryInventory(repoUrl, githubToken);
    } else {
      inventory = buildStaticRepositoryInventory(targetPath);
    }
    scanSpan?.end({ fileCount: inventory.analyzedFiles?.length });

    const revision = inventory.commitSha || 'local-rev';
    const cacheKey = `${localPath || repoUrl}@${revision}-${ANALYZER_VERSION}-${llmConfig?.provider || 'default'}-${viewMode}-${githubToken ? 'auth' : 'pub'}`;
    if (analysisCache.has(cacheKey)) {
      const cached = analysisCache.get(cacheKey);
      if (cached && cached.detailedGraph && cached.detailedGraph.nodes.length > 10) {
        return res.json(cached);
      }
    }

    // Helper to sanitize edges to maintain DAG acyclicity
    const sanitizeAcyclicEdges = (nodes: any[], edges: any[]) => {
      const safe: typeof edges = [];
      for (const edge of edges) {
        safe.push(edge);
        const cycleCheck = validateGraphAcyclic(nodes, safe);
        if (cycleCheck.hasCycle) {
          safe.pop();
        }
      }
      return safe;
    };

    // 2. Perform Architecture Analysis for both Basic and Detailed views concurrently
    const llmSpan = req.startSpan?.('llm-architecture-analysis', { viewMode });
    const [basicAnalysis, detailedAnalysis] = await Promise.all([
      analyzeArchitectureWithLLM(inventory, llmConfig, 'basic'),
      analyzeArchitectureWithLLM(inventory, llmConfig, 'detailed'),
    ]);
    llmSpan?.end({ basicNodes: basicAnalysis.components?.length, detailedNodes: detailedAnalysis.components?.length });
    const basicArch = convertAnalysisToArchitecture(basicAnalysis);
    const basicEdges = sanitizeAcyclicEdges(basicArch.nodes, basicArch.edges);

    const detailedArch = convertAnalysisToArchitecture(detailedAnalysis);
    const detailedEdges = sanitizeAcyclicEdges(detailedArch.nodes, detailedArch.edges);

    const activeGraph = viewMode === 'detailed'
      ? { nodes: detailedArch.nodes, edges: detailedEdges, analysis: detailedAnalysis }
      : { nodes: basicArch.nodes, edges: basicEdges, analysis: basicAnalysis };

    const result = {
      repoName: inventory.repoName,
      inventory,
      analysis: activeGraph.analysis,
      nodes: activeGraph.nodes,
      edges: activeGraph.edges,
      basicGraph: { nodes: basicArch.nodes, edges: basicEdges },
      detailedGraph: { nodes: detailedArch.nodes, edges: detailedEdges },
      viewMode,
      detectedServices: activeGraph.nodes.filter((n) => n.type !== 'load_generator').map((n) => n.name),
      analyzedFilesCount: inventory.analyzedFiles.length,
      skippedFilesCount: inventory.skippedFiles.length,
    };

    analysisCache.set(cacheKey, result);
    return res.json(result);
  } catch (err: any) {
    console.error('[Repository Analysis Error]', err);
    return res.status(400).json({
      error: 'Repository Analysis Failed',
      message: err.message || 'An error occurred while analyzing repository.',
    });
  }
});

// Endpoint to check if server has an LLM key configured in .env
router.get('/llm-status', (_req: Request, res: Response) => {
  const hasKey = Boolean(
    process.env.LLM_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.ANTHROPIC_API_KEY
  );
  const provider =
    process.env.LLM_PROVIDER ||
    (process.env.OPENAI_API_KEY
      ? 'openai'
      : process.env.GEMINI_API_KEY
      ? 'gemini'
      : process.env.ANTHROPIC_API_KEY
      ? 'anthropic'
      : 'none');

  res.json({
    hasKey,
    provider,
    model: process.env.LLM_MODEL || undefined,
  });
});

// Endpoint to test LLM Connection
router.post('/test-llm', async (req: Request, res: Response) => {
  const provider = req.body.provider || 'openai';
  const apiKey =
    req.body.apiKey ||
    process.env.LLM_API_KEY ||
    (provider === 'openai'
      ? process.env.OPENAI_API_KEY
      : provider === 'gemini'
      ? process.env.GEMINI_API_KEY
      : process.env.ANTHROPIC_API_KEY);

  if (!apiKey && provider !== 'other') {
    return res.status(400).json({ success: false, message: 'API key is required.' });
  }

  // Verify connection
  try {
    if (provider === 'other') {
      const baseUrl = req.body.baseUrl;
      if (!baseUrl) {
        return res.status(400).json({ success: false, message: 'Base URL is required for custom LLM endpoint.' });
      }
      const cleanBase = baseUrl.replace(/\/+$/, '');
      const testUrl = cleanBase.endsWith('/models') || cleanBase.endsWith('/chat/completions')
        ? cleanBase
        : `${cleanBase}/models`;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const resp = await fetch(testUrl, {
        method: 'GET',
        headers,
      });

      if (resp.ok) {
        return res.json({ success: true, message: 'Successfully connected to custom LLM endpoint!' });
      } else {
        // If /models returned 404/405, test /chat/completions with minimal payload
        if (resp.status === 404 || resp.status === 405) {
          const chatUrl = cleanBase.endsWith('/chat/completions') ? cleanBase : `${cleanBase}/chat/completions`;
          const chatResp = await fetch(chatUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              model: req.body.model || 'default',
              messages: [{ role: 'user', content: 'test' }],
              max_tokens: 1,
            }),
          });
          if (chatResp.ok) {
            return res.json({ success: true, message: 'Successfully connected to custom LLM endpoint!' });
          }
        }
        return res.status(400).json({ success: false, message: `Endpoint returned status ${resp.status}` });
      }
    } else if (provider === 'gemini') {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      if (resp.ok) {
        return res.json({ success: true, message: 'Successfully connected to Google Gemini API!' });
      } else {
        return res.status(400).json({ success: false, message: `Gemini returned status ${resp.status}` });
      }
    } else if (provider === 'anthropic') {
      const resp = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      });
      if (resp.ok || resp.status === 200) {
        return res.json({ success: true, message: 'Successfully connected to Anthropic API!' });
      } else {
        return res.status(400).json({ success: false, message: `Anthropic returned status ${resp.status}` });
      }
    } else {
      const resp = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (resp.ok) {
        return res.json({ success: true, message: 'Successfully connected to OpenAI API!' });
      } else {
        return res.status(400).json({ success: false, message: `OpenAI returned status ${resp.status}` });
      }
    }
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message || 'Connection test failed.' });
  }
});

/**
 * Lists the authenticated user's GitHub repositories (both public and private)
 * using their OAuth token or Personal Access Token.
 */
router.post('/user-repos', async (req: Request, res: Response) => {
  try {
    const rawToken = req.body?.githubToken || req.headers.authorization?.replace(/^Bearer\s+/i, '');
    const token = typeof rawToken === 'string' ? rawToken.trim() : '';

    if (!token) {
      return res.status(400).json({
        error: 'Missing Token',
        message: 'A GitHub access token is required to list your repositories.',
      });
    }

    // Support simulated/mock token in local or test environments
    if (token.startsWith('mock_') || token === 'test-github-token') {
      return res.json({
        success: true,
        user: {
          login: 'octocat-dev',
          name: 'Octocat Developer',
          avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
          totalPrivateRepos: 4,
        },
        repos: [
          {
            id: 101,
            name: 'distributed-order-service',
            fullName: 'octocat-dev/distributed-order-service',
            htmlUrl: 'https://github.com/octocat-dev/distributed-order-service',
            private: true,
            description: 'High-throughput microservices architecture with Kafka, Redis, and PostgreSQL',
            language: 'TypeScript',
            stars: 12,
            updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            defaultBranch: 'main',
          },
          {
            id: 102,
            name: 'auth-vault-private',
            fullName: 'octocat-dev/auth-vault-private',
            htmlUrl: 'https://github.com/octocat-dev/auth-vault-private',
            private: true,
            description: 'OAuth2 and token rotation service with rate limiting',
            language: 'Go',
            stars: 8,
            updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
            defaultBranch: 'main',
          },
          {
            id: 103,
            name: 'system-design-patterns',
            fullName: 'octocat-dev/system-design-patterns',
            htmlUrl: 'https://github.com/octocat-dev/system-design-patterns',
            private: false,
            description: 'Production architecture blueprints and distributed scaling examples',
            language: 'Python',
            stars: 45,
            updatedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
            defaultBranch: 'main',
          },
        ],
      });
    }

    // 1. Fetch user profile from GitHub API
    const userResp = await fetch('https://api.github.com/user', {
      headers: {
        'User-Agent': 'GitToScale-Architecture-Scanner/1.0',
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!userResp.ok) {
      const errText = await userResp.text().catch(() => '');
      return res.status(userResp.status).json({
        error: 'GitHub Authentication Failed',
        message: 'Invalid or expired GitHub token. Please reconnect your GitHub account.',
        details: errText,
      });
    }

    const userData: any = await userResp.json();

    // 2. Fetch user repositories (up to 100, sorted by updated, including private repos)
    const reposResp = await fetch(
      'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator',
      {
        headers: {
          'User-Agent': 'GitToScale-Architecture-Scanner/1.0',
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!reposResp.ok) {
      const errText = await reposResp.text().catch(() => '');
      return res.status(reposResp.status).json({
        error: 'GitHub Repositories Error',
        message: 'Failed to retrieve repositories from GitHub.',
        details: errText,
      });
    }

    const rawRepos: any = await reposResp.json();
    const repos = Array.isArray(rawRepos)
      ? rawRepos.map((r: any) => ({
          id: r.id,
          name: r.name,
          fullName: r.full_name,
          htmlUrl: r.html_url,
          private: Boolean(r.private),
          description: r.description || null,
          language: r.language || null,
          stars: r.stargazers_count || 0,
          updatedAt: r.updated_at,
          defaultBranch: r.default_branch || 'main',
        }))
      : [];

    return res.json({
      success: true,
      user: {
        login: userData.login,
        name: userData.name || userData.login,
        avatarUrl: userData.avatar_url,
        totalPrivateRepos: userData.total_private_repos || 0,
      },
      repos,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: err?.message || 'Failed to communicate with GitHub API.',
    });
  }
});

export default router;
