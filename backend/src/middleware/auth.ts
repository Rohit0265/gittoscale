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

  // Handle mock tokens if Supabase is not configured or mock token used
  if (token.startsWith('mock_jwt_') || !isServerSupabaseConfigured) {
    try {
      if (token.startsWith('mock_jwt_')) {
        const payloadBase64 = token.replace('mock_jwt_', '');
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
        req.user = {
          id: payload.id || 'usr_mock',
          email: payload.email || 'mock@gittoscale.tech',
          fullName: payload.name || payload.email?.split('@')[0] || 'GitToScale User',
        };
      } else {
        // Fallback user for dev when no credentials supplied
        req.user = {
          id: 'usr_dev_default',
          email: 'developer@gittoscale.tech',
          fullName: 'Local Developer',
        };
      }
      next();
      return;
    } catch {
      // If parsing failed, fall through to Supabase check
    }
  }

  if (!isServerSupabaseConfigured) {
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

    req.user = {
      id: user.id,
      email: user.email || '',
      fullName: user.user_metadata?.full_name || user.user_metadata?.name || '',
      avatarUrl: user.user_metadata?.avatar_url || '',
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

