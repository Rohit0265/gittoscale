import React, { useState, useRef } from 'react';
import { Image, Video, X, Send, AlertCircle, Loader2, Play } from 'lucide-react';
import { validateMediaFile, validateVideoFile, fileToBase64 } from '../utils/mediaValidation';
import { feedApi } from '../services/feedApi';
import { MediaItem } from '../types';

interface CreatePostProps {
  user?: any;
  token?: string | null;
  onPostCreated: (
    content: string,
    mediaUrl?: string | null,
    mediaType?: 'image' | 'video' | null,
    mediaItems?: MediaItem[]
  ) => Promise<any>;
  onOpenSignIn?: () => void;
}

interface SelectedMedia {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
}

export const CreatePost: React.FC<CreatePostProps> = ({
  user,
  token,
  onPostCreated,
  onOpenSignIn,
}) => {
  const [content, setContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
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

  const handleSelectFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: SelectedMedia[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateMediaFile(file);

      if (!validation.valid || !validation.mediaType) {
        setErrorMessage(validation.error || `File "${file.name}" is invalid.`);
        continue;
      }

      // If video, validate length <= 2 minutes (120s)
      if (validation.mediaType === 'video') {
        const videoValidation = await validateVideoFile(file);
        if (!videoValidation.valid) {
          setErrorMessage(videoValidation.error || 'Video exceeds the 2 minute maximum length restriction.');
          continue;
        }
      }

      const previewUrl = URL.createObjectURL(file);
      newItems.push({
        id: `${file.name}-${Date.now()}-${i}`,
        file,
        previewUrl,
        type: validation.mediaType,
      });
    }

    if (newItems.length > 0) {
      setSelectedMedia((prev) => {
        const merged = [...prev, ...newItems];
        // Enforce: "remember if user upload any video keep it at first showing"
        merged.sort((a, b) => (a.type === 'video' ? -1 : b.type === 'video' ? 1 : 0));
        return merged;
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveItem = (id: string) => {
    setSelectedMedia((prev) => {
      const target = prev.find((m) => m.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((m) => m.id !== id);
    });
  };

  const handleResetForm = () => {
    setContent('');
    selectedMedia.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    setSelectedMedia([]);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && selectedMedia.length === 0) {
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

      const uploadedItems: MediaItem[] = [];

      for (const item of selectedMedia) {
        const base64Data = await fileToBase64(item.file);
        const uploadResult = await feedApi.uploadMedia(base64Data, token);
        uploadedItems.push({
          url: uploadResult.url,
          type: uploadResult.mediaType,
        });
      }

      // Enforce: "remember if user upload any video keep it at first showing"
      uploadedItems.sort((a, b) => (a.type === 'video' ? -1 : b.type === 'video' ? 1 : 0));

      const primaryUrl = uploadedItems[0]?.url || null;
      const primaryType = uploadedItems[0]?.type || null;

      await onPostCreated(content.trim(), primaryUrl, primaryType, uploadedItems);
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

        {/* Media Preview Gallery */}
        {selectedMedia.length > 0 && (
          <div className="mt-3 p-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
                Attached Media ({selectedMedia.length})
              </span>
              <span className="text-[11px] text-slate-400">
                Videos are automatically positioned first
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {selectedMedia.map((item, idx) => (
                <div
                  key={item.id}
                  className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-neutral-700 bg-black aspect-video flex items-center justify-center"
                >
                  {item.type === 'video' ? (
                    <div className="w-full h-full relative flex items-center justify-center">
                      <video
                        src={item.previewUrl}
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-6 h-6 text-white drop-shadow-md" />
                      </div>
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-sm bg-red-600 text-[10px] font-bold text-white uppercase tracking-wider">
                        Video 1st
                      </span>
                    </div>
                  ) : (
                    <img
                      src={item.previewUrl}
                      alt="Attachment preview"
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Slot Number Badge */}
                  <span className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/70 text-[10px] font-bold text-white flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/80 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                    title="Remove this media"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
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

        {/* Hidden Multiple File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
          onChange={handleSelectFiles}
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
              title="Add Images (multiple supported)"
            >
              <Image className="w-4 h-4 text-emerald-500" />
              <span className="hidden sm:inline">Images</span>
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
              title="Add Video (≤ 1MB, shown first)"
            >
              <Video className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">Video (≤ 1MB)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {(content || selectedMedia.length > 0) && (
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
              disabled={isSubmitting || (!content.trim() && selectedMedia.length === 0)}
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

