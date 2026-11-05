import { getSql } from '../services/neon.js';
import { FeedPost, FeedComment, UserProfileFeed } from './types.js';
import crypto from 'node:crypto';

// In-memory fallbacks when Neon is offline (e.g. unit testing or network timeouts)
const inMemPosts: any[] = [];
const inMemLikes: { post_id: string; user_id: string }[] = [];
const inMemComments: any[] = [];
const inMemFollows: { follower_id: string; following_id: string }[] = [];

/**
 * Normalizes username from full_name or email if not explicitly set.
 */
function deriveUsername(fullName?: string | null, email?: string | null): string {
  if (fullName && fullName.trim()) {
    const clean = fullName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (clean) return clean;
  }
  if (email && email.includes('@')) {
    const clean = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (clean) return clean;
  }
  return 'user';
}

function isDbConnectionError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  return (
    msg.includes('fetch failed') ||
    msg.includes('eai_again') ||
    msg.includes('enotfound') ||
    msg.includes('etimedout') ||
    msg.includes('database_url is not set') ||
    msg.includes('neon')
  );
}

/**
 * Fetch feed posts with author profiles, like counts, comment counts, and like status.
 */
export async function getFeedPosts(
  currentUserId?: string,
  options: { limit?: number; offset?: number } = {}
): Promise<FeedPost[]> {
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 50);
  const offset = Math.max(Number(options.offset) || 0, 0);

  try {
    const db = getSql();
    const rows = await db`
      SELECT 
        p.id,
        p.user_id,
        p.content,
        p.media_url,
        p.media_type,
        p.created_at,
        p.updated_at,
        pr.full_name as author_name,
        pr.username as author_username,
        pr.avatar_url as author_avatar,
        pr.email as author_email,
        COALESCE(l_count.count, 0)::int as like_count,
        COALESCE(c_count.count, 0)::int as comment_count,
        CASE 
          WHEN ${currentUserId || null}::text IS NOT NULL AND user_likes.id IS NOT NULL THEN true 
          ELSE false 
        END as has_liked
      FROM public.feed_posts p
      JOIN public.profiles pr ON pr.id = p.user_id
      LEFT JOIN (
        SELECT post_id, count(*)::int as count 
        FROM public.feed_likes 
        GROUP BY post_id
      ) l_count ON l_count.post_id = p.id
      LEFT JOIN (
        SELECT post_id, count(*)::int as count 
        FROM public.feed_comments 
        GROUP BY post_id
      ) c_count ON c_count.post_id = p.id
      LEFT JOIN public.feed_likes user_likes 
        ON user_likes.post_id = p.id AND user_likes.user_id = ${currentUserId || null}::text
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    return rows.map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      content: r.content,
      media_url: r.media_url,
      media_type: r.media_type,
      created_at: r.created_at,
      updated_at: r.updated_at,
      author: {
        id: r.user_id,
        full_name: r.author_name || r.author_email?.split('@')[0] || 'Anonymous',
        username: r.author_username || deriveUsername(r.author_name, r.author_email),
        avatar_url: r.author_avatar || null,
      },
      like_count: Number(r.like_count) || 0,
      comment_count: Number(r.comment_count) || 0,
      has_liked: Boolean(r.has_liked),
    }));
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      // In-memory fallback
      const sorted = [...inMemPosts].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const sliced = sorted.slice(offset, offset + limit);

      return sliced.map((r) => {
        const likeCount = inMemLikes.filter((l) => l.post_id === r.id).length;
        const commentCount = inMemComments.filter((c) => c.post_id === r.id).length;
        const hasLiked = currentUserId ? inMemLikes.some((l) => l.post_id === r.id && l.user_id === currentUserId) : false;

        return {
          id: r.id,
          user_id: r.user_id,
          content: r.content,
          media_url: r.media_url,
          media_type: r.media_type,
          created_at: r.created_at,
          updated_at: r.updated_at,
          author: {
            id: r.user_id,
            full_name: r.author_name || 'Anonymous',
            username: r.author_username || deriveUsername(r.author_name, r.author_email),
            avatar_url: r.author_avatar || null,
          },
          like_count: likeCount,
          comment_count: commentCount,
          has_liked: hasLiked,
        };
      });
    }
    throw err;
  }
}

/**
 * Fetch a single post by ID.
 */
export async function getPostById(postId: string, currentUserId?: string): Promise<FeedPost | null> {
  try {
    const db = getSql();
    const rows = await db`
      SELECT 
        p.id,
        p.user_id,
        p.content,
        p.media_url,
        p.media_type,
        p.created_at,
        p.updated_at,
        pr.full_name as author_name,
        pr.username as author_username,
        pr.avatar_url as author_avatar,
        pr.email as author_email,
        COALESCE(l_count.count, 0)::int as like_count,
        COALESCE(c_count.count, 0)::int as comment_count,
        CASE 
          WHEN ${currentUserId || null}::text IS NOT NULL AND user_likes.id IS NOT NULL THEN true 
          ELSE false 
        END as has_liked
      FROM public.feed_posts p
      JOIN public.profiles pr ON pr.id = p.user_id
      LEFT JOIN (
        SELECT post_id, count(*)::int as count 
        FROM public.feed_likes 
        GROUP BY post_id
      ) l_count ON l_count.post_id = p.id
      LEFT JOIN (
        SELECT post_id, count(*)::int as count 
        FROM public.feed_comments 
        GROUP BY post_id
      ) c_count ON c_count.post_id = p.id
      LEFT JOIN public.feed_likes user_likes 
        ON user_likes.post_id = p.id AND user_likes.user_id = ${currentUserId || null}::text
      WHERE p.id = ${postId}
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      user_id: r.user_id,
      content: r.content,
      media_url: r.media_url,
      media_type: r.media_type,
      created_at: r.created_at,
      updated_at: r.updated_at,
      author: {
        id: r.user_id,
        full_name: r.author_name || r.author_email?.split('@')[0] || 'Anonymous',
        username: r.author_username || deriveUsername(r.author_name, r.author_email),
        avatar_url: r.author_avatar || null,
      },
      like_count: Number(r.like_count) || 0,
      comment_count: Number(r.comment_count) || 0,
      has_liked: Boolean(r.has_liked),
    };
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const found = inMemPosts.find((p) => p.id === postId);
      if (!found) return null;
      const likeCount = inMemLikes.filter((l) => l.post_id === postId).length;
      const commentCount = inMemComments.filter((c) => c.post_id === postId).length;
      const hasLiked = currentUserId ? inMemLikes.some((l) => l.post_id === postId && l.user_id === currentUserId) : false;

      return {
        id: found.id,
        user_id: found.user_id,
        content: found.content,
        media_url: found.media_url,
        media_type: found.media_type,
        created_at: found.created_at,
        updated_at: found.updated_at,
        author: {
          id: found.user_id,
          full_name: found.author_name || 'Anonymous',
          username: found.author_username || deriveUsername(found.author_name, found.author_email),
          avatar_url: found.author_avatar || null,
        },
        like_count: likeCount,
        comment_count: commentCount,
        has_liked: hasLiked,
      };
    }
    throw err;
  }
}

