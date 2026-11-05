import { Router, Response, NextFunction } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseServer, isServerSupabaseConfigured } from '../services/supabase.js';
import { uploadToR2 } from '../services/r2Service.js';
import { compressImage, processAndValidateVideo } from '../services/mediaCompressionService.js';
import {
  getFeedPosts,
  getPostById,
  createFeedPost,
  updateFeedPost,
  deleteFeedPost,
  toggleFeedLike,
  getPostComments,
  addPostComment,
  deletePostComment,
  getUserFeedProfile,
  getUserPosts,
  getUserLikedPosts,
  toggleFollowUser,
} from './feedService.js';

const router = Router();

// Ensure local uploads directory exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'feed');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Optional authentication middleware:
 * Populates req.user if a valid token is present, but allows unauthenticated visitors through.
 */
async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7).trim();
  req.token = token;

  // Handle mock tokens if offline
  if (token.startsWith('mock_jwt_')) {
    try {
      const payloadBase64 = token.replace('mock_jwt_', '');
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
      req.user = {
        id: payload.id || 'usr_mock',
        email: payload.email || 'mock@gittoscale.tech',
        fullName: payload.name || 'Mock User',
      };
      return next();
    } catch {
      return next();
    }
  }

  if (!isServerSupabaseConfigured) {
    return next();
  }

  try {
    const { data: { user } } = await supabaseServer.auth.getUser(token);
    if (user) {
      req.user = {
        id: user.id,
        email: user.email || '',
        fullName: user.user_metadata?.full_name || user.user_metadata?.name || '',
        avatarUrl: user.user_metadata?.avatar_url || '',
      };
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }
  next();
}

/**
 * Detect media type and validate binary magic bytes.
 */
function validateMediaBinary(buffer: Buffer): { isValid: boolean; mediaType?: 'image' | 'video'; mimeType?: string; error?: string } {
  if (!buffer || buffer.length < 8) {
    return { isValid: false, error: 'File is empty or corrupted.' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { isValid: true, mediaType: 'image', mimeType: 'image/png' };
  }

  // JPEG / JPG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, mediaType: 'image', mimeType: 'image/jpeg' };
  }

  // GIF: GIF87a or GIF89a (47 49 46 38)
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return { isValid: true, mediaType: 'image', mimeType: 'image/gif' };
  }

  // WEBP: RIFF....WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { isValid: true, mediaType: 'image', mimeType: 'image/webp' };
  }

  // MP4: offset 4 ftyp (66 74 79 70)
  if (
    buffer.length >= 12 &&
    buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70
  ) {
    return { isValid: true, mediaType: 'video', mimeType: 'video/mp4' };
  }

  // WEBM / MKV: 1A 45 DF A3
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return { isValid: true, mediaType: 'video', mimeType: 'video/webm' };
  }

  // QuickTime MOV: offset 4 moov or ftyp or wide or mdat
  const tag = buffer.subarray(4, 8).toString('utf-8');
  if (['moov', 'wide', 'mdat', 'free'].includes(tag)) {
    return { isValid: true, mediaType: 'video', mimeType: 'video/quicktime' };
  }

  return { isValid: false, error: 'Unsupported media format. Only PNG, JPEG, WebP, GIF, MP4, and WebM are permitted.' };
}

// ============================================================================
// 1. GET /api/feed/posts - Retrieve posts list
// ============================================================================
router.get('/posts', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const currentUserId = req.user?.id;

    const posts = await getFeedPosts(currentUserId, { limit, offset });
    res.json({
      success: true,
      data: posts,
      count: posts.length,
    });
  } catch (error: any) {
    console.error('[Feed API] Failed to fetch posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feed posts.',
      message: error?.message || 'Internal database error.',
    });
  }
});

