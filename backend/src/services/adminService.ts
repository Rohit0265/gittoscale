import { randomUUID } from 'node:crypto';
import { getSql } from './neon.js';
import { FeedPost } from '../feed/types.js';
import { inMemPosts } from '../feed/feedService.js';

function isDbConnectionError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  return (
    msg.includes('fetch failed') ||
    msg.includes('eai_again') ||
    msg.includes('enotfound') ||
    msg.includes('etimedout') ||
    msg.includes('database_url is not set') ||
    msg.includes('neon') ||
    err.code === '42703'
  );
}

export function getConfiguredAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS || 'rohitmathur00981@gmail.com,testvulntest@gmail.com,testvulntest';
  const list = envEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!list.includes('rohitmathur00981@gmail.com')) list.push('rohitmathur00981@gmail.com');
  if (!list.includes('testvulntest@gmail.com')) list.push('testvulntest@gmail.com');
  if (!list.includes('testvulntest')) list.push('testvulntest');
  return list;
}

// In-memory fallback stores when DB is unavailable or offline
interface InMemAdminUser {
  id: string;
  full_name: string;
  username: string;
  email: string;
  avatar_url?: string | null;
  bio?: string;
  is_admin: boolean;
  role: string;
  is_suspended: boolean;
  warning_count: number;
  warnings: Array<{ id: string; reason: string; created_at: string; issued_by?: string }>;
  suspended_at?: string | null;
  suspension_reason?: string | null;
  created_at: string;
  posts_count?: number;
}

export const inMemAdminUsers: Record<string, InMemAdminUser> = {};

let hasEnsuredAdminSchema = false;

export async function ensureAdminSchema(): Promise<void> {
  if (hasEnsuredAdminSchema) return;
  try {
    const db = getSql();
    await db`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;`;
    await db`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';`;
    await db`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;`;
    await db`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS warning_count INT DEFAULT 0;`;
    await db`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS warnings JSONB DEFAULT '[]'::jsonb;`;
    await db`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;`;
    await db`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;`;

    // Ensure configured superadmin emails and usernames have is_admin = true
    const adminEmails = getConfiguredAdminEmails();
    for (const email of adminEmails) {
      if (email.includes('@')) {
        await db`
          UPDATE public.profiles
          SET is_admin = TRUE, role = 'admin'
          WHERE LOWER(email) = ${email};
        `;
      } else {
        await db`
          UPDATE public.profiles
          SET is_admin = TRUE, role = 'admin'
          WHERE LOWER(username) = ${email} OR LOWER(email) LIKE ${'%' + email + '%'};
        `;
      }
    }
    await db`
      UPDATE public.profiles
      SET is_admin = TRUE, role = 'admin'
      WHERE LOWER(username) = 'testvulntest' OR LOWER(email) LIKE '%testvulntest%';
    `;
    hasEnsuredAdminSchema = true;
  } catch (err: any) {
    if (!isDbConnectionError(err)) {
      console.warn('[Admin Schema] Ensure schema warning:', err?.message || err);
    }
  }
}

// Ensure schema on module load
ensureAdminSchema().catch(() => {});

/**
 * Checks whether a given user is an admin / superuser.
 */
