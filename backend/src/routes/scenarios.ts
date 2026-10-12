import { Router, Request, Response, NextFunction } from 'express';
import { getScenariosFixture } from '../fixtures/loader.js';

const router = Router();

router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const scenarios = getScenariosFixture();
    res.json(scenarios);
  } catch (err) {
    next(err);
  }
});

export default router;

