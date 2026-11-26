import crypto from 'node:crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { getArchitectureFixture, getDetailedArchitectureFixture } from '../fixtures/loader.js';
import { generateSystemDesignReport } from '../services/aiSystemDesignArchitect.js';
import { resolveUserFromRequest } from '../middleware/auth.js';
import { checkAndIncrementAiUsage } from '../services/subscriptionService.js';

const router = Router();

router.post('/design-report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await resolveUserFromRequest(req);
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || 'guest';
    const userId = user?.id || 'anon_' + crypto.createHash('md5').update(ip).digest('hex').substring(0, 16);

    const usageCheck = await checkAndIncrementAiUsage(userId);
    if (!usageCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: usageCheck.error || 'Free plan AI generation limit reached.',
        requiresUpgrade: true,
      });
    }

    const report = await generateSystemDesignReport(req.body);
    return res.json(report);
  } catch (err: any) {
    next(err);
  }
});

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const mode = req.query.mode === 'detailed' ? 'detailed' : 'basic';
    const basicArch = getArchitectureFixture(true);
    const detailedArch = getDetailedArchitectureFixture(true);

    if (mode === 'detailed') {
      res.json({
        ...detailedArch,
        basicGraph: basicArch,
        detailedGraph: detailedArch,
      });
    } else {
      res.json({
        ...basicArch,
        basicGraph: basicArch,
        detailedGraph: detailedArch,
      });
    }
  } catch (err) {
    next(err);
  }
});

export default router;

