/**
 * Avatar & Profile Presentation Utilities
 *
 * Resolves account avatars from OAuth metadata and provides vibrant,
 * deterministic fallback background colors and banner gradients.
 */

// Curated vibrant hex colors for avatar circle backgrounds
export const AVATAR_PALETTE = [
  '#4f46e5', // Indigo
  '#059669', // Emerald
  '#7c3aed', // Violet
  '#db2777', // Pink
  '#d97706', // Amber
  '#0284c7', // Sky
  '#dc2626', // Red
  '#0d9488', // Teal
  '#9333ea', // Purple
  '#ea580c', // Orange
  '#2563eb', // Royal Blue
  '#16a34a', // Green
];

// Curated modern gradients for profile cover / background image fallbacks
export const BANNER_GRADIENT_PALETTE = [
  'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)', // Indigo -> Violet -> Pink
  'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)', // Sky -> Blue -> Indigo
  'linear-gradient(135deg, #059669 0%, #0d9488 50%, #2563eb 100%)', // Emerald -> Teal -> Blue
  'linear-gradient(135deg, #ea580c 0%, #d97706 50%, #ca8a04 100%)', // Orange -> Amber -> Gold
  'linear-gradient(135deg, #9333ea 0%, #c026d3 50%, #e11d48 100%)', // Purple -> Fuchsia -> Rose
  'linear-gradient(135deg, #be185d 0%, #e11d48 50%, #f97316 100%)', // Berry -> Red -> Orange
  'linear-gradient(135deg, #047857 0%, #15803d 50%, #84cc16 100%)', // Forest -> Green -> Lime
  'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)', // Blue -> Violet -> Pink
];

/**
 * Returns a deterministic hash index from an input string seed.
 */
function hashSeed(seed?: string | null): number {
  if (!seed) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

/**
 * Get a vibrant, deterministic background color for an avatar with no profile photo.
 */
export function getAvatarColor(seed?: string | null): string {
  const index = hashSeed(seed) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}

/**
 * Get a vibrant, deterministic or random gradient for a profile banner with no cover image.
 */
export function getRandomBannerColor(seed?: string | null): string {
  const index = hashSeed(seed) % BANNER_GRADIENT_PALETTE.length;
  return BANNER_GRADIENT_PALETTE[index];
}

/**
 * Extract uppercase initial from a user's display name, username, or email.
 */
export function getInitial(name?: string | null): string {
  if (!name || !name.trim()) return 'U';
  const clean = name.trim().replace(/^[@\s]+/, '');
  return (clean[0] || 'U').toUpperCase();
}

/**
 * Extract the account avatar URL from user metadata (Google picture, GitHub avatar, Supabase user metadata).
 */
export function extractAccountAvatar(user?: any): string | null {
  if (!user) return null;
  const meta = user.user_metadata || {};
  const identities = user.identities?.[0]?.identity_data || {};
  const appMeta = user.app_metadata || {};

  return (
    meta.avatar_url ||
    meta.picture ||
    meta.avatar ||
    identities.avatar_url ||
    identities.picture ||
    appMeta.avatar_url ||
    user.avatarUrl ||
    user.avatar_url ||
    null
  );
}
