import React, { useState, useEffect } from 'react';
import { getAvatarColor, getInitial } from '../utils/avatarUtils';

export interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  seed?: string | null;
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
  style?: React.CSSProperties;
  alt?: string;
}

/**
 * Universal UserAvatar Component
 * Gracefully displays the user's avatar image, and automatically falls back
 * to a vibrant deterministic background color with the uppercase initial letter
 * whenever the image is missing, empty, or fails to load (onError).
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  seed,
  className = 'w-8 h-8 rounded-full',
  imgClassName = 'object-cover',
  fallbackClassName = 'text-white font-bold flex items-center justify-center uppercase shadow-xs select-none',
  style,
  alt,
}) => {
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const cleanSrc = typeof src === 'string' && src.trim().length > 0 ? src.trim() : null;

  if (cleanSrc && !hasError) {
    return (
      <img
        src={cleanSrc}
        alt={alt || name || 'User avatar'}
        className={`${className} ${imgClassName}`}
        style={style}
        onError={() => setHasError(true)}
      />
    );
  }

  const initial = getInitial(name);
  const bgColor = getAvatarColor(seed || name || 'User');

  return (
    <div
      className={`${className} ${fallbackClassName}`}
      style={{
        background: bgColor,
        ...style,
      }}
      title={name || undefined}
      aria-label={name || 'User avatar'}
    >
      {initial}
    </div>
  );
};
