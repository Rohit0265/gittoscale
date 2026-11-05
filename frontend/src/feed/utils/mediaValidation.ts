export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB input limit
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // 25 MB input limit
export const MAX_VIDEO_DURATION_SECONDS = 120; // 2 minutes maximum length

export interface MediaValidationResult {
  valid: boolean;
  error?: string;
  mediaType?: 'image' | 'video';
}

export function validateMediaFile(file: File): MediaValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name);
  const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);

  if (!isVideo && !isImage) {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload an image (PNG, JPG, WebP, GIF) or video (MP4, WebM).',
    };
  }

  if (isVideo) {
    if (file.size > MAX_VIDEO_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `Video file (${sizeMb} MB) exceeds maximum upload payload limit of 50 MB.`,
      };
    }
    return { valid: true, mediaType: 'video' };
  }

  if (isImage) {
    if (file.size > MAX_IMAGE_BYTES) {
      return {
        valid: false,
        error: 'Image file size exceeds the 25 MB limit.',
      };
    }
    return { valid: true, mediaType: 'image' };
  }

  return { valid: false, error: 'Invalid file.' };
}

/**
 * Extracts duration and dimensions from a video file in browser.
 */
export function getVideoMetadata(file: File): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({
        duration: video.duration || 0,
        width: video.videoWidth || 0,
        height: video.videoHeight || 0,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      // Fallback if browser can't decode metadata immediately
      resolve({ duration: 0, width: 0, height: 0 });
    };

    video.src = url;
  });
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

