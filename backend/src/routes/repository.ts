import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { buildStaticRepositoryInventory } from '../services/staticScanner.js';
import { analyzeArchitectureWithLLM } from '../services/architectureAnalyzer.js';
import { convertAnalysisToArchitecture } from '../services/diagramGenerator.js';
import { validateGraphAcyclic } from '../simulation/validation.js';

const router = Router();

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

router.post('/analyze', async (req: Request, res: Response, next: NextFunction) => {
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

    const ANALYZER_VERSION = 'v3.2';

    // 1. Build Static Inventory (either local directory or GitHub repository tree)
    let inventory;
    if (repoUrl) {
      const { buildGitHubRepositoryInventory } = await import('../services/githubScanner.js');
      inventory = await buildGitHubRepositoryInventory(repoUrl, githubToken);
    } else {
      const targetPath = localPath || process.cwd();
      inventory = buildStaticRepositoryInventory(targetPath);
    }

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

    // 2. Perform Architecture Analysis for both Basic and Detailed views
    const basicAnalysis = await analyzeArchitectureWithLLM(inventory, llmConfig, 'basic');
    const basicArch = convertAnalysisToArchitecture(basicAnalysis);
    const basicEdges = sanitizeAcyclicEdges(basicArch.nodes, basicArch.edges);

    const detailedAnalysis = await analyzeArchitectureWithLLM(inventory, llmConfig, 'detailed');
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

export default router;