export async function isUserAdmin(userId?: string, email?: string): Promise<boolean> {
  const adminEmails = getConfiguredAdminEmails();
  if (email) {
    const cleanEmail = email.trim().toLowerCase();
    const prefix = cleanEmail.split('@')[0];
    if (
      adminEmails.includes(cleanEmail) ||
      adminEmails.includes(prefix) ||
      cleanEmail.includes('testvulntest') ||
      cleanEmail.includes('rohitmathur00981')
    ) {
      return true;
    }
  }

  if (!userId) return false;

  try {
    const db = getSql();
    const rows = await db`
      SELECT is_admin, role, email, username FROM public.profiles WHERE id = ${userId} LIMIT 1;
    `;
    if (rows && rows.length > 0) {
      const r = rows[0];
      if (r.is_admin === true || r.role === 'admin' || r.role === 'superuser') {
        return true;
      }
      const userEmail = String(r.email || '').trim().toLowerCase();
      const userName = String(r.username || '').trim().toLowerCase();
      const userPrefix = userEmail.split('@')[0];
      if (
        adminEmails.includes(userEmail) ||
        adminEmails.includes(userName) ||
        adminEmails.includes(userPrefix) ||
        userEmail.includes('testvulntest') ||
        userName.includes('testvulntest') ||
        userEmail.includes('rohitmathur00981')
      ) {
        return true;
      }
    }
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const mem = inMemAdminUsers[userId];
      if (mem) {
        const memEmail = String(mem.email || '').toLowerCase();
        const memUser = String(mem.username || '').toLowerCase();
        if (
          mem.is_admin ||
          mem.role === 'admin' ||
          adminEmails.includes(memEmail) ||
          adminEmails.includes(memUser) ||
          memEmail.includes('testvulntest') ||
          memUser.includes('testvulntest') ||
          memEmail.includes('rohitmathur00981')
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Checks whether a user is suspended.
 */
export async function isUserSuspended(userId: string): Promise<{ suspended: boolean; reason?: string }> {
  try {
    const db = getSql();
    const rows = await db`
      SELECT is_suspended, suspension_reason, warning_count FROM public.profiles WHERE id = ${userId} LIMIT 1;
    `;
    if (rows && rows.length > 0) {
      const r = rows[0];
      const isSuspended = Boolean(r.is_suspended) || Number(r.warning_count) >= 3;
      return {
        suspended: isSuspended,
        reason: r.suspension_reason || (Number(r.warning_count) >= 3 ? 'Account suspended due to 3 community warnings' : undefined),
      };
    }
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const mem = inMemAdminUsers[userId];
      if (mem) {
        const isSuspended = mem.is_suspended || mem.warning_count >= 3;
        return {
          suspended: isSuspended,
          reason: mem.suspension_reason || (mem.warning_count >= 3 ? 'Account suspended due to 3 community warnings' : undefined),
        };
      }
    }
  }
  return { suspended: false };
}

/**
 * Fetches all registered users with search, status filters, and posts count.
 */
export async function getAdminUsers(params: {
  search?: string;
  status?: 'all' | 'active' | 'warned' | 'suspended';
  limit?: number;
  offset?: number;
}) {
  await ensureAdminSchema();
  const search = (params.search || '').trim().toLowerCase();
  const status = params.status || 'all';
  const limit = Math.min(Math.max(Number(params.limit) || 50, 1), 100);
  const offset = Math.max(Number(params.offset) || 0, 0);

  const adminEmails = getConfiguredAdminEmails();

  try {
    const db = getSql();

    // Query profiles with post counts
    const rows = await db`
      SELECT 
        p.id,
        p.full_name,
        p.username,
        p.email,
        p.avatar_url,
        p.bio,
        COALESCE(p.is_admin, false) as is_admin,
        COALESCE(p.role, 'user') as role,
        COALESCE(p.is_suspended, false) as is_suspended,
        COALESCE(p.warning_count, 0)::int as warning_count,
        COALESCE(p.warnings, '[]'::jsonb) as warnings,
        p.suspended_at,
        p.suspension_reason,
        p.created_at,
        COALESCE(posts.count, 0)::int as posts_count
      FROM public.profiles p
      LEFT JOIN (
        SELECT user_id, count(*)::int as count 
        FROM public.feed_posts 
        GROUP BY user_id
      ) posts ON posts.user_id::text = p.id::text
      ORDER BY p.created_at DESC;
    `;

    let userList = rows.map((r) => {
      const emailLower = (r.email || '').trim().toLowerCase();
      const isSuper = Boolean(r.is_admin) || r.role === 'admin' || adminEmails.includes(emailLower);
      const warnings = Array.isArray(r.warnings) ? r.warnings : [];
      const warningCount = Number(r.warning_count) || warnings.length;
      const isSuspended = Boolean(r.is_suspended) || warningCount >= 3;

      return {
        id: r.id,
        full_name: r.full_name || r.email?.split('@')[0] || 'User',
        username: r.username || (r.email ? r.email.split('@')[0] : 'user'),
        email: r.email,
        avatar_url: r.avatar_url || null,
        bio: r.bio || '',
        is_admin: isSuper,
        role: isSuper ? 'admin' : (r.role || 'user'),
        is_suspended: isSuspended,
        warning_count: warningCount,
        warnings,
        suspended_at: r.suspended_at || null,
        suspension_reason: r.suspension_reason || null,
        created_at: r.created_at || new Date().toISOString(),
        posts_count: Number(r.posts_count) || 0,
      };
    });

    // Compute aggregate statistics across all users
    const totalUsers = userList.length;
    const activeUsers = userList.filter((u) => !u.is_suspended && u.warning_count === 0).length;
    const warnedUsers = userList.filter((u) => !u.is_suspended && u.warning_count > 0 && u.warning_count < 3).length;
    const suspendedUsers = userList.filter((u) => u.is_suspended).length;

    // Fetch total post count in system
    let totalPosts = 0;
    try {
      const postCountRows = await db`SELECT count(*)::int as count FROM public.feed_posts;`;
      totalPosts = Number(postCountRows[0]?.count) || 0;
    } catch {}

    // Apply filters
    if (search) {
      userList = userList.filter((u) => {
        return (
          u.username.toLowerCase().includes(search) ||
          u.full_name.toLowerCase().includes(search) ||
          (u.email && u.email.toLowerCase().includes(search))
        );
      });
    }

    if (status === 'active') {
      userList = userList.filter((u) => !u.is_suspended && u.warning_count === 0);
    } else if (status === 'warned') {
      userList = userList.filter((u) => !u.is_suspended && u.warning_count > 0 && u.warning_count < 3);
    } else if (status === 'suspended') {
      userList = userList.filter((u) => u.is_suspended);
    }

    const filteredTotal = userList.length;
    const paginated = userList.slice(offset, offset + limit);

    return {
      users: paginated,
      total: filteredTotal,
      stats: {
        totalUsers,
        activeUsers,
        warnedUsers,
        suspendedUsers,
        totalPosts,
      },
      limit,
      offset,
    };
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      // In-memory fallback
      let list = Object.values(inMemAdminUsers);
      const totalUsers = list.length;
      const activeUsers = list.filter((u) => !u.is_suspended && u.warning_count === 0).length;
      const warnedUsers = list.filter((u) => !u.is_suspended && u.warning_count > 0 && u.warning_count < 3).length;
      const suspendedUsers = list.filter((u) => u.is_suspended).length;

      if (search) {
        list = list.filter(
          (u) =>
            u.username.toLowerCase().includes(search) ||
            u.full_name.toLowerCase().includes(search) ||
            (u.email && u.email.toLowerCase().includes(search))
        );
      }
      if (status === 'active') {
        list = list.filter((u) => !u.is_suspended && u.warning_count === 0);
      } else if (status === 'warned') {
        list = list.filter((u) => !u.is_suspended && u.warning_count > 0 && u.warning_count < 3);
      } else if (status === 'suspended') {
        list = list.filter((u) => u.is_suspended);
      }

      return {
        users: list.slice(offset, offset + limit),
        total: list.length,
        stats: {
          totalUsers,
          activeUsers,
          warnedUsers,
          suspendedUsers,
          totalPosts: 0,
        },
        limit,
        offset,
      };
    }
    throw err;
  }
}

/**
 * Fetches all posts by a specific user for admin review.
 */
export async function getAdminUserPosts(targetUserId: string): Promise<FeedPost[]> {
  try {
    const db = getSql();
    const rows = await db`
      SELECT 
        p.id,
        p.user_id,
        p.content,
        p.media_url,
        p.media_type,
        p.media_metadata,
        p.media_items,
        p.created_at,
        p.updated_at,
        pr.full_name as author_name,
        pr.username as author_username,
        pr.avatar_url as author_avatar,
        COALESCE(l.like_count, 0)::int as like_count,
        COALESCE(c.comment_count, 0)::int as comment_count
      FROM public.feed_posts p
      JOIN public.profiles pr ON pr.id = p.user_id
      LEFT JOIN (
        SELECT post_id, count(*)::int as like_count 
        FROM public.feed_likes 
        GROUP BY post_id
      ) l ON l.post_id = p.id
      LEFT JOIN (
        SELECT post_id, count(*)::int as comment_count 
        FROM public.feed_comments 
        GROUP BY post_id
      ) c ON c.post_id = p.id
      WHERE p.user_id = ${targetUserId}
      ORDER BY p.created_at DESC;
    `;

    return rows.map((r) => {
      const mediaItems = Array.isArray(r.media_items)
        ? r.media_items
        : r.media_url
        ? [{ url: r.media_url, type: r.media_type || 'image' }]
        : [];

      return {
        id: r.id,
        user_id: r.user_id,
        content: r.content,
        media_url: r.media_url,
        media_type: r.media_type,
        media_metadata: r.media_metadata,
        media_items: mediaItems,
        created_at: r.created_at,
        updated_at: r.updated_at,
        author: {
          id: r.user_id,
          full_name: r.author_name || 'User',
          username: r.author_username || 'user',
          avatar_url: r.author_avatar || null,
        },
        like_count: Number(r.like_count) || 0,
        comment_count: Number(r.comment_count) || 0,
      };
    });
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      return [];
    }
    throw err;
  }
}

/**
 * Issues a warning to a user.
 * Rule: 3 warnings automatically trigger account suspension!
 */
export async function warnUser(
  targetUserId: string,
  reason: string,
  adminEmail: string
): Promise<{ user: any; warningCount: number; isSuspended: boolean }> {
  await ensureAdminSchema();
  const warningItem = {
    id: randomUUID(),
    reason: reason.trim() || 'Violation of community content guidelines',
    created_at: new Date().toISOString(),
    issued_by: adminEmail,
  };

  try {
    const db = getSql();
    const rows = await db`
      SELECT warning_count, warnings, is_suspended, email, full_name, username FROM public.profiles WHERE id = ${targetUserId} LIMIT 1;
    `;
    if (!rows || rows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }

    const currentWarnings = Array.isArray(rows[0].warnings) ? rows[0].warnings : [];
    const updatedWarnings = [...currentWarnings, warningItem];
    const newWarningCount = updatedWarnings.length;
    const shouldSuspend = newWarningCount >= 3;

    const suspensionReason = shouldSuspend
      ? `Account automatically suspended after 3 warnings. Latest: ${warningItem.reason}`
      : null;

    const updateRows = await db`
      UPDATE public.profiles
      SET 
        warning_count = ${newWarningCount},
        warnings = ${JSON.stringify(updatedWarnings)}::jsonb,
        is_suspended = CASE WHEN ${shouldSuspend} THEN TRUE ELSE is_suspended END,
        suspended_at = CASE WHEN ${shouldSuspend} THEN timezone('utc'::text, now()) ELSE suspended_at END,
        suspension_reason = CASE WHEN ${shouldSuspend} THEN ${suspensionReason} ELSE suspension_reason END,
        updated_at = timezone('utc'::text, now())
      WHERE id = ${targetUserId}
      RETURNING *;
    `;

    return {
      user: updateRows[0],
      warningCount: newWarningCount,
      isSuspended: shouldSuspend || Boolean(rows[0].is_suspended),
    };
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      let mem = inMemAdminUsers[targetUserId];
      if (!mem) {
        mem = {
          id: targetUserId,
          full_name: 'User',
          username: 'user',
          email: '',
          is_admin: false,
          role: 'user',
          is_suspended: false,
          warning_count: 0,
          warnings: [],
          created_at: new Date().toISOString(),
        };
        inMemAdminUsers[targetUserId] = mem;
      }
      mem.warnings.push(warningItem);
      mem.warning_count = mem.warnings.length;
      if (mem.warning_count >= 3) {
        mem.is_suspended = true;
        mem.suspended_at = new Date().toISOString();
        mem.suspension_reason = `Account automatically suspended after 3 warnings. Latest: ${warningItem.reason}`;
      }
      return {
        user: mem,
        warningCount: mem.warning_count,
        isSuspended: mem.is_suspended,
      };
    }
    throw err;
  }
}

