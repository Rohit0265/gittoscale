import crypto from 'node:crypto';
import { Router, Request, Response } from 'express';
import { recommenderInputSchema } from '../services/recommenderTypes.js';
import { recommendArchitecture } from '../services/architectureRecommender.js';
import { generateSystemDesignReport } from '../services/aiSystemDesignArchitect.js';
import { resolveUserFromRequest } from '../middleware/auth.js';
import { checkAndIncrementAiUsage } from '../services/subscriptionService.js';

const router = Router();

function getClientIdentifier(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || 'guest';
  return 'anon_' + crypto.createHash('md5').update(ip).digest('hex').substring(0, 16);
}

// Endpoint for AI System Design Architect 7-Phase Report
router.post('/design-report', async (req: Request, res: Response) => {
  try {
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

    const report = await generateSystemDesignReport(req.body);
    return res.json(report);
  } catch (err: any) {
    console.error('[AI System Design Architect Error]', err);
    return res.status(500).json({
      error: 'System Design Generation Failed',
      message: err.message || 'Failed to generate system design report.',
    });
  }
});

// In-memory cache for fast repeated prompts
const recommendationCache = new Map<string, any>();

router.post('/', async (req: Request, res: Response) => {
  try {
    const parseResult = recommenderInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request payload for architecture recommendation.',
        details: parseResult.error.format(),
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
