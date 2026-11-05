import { Router, Request, Response } from 'express';
import { sendSignupTelegramNotification } from '../services/telegramService.js';
import { isNeonConfigured, upsertUserProfile, getUserProfile, getUserProfileByEmail } from '../services/neon.js';

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

  // Send Telegram alert for new mock user signup
  sendSignupTelegramNotification({
    name: user.name,
    email: user.email,
    userId: user.id,
    provider: 'Mock / Dev',
    createdAt: user.createdAt,
  }).catch((err) => {
    console.warn('[Auth Route] Failed to send Telegram notification:', err);
  });

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
 * POST /api/auth/notify-signup
 * Dispatches a Telegram notification when a user signs up via Supabase (OAuth or Email/Password)
 */
router.post('/notify-signup', async (req: Request, res: Response) => {
  const { name, email, userId, avatarUrl, provider, createdAt } = req.body || {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      error: 'Valid email is required',
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = (typeof name === 'string' && name.trim()) || cleanEmail.split('@')[0];
  const effectiveUserId = (typeof userId === 'string' && userId.trim()) || `usr_${Date.now().toString(36)}`;

  // 1. Persist user in PostgreSQL (Neon) database
  if (isNeonConfigured()) {
    try {
      await upsertUserProfile({
        id: effectiveUserId,
        full_name: cleanName,
        email: cleanEmail,
        avatar_url: typeof avatarUrl === 'string' ? avatarUrl : null,
      });
      console.log('[Auth Route] Stored user profile in Neon database:', cleanEmail);
    } catch (dbErr) {
      console.error('[Auth Route] Failed to save user profile to Neon:', dbErr);
    }
  }

  try {
    sendSignupTelegramNotification({
      name: cleanName,
      email: cleanEmail,
      userId: effectiveUserId,
      provider: typeof provider === 'string' ? provider : undefined,
      createdAt: typeof createdAt === 'string' ? createdAt : new Date().toISOString(),
    }).catch((err) => {
      console.warn('[Auth Route] Telegram signup alert error:', err);
    });

    return res.json({
      success: true,
      message: 'Signup stored and notification dispatched.',
      user: {
        id: effectiveUserId,
        name: cleanName,
        email: cleanEmail,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to dispatch notification',
    });
  }
});

/**
 * POST /api/auth/sync-profile
 * Saves or updates authenticated user profile in PostgreSQL (Neon)
 */
router.post('/sync-profile', async (req: Request, res: Response) => {
  const { id, email, fullName, avatarUrl } = req.body || {};

  if (!id || !email) {
    return res.status(400).json({ success: false, error: 'id and email are required' });
  }

  if (isNeonConfigured()) {
    try {
      const profile = await upsertUserProfile({
        id: String(id),
        full_name: fullName,
        email: String(email).trim().toLowerCase(),
        avatar_url: avatarUrl || null,
      });
      return res.json({ success: true, profile });
    } catch (err: any) {
      console.error('[Auth Route] Error syncing user profile:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.json({ success: true, message: 'Database not configured, skipped' });
});

/**
 * GET /api/auth/profile/:id
 * Fetches user profile from database
 */
router.get('/profile/:id', async (req: Request, res: Response) => {
  const userId = req.params.id;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId is required' });
  }

  if (isNeonConfigured()) {
    try {
      const profile = await getUserProfile(userId);
      if (profile) {
        return res.json({ success: true, profile });
      }
      return res.status(404).json({ success: false, error: 'Profile not found' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(404).json({ success: false, error: 'Profile not found' });
});

/**
 * POST /api/auth/logout
 * Clears session and authentication cookies
 */
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('sb-access-token', { path: '/' });
  res.clearCookie('sb-refresh-token', { path: '/' });
  res.clearCookie('session', { path: '/' });
  res.clearCookie('token', { path: '/' });
  return res.json({
    success: true,
    message: 'Logged out and session cookies cleared.',
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

