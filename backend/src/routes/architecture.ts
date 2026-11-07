import { Router, Request, Response, NextFunction } from 'express';
import { getArchitectureFixture, getDetailedArchitectureFixture } from '../fixtures/loader.js';
import { generateSystemDesignReport } from '../services/aiSystemDesignArchitect.js';

const router = Router();

router.post('/design-report', async (req: Request, res: Response, next: NextFunction) => {
  try {
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