/**
 * Create a new feed post.
 */
export async function createFeedPost(data: {
  userId: string;
  content: string;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | null;
  authorName?: string;
  authorEmail?: string;
}): Promise<FeedPost> {
  try {
    const db = getSql();
    const rows = await db`
      INSERT INTO public.feed_posts (user_id, content, media_url, media_type, created_at, updated_at)
      VALUES (
        ${data.userId},
        ${data.content.trim()},
        ${data.mediaUrl || null},
        ${data.mediaType || null},
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
      )
      RETURNING id;
    `;

    const newPostId = rows[0].id;
    const post = await getPostById(newPostId, data.userId);
    if (!post) throw new Error('Failed to retrieve newly created post');
    return post;
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const newId = crypto.randomUUID();
      const now = new Date().toISOString();
      const inMem: any = {
        id: newId,
        user_id: data.userId,
        content: data.content.trim(),
        media_url: data.mediaUrl || null,
        media_type: data.mediaType || null,
        created_at: now,
        updated_at: now,
        author_name: data.authorName || 'GitToScale User',
        author_username: deriveUsername(data.authorName, data.authorEmail),
        author_email: data.authorEmail || 'user@gittoscale.tech',
        author_avatar: null,
      };
      inMemPosts.unshift(inMem);
      return {
        id: inMem.id,
        user_id: inMem.user_id,
        content: inMem.content,
        media_url: inMem.media_url,
        media_type: inMem.media_type,
        created_at: inMem.created_at,
        updated_at: inMem.updated_at,
        author: {
          id: inMem.user_id,
          full_name: inMem.author_name,
          username: inMem.author_username,
          avatar_url: inMem.author_avatar,
        },
        like_count: 0,
        comment_count: 0,
        has_liked: false,
      };
    }
    throw err;
  }
}