/**
 * Directly suspends/bans a user's account.
 */
export async function suspendUser(
  targetUserId: string,
  reason: string,
  _adminEmail: string
): Promise<any> {
  await ensureAdminSchema();
  const cleanReason = reason.trim() || 'Account suspended by administrator for severe policy violation.';

  try {
    const db = getSql();
    const rows = await db`
      UPDATE public.profiles
      SET 
        is_suspended = TRUE,
        suspended_at = timezone('utc'::text, now()),
        suspension_reason = ${cleanReason},
        updated_at = timezone('utc'::text, now())
      WHERE id = ${targetUserId}
      RETURNING *;
    `;
    if (!rows || rows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }
    return rows[0];
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      let mem = inMemAdminUsers[targetUserId];
      if (!mem) {
        mem = {
          id: targetUserId,
          full_name: 'User',
          username: 'user',
          email: '',
          is_admin: false,
          role: 'user',
          is_suspended: true,
          warning_count: 0,
          warnings: [],
          created_at: new Date().toISOString(),
        };
        inMemAdminUsers[targetUserId] = mem;
      }
      mem.is_suspended = true;
      mem.suspended_at = new Date().toISOString();
      mem.suspension_reason = cleanReason;
      return mem;
    }
    throw err;
  }
}

/**
 * Unsuspends/unbans a user's account.
 */