// ============================================================================
// 2. POST /api/feed/posts - Create post
// ============================================================================
router.post('/posts', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { content, mediaUrl, mediaType, mediaItems } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Post content cannot be empty.',
      });
      return;
    }

    // Strict 2,500 word limit enforcement
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 2500) {
      res.status(400).json({
        success: false,
        error: 'WORD_LIMIT_EXCEEDED',
        message: `Post content exceeds the 2,500 word limit (${wordCount.toLocaleString()} words).`,
      });
      return;
    }

    let sanitizedMediaType: 'image' | 'video' | null = null;
    if (mediaType === 'image' || mediaType === 'video') {
      sanitizedMediaType = mediaType;
    }

    const post = await createFeedPost({
      userId,
      content: content.trim(),
      mediaUrl: mediaUrl || null,
      mediaType: sanitizedMediaType,
      mediaItems: Array.isArray(mediaItems) ? mediaItems : undefined,
      authorName: req.user?.fullName,
      authorEmail: req.user?.email,
    });

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error: any) {
    console.error('[Feed API] Failed to create post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create post.',
      message: error?.message || 'Server error.',
    });
  }
});

// ============================================================================
// 3. GET /api/feed/posts/:id - Single post details
// ============================================================================
router.get('/posts/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const postId = req.params.id;
    const post = await getPostById(postId, req.user?.id);

    if (!post) {
      res.status(404).json({
        success: false,
        error: 'POST_NOT_FOUND',
        message: 'Post not found.',
      });
      return;
    }

    res.json({
      success: true,
      data: post,
    });
  } catch (error: any) {
    console.error('[Feed API] Failed to fetch post:', error);
    res.status(500).json({
      success: false,
      error: 'Server error.',
    });
  }
});

// ============================================================================
// 4. PUT /api/feed/posts/:id - Edit post (Owner strictly verified)
// ============================================================================
router.put('/posts/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const postId = req.params.id;
    const userId = req.user!.id;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Post content cannot be empty.',
      });
      return;
    }

    // Strict 2,500 word limit enforcement
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 2500) {
      res.status(400).json({
        success: false,
        error: 'WORD_LIMIT_EXCEEDED',
        message: `Post content exceeds the 2,500 word limit (${wordCount.toLocaleString()} words).`,
      });
      return;
    }

    const updatedPost = await updateFeedPost(postId, userId, content.trim());
    if (!updatedPost) {
      res.status(404).json({
        success: false,
        error: 'POST_NOT_FOUND',
        message: 'Post not found.',
      });
      return;
    }

    res.json({
      success: true,
      data: updatedPost,
    });
  } catch (error: any) {
    if (error?.message === 'FORBIDDEN_NOT_OWNER') {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'You are not authorized to edit this post.',
      });
      return;
    }

    console.error('[Feed API] Failed to update post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update post.',
    });
  }
});

// ============================================================================
// 5. DELETE /api/feed/posts/:id - Delete post (Owner strictly verified)
// ============================================================================
router.delete('/posts/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const postId = req.params.id;
    const userId = req.user!.id;

    const deleted = await deleteFeedPost(postId, userId);
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'POST_NOT_FOUND',
        message: 'Post not found.',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Post deleted successfully.',
    });
  } catch (error: any) {
    if (error?.message === 'FORBIDDEN_NOT_OWNER') {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'You are not authorized to delete this post.',
      });
      return;
    }

    console.error('[Feed API] Failed to delete post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete post.',
    });
  }
});

// ============================================================================
// 6. POST /api/feed/posts/:id/like - Toggle like
// ============================================================================
router.post('/posts/:id/like', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const postId = req.params.id;
    const userId = req.user!.id;

    const result = await toggleFeedLike(postId, userId);
    res.json({
      success: true,
      liked: result.liked,
      likeCount: result.count,
    });
  } catch (error: any) {
    if (error?.message === 'POST_NOT_FOUND') {
      res.status(404).json({
        success: false,
        error: 'POST_NOT_FOUND',
        message: 'Post does not exist.',
      });
      return;
    }

    console.error('[Feed API] Failed to toggle like:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update like status.',
    });
  }
});

// ============================================================================
// 7. GET /api/feed/posts/:id/comments - Retrieve comments
// ============================================================================
router.get('/posts/:id/comments', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const postId = req.params.id;
    const comments = await getPostComments(postId);
    res.json({
      success: true,
      data: comments,
      count: comments.length,
    });
  } catch (error: any) {
    console.error('[Feed API] Failed to fetch comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments.',
    });
  }
});

