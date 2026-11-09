import React, { useState, useRef } from 'react';
import { X, Camera, Loader2, AlertCircle, Check, User, Trash2, Sparkles } from 'lucide-react';
import { UserProfileFeed } from '../types';
import { feedApi } from '../services/feedApi';
import { getAvatarColor, getRandomBannerColor, getInitial } from '../utils/avatarUtils';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfileFeed;
  token: string;
  onProfileUpdated: (updated: UserProfileFeed) => void;
  accountAvatar?: string | null;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  token,
  onProfileUpdated,
  accountAvatar,
}) => {
  const initialAvatar = profile.avatar_url || accountAvatar || null;
  const [fullName, setFullName] = useState<string>(profile.full_name || '');
  const [username, setUsername] = useState<string>(profile.username || '');
  const [bio, setBio] = useState<string>(profile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatar);
  const [bannerUrl, setBannerUrl] = useState<string | null>(profile.banner_url || null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatar);
  const [bannerPreview, setBannerPreview] = useState<string | null>(profile.banner_url || null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Preset gradient backgrounds for quick selection
  const PRESET_BANNERS = [
    'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
    'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    'linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)',
    'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #065f46 100%)',
    'linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #991b1b 100%)',
    'linear-gradient(135deg, #172554 0%, #1e3a8a 50%, #1d4ed8 100%)',
  ];

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file (PNG, JPEG, WebP, GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Avatar image size must be under 10 MB.');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      setErrorMessage(null);

      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        setAvatarPreview(base64Data);

        try {
          const uploadRes = await feedApi.uploadMedia(base64Data, token);
          if (uploadRes?.url) {
            setAvatarUrl(uploadRes.url);
            setAvatarPreview(uploadRes.url);
          } else {
            // Fallback to base64
            setAvatarUrl(base64Data);
          }
        } catch (uploadErr) {
          console.warn('[EditProfileModal] Remote upload failed, keeping local preview:', uploadErr);
          setAvatarUrl(base64Data);
        } finally {
          setIsUploadingAvatar(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsUploadingAvatar(false);
      setErrorMessage(err.message || 'Failed to read avatar file.');
    }
  };

  const handleBannerFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file (PNG, JPEG, WebP, GIF).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Banner image size must be under 15 MB.');
      return;
    }

    try {
      setIsUploadingBanner(true);
      setErrorMessage(null);

      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        setBannerPreview(base64Data);

        try {
          const uploadRes = await feedApi.uploadMedia(base64Data, token);
          if (uploadRes?.url) {
            setBannerUrl(uploadRes.url);
            setBannerPreview(uploadRes.url);
          } else {
            setBannerUrl(base64Data);
          }
        } catch (uploadErr) {
          console.warn('[EditProfileModal] Remote upload failed, keeping local preview:', uploadErr);
          setBannerUrl(base64Data);
        } finally {
          setIsUploadingBanner(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsUploadingBanner(false);
      setErrorMessage(err.message || 'Failed to read banner file.');
    }
  };

  const validateUsername = (val: string): boolean => {
    const clean = val.trim().toLowerCase();
    if (!clean) {
      setUsernameError('Username cannot be empty.');
      return false;
    }
    if (clean.length < 3) {
      setUsernameError('Username must be at least 3 characters.');
      return false;
    }
    if (clean.length > 30) {
      setUsernameError('Username cannot exceed 30 characters.');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      setUsernameError('Username can only contain letters, numbers, and underscores.');
      return false;
    }
    setUsernameError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!validateUsername(cleanUsername)) {
      return;
    }

    const cleanFullName = fullName.trim();
    if (!cleanFullName) {
      setErrorMessage('Please enter your name.');
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await feedApi.updateProfile(
        {
          full_name: cleanFullName,
          username: cleanUsername,
          bio: bio.trim(),
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
        },
        token
      );

      // Persist banner locally for sidebar instant mirror
      try {
        if (bannerUrl) {
          localStorage.setItem(`gitoscale_sidebar_bg_${profile.id}`, bannerUrl);
        } else {
          localStorage.removeItem(`gitoscale_sidebar_bg_${profile.id}`);
        }
      } catch {}

      onProfileUpdated(updated);
      onClose();
    } catch (err: any) {
      console.error('[EditProfileModal] Update failed:', err);
      const resError = err?.response?.data?.error;
      const resMsg = err?.response?.data?.message;

      if (resError === 'USERNAME_TAKEN' || resMsg?.toLowerCase()?.includes('username')) {
        setUsernameError(resMsg || 'This username is already taken. Please choose another.');
      } else {
        setErrorMessage(resMsg || err.message || 'Failed to update profile. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] shadow-2xl">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800/80 bg-white/90 dark:bg-[#0A0A0A]/90 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Edit Profile
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-500 dark:text-neutral-400 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Global Error Banner */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Profile Banner / Cover Editor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">
              Profile Background Cover
            </label>
            <div className="relative h-32 sm:h-36 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-900 group">
              {bannerPreview ? (
                bannerPreview.startsWith('linear-gradient') ? (
                  <div className="w-full h-full" style={{ background: bannerPreview }} />
                ) : (
                  <img
                    src={bannerPreview}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div
                  className="w-full h-full"
                  style={{ background: getRandomBannerColor(profile.id || profile.username || fullName) }}
                />
              )}

              {/* Upload & Remove overlay actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={isUploadingBanner}
                  className="px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  {isUploadingBanner ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                  <span>Upload Image</span>
                </button>

                {bannerPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setBannerUrl(null);
                      setBannerPreview(null);
                    }}
                    className="p-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white cursor-pointer shadow-md transition-all"
                    title="Remove custom banner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerFileSelect}
                className="hidden"
              />
            </div>

            {/* Quick Preset Gradients */}
            <div className="mt-2 flex items-center gap-2 overflow-x-auto py-1">
              <span className="text-[11px] text-slate-400 dark:text-neutral-500 whitespace-nowrap">
                Or pick preset:
              </span>
              {PRESET_BANNERS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setBannerUrl(preset);
                    setBannerPreview(preset);
                  }}
                  style={{ background: preset }}
                  className={`w-6 h-6 rounded-full shrink-0 border-2 transition-transform cursor-pointer ${
                    bannerPreview === preset ? 'border-indigo-500 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                  }`}
                  title={`Preset ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* 2. Avatar Editor */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0 group">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-20 h-20 rounded-full object-cover border-4 border-slate-100 dark:border-neutral-800 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-indigo-600 text-white text-2xl font-bold flex items-center justify-center uppercase border-4 border-slate-100 dark:border-neutral-800 shadow-md">
                  {(fullName[0] || 'U')}
                </div>
              )}

              {/* Upload overlay */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                title="Change Avatar"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </button>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileSelect}
                className="hidden"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                Profile Avatar
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-900 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-800 dark:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Change Image
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarUrl(null);
                      setAvatarPreview(null);
                    }}
                    className="text-xs text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
              <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                Recommended: Square image at least 200x200px
              </span>
            </div>
          </div>

          {/* 3. Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* 4. Username (Strict Uniqueness) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">
              Username <span className="text-rose-500">*</span>
              <span className="text-[11px] font-normal text-slate-400 dark:text-neutral-500 ml-1.5">
                (Unique identifier across GitToScale)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 dark:text-neutral-500 select-none">
                @
              </span>
              <input
                type="text"
                required
                maxLength={30}
                value={username}
                onChange={(e) => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                  setUsername(val);
                  validateUsername(val);
                }}
                placeholder="your_handle"
                className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl text-xs font-mono border ${
                  usernameError
                    ? 'border-rose-400 dark:border-rose-600 ring-1 ring-rose-500'
                    : 'border-slate-200 dark:border-neutral-800'
                } bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all`}
              />
            </div>
            {usernameError ? (
              <p className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{usernameError}</span>
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-400 dark:text-neutral-500">
                Letters, numbers, and underscores only. 3–30 characters.
              </p>
            )}
          </div>

          {/* 5. Bio */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                Bio
              </label>
              <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono">
                {bio.length}/500
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other architects about yourself, your cloud focus, or systems you build..."
              className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isUploadingAvatar || isUploadingBanner || Boolean(usernameError)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
