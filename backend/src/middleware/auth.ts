import { Request, Response, NextFunction } from 'express';
import { supabaseServer, isServerSupabaseConfigured } from '../services/supabase.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  token?: string;
}

/**
 * Middleware to require a valid Supabase authentication token.
 * Validates the JWT with Supabase auth or fallback mock session when offline/mock mode.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication token is required. Please sign in.',
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  req.token = token;

  const allowMockAuth =
    process.env.NODE_ENV !== 'production' || process.env.ENABLE_MOCK_AUTH === 'true';

  // Handle mock tokens if Supabase is not configured or mock token used
  if (token.startsWith('mock_jwt_')) {
    if (!allowMockAuth) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Mock authentication tokens are disabled in production.',
      });
      return;
    }
    try {
      const payloadBase64 = token.replace('mock_jwt_', '');
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
      req.user = {
        id: payload.id || 'usr_mock',
        email: payload.email || 'mock@gittoscale.tech',
        fullName: payload.name || payload.email?.split('@')[0] || 'GitToScale User',
        avatarUrl: payload.avatar_url || payload.picture || payload.avatar || undefined,
      };
      next();
      return;
    } catch {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Malformed authentication token.',
      });
      return;
    }
  }

  if (!isServerSupabaseConfigured) {
    if (allowMockAuth) {
      req.user = {
        id: 'usr_dev_default',
        email: 'developer@gittoscale.tech',
        fullName: 'Local Developer',
        avatarUrl: undefined,
      };
      next();
      return;
    }
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid session or authentication credentials.',
    });
    return;
  }

  try {
    const { data: { user }, error } = await supabaseServer.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: error?.message || 'Invalid or expired session. Please sign in again.',
      });
      return;
    }

    const meta = user.user_metadata || {};
    const identities = (user.identities && user.identities[0]?.identity_data) || {};
    const resolvedAvatar =
      meta.avatar_url ||
      meta.picture ||
      meta.avatar ||
      identities.avatar_url ||
      identities.picture ||
      '';

    req.user = {
      id: user.id,
      email: user.email || '',
      fullName: meta.full_name || meta.name || user.email?.split('@')[0] || '',
      avatarUrl: resolvedAvatar,
    };

    next();
  } catch (err: any) {
    console.error('[Auth Middleware] Verification error:', err);
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Failed to verify authentication session.',
    });
  }
}

