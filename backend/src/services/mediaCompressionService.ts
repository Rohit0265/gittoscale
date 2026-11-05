import sharp from 'sharp';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

export interface ImageCompressionResult {
  buffer: Buffer;
  mimeType: 'image/webp';
  extension: 'webp';
  sizeBytes: number;
  originalSizeBytes: number;
  compressionPercentage: number;
  width?: number | null;
  height?: number | null;
}

export interface VideoCompressionResult {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  originalSizeBytes: number;
  compressionPercentage: number;
  duration?: number | null;
  width?: number | null;
  height?: number | null;
  compressedWithFfmpeg: boolean;
}

/**
 * Checks if ffmpeg command is available in system PATH.
 */
export function isFfmpegAvailable(): boolean {
  try {
    const res = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    return res.status === 0;
  } catch {
    return false;
  }
}

/**
 * Checks if ffprobe command is available in system PATH.
 */
export function isFfprobeAvailable(): boolean {
  try {
    const res = spawnSync('ffprobe', ['-version'], { stdio: 'ignore' });
    return res.status === 0;
  } catch {
    return false;
  }
}

/**
 * Inspects MP4 header (moov -> mvhd atom) directly from buffer to compute duration without native dependencies.
 */
export function parseMp4DurationFromBuffer(buffer: Buffer): number | null {
  try {
    // Search for 'mvhd' box header (0x6d766864)
    const mvhdSignature = Buffer.from([0x6d, 0x76, 0x68, 0x64]);
    const idx = buffer.indexOf(mvhdSignature);
    if (idx === -1 || idx + 28 > buffer.length) return null;

    // The atom header is: [4 bytes length][4 bytes 'mvhd']
    // Right after 'mvhd' is 1 byte version, 3 bytes flags
    const version = buffer.readUInt8(idx + 4);

    let timescale: number;
    let duration: number;

    if (version === 1) {
      // 64-bit creation_time (8), modification_time (8)
      // timescale at +4 (version/flags) + 16 = 20
      // duration at +24 (8 bytes)
      if (idx + 36 > buffer.length) return null;
      timescale = buffer.readUInt32BE(idx + 24);
      const durationBig = buffer.readBigUInt64BE(idx + 28);
      duration = Number(durationBig);
    } else {
      // 32-bit creation_time (4), modification_time (4)
      // timescale at idx + 16
      // duration at idx + 20
      if (idx + 24 > buffer.length) return null;
      timescale = buffer.readUInt32BE(idx + 16);
      duration = buffer.readUInt32BE(idx + 20);
    }

    if (!timescale || timescale <= 0 || !duration || duration <= 0) {
      return null;
    }

    const durationSeconds = duration / timescale;
    return Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : null;
  } catch {
    return null;
  }
}

/**
 * Compresses an image with Sharp:
 * - Max dimensions 1600 × 1600 while preserving aspect ratio.
 * - Converts to WebP quality 80.
 * - Removes unnecessary EXIF/IPTC metadata.
 * - Preserves transparency channels.
 */
export async function compressImage(buffer: Buffer): Promise<ImageCompressionResult> {
  const originalSizeBytes = buffer.length;

  try {
    // Process with sharp
    const sharpInstance = sharp(buffer);
    const originalMeta = await sharpInstance.metadata();

    const outputBuffer = await sharp(buffer)
      .rotate() // auto-orient based on EXIF before stripping
      .resize({
        width: 1600,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: 80,
        effort: 4,
        alphaQuality: 85,
      })
      .toBuffer();

    const outMeta = await sharp(outputBuffer).metadata();
    const sizeBytes = outputBuffer.length;
    const compressionPercentage = Math.max(
      0,
      Math.round(((originalSizeBytes - sizeBytes) / originalSizeBytes) * 10000) / 100
    );

    return {
      buffer: outputBuffer,
      mimeType: 'image/webp',
      extension: 'webp',
      sizeBytes,
      originalSizeBytes,
      compressionPercentage,
      width: outMeta.width || originalMeta.width || null,
      height: outMeta.height || originalMeta.height || null,
    };
  } catch (err: any) {
    console.warn('[Media Compression] Sharp image compression warning/fallback:', err.message);
    return {
      buffer,
      mimeType: 'image/webp',
      extension: 'webp',
      sizeBytes: buffer.length,
      originalSizeBytes,
      compressionPercentage: 0,
      width: null,
      height: null,
    };
  }
}

/**
 * Ensures a dedicated temporary directory exists inside /tmp for media processing.
 */
function ensureTempDir(): string {
  const tmpDir = path.join(os.tmpdir(), 'gitoscale_media');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  return tmpDir;
}

/**
 * Validates video duration and optimizes/transcodes if FFmpeg is available.
 * Maximum duration allowed: 120 seconds (2 minutes).
 */
