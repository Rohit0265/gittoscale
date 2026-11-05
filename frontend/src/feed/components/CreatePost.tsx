import React, { useState, useRef } from 'react';
import { Image, Video, X, Send, AlertCircle, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import {
  validateMediaFile,
  fileToBase64,
  getVideoMetadata,
  MAX_VIDEO_DURATION_SECONDS,
} from '../utils/mediaValidation';
import { feedApi } from '../services/feedApi';

interface CreatePostProps {
  user?: any;
  token?: string | null;
  onPostCreated: (
    content: string,
    mediaUrl?: string | null,
    mediaType?: 'image' | 'video' | null,
    mediaMetadata?: any
  ) => Promise<any>;
  onOpenSignIn?: () => void;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

export const CreatePost: React.FC<CreatePostProps> = ({
  user,
  token,
  onPostCreated,
  onOpenSignIn,
}) => {
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [compressionResult, setCompressionResult] = useState<{
    originalSize: number;
    compressedSize: number;
    compressionPercentage: number;
    mimeType: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="w-full rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] p-4 sm:p-5 shadow-xs mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Have a system design insight?</h4>
              <p className="text-xs text-slate-500 dark:text-neutral-400">Sign in to share architecture diagrams, questions, and insights.</p>
            </div>
          </div>
          {onOpenSignIn && (
            <button
              onClick={onOpenSignIn}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              Sign In to Post
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setCompressionResult(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validation = validateMediaFile(file);

    if (!validation.valid || !validation.mediaType) {
      setErrorMessage(validation.error || 'Invalid file format.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Video duration validation (Strict 2-minute / 120-second limit)
    if (validation.mediaType === 'video') {
      try {
        const meta = await getVideoMetadata(file);
        if (meta.duration > MAX_VIDEO_DURATION_SECONDS) {
          setErrorMessage(
            `Video duration (${formatDuration(meta.duration)}) exceeds the maximum allowed length of 2 minutes (120s). Please trim or select a shorter video.`
          );
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
        setVideoDuration(meta.duration);
      } catch (err: any) {
        console.warn('Could not read video metadata in browser:', err);
      }
    } else {
      setVideoDuration(null);
    }

    setMediaFile(file);
    setMediaType(validation.mediaType);

    // Create object URL for instant preview
    const previewUrl = URL.createObjectURL(file);
    setMediaPreviewUrl(previewUrl);
  };

  const handleRemoveMedia = () => {
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    setMediaFile(null);
    setMediaPreviewUrl(null);
    setMediaType(null);
    setVideoDuration(null);
    setErrorMessage(null);
    setCompressionResult(null);
    setUploadProgress(0);
    setUploadStatusText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetForm = () => {
    setContent('');
    handleRemoveMedia();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate uploads

    if (!content.trim() && !mediaFile) {
      setErrorMessage('Please write some content or upload an image/video.');
      return;
    }

    if (!token) {
      setErrorMessage('You must be signed in.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setUploadProgress(10);
      setUploadStatusText('Preparing media...');

      let uploadedMediaUrl: string | null = null;
      let finalMediaType: 'image' | 'video' | null = null;
      let mediaMetadata: any = null;

      if (mediaFile && mediaType) {
        setUploadStatusText(
          mediaType === 'image'
            ? 'Optimizing image (WebP 1600px, 80% quality)...'
            : 'Uploading & validating video clip...'
        );

        // Convert to base64 for secure upload
        const base64Data = await fileToBase64(mediaFile);
        setUploadProgress(40);

        const uploadResult = await feedApi.uploadMedia(
          base64Data,
          token,
          videoDuration ?? undefined,
          (progressEvent) => {
            if (progressEvent.total) {
              const pct = Math.round((progressEvent.loaded * 50) / progressEvent.total) + 40;
              setUploadProgress(Math.min(pct, 95));
            }
          }
        );

        uploadedMediaUrl = uploadResult.url;
        finalMediaType = uploadResult.mediaType;
        mediaMetadata = uploadResult.mediaMetadata || null;

        if (mediaMetadata) {
          setCompressionResult({
            originalSize: mediaMetadata.originalSizeBytes || mediaFile.size,
            compressedSize: mediaMetadata.sizeBytes || mediaFile.size,
            compressionPercentage: mediaMetadata.compressionPercentage || 0,
            mimeType: mediaMetadata.mimeType || (mediaType === 'image' ? 'image/webp' : 'video/mp4'),
          });
        }
      }

      setUploadProgress(98);
      setUploadStatusText('Publishing post...');

      await onPostCreated(content.trim(), uploadedMediaUrl, finalMediaType, mediaMetadata);
      handleResetForm();
    } catch (err: any) {
      console.error('[CreatePost] Publish failed:', err);
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Failed to publish post. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
      setUploadStatusText('');
    }
  };

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'You';
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] p-4 sm:p-5 shadow-xs mb-6 transition-colors">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-neutral-700 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center uppercase shrink-0">
              {displayName[0]}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              disabled={isSubmitting}
              placeholder="What are you designing? Share a system architecture, question, or latency finding..."
              rows={3}
              maxLength={3000}
              className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-hidden resize-none leading-relaxed disabled:opacity-60"
            />
          </div>
        </div>

        {/* Media Preview Box */}
        {mediaPreviewUrl && (
          <div className="relative mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 max-h-96 flex flex-col items-center justify-center p-2">
            {mediaType === 'image' ? (
              <img
                src={mediaPreviewUrl}
                alt="Upload preview"
                className="max-h-80 w-auto object-contain rounded-lg"
              />
            ) : (
              <div className="w-full flex flex-col items-center">
                <video
                  src={mediaPreviewUrl}
                  controls
                  playsInline
                  className="max-h-72 w-full rounded-lg bg-black"
                />
              </div>
            )}

            {/* Media Info Pill */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-slate-200/80 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 font-medium">
                {mediaType === 'image' ? 'Image' : 'Video'}: {mediaFile ? formatBytes(mediaFile.size) : '0 B'}
              </span>
              {videoDuration !== null && videoDuration > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium">
                  Length: {formatDuration(videoDuration)} (max 2m)
                </span>
              )}
              {mediaType === 'image' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium">
                  <Sparkles className="w-3 h-3" />
                  Auto-converts to WebP (≤ 1600px, 80% Q)
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleRemoveMedia}
              disabled={isSubmitting}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition-colors cursor-pointer disabled:opacity-40"
              title="Remove media"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Compression Statistics Banner (if available) */}
        {compressionResult && (
          <div className="mt-3 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Optimized: <strong>{formatBytes(compressionResult.originalSize)}</strong> →{' '}
                <strong>{formatBytes(compressionResult.compressedSize)}</strong>
              </span>
            </div>
            {compressionResult.compressionPercentage > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 font-semibold">
                -{compressionResult.compressionPercentage}% saved
              </span>
            )}
          </div>
        )}

        {/* Upload Progress Bar */}
        {isSubmitting && uploadProgress > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                {uploadStatusText || 'Uploading media...'}
              </span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
          onChange={handleSelectFile}
          disabled={isSubmitting}
          className="hidden"
        />

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = 'image/png,image/jpeg,image/webp,image/gif';
                  fileInputRef.current.click();
                }
              }}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors cursor-pointer"
              title="Add Image"
            >
              <Image className="w-4 h-4 text-emerald-500" />
              <span className="hidden sm:inline">Image</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = 'video/mp4,video/webm';
                  fileInputRef.current.click();
                }
              }}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors cursor-pointer"
              title="Add Video (Max 2 minutes)"
            >
              <Video className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">Video (≤ 2 min)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {(content || mediaFile) && (
              <button
                type="button"
                onClick={handleResetForm}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || (!content.trim() && !mediaFile)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white shadow-xs transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