/**
 * Edit a post content. Verifies ownership in query.
 */
export async function updateFeedPost(
  postId: string,
  userId: string,
  newContent: string
): Promise<FeedPost | null> {
  try {
    const db = getSql();
    const checkRows = await db`
      SELECT user_id FROM public.feed_posts WHERE id = ${postId} LIMIT 1;
    `;

    if (!checkRows || checkRows.length === 0) {
      return null; // Post not found
    }
    if (checkRows[0].user_id !== userId) {
      throw new Error('FORBIDDEN_NOT_OWNER');
    }

    await db`
      UPDATE public.feed_posts
      SET content = ${newContent.trim()}, updated_at = timezone('utc'::text, now())
      WHERE id = ${postId} AND user_id = ${userId};
    `;

    return getPostById(postId, userId);
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const found = inMemPosts.find((p) => p.id === postId);
      if (!found) return null;
      if (found.user_id !== userId) throw new Error('FORBIDDEN_NOT_OWNER');
      found.content = newContent.trim();
      found.updated_at = new Date().toISOString();
      return getPostById(postId, userId);
    }
    throw err;
  }
}

/**
 * Delete a post. Verifies ownership in query.
 */
export async function deleteFeedPost(postId: string, userId: string): Promise<boolean> {
  try {
    const db = getSql();
    const checkRows = await db`
      SELECT user_id FROM public.feed_posts WHERE id = ${postId} LIMIT 1;
    `;

    if (!checkRows || checkRows.length === 0) {
      return false; // Not found
    }
    if (checkRows[0].user_id !== userId) {
      throw new Error('FORBIDDEN_NOT_OWNER');
    }

    await db`
      DELETE FROM public.feed_posts WHERE id = ${postId} AND user_id = ${userId};
    `;
    return true;
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const idx = inMemPosts.findIndex((p) => p.id === postId);
      if (idx === -1) return false;
      if (inMemPosts[idx].user_id !== userId) throw new Error('FORBIDDEN_NOT_OWNER');
      inMemPosts.splice(idx, 1);
      return true;
    }
    throw err;
  }
}

/**
 * Toggle like for a post. Returns whether it is currently liked and updated count.
 */
export async function toggleFeedLike(postId: string, userId: string): Promise<{ liked: boolean; count: number }> {
  try {
    const db = getSql();

    // Check if post exists
    const postCheck = await db`SELECT id FROM public.feed_posts WHERE id = ${postId} LIMIT 1;`;
    if (!postCheck || postCheck.length === 0) {
      throw new Error('POST_NOT_FOUND');
    }

    const existingLike = await db`
      SELECT id FROM public.feed_likes WHERE post_id = ${postId} AND user_id = ${userId} LIMIT 1;
    `;

    let liked = false;
    if (existingLike && existingLike.length > 0) {
      await db`
        DELETE FROM public.feed_likes WHERE post_id = ${postId} AND user_id = ${userId};
      `;
      liked = false;
    } else {
      await db`
        INSERT INTO public.feed_likes (post_id, user_id, created_at)
        VALUES (${postId}, ${userId}, timezone('utc'::text, now()))
        ON CONFLICT (post_id, user_id) DO NOTHING;
      `;
      liked = true;
    }

    const countResult = await db`
      SELECT count(*)::int as count FROM public.feed_likes WHERE post_id = ${postId};
    `;
    const count = Number(countResult[0]?.count) || 0;

    return { liked, count };
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const postExists = inMemPosts.some((p) => p.id === postId);
      if (!postExists) throw new Error('POST_NOT_FOUND');

      const idx = inMemLikes.findIndex((l) => l.post_id === postId && l.user_id === userId);
      let liked = false;
      if (idx !== -1) {
        inMemLikes.splice(idx, 1);
        liked = false;
      } else {
        inMemLikes.push({ post_id: postId, user_id: userId });
        liked = true;
      }
      const count = inMemLikes.filter((l) => l.post_id === postId).length;
      return { liked, count };
    }
    throw err;
  }
}

/**
 * Get comments for a post.
 */
