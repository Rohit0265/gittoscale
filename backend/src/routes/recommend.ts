import { Router, Request, Response, NextFunction } from 'express';
import { recommenderInputSchema } from '../services/recommenderTypes.js';
import { recommendArchitecture } from '../services/architectureRecommender.js';

const router = Router();

// In-memory cache for fast repeated prompts
const recommendationCache = new Map<string, any>();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = recommenderInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request payload for architecture recommendation.',
        details: parseResult.error.format(),
      });
    }

    const input = parseResult.data;
    const cacheKey = JSON.stringify({
      desc: input.projectDescription.trim(),
      scale: input.expectedScale || '',
      budget: input.budgetConstraint || '',
      tech: input.preferredTech || [],
      deploy: input.deploymentPreference || '',
      refine: input.refinementRequest || '',
      provider: input.llmConfig?.provider || 'default',
    });

    if (recommendationCache.has(cacheKey)) {
      return res.json(recommendationCache.get(cacheKey));
    }

    const recommendation = await recommendArchitecture(input);

    // Cache the successful result (limit cache size to 50 items)
    if (recommendationCache.size > 50) {
      const firstKey = recommendationCache.keys().next().value;
      if (firstKey) recommendationCache.delete(firstKey);
    }
    recommendationCache.set(cacheKey, recommendation);

    return res.json(recommendation);
  } catch (err: any) {
    console.error('[Architecture Recommender Error]', err);
    return res.status(500).json({
      error: 'Architecture Recommendation Failed',
      message: err.message || 'Failed to generate architecture recommendation.',
    });
  }
});

export default router;

