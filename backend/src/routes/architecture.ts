import { Router, Request, Response, NextFunction } from 'express';
import { getArchitectureFixture, getDetailedArchitectureFixture } from '../fixtures/loader.js';

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const mode = req.query.mode === 'detailed' ? 'detailed' : 'basic';
    const basicArch = getArchitectureFixture();
    const detailedArch = getDetailedArchitectureFixture();

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

