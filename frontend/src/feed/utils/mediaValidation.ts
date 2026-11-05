export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB for images
export const MAX_VIDEO_DURATION_SECONDS = 120; // 2 minutes maximum video duration

export interface MediaValidationResult {
  valid: boolean;
  error?: string;
  mediaType?: 'image' | 'video';
  duration?: number;
}

/**
 * Synchronous basic validation for file types and image size.
 */
export function validateMediaFile(file: File): MediaValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
  const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);

  if (!isVideo && !isImage) {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload an image (PNG, JPG, WebP, GIF) or video (MP4, WebM).',
    };
  }

  if (isVideo) {
    // 1 MB limit removed. Only duration <= 2 min (120s) is restricted.
    return { valid: true, mediaType: 'video' };
  }

  if (isImage) {
    if (file.size > MAX_IMAGE_BYTES) {
      return {
        valid: false,
        error: 'Image file size exceeds the 10 MB limit.',
      };
    }
    return { valid: true, mediaType: 'image' };
  }

  return { valid: false, error: 'Invalid file.' };
}

/**
 * Extracts video duration in seconds from a File object.
 */
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to read video metadata.'));
    };

    video.src = objectUrl;
  });
}

/**
 * Asynchronously validates video file, strictly checking that duration <= 2 minutes (120s).
 */
export async function validateVideoFile(file: File): Promise<MediaValidationResult> {
  const syncCheck = validateMediaFile(file);
  if (!syncCheck.valid || syncCheck.mediaType !== 'video') {
    return syncCheck;
  }

  try {
    const duration = await getVideoDuration(file);
    // Allow slight tolerance (1.5 seconds) for container header variance
    if (duration > MAX_VIDEO_DURATION_SECONDS + 1.5) {
      const mins = Math.floor(duration / 60);
      const secs = Math.round(duration % 60);
      const formatted = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      return {
        valid: false,
        error: `Video duration (${formatted}) exceeds the maximum allowed length of 2 minutes (120 seconds).`,
      };
    }
    return { valid: true, mediaType: 'video', duration };
  } catch (err: any) {
    // If the browser fails to load metadata, let the backend ffprobe validate duration
    return { valid: true, mediaType: 'video' };
  }
}

/**
 * Converts a File object to base64 data string.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
