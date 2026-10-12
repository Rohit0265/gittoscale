import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { scanLocalRepository, scanGitHubRepository } from '../services/repoScanner.js';

const router = Router();

const repoAnalyzeSchema = z.object({
  repoUrl: z.string().optional(),
  localPath: z.string().optional(),
});

router.post('/analyze', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = repoAnalyzeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid repository parameters.',
        details: parseResult.error.format(),
      });
    }

    const { repoUrl, localPath } = parseResult.data;

    if (!repoUrl && !localPath) {
      return res.status(400).json({
        error: 'Missing Input',
        message: 'Please provide either a GitHub repository URL or a local path.',
      });
    }

    let result;
    if (repoUrl) {
      result = await scanGitHubRepository(repoUrl);
    } else if (localPath) {
      result = await scanLocalRepository(localPath);
    }

    res.json(result);
  } catch (err: any) {
    res.status(400).json({
      error: 'Repository Analysis Failed',
      message: err.message || 'Failed to scan repository.',
    });
  }
});

export default router;
