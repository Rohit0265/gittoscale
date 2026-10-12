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
  llmConfig: z
    .object({
      provider: z.string().optional(),
      apiKey: z.string().optional(),
      model: z.string().optional(),
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

    const { localPath, repoUrl, llmConfig } = parseResult.data;

    if (!localPath && !repoUrl) {
      return res.status(400).json({
        error: 'Missing Input',
        message: 'Please provide either a localPath or repoUrl.',
      });
    }

    const cacheKey = `${localPath || repoUrl}-${llmConfig?.provider || 'default'}`;
    if (analysisCache.has(cacheKey)) {
      return res.json(analysisCache.get(cacheKey));
    }

    // 1. Build Static Inventory
    const targetPath = localPath || process.cwd();
    const inventory = buildStaticRepositoryInventory(targetPath);

    // 2. Perform Architecture Analysis (LLM / Hybrid)
    const analysis = await analyzeArchitectureWithLLM(inventory, llmConfig);

    // 3. Generate React Flow Diagram
    const { nodes, edges } = convertAnalysisToArchitecture(analysis);

    // 4. Validate graph acyclic property
    const cycleCheck = validateGraphAcyclic(nodes, edges);
    if (cycleCheck.hasCycle) {
      console.warn('[Repository Analysis] Detected cycle in generated edges. Disabling cycle edges.');
    }

    const result = {
      repoName: inventory.repoName,
      inventory,
      analysis,
      nodes,
      edges,
      detectedServices: nodes.filter((n) => n.type !== 'load_generator').map((n) => n.name),
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

// Endpoint to test LLM Connection
router.post('/test-llm', async (req: Request, res: Response) => {
  const { provider, apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ success: false, message: 'API key is required.' });
  }

  // Verify connection
  try {
    if (provider === 'openai') {
      const resp = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (resp.ok) {
        return res.json({ success: true, message: 'Successfully connected to OpenAI API!' });
      } else {
        return res.status(400).json({ success: false, message: `OpenAI returned status ${resp.status}` });
      }
    }

    return res.json({ success: true, message: `Configuration verified for ${provider || 'provider'}.` });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message || 'Connection test failed.' });
  }
});

export default router;