// ============================================================================
// 8. POST /api/feed/posts/:id/comments - Add comment
// ============================================================================
router.post('/posts/:id/comments', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const postId = req.params.id;
    const userId = req.user!.id;
    const { content, parentId } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Comment content cannot be empty.',
      });
      return;
    }

    if (content.trim().length > 1000) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Comment exceeds maximum allowed length of 1,000 characters.',
      });
      return;
    }

    const comment = await addPostComment({
      postId,
      userId,
      content: content.trim(),
      parentId: parentId || null,
      authorName: req.user?.fullName,
      authorEmail: req.user?.email,
    });

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error: any) {
    if (error?.message === 'POST_NOT_FOUND') {
      res.status(404).json({
        success: false,
        error: 'POST_NOT_FOUND',
        message: 'Post does not exist.',
      });
      return;
    }

    console.error('[Feed API] Failed to add comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment.',
    });
  }
});

// ============================================================================
// 9. DELETE /api/feed/comments/:id - Delete comment
// ============================================================================
router.delete('/comments/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const commentId = req.params.id;
    const userId = req.user!.id;

    const deleted = await deletePostComment(commentId, userId);
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'COMMENT_NOT_FOUND',
        message: 'Comment not found.',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Comment deleted.',
    });
  } catch (error: any) {
    if (error?.message === 'FORBIDDEN_NOT_OWNER') {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'You can only delete your own comments.',
      });
      return;
    }

    console.error('[Feed API] Failed to delete comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment.',
    });
  }
});

// ============================================================================
// 10. GET /api/feed/profile/:id - Profile details & stats
// ============================================================================
router.get('/profile/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = req.params.id;
    const viewerUserId = req.user?.id;

    const profile = await getUserFeedProfile(targetUserId, viewerUserId);
    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'PROFILE_NOT_FOUND',
        message: 'User profile not found.',
      });
      return;
    }

    res.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    console.error('[Feed API] Failed to fetch profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile.',
    });
  }
});

// ============================================================================
// 11. GET /api/feed/profile/:id/posts - User's posts
// ============================================================================
router.get('/profile/:id/posts', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = req.params.id;
    const viewerUserId = req.user?.id;

    const posts = await getUserPosts(targetUserId, viewerUserId);
    res.json({
      success: true,
      data: posts,
      count: posts.length,
    });
  } catch (error: any) {
    console.error('[Feed API] Failed to fetch user posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts for user.',
    });
  }
});

// ============================================================================
// 12. GET /api/feed/profile/:id/likes - User's liked posts
// ============================================================================
router.get('/profile/:id/likes', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = req.params.id;
    const viewerUserId = req.user?.id;

    const posts = await getUserLikedPosts(targetUserId, viewerUserId);
    res.json({
      success: true,
      data: posts,
      count: posts.length,
    });
  } catch (error: any) {
    console.error('[Feed API] Failed to fetch liked posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch liked posts for user.',
    });
  }
});

// ============================================================================
// 12. POST /api/feed/profile/:id/follow - Follow / Unfollow user
// ============================================================================
router.post('/profile/:id/follow', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const followingId = req.params.id;
    const followerId = req.user!.id;

    if (followerId === followingId) {
      res.status(400).json({
        success: false,
        error: 'CANNOT_FOLLOW_SELF',
        message: 'You cannot follow yourself.',
      });
      return;
    }

    const result = await toggleFollowUser(followerId, followingId);
    res.json({
      success: true,
      following: result.following,
      followersCount: result.followersCount,
    });
  } catch (error: any) {
    if (error?.message === 'USER_NOT_FOUND') {
      res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'Target user does not exist.',
      });
      return;
    }

    console.error('[Feed API] Failed to toggle follow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update follow status.',
    });
  }
});

