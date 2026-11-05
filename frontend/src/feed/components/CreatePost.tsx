import React, { useState, useRef } from 'react';
import { Image, Video, X, Send, AlertCircle, Loader2 } from 'lucide-react';
import { validateMediaFile, fileToBase64 } from '../utils/mediaValidation';
import { feedApi } from '../services/feedApi';

interface CreatePostProps {
  user?: any;
  token?: string | null;
  onPostCreated: (content: string, mediaUrl?: string | null, mediaType?: 'image' | 'video' | null) => Promise<any>;
  onOpenSignIn?: () => void;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validation = validateMediaFile(file);

    if (!validation.valid || !validation.mediaType) {
      setErrorMessage(validation.error || 'Invalid file format.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
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
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetForm = () => {
    setContent('');
    handleRemoveMedia();
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      let uploadedMediaUrl: string | null = null;
      let finalMediaType: 'image' | 'video' | null = null;

      if (mediaFile && mediaType) {
        // Convert to base64 for secure upload
        const base64Data = await fileToBase64(mediaFile);
        const uploadResult = await feedApi.uploadMedia(base64Data, token);
        uploadedMediaUrl = uploadResult.url;
        finalMediaType = uploadResult.mediaType;
      }

      await onPostCreated(content.trim(), uploadedMediaUrl, finalMediaType);
      handleResetForm();
    } catch (err: any) {
      console.error('[CreatePost] Publish failed:', err);
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to publish post.');
    } finally {
      setIsSubmitting(false);
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
              placeholder="What are you designing? Share a system architecture, question, or latency finding..."
              rows={3}
              maxLength={3000}
              className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-hidden resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Media Preview Box */}
        {mediaPreviewUrl && (
          <div className="relative mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 max-h-96 flex items-center justify-center">
            {mediaType === 'image' ? (
              <img
                src={mediaPreviewUrl}
                alt="Upload preview"
                className="max-h-96 w-auto object-contain rounded-xl"
              />
            ) : (
              <div className="w-full flex flex-col items-center p-2">
                <video
                  src={mediaPreviewUrl}
                  controls
                  className="max-h-80 w-full rounded-lg"
                />
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                  Video preview ({mediaFile ? (mediaFile.size / (1024 * 1024)).toFixed(2) : 0} MB, max 1 MB)
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleRemoveMedia}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition-colors cursor-pointer"
              title="Remove media"
            >
              <X className="w-4 h-4" />
            </button>
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Add Video (Max 1 MB)"
            >
              <Video className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">Video (≤ 1MB)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {(content || mediaFile) && (
              <button
                type="button"
                onClick={handleResetForm}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
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

