export const MAX_VIDEO_BYTES = 1 * 1024 * 1024; // 1 MB
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

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
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `Video exceeds the 1 MB size limit (${sizeMb} MB). Please choose a shorter or compressed clip.`,
      };
    }
    return { valid: true, mediaType: 'video' };
  }

  if (isImage) {
    if (file.size > MAX_IMAGE_BYTES) {
      return {
        valid: false,
        error: 'Image file size exceeds the 5 MB limit.',
      };
    }
    return { valid: true, mediaType: 'image' };
  }

  return { valid: false, error: 'Invalid file.' };
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