// ============================================================================
// 13. POST /api/feed/upload - Media Upload with strict 1MB video restriction & magic byte validation
// ============================================================================
router.post('/upload', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { base64Data } = req.body;

    if (!base64Data || typeof base64Data !== 'string') {
      res.status(400).json({
        success: false,
        error: 'MISSING_DATA',
        message: 'Media upload payload must include base64Data.',
      });
      return;
    }

    // Extract raw base64 data if prefixed with data URI scheme
    const commaIndex = base64Data.indexOf(',');
    const cleanBase64 = commaIndex !== -1 ? base64Data.slice(commaIndex + 1) : base64Data;

    let buffer: Buffer;
    try {
      buffer = Buffer.from(cleanBase64, 'base64');
    } catch {
      res.status(400).json({
        success: false,
        error: 'INVALID_BASE64',
        message: 'Failed to decode base64 binary content.',
      });
      return;
    }

    // Inspect binary content magic bytes
    const validation = validateMediaBinary(buffer);
    if (!validation.isValid || !validation.mediaType) {
      res.status(400).json({
        success: false,
        error: 'UNSUPPORTED_MEDIA_TYPE',
        message: validation.error || 'Invalid file format.',
      });
      return;
    }

    // File size safety ceilings:
    // Image: max 15 MB before compression
    // Video: max 100 MB before compression (1 MB restriction removed; duration <= 2 min enforced)
    const MAX_RAW_IMAGE_BYTES = 15 * 1024 * 1024;
    const MAX_RAW_VIDEO_BYTES = 100 * 1024 * 1024;

    if (validation.mediaType === 'image' && buffer.length > MAX_RAW_IMAGE_BYTES) {
      res.status(400).json({
        success: false,
        error: 'IMAGE_TOO_LARGE',
        message: 'Image file size exceeds maximum limit of 15 MB.',
      });
      return;
    }

    if (validation.mediaType === 'video' && buffer.length > MAX_RAW_VIDEO_BYTES) {
      res.status(400).json({
        success: false,
        error: 'VIDEO_TOO_LARGE',
        message: 'Video file size exceeds server upload limit of 100 MB.',
      });
      return;
    }

    let compressedBuffer: Buffer;
    let finalMimeType: string;
    let finalExt: string;
    let width: number | null = null;
    let height: number | null = null;
    let duration: number | null = null;
    let compressionPercentage = 0;

    if (validation.mediaType === 'image') {
      // 1. Sharp Image Compression:
      // Converts to WebP quality 80, max 1600x1600, strips metadata, preserves transparency
      const imageResult = await compressImage(buffer);
      compressedBuffer = imageResult.buffer;
      finalMimeType = imageResult.mimeType;
      finalExt = imageResult.extension;
      width = imageResult.width || null;
      height = imageResult.height || null;
      compressionPercentage = imageResult.compressionPercentage;
    } else {
      // 2. Video Validation & Compression:
      // Enforces duration <= 120s (2 minutes). Optimizes via FFmpeg if available.
      try {
        const videoResult = await processAndValidateVideo(buffer, {
          clientDuration: req.body?.duration,
          mimeType: validation.mimeType,
        });
        compressedBuffer = videoResult.buffer;
        finalMimeType = videoResult.mimeType;
        finalExt = videoResult.extension;
        duration = videoResult.duration || null;
        width = videoResult.width || null;
        height = videoResult.height || null;
        compressionPercentage = videoResult.compressionPercentage;
      } catch (videoErr: any) {
        if (videoErr?.message?.includes('VIDEO_TOO_LONG')) {
          res.status(400).json({
            success: false,
            error: 'VIDEO_TOO_LONG',
            message: videoErr.message.replace('VIDEO_TOO_LONG: ', ''),
          });
          return;
        }
        throw videoErr;
      }
    }

    // Generate collision-resistant unique filename
    const safeBaseName = crypto.randomBytes(16).toString('hex');
    const diskFilename = `${safeBaseName}.${finalExt}`;
    const filePath = path.join(UPLOADS_DIR, diskFilename);

    // Save compressed file to server local disk as cache/fallback
    await fs.promises.writeFile(filePath, compressedBuffer);

    // Upload compressed file to Cloudflare R2 object storage if configured
    const r2Key = `feed/${diskFilename}`;
    const r2Url = await uploadToR2(compressedBuffer, r2Key, finalMimeType);
    const publicUrl = r2Url || `/uploads/feed/${diskFilename}`;

    res.json({
      success: true,
      url: publicUrl,
      r2Key: r2Url ? r2Key : null,
      mediaType: validation.mediaType,
      sizeBytes: compressedBuffer.length,
      originalSizeBytes: buffer.length,
      compressionPercentage,
      mimeType: finalMimeType,
      width,
      height,
      duration,
      storage: r2Url ? 'cloudflare_r2' : 'local',
    });
  } catch (error: any) {
    console.error('[Feed API] Media upload failed:', error);
    res.status(500).json({
      success: false,
      error: 'UPLOAD_FAILED',
      message: error?.message || 'Server error saving uploaded media.',
    });
  }
});

export default router;