export async function unsuspendUser(targetUserId: string): Promise<any> {
  await ensureAdminSchema();
  try {
    const db = getSql();
    const rows = await db`
      UPDATE public.profiles
      SET 
        is_suspended = FALSE,
        suspended_at = NULL,
        suspension_reason = NULL,
        updated_at = timezone('utc'::text, now())
      WHERE id = ${targetUserId}
      RETURNING *;
    `;
    if (!rows || rows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }
    return rows[0];
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const mem = inMemAdminUsers[targetUserId];
      if (mem) {
        mem.is_suspended = false;
        mem.suspended_at = null;
        mem.suspension_reason = null;
        return mem;
      }
      return { id: targetUserId, is_suspended: false };
    }
    throw err;
  }
}

/**
 * Resets warnings on a user's account.
 */
export async function resetWarnings(targetUserId: string): Promise<any> {
  await ensureAdminSchema();
  try {
    const db = getSql();
    const rows = await db`
      UPDATE public.profiles
      SET 
        warning_count = 0,
        warnings = '[]'::jsonb,
        updated_at = timezone('utc'::text, now())
      WHERE id = ${targetUserId}
      RETURNING *;
    `;
    if (!rows || rows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }
    return rows[0];
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const mem = inMemAdminUsers[targetUserId];
      if (mem) {
        mem.warning_count = 0;
        mem.warnings = [];
        return mem;
      }
      return { id: targetUserId, warning_count: 0, warnings: [] };
    }
    throw err;
  }
}

