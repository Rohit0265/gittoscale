import { Router, Request, Response } from 'express';

const router = Router();

// In-memory mock session storage (no DB connected)
const mockUsers: Array<{ id: string; email: string; name: string; createdAt: string }> = [
  {
    id: 'usr_demo',
    email: 'demo@gittoscale.tech',
    name: 'GitToScale Engineer',
    createdAt: new Date().toISOString(),
  },
];

/**
 * POST /api/auth/login
 * Mock user authentication without database connection
 */
router.post('/login', (req: Request, res: Response) => {
  const { email } = req.body || {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid email address.',
    });
  }

  // Find or create in-memory mock user
  let user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    user = {
      id: `usr_${Math.random().toString(36).substring(2, 9)}`,
      email: email.trim().toLowerCase(),
      name: email.split('@')[0],
      createdAt: new Date().toISOString(),
    };
    mockUsers.push(user);
  }

  const mockToken = `mock_jwt_${Buffer.from(JSON.stringify({ id: user.id, email: user.email })).toString('base64')}`;

  return res.json({
    success: true,
    message: 'Signed in successfully (mock session).',
    token: mockToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
});

/**
 * POST /api/auth/signup
 * Mock user registration without database connection
 */
router.post('/signup', (req: Request, res: Response) => {
  const { name, email } = req.body || {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid email address.',
    });
  }

  const cleanName = (typeof name === 'string' && name.trim()) || email.split('@')[0];

  const user = {
    id: `usr_${Math.random().toString(36).substring(2, 9)}`,
    email: email.trim().toLowerCase(),
    name: cleanName,
    createdAt: new Date().toISOString(),
  };

  mockUsers.push(user);

  const mockToken = `mock_jwt_${Buffer.from(JSON.stringify({ id: user.id, email: user.email })).toString('base64')}`;

  return res.status(201).json({
    success: true,
    message: 'Account created successfully (mock session).',
    token: mockToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
});

/**
 * GET /api/auth/me
 * Returns mock authenticated user state
 */
router.get('/me', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    authenticated: true,
    user: mockUsers[0],
  });
});

export default router;

