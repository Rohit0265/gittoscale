import { Router, Request, Response, NextFunction } from 'express';
import { getArchitectureFixture } from '../fixtures/loader.js';

const router = Router();

router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const arch = getArchitectureFixture();
    res.json(arch);
  } catch (err) {
    next(err);
  }
});

export default router;