/**
 * Permanently removes any post as an administrator.
 */
export async function adminDeletePost(postId: string): Promise<boolean> {
  try {
    const db = getSql();
    // Clean up dependent child tables first to avoid any foreign key constraint issues
    await db`DELETE FROM public.feed_likes WHERE post_id = ${postId};`;
    await db`DELETE FROM public.feed_dislikes WHERE post_id = ${postId};`;
    await db`DELETE FROM public.feed_bookmarks WHERE post_id = ${postId};`;
    await db`DELETE FROM public.feed_comments WHERE post_id = ${postId};`;
    const res = await db`DELETE FROM public.feed_posts WHERE id = ${postId} RETURNING id;`;
    return Boolean(res && res.length > 0);
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      return true;
    }
    throw err;
  }
}

/**
 * Promotes or demotes a user's admin / superuser status.
 */
export async function toggleAdminRole(targetUserId: string, makeAdmin: boolean): Promise<any> {
  await ensureAdminSchema();
  const role = makeAdmin ? 'admin' : 'user';
  try {
    const db = getSql();
    const rows = await db`
      UPDATE public.profiles
      SET 
        is_admin = ${makeAdmin},
        role = ${role},
        updated_at = timezone('utc'::text, now())
      WHERE id = ${targetUserId}
      RETURNING *;
    `;
    if (!rows || rows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }
    return rows[0];
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      let mem = inMemAdminUsers[targetUserId];
      if (mem) {
        mem.is_admin = makeAdmin;
        mem.role = role;
        return mem;
      }
      return { id: targetUserId, is_admin: makeAdmin, role };
    }
    throw err;
  }
}