export async function processAndValidateVideo(
  buffer: Buffer,
  options: {
    clientDuration?: number | null;
    mimeType?: string;
  } = {}
): Promise<VideoCompressionResult> {
  const originalSizeBytes = buffer.length;
  const MAX_DURATION_SECONDS = 120; // 2 minutes

  let detectedDuration: number | null = parseMp4DurationFromBuffer(buffer);
  let detectedWidth: number | null = null;
  let detectedHeight: number | null = null;

  // If ffprobe is available, get exact duration and dimensions
  if (isFfprobeAvailable()) {
    const tmpDir = ensureTempDir();
    const tmpInput = path.join(tmpDir, `ffprobe_${crypto.randomUUID()}.mp4`);
    try {
      await fs.promises.writeFile(tmpInput, buffer);
      const probeRes = spawnSync(
        'ffprobe',
        [
          '-v',
          'error',
          '-show_entries',
          'format=duration:stream=width,height',
          '-of',
          'json',
          tmpInput,
        ],
        { encoding: 'utf8', timeout: 5000 }
      );

      if (probeRes.status === 0 && probeRes.stdout) {
        const parsed = JSON.parse(probeRes.stdout);
        const formatDuration = parseFloat(parsed.format?.duration);
        if (Number.isFinite(formatDuration) && formatDuration > 0) {
          detectedDuration = formatDuration;
        }
        const firstStream = parsed.streams?.[0];
        if (firstStream) {
          detectedWidth = firstStream.width || null;
          detectedHeight = firstStream.height || null;
        }
      }
    } catch (e: any) {
      console.warn('[Media Compression] ffprobe inspection warning:', e.message);
    } finally {
      try {
        await fs.promises.unlink(tmpInput);
      } catch {}
    }
  }

  // Fallback to client-provided duration if binary parsing didn't find duration
  const finalDuration = detectedDuration ?? options.clientDuration ?? null;

  // Enforce 2 minutes (120 seconds) maximum duration rule
  if (finalDuration !== null && finalDuration > MAX_DURATION_SECONDS + 1.5) {
    const mins = Math.floor(finalDuration / 60);
    const secs = Math.round(finalDuration % 60);
    const formatted = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    throw new Error(
      `VIDEO_TOO_LONG: Video duration (${formatted}) exceeds the maximum allowed length of 2 minutes (120 seconds).`
    );
  }

  // Attempt FFmpeg compression if available
  if (isFfmpegAvailable()) {
    const tmpDir = ensureTempDir();
    const tmpId = crypto.randomUUID();
    const tmpIn = path.join(tmpDir, `ffmpeg_in_${tmpId}.mp4`);
    const tmpOut = path.join(tmpDir, `ffmpeg_out_${tmpId}.mp4`);

    try {
      await fs.promises.writeFile(tmpIn, buffer);

      // Run FFmpeg to transcode to H.264/AAC with faststart and crf 28
      const ffmpegRes = spawnSync(
        'ffmpeg',
        [
          '-y',
          '-i',
          tmpIn,
          '-c:v',
          'libx264',
          '-preset',
          'fast',
          '-crf',
          '28',
          '-vf',
          "scale='min(1280,iw)':-2",
          '-c:a',
          'aac',
          '-b:a',
          '128k',
          '-movflags',
          '+faststart',
          tmpOut,
        ],
        { timeout: 30000, stdio: 'ignore' }
      );

      if (ffmpegRes.status === 0 && fs.existsSync(tmpOut)) {
        const compressedBuffer = await fs.promises.readFile(tmpOut);
        const sizeBytes = compressedBuffer.length;
        const compressionPercentage = Math.max(
          0,
          Math.round(((originalSizeBytes - sizeBytes) / originalSizeBytes) * 10000) / 100
        );

        return {
          buffer: compressedBuffer,
          mimeType: 'video/mp4',
          extension: 'mp4',
          sizeBytes,
          originalSizeBytes,
          compressionPercentage,
          duration: finalDuration,
          width: detectedWidth,
          height: detectedHeight,
          compressedWithFfmpeg: true,
        };
      }
    } catch (e: any) {
      console.warn('[Media Compression] FFmpeg optimization failed, falling back:', e.message);
    } finally {
      try {
        if (fs.existsSync(tmpIn)) await fs.promises.unlink(tmpIn);
        if (fs.existsSync(tmpOut)) await fs.promises.unlink(tmpOut);
      } catch {}
    }
  }

  // If FFmpeg is not installed or failed, preserve buffer gracefully
  return {
    buffer,
    mimeType: options.mimeType || 'video/mp4',
    extension: options.mimeType?.includes('webm') ? 'webm' : 'mp4',
    sizeBytes: buffer.length,
    originalSizeBytes,
    compressionPercentage: 0,
    duration: finalDuration,
    width: detectedWidth,
    height: detectedHeight,
    compressedWithFfmpeg: false,
  };
}
