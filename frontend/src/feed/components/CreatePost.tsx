import React, { useState, useRef } from 'react';
import { Image, Video, X, Send, AlertCircle, Loader2, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { validateMediaFile, validateVideoFile, fileToBase64 } from '../utils/mediaValidation';
import { feedApi } from '../services/feedApi';
import { MediaItem } from '../types';
import { RichPostInput } from './RichPostInput';
import { extractAccountAvatar, getAvatarColor, getInitial } from '../utils/avatarUtils';

export interface InitialPostMedia {
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
}

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
  initialContent?: string;
  initialMedia?: InitialPostMedia[];
  onClearInitialMedia?: () => void;
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
  initialContent,
  initialMedia,
  onClearInitialMedia,
}) => {
  const [content, setContent] = useState(initialContent || '');
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>(() => {
    if (initialMedia && initialMedia.length > 0) {
      return initialMedia.map((m, i) => ({
        id: `init-${Date.now()}-${i}`,
        file: m.file,
        previewUrl: m.previewUrl,
        type: m.type,
      }));
    }
    return [];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
    }
    if (initialMedia && initialMedia.length > 0) {
      setSelectedMedia(
        initialMedia.map((m, i) => ({
          id: `init-${Date.now()}-${i}`,
          file: m.file,
          previewUrl: m.previewUrl,
          type: m.type,
        }))
      );
      setTimeout(() => {
        formContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [initialContent, initialMedia]);

  const handleSwap = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= selectedMedia.length) return;
    setSelectedMedia((prev) => {
      const copy = [...prev];
      const temp = copy[fromIdx];
      copy[fromIdx] = copy[toIdx];
      copy[toIdx] = temp;
      return copy;
    });
  };

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIdx: number) => {
    if (draggedIdx === null || draggedIdx === dropIdx) return;
    setSelectedMedia((prev) => {
      const copy = [...prev];
      const temp = copy[draggedIdx];
      copy[draggedIdx] = copy[dropIdx];
      copy[dropIdx] = temp;
      return copy;
    });
    setDraggedIdx(null);
  };

  if (!user) {
    return (
      <div className="w-full rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] p-4 sm:p-5 shadow-xs mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 shrink-0">
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
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors shrink-0 cursor-pointer text-center"
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
      setSelectedMedia((prev) => [...prev, ...newItems]);
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
    onClearInitialMedia?.();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && selectedMedia.length === 0) {
      setErrorMessage('Please write some content or upload an image/video.');
      return;
    }

    const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
    if (wordCount > 2500) {
      setErrorMessage(`Post exceeds the 2,500 word limit (${wordCount.toLocaleString()} / 2,500 words).`);
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
          r2Key: uploadResult.r2Key,
        });
      }

      // Preserves the user's custom swapped media order
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

  const avatarUrl = extractAccountAvatar(user);
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <div
      ref={formContainerRef}
      className="w-full rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] p-3.5 sm:p-5 shadow-xs mb-4 sm:mb-6 transition-colors"
    >
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3 items-start">
          {/* User Avatar: Desktop only so small screen retains 100% input width */}
          <div className="hidden sm:block shrink-0 pt-0.5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-neutral-700"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full text-white flex items-center justify-center text-xs font-bold uppercase shadow-xs"
                style={{ background: getAvatarColor(user?.id || displayName) }}
              >
                {getInitial(displayName)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <RichPostInput
              value={content}
              onChange={(val) => {
                setContent(val);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="What are you designing? Share an architecture, question, or latency finding..."
              rows={3}
              disabled={isSubmitting}
              minHeight="95px"
              maxWords={2500}
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
              {selectedMedia.length > 1 && (
                <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                  <span className="hidden sm:inline">Click arrows or drag to swap places</span>
                  <span className="sm:hidden">Tap arrows to reorder</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {selectedMedia.map((item, idx) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(idx)}
                  className={`relative group rounded-lg overflow-hidden border border-slate-200 dark:border-neutral-700 bg-black aspect-video flex items-center justify-center cursor-grab active:cursor-grabbing transition-all ${
                    draggedIdx === idx ? 'opacity-40 ring-2 ring-indigo-500 scale-95' : 'hover:border-slate-400 dark:hover:border-neutral-500'
                  }`}
                >
                  {item.type === 'video' ? (
                    <div className="w-full h-full relative flex items-center justify-center">
                      <video
                        src={item.previewUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover opacity-80 pointer-events-none"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Play className="w-5 h-5 text-white drop-shadow-md" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.previewUrl}
                      alt="Attachment preview"
                      className="w-full h-full object-cover pointer-events-none select-none"
                    />
                  )}

                  {/* Clean Reorder Arrows: compact, positioned at bottom corners without blocking the preview image */}
                  {selectedMedia.length > 1 && (
                    <div className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-between pointer-events-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSwap(idx, idx - 1);
                        }}
                        disabled={idx === 0}
                        className="p-1 rounded-md bg-black/80 hover:bg-black text-white disabled:opacity-25 transition-colors cursor-pointer disabled:cursor-not-allowed shadow-xs"
                        title="Move left"
                        aria-label="Move left"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSwap(idx, idx + 1);
                        }}
                        disabled={idx === selectedMedia.length - 1}
                        className="p-1 rounded-md bg-black/80 hover:bg-black text-white disabled:opacity-25 transition-colors cursor-pointer disabled:cursor-not-allowed shadow-xs"
                        title="Move right"
                        aria-label="Move right"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveItem(item.id);
                    }}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/80 hover:bg-rose-600 text-white transition-colors cursor-pointer z-10"
                    title="Remove this media"
                    aria-label="Remove media"
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

        {/* Footer Actions: Touch-friendly heights and responsive spacing */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = 'image/png,image/jpeg,image/webp,image/gif';
                  fileInputRef.current.click();
                }
              }}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg text-xs font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 border border-transparent hover:border-slate-200 dark:hover:border-neutral-700 transition-colors cursor-pointer"
              title="Add Images (multiple supported)"
              aria-label="Add Images"
            >
              <Image className="w-4 h-4 text-slate-500 dark:text-neutral-400 shrink-0" />
              <span className="text-xs">Photo</span>
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
              className="flex items-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg text-xs font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 border border-transparent hover:border-slate-200 dark:hover:border-neutral-700 transition-colors cursor-pointer"
              title="Add Video (≤ 2 Min)"
              aria-label="Add Video"
            >
              <Video className="w-4 h-4 text-slate-500 dark:text-neutral-400 shrink-0" />
              <span className="text-xs">Video</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {(content || selectedMedia.length > 0) && (
              <button
                type="button"
                onClick={handleResetForm}
                disabled={isSubmitting}
                className="h-8 sm:h-9 px-3 rounded-lg text-xs font-medium text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || (!content.trim() && selectedMedia.length === 0)}
              className="flex items-center gap-1.5 h-8 sm:h-9 px-4 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white shadow-xs transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <span>Publish</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