export async function getPostComments(postId: string): Promise<FeedComment[]> {
  try {
    const db = getSql();
    const rows = await db`
      SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.parent_id,
        COALESCE(c.depth, 0)::int as depth,
        c.created_at,
        c.updated_at,
        pr.full_name as author_name,
        pr.username as author_username,
        pr.avatar_url as author_avatar,
        pr.email as author_email
      FROM public.feed_comments c
      JOIN public.profiles pr ON pr.id = c.user_id
      WHERE c.post_id = ${postId}
      ORDER BY c.created_at ASC;
    `;

    return rows.map((r: any) => ({
      id: r.id,
      post_id: r.post_id,
      user_id: r.user_id,
      content: r.content,
      parent_id: r.parent_id || null,
      depth: typeof r.depth === 'number' ? r.depth : 0,
      created_at: r.created_at,
      updated_at: r.updated_at,
      author: {
        id: r.user_id,
        full_name: r.author_name || r.author_email?.split('@')[0] || 'Anonymous',
        username: r.author_username || deriveUsername(r.author_name, r.author_email),
        avatar_url: r.author_avatar || null,
      },
    }));
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      return inMemComments
        .filter((c) => c.post_id === postId)
        .map((c) => ({
          id: c.id,
          post_id: c.post_id,
          user_id: c.user_id,
          content: c.content,
          parent_id: c.parent_id || null,
          depth: c.depth ?? 0,
          created_at: c.created_at,
          updated_at: c.updated_at,
          author: {
            id: c.user_id,
            full_name: c.author_name || 'Anonymous',
            username: c.author_username || deriveUsername(c.author_name, c.author_email),
            avatar_url: c.author_avatar || null,
          },
        }));
    }
    throw err;
  }
}

/**
 * Add a comment to a post.
 */
export async function addPostComment(data: {
  postId: string;
  userId: string;
  content: string;
  parentId?: string | null;
  authorName?: string;
  authorEmail?: string;
}): Promise<FeedComment> {
  try {
    const db = getSql();

    // Check post exists
    const postCheck = await db`SELECT id FROM public.feed_posts WHERE id = ${data.postId} LIMIT 1;`;
    if (!postCheck || postCheck.length === 0) {
      throw new Error('POST_NOT_FOUND');
    }

    let parentId: string | null = data.parentId || null;
    let depth = 0;

    if (parentId) {
      const parentRow = await db`SELECT id, parent_id, depth FROM public.feed_comments WHERE id = ${parentId} LIMIT 1;`;
      if (parentRow && parentRow.length > 0) {
        const p = parentRow[0];
        const pDepth = typeof p.depth === 'number' ? p.depth : 0;
        // Limit of max 3 tree conversation (0, 1, 2) like YouTube
        if (pDepth >= 2) {
          depth = 2;
          parentId = p.id;
        } else {
          depth = pDepth + 1;
          parentId = p.id;
        }
      } else {
        parentId = null;
        depth = 0;
      }
    }

    const insertRows = await db`
      INSERT INTO public.feed_comments (post_id, user_id, content, parent_id, depth, created_at, updated_at)
      VALUES (
        ${data.postId},
        ${data.userId},
        ${data.content.trim()},
        ${parentId},
        ${depth},
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
      )
      RETURNING id;
    `;

    const newCommentId = insertRows[0].id;

    const row = await db`
      SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.parent_id,
        COALESCE(c.depth, 0)::int as depth,
        c.created_at,
        c.updated_at,
        pr.full_name as author_name,
        pr.username as author_username,
        pr.avatar_url as author_avatar,
        pr.email as author_email
      FROM public.feed_comments c
      JOIN public.profiles pr ON pr.id = c.user_id
      WHERE c.id = ${newCommentId}
      LIMIT 1;
    `;

    const r = row[0];
    return {
      id: r.id,
      post_id: r.post_id,
      user_id: r.user_id,
      content: r.content,
      parent_id: r.parent_id || null,
      depth: typeof r.depth === 'number' ? r.depth : 0,
      created_at: r.created_at,
      updated_at: r.updated_at,
      author: {
        id: r.user_id,
        full_name: r.author_name || r.author_email?.split('@')[0] || 'Anonymous',
        username: r.author_username || deriveUsername(r.author_name, r.author_email),
        avatar_url: r.author_avatar || null,
      },
    };
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const postExists = inMemPosts.some((p) => p.id === data.postId);
      if (!postExists) throw new Error('POST_NOT_FOUND');

      let parentId: string | null = data.parentId || null;
      let depth = 0;
      if (parentId) {
        const parent = inMemComments.find((c) => c.id === parentId);
        if (parent) {
          const pDepth = parent.depth ?? 0;
          depth = Math.min(pDepth + 1, 2);
        } else {
          parentId = null;
        }
      }

      const newId = crypto.randomUUID();
      const now = new Date().toISOString();
      const inMem: any = {
        id: newId,
        post_id: data.postId,
        user_id: data.userId,
        content: data.content.trim(),
        parent_id: parentId,
        depth: depth,
        created_at: now,
        updated_at: now,
        author_name: data.authorName || 'Commenter',
        author_username: deriveUsername(data.authorName, data.authorEmail),
        author_email: data.authorEmail || 'user@gittoscale.tech',
        author_avatar: null,
      };
      inMemComments.push(inMem);

      return {
        id: inMem.id,
        post_id: inMem.post_id,
        user_id: inMem.user_id,
        content: inMem.content,
        parent_id: inMem.parent_id,
        depth: inMem.depth,
        created_at: inMem.created_at,
        updated_at: inMem.updated_at,
        author: {
          id: inMem.user_id,
          full_name: inMem.author_name,
          username: inMem.author_username,
          avatar_url: inMem.author_avatar,
        },
      };
    }
    throw err;
  }
}

