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
 * Resolves authenticated user from Request Authorization header if present.
 * Returns null if not authenticated or invalid token.
 */
export async function resolveUserFromRequest(req: Request): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7).trim();
  if (!token) return null;

  const allowMockAuth =
    process.env.NODE_ENV !== 'production' || process.env.ENABLE_MOCK_AUTH === 'true';

  if (token.startsWith('mock_jwt_')) {
    if (!allowMockAuth) return null;
    try {
      const payloadBase64 = token.replace('mock_jwt_', '');
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
      return {
        id: payload.id || 'usr_mock',
        email: payload.email || 'mock@gittoscale.tech',
        fullName: payload.name || payload.email?.split('@')[0] || 'GitToScale User',
        avatarUrl: payload.avatar_url || payload.picture || payload.avatar || undefined,
      };
    } catch {
      return null;
    }
  }

  if (!isServerSupabaseConfigured) {
    if (allowMockAuth) {
      return {
        id: 'usr_dev_default',
        email: 'developer@gittoscale.tech',
        fullName: 'Local Developer',
        avatarUrl: undefined,
      };
    }
    return null;
  }

  try {
    const { data: { user }, error } = await supabaseServer.auth.getUser(token);
    if (error || !user) {
      return null;
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

    return {
      id: user.id,
      email: user.email || '',
      fullName: meta.full_name || meta.name || user.email?.split('@')[0] || '',
      avatarUrl: resolvedAvatar,
    };
  } catch (err: any) {
    console.warn('[Auth Middleware] resolveUserFromRequest error:', err.message);
    return null;
  }
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

  const user = await resolveUserFromRequest(req);
  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired session. Please sign in again.',
    });
    return;
  }

  req.user = user;
  next();
}
