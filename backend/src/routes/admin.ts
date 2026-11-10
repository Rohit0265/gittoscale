import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import {
  isUserAdmin,
  getAdminUsers,
  getAdminUserPosts,
  warnUser,
  suspendUser,
  unsuspendUser,
  resetWarnings,
  adminDeletePost,
  toggleAdminRole,
} from '../services/adminService.js';

const router = Router();

/**
 * Superuser Authorization Guard Middleware
 */
async function requireSuperUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication required to access admin resources.',
    });
    return;
  }

  const isAdmin = await isUserAdmin(req.user.id, req.user.email);
  if (!isAdmin) {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Access denied: Superuser / Administrator privileges required.',
    });
    return;
  }

  next();
}

/**
 * GET /api/admin/check
 * Verifies if current session has admin permissions
 */
router.get('/check', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const isAdmin = await isUserAdmin(req.user?.id, req.user?.email);
    res.json({
      success: true,
      isAdmin,
      user: req.user
        ? {
            id: req.user.id,
            email: req.user.email,
            fullName: req.user.fullName,
            avatarUrl: req.user.avatarUrl,
            isAdmin,
          }
        : null,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: err?.message || 'Failed to check superuser status',
    });
  }
});

/**
 * GET /api/admin/users
 * Lists users with search query and status filters
 */
router.get('/users', requireAuth, requireSuperUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const search = req.query.search ? String(req.query.search) : undefined;
    const status = req.query.status as 'all' | 'active' | 'warned' | 'suspended' | undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
    const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0;

    const result = await getAdminUsers({
      search,
      status,
      limit,
      offset,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error('[Admin] Error fetching users:', err);
    res.status(500).json({
      success: false,
      error: 'FETCH_USERS_FAILED',
      message: err?.message || 'Failed to fetch users',
    });
  }
});

/**
 * GET /api/admin/users/:userId/posts
 * Retrieves all posts made by a specific user for admin inspection
 */
router.get(
  '/users/:userId/posts',
  requireAuth,
  requireSuperUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const posts = await getAdminUserPosts(userId);

      res.json({
        success: true,
        data: posts,
      });
    } catch (err: any) {
      console.error('[Admin] Error fetching user posts:', err);
      res.status(500).json({
        success: false,
        error: 'FETCH_POSTS_FAILED',
        message: err?.message || 'Failed to fetch user posts',
      });
    }
  }
);

/**
 * POST /api/admin/users/:userId/warn
 * Issues a warning to the user. On 3rd warning, auto-suspends account.
 */
router.post(
  '/users/:userId/warn',
  requireAuth,
  requireSuperUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const adminEmail = req.user?.email || 'admin@gittoscale.tech';

      if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Warning reason is required.',
        });
        return;
      }

      const result = await warnUser(userId, reason, adminEmail);

      res.json({
        success: true,
        data: result,
        message: result.isSuspended
          ? `User received Warning #${result.warningCount}. Account has been suspended automatically.`
          : `Warning #${result.warningCount}/3 issued successfully.`,
      });
    } catch (err: any) {
      console.error('[Admin] Error issuing warning:', err);
      res.status(500).json({
        success: false,
        error: 'WARN_USER_FAILED',
        message: err?.message || 'Failed to warn user',
      });
    }
  }
);

/**
 * POST /api/admin/users/:userId/suspend
 * Directly suspends/bans an account (e.g. for adult content or severe violations)
 */
router.post(
  '/users/:userId/suspend',
  requireAuth,
  requireSuperUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const adminEmail = req.user?.email || 'admin@gittoscale.tech';

      const result = await suspendUser(userId, reason || 'Account suspended for policy violation', adminEmail);

      res.json({
        success: true,
        data: result,
        message: 'User account has been suspended.',
      });
    } catch (err: any) {
      console.error('[Admin] Error suspending user:', err);
      res.status(500).json({
        success: false,
        error: 'SUSPEND_USER_FAILED',
        message: err?.message || 'Failed to suspend user',
      });
    }
  }
);

/**
 * POST /api/admin/users/:userId/unsuspend
 * Lifts suspension on user account
 */
router.post(
  '/users/:userId/unsuspend',
  requireAuth,
  requireSuperUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const result = await unsuspendUser(userId);

      res.json({
        success: true,
        data: result,
        message: 'Account suspension has been lifted.',
      });
    } catch (err: any) {
      console.error('[Admin] Error lifting suspension:', err);
      res.status(500).json({
        success: false,
        error: 'UNSUSPEND_USER_FAILED',
        message: err?.message || 'Failed to unsuspend user',
      });
    }
  }
);

/**
 * POST /api/admin/users/:userId/reset-warnings
 * Clears warnings count back to 0
 */
router.post(
  '/users/:userId/reset-warnings',
  requireAuth,
  requireSuperUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const result = await resetWarnings(userId);

      res.json({
        success: true,
        data: result,
        message: 'User warnings have been reset to 0.',
      });
    } catch (err: any) {
      console.error('[Admin] Error resetting warnings:', err);
      res.status(500).json({
        success: false,
        error: 'RESET_WARNINGS_FAILED',
        message: err?.message || 'Failed to reset warnings',
      });
    }
  }
);

/**
 * DELETE /api/admin/posts/:postId
 * Admin removes an inappropriate or prohibited post
 */
router.delete(
  '/posts/:postId',
  requireAuth,
  requireSuperUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { postId } = req.params;
      const deleted = await adminDeletePost(postId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'POST_NOT_FOUND',
          message: 'Post not found or already deleted.',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Post has been removed by administrator.',
      });
    } catch (err: any) {
      console.error('[Admin] Error deleting post:', err);
      res.status(500).json({
        success: false,
        error: 'DELETE_POST_FAILED',
        message: err?.message || 'Failed to delete post',
      });
    }
  }
);

/**
 * POST /api/admin/users/:userId/role
 * Toggles user superuser / admin role
 */
router.post(
  '/users/:userId/role',
  requireAuth,
  requireSuperUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { makeAdmin } = req.body;

      const result = await toggleAdminRole(userId, Boolean(makeAdmin));

      res.json({
        success: true,
        data: result,
        message: makeAdmin ? 'User granted superuser privileges.' : 'Superuser privileges revoked.',
      });
    } catch (err: any) {
      console.error('[Admin] Error updating user role:', err);
      res.status(500).json({
        success: false,
        error: 'UPDATE_ROLE_FAILED',
        message: err?.message || 'Failed to update user role',
      });
    }
  }
);

export default router;