/**
 * Delete a comment. Verifies ownership.
 */
export async function deletePostComment(commentId: string, userId: string): Promise<boolean> {
  try {
    const db = getSql();
    const check = await db`SELECT user_id FROM public.feed_comments WHERE id = ${commentId} LIMIT 1;`;
    if (!check || check.length === 0) return false;
    if (check[0].user_id !== userId) throw new Error('FORBIDDEN_NOT_OWNER');

    await db`DELETE FROM public.feed_comments WHERE id = ${commentId} AND user_id = ${userId};`;
    return true;
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const idx = inMemComments.findIndex((c) => c.id === commentId);
      if (idx === -1) return false;
      if (inMemComments[idx].user_id !== userId) throw new Error('FORBIDDEN_NOT_OWNER');
      inMemComments.splice(idx, 1);
      return true;
    }
    throw err;
  }
}

/**
 * Get user profile for feed and social stats.
 */
export async function getUserFeedProfile(
  targetUserId: string,
  viewerUserId?: string
): Promise<UserProfileFeed | null> {
  try {
    const db = getSql();
    const rows = await db`
      SELECT 
        p.id,
        p.full_name,
        p.username,
        p.email,
        p.avatar_url,
        p.bio,
        COALESCE(followers.count, 0)::int as followers_count,
        COALESCE(following.count, 0)::int as following_count,
        COALESCE(posts.count, 0)::int as posts_count,
        CASE 
          WHEN ${viewerUserId || null}::text IS NOT NULL AND user_follow.id IS NOT NULL THEN true 
          ELSE false 
        END as is_following
      FROM public.profiles p
      LEFT JOIN (
        SELECT following_id, count(*)::int as count 
        FROM public.feed_follows 
        GROUP BY following_id
      ) followers ON followers.following_id = p.id
      LEFT JOIN (
        SELECT follower_id, count(*)::int as count 
        FROM public.feed_follows 
        GROUP BY follower_id
      ) following ON following.follower_id = p.id
      LEFT JOIN (
        SELECT user_id, count(*)::int as count 
        FROM public.feed_posts 
        GROUP BY user_id
      ) posts ON posts.user_id = p.id
      LEFT JOIN public.feed_follows user_follow 
        ON user_follow.following_id = p.id AND user_follow.follower_id = ${viewerUserId || null}::text
      WHERE p.id = ${targetUserId}
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) return null;
    const r = rows[0];

    return {
      id: r.id,
      full_name: r.full_name || r.email?.split('@')[0] || 'GitToScale User',
      username: r.username || deriveUsername(r.full_name, r.email),
      email: r.email,
      avatar_url: r.avatar_url || null,
      bio: r.bio || '',
      followers_count: Number(r.followers_count) || 0,
      following_count: Number(r.following_count) || 0,
      posts_count: Number(r.posts_count) || 0,
      is_following: Boolean(r.is_following),
      is_owner: viewerUserId ? viewerUserId === r.id : false,
    };
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const followersCount = inMemFollows.filter((f) => f.following_id === targetUserId).length;
      const followingCount = inMemFollows.filter((f) => f.follower_id === targetUserId).length;
      const postsCount = inMemPosts.filter((p) => p.user_id === targetUserId).length;
      const isFollowing = viewerUserId ? inMemFollows.some((f) => f.follower_id === viewerUserId && f.following_id === targetUserId) : false;

      return {
        id: targetUserId,
        full_name: 'Mock Architect',
        username: 'mock_architect',
        email: 'user@gittoscale.tech',
        avatar_url: null,
        bio: 'Distributed systems architect',
        followers_count: followersCount,
        following_count: followingCount,
        posts_count: postsCount,
        is_following: isFollowing,
        is_owner: viewerUserId ? viewerUserId === targetUserId : false,
      };
    }
    throw err;
  }
}

/**
 * Get all posts created by a specific user.
 */
export async function getUserPosts(
  targetUserId: string,
  viewerUserId?: string
): Promise<FeedPost[]> {
  try {
    const db = getSql();
    const rows = await db`
      SELECT 
        p.id,
        p.user_id,
        p.content,
        p.media_url,
        p.media_type,
        p.created_at,
        p.updated_at,
        pr.full_name as author_name,
        pr.username as author_username,
        pr.avatar_url as author_avatar,
        pr.email as author_email,
        COALESCE(l_count.count, 0)::int as like_count,
        COALESCE(c_count.count, 0)::int as comment_count,
        CASE 
          WHEN ${viewerUserId || null}::text IS NOT NULL AND user_likes.id IS NOT NULL THEN true 
          ELSE false 
        END as has_liked
      FROM public.feed_posts p
      JOIN public.profiles pr ON pr.id = p.user_id
      LEFT JOIN (
        SELECT post_id, count(*)::int as count 
        FROM public.feed_likes 
        GROUP BY post_id
      ) l_count ON l_count.post_id = p.id
      LEFT JOIN (
        SELECT post_id, count(*)::int as count 
        FROM public.feed_comments 
        GROUP BY post_id
      ) c_count ON c_count.post_id = p.id
      LEFT JOIN public.feed_likes user_likes 
        ON user_likes.post_id = p.id AND user_likes.user_id = ${viewerUserId || null}::text
      WHERE p.user_id = ${targetUserId}
      ORDER BY p.created_at DESC;
    `;

    return rows.map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      content: r.content,
      media_url: r.media_url,
      media_type: r.media_type,
      created_at: r.created_at,
      updated_at: r.updated_at,
      author: {
        id: r.user_id,
        full_name: r.author_name || r.author_email?.split('@')[0] || 'Anonymous',
        username: r.author_username || deriveUsername(r.author_name, r.author_email),
        avatar_url: r.author_avatar || null,
      },
      like_count: Number(r.like_count) || 0,
      comment_count: Number(r.comment_count) || 0,
      has_liked: Boolean(r.has_liked),
    }));
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      return inMemPosts
        .filter((p) => p.user_id === targetUserId)
        .map((p) => ({
          id: p.id,
          user_id: p.user_id,
          content: p.content,
          media_url: p.media_url,
          media_type: p.media_type,
          created_at: p.created_at,
          updated_at: p.updated_at,
          author: {
            id: p.user_id,
            full_name: p.author_name || 'Anonymous',
            username: p.author_username || deriveUsername(p.author_name, p.author_email),
            avatar_url: p.author_avatar || null,
          },
          like_count: inMemLikes.filter((l) => l.post_id === p.id).length,
          comment_count: inMemComments.filter((c) => c.post_id === p.id).length,
          has_liked: viewerUserId ? inMemLikes.some((l) => l.post_id === p.id && l.user_id === viewerUserId) : false,
        }));
    }
    throw err;
  }
}

/**
 * Get all posts liked by a user.
 */
export async function getUserLikedPosts(
  targetUserId: string,
  viewerUserId?: string
): Promise<FeedPost[]> {
  try {
    const db = getSql();
    const rows = await db`
      SELECT 
        p.id,
        p.user_id,
        p.content,
        p.media_url,
        p.media_type,
        p.created_at,
        p.updated_at,
        pr.full_name as author_name,
        pr.username as author_username,
        pr.avatar_url as author_avatar,
        pr.email as author_email,
        COALESCE(l_count.count, 0)::int as like_count,
        COALESCE(c_count.count, 0)::int as comment_count,
        CASE 
          WHEN ${viewerUserId || null}::text IS NOT NULL AND user_likes.id IS NOT NULL THEN true 
          ELSE false 
        END as has_liked
      FROM public.feed_likes ul
      JOIN public.feed_posts p ON p.id = ul.post_id
      JOIN public.profiles pr ON pr.id = p.user_id
      LEFT JOIN (
        SELECT post_id, count(*)::int as count 
        FROM public.feed_likes 
        GROUP BY post_id
      ) l_count ON l_count.post_id = p.id
      LEFT JOIN (
        SELECT post_id, count(*)::int as count 
        FROM public.feed_comments 
        GROUP BY post_id
      ) c_count ON c_count.post_id = p.id
      LEFT JOIN public.feed_likes user_likes 
        ON user_likes.post_id = p.id AND user_likes.user_id = ${viewerUserId || null}::text
      WHERE ul.user_id = ${targetUserId}
      ORDER BY ul.created_at DESC;
    `;

    return rows.map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      content: r.content,
      media_url: r.media_url,
      media_type: r.media_type,
      created_at: r.created_at,
      updated_at: r.updated_at,
      author: {
        id: r.user_id,
        full_name: r.author_name || r.author_email?.split('@')[0] || 'Anonymous',
        username: r.author_username || deriveUsername(r.author_name, r.author_email),
        avatar_url: r.author_avatar || null,
      },
      like_count: Number(r.like_count) || 0,
      comment_count: Number(r.comment_count) || 0,
      has_liked: Boolean(r.has_liked),
    }));
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const likedPostIds = inMemLikes.filter((l) => l.user_id === targetUserId).map((l) => l.post_id);
      return inMemPosts
        .filter((p) => likedPostIds.includes(p.id))
        .map((p) => ({
          id: p.id,
          user_id: p.user_id,
          content: p.content,
          media_url: p.media_url,
          media_type: p.media_type,
          created_at: p.created_at,
          updated_at: p.updated_at,
          author: {
            id: p.user_id,
            full_name: p.author_name || 'Anonymous',
            username: p.author_username || deriveUsername(p.author_name, p.author_email),
            avatar_url: p.author_avatar || null,
          },
          like_count: inMemLikes.filter((l) => l.post_id === p.id).length,
          comment_count: inMemComments.filter((c) => c.post_id === p.id).length,
          has_liked: viewerUserId ? inMemLikes.some((l) => l.post_id === p.id && l.user_id === viewerUserId) : false,
        }));
    }
    throw err;
  }
}

/**
 * Toggle follow status for a target user.
 */
export async function toggleFollowUser(
  followerId: string,
  followingId: string
): Promise<{ following: boolean; followersCount: number }> {
  if (followerId === followingId) {
    throw new Error('CANNOT_FOLLOW_SELF');
  }

  try {
    const db = getSql();

    // Check target user exists
    const userCheck = await db`SELECT id FROM public.profiles WHERE id = ${followingId} LIMIT 1;`;
    if (!userCheck || userCheck.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }

    const existingFollow = await db`
      SELECT id FROM public.feed_follows 
      WHERE follower_id = ${followerId} AND following_id = ${followingId}
      LIMIT 1;
    `;

    let following = false;
    if (existingFollow && existingFollow.length > 0) {
      await db`
        DELETE FROM public.feed_follows 
        WHERE follower_id = ${followerId} AND following_id = ${followingId};
      `;
      following = false;
    } else {
      await db`
        INSERT INTO public.feed_follows (follower_id, following_id, created_at)
        VALUES (${followerId}, ${followingId}, timezone('utc'::text, now()))
        ON CONFLICT (follower_id, following_id) DO NOTHING;
      `;
      following = true;
    }

    const countRes = await db`
      SELECT count(*)::int as count FROM public.feed_follows WHERE following_id = ${followingId};
    `;
    const followersCount = Number(countRes[0]?.count) || 0;

    return { following, followersCount };
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const idx = inMemFollows.findIndex((f) => f.follower_id === followerId && f.following_id === followingId);
      let following = false;
      if (idx !== -1) {
        inMemFollows.splice(idx, 1);
        following = false;
      } else {
        inMemFollows.push({ follower_id: followerId, following_id: followingId });
        following = true;
      }
      const followersCount = inMemFollows.filter((f) => f.following_id === followingId).length;
      return { following, followersCount };
    }
    throw err;
  }
}
