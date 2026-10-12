import { Router, Request, Response, NextFunction } from 'express';
import { simulationInputSchema } from '../simulation/validation.js';
import { runSimulation, SimulationError } from '../simulation/engine.js';
import { getArchitectureFixture } from '../fixtures/loader.js';

const router = Router();

router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    let body = req.body;

    // If nodes/edges are not provided, fall back to architecture fixture
    if (!body.nodes || !body.edges) {
      const defaultArch = getArchitectureFixture();
      body = {
        ...body,
        nodes: body.nodes || defaultArch.nodes,
        edges: body.edges || defaultArch.edges,
      };
    }

    const parseResult = simulationInputSchema.safeParse(body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid simulation input parameters.',
        details: parseResult.error.format(),
      });
    }

    const input = parseResult.data;
    const result = runSimulation({
      nodes: input.nodes,
      edges: input.edges,
      incomingTrafficRate: input.incomingTrafficRate,
      durationSeconds: input.durationSeconds,
      scenarioId: input.scenarioId,
    });

    return res.json(result);
  } catch (err) {
    if (err instanceof SimulationError) {
      return res.status(400).json({
        error: 'Simulation Error',
        code: err.code,
        message: err.message,
      });
    }
    next(err);
  }
});

export default router;

