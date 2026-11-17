import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2, Video as VideoIcon, Volume2, VolumeX } from 'lucide-react';
import { MediaItem } from '../types';

/**
 * Viewport-aware autoplay video player with loop, playsInline and audio toggle
 */
export const FeedVideoPlayer: React.FC<{
  src: string;
  className?: string;
  controls?: boolean;
  loop?: boolean;
  showMuteButton?: boolean;
}> = ({ src, className = '', controls = true, loop = true, showMuteButton = true }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  // Strictly enforce muted in DOM so browser autoplay policies never block playback
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.defaultMuted = true;
    }
  }, [isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: [0, 0.35, 0.7] }
    );

    observer.observe(video);
    return () => {
      observer.disconnect();
    };
  }, [src]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black group/videoplayer">
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        loop={loop}
        playsInline
        controls={controls}
        preload="auto"
        className={className}
      />
      {showMuteButton && (
        <button
          type="button"
          onClick={toggleMute}
          className="absolute bottom-3 right-3 p-2 rounded-full bg-black/75 hover:bg-black text-white backdrop-blur-md opacity-80 hover:opacity-100 transition-all cursor-pointer z-20 shadow-md group-hover/videoplayer:opacity-100"
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
        </button>
      )}
    </div>
  );
};

interface PostMediaGalleryProps {
  mediaItems: MediaItem[];
  postId?: string;
}

export const PostMediaGallery: React.FC<PostMediaGalleryProps> = ({ mediaItems }) => {
  // Sort items to ensure video is always first: "remember if user upload any video keep it at first showing"
  const sortedItems = React.useMemo(() => {
    return mediaItems.toSorted((a, b) => (a.type === 'video' ? -1 : b.type === 'video' ? 1 : 0));
  }, [mediaItems]);

  const [activeSlide, setActiveSlide] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Keyboard navigation for Lightbox
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev! > 0 ? prev! - 1 : sortedItems.length - 1));
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev! < sortedItems.length - 1 ? prev! + 1 : 0));
      }
    },
    [lightboxIndex, sortedItems.length]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!sortedItems || sortedItems.length === 0) return null;

  const count = sortedItems.length;

  // Single Item View (Both desktop and mobile)
  if (count === 1) {
    const item = sortedItems[0];
    return (
      <div className="mb-4 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-neutral-800 bg-black/90 relative group">
        {item.type === 'video' ? (
          <FeedVideoPlayer
            src={item.url}
            className="w-full max-h-[500px] object-contain rounded-2xl bg-black"
          />
        ) : (
          <div
            onClick={() => setLightboxIndex(0)}
            className="cursor-zoom-in relative flex items-center justify-center max-h-[500px]"
          >
            <img
              src={item.url}
              alt="Post attachment"
              loading="lazy"
              className="w-full max-h-[500px] object-contain rounded-2xl"
            />
            <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-white">
              <Maximize2 className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Lightbox Modal */}
        {lightboxIndex !== null && (
          <LightboxModal
            items={sortedItems}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </div>
    );
  }

  // Next / Previous helpers for mobile carousel
  const nextSlide = () => {
    setActiveSlide((prev) => (prev < count - 1 ? prev + 1 : 0));
  };
  const prevSlide = () => {
    setActiveSlide((prev) => (prev > 0 ? prev - 1 : count - 1));
  };

  return (
    <div className="mb-4 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-900/60">
      {/* ========================================================================= */}
      {/* 1. MOBILE / SMALL DISPLAY CAROUSEL (md:hidden)                            */}
      {/* ========================================================================= */}
      <div className="md:hidden relative w-full aspect-[4/3] sm:aspect-video bg-black overflow-hidden select-none">
        {/* Slide Item */}
        <div className="w-full h-full flex items-center justify-center relative">
          {sortedItems[activeSlide].type === 'video' ? (
            <FeedVideoPlayer
              src={sortedItems[activeSlide].url}
              className="w-full h-full object-contain bg-black"
            />
          ) : (
            <img
              src={sortedItems[activeSlide].url}
              alt={`Slide ${activeSlide + 1}`}
              onClick={() => setLightboxIndex(activeSlide)}
              className="w-full h-full object-contain cursor-zoom-in"
            />
          )}
        </div>

        {/* Carousel Prev Button */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous image"
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all z-20 cursor-pointer shadow-lg"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Carousel Next Button */}
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next image"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all z-20 cursor-pointer shadow-lg"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Carousel Dots Pagination */}
        <div className="absolute bottom-2.5 inset-x-0 flex justify-center gap-1.5 z-20 pointer-events-none">
          {sortedItems.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                activeSlide === idx
                  ? 'w-4 bg-neutral-300 dark:bg-neutral-300 shadow-xs'
                  : 'w-1.5 bg-neutral-600/70 dark:bg-neutral-600/70'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP GRID LAYOUT (hidden md:block)                                   */}
      {/* Exact match to user drawing: 1 large left, 2x2 grid right with +N overlay  */}
      {/* ========================================================================= */}
      <div className="hidden md:block w-full h-[420px] bg-slate-950 overflow-hidden">
        {count === 2 ? (
          /* 2 items: 2 equal side-by-side columns */
          <div className="grid grid-cols-2 gap-1.5 h-full w-full">
            {sortedItems.slice(0, 2).map((item, idx) => (
              <DesktopMediaCell
                key={idx}
                item={item}
                onClick={() => setLightboxIndex(idx)}
              />
            ))}
          </div>
        ) : count === 3 ? (
          /* 3 items: 1 large left (span 2 rows), 2 stacked right */
          <div className="grid grid-cols-12 gap-1.5 h-full w-full">
            <div className="col-span-7 h-full">
              <DesktopMediaCell
                item={sortedItems[0]}
                onClick={() => setLightboxIndex(0)}
              />
            </div>
            <div className="col-span-5 grid grid-rows-2 gap-1.5 h-full">
              <DesktopMediaCell
                item={sortedItems[1]}
                onClick={() => setLightboxIndex(1)}
              />
              <DesktopMediaCell
                item={sortedItems[2]}
                onClick={() => setLightboxIndex(2)}
              />
            </div>
          </div>
        ) : count === 4 ? (
          /* 4 items: 1 large left, 3 right (1 top, 2 bottom) */
          <div className="grid grid-cols-12 gap-1.5 h-full w-full">
            <div className="col-span-6 h-full">
              <DesktopMediaCell
                item={sortedItems[0]}
                onClick={() => setLightboxIndex(0)}
              />
            </div>
            <div className="col-span-6 grid grid-rows-2 gap-1.5 h-full">
              <DesktopMediaCell
                item={sortedItems[1]}
                onClick={() => setLightboxIndex(1)}
              />
              <div className="grid grid-cols-2 gap-1.5 h-full">
                <DesktopMediaCell
                  item={sortedItems[2]}
                  onClick={() => setLightboxIndex(2)}
                />
                <DesktopMediaCell
                  item={sortedItems[3]}
                  onClick={() => setLightboxIndex(3)}
                />
              </div>
            </div>
          </div>
        ) : (
          /* 5+ items: EXACT MATCH TO USER'S DRAWING */
          /* Left: 1 large video/image (50%) */
          /* Right: 2x2 grid (4 slots). 4th slot shows "+ remaining count" */
          <div className="grid grid-cols-12 gap-1.5 h-full w-full">
            {/* Left Hero Cell */}
            <div className="col-span-6 h-full">
              <DesktopMediaCell
                item={sortedItems[0]}
                onClick={() => setLightboxIndex(0)}
              />
            </div>

            {/* Right 2x2 Grid */}
            <div className="col-span-6 grid grid-cols-2 grid-rows-2 gap-1.5 h-full">
              {/* Slot 1: Top-left */}
              <DesktopMediaCell
                item={sortedItems[1]}
                onClick={() => setLightboxIndex(1)}
              />

              {/* Slot 2: Top-right */}
              <DesktopMediaCell
                item={sortedItems[2]}
                onClick={() => setLightboxIndex(2)}
              />

              {/* Slot 3: Bottom-left */}
              <DesktopMediaCell
                item={sortedItems[3]}
                onClick={() => setLightboxIndex(3)}
              />

              {/* Slot 4: Bottom-right (with + remaining overlay if count > 5) */}
              <div
                onClick={() => setLightboxIndex(4)}
                className="relative h-full w-full overflow-hidden bg-black group cursor-pointer"
              >
                {sortedItems[4].type === 'video' ? (
                  <video
                    src={sortedItems[4].url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <img
                    src={sortedItems[4].url}
                    alt="Thumbnail 5"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}

                {/* Overlaid Count: "+ remaining video/images number" */}
                {count > 5 ? (
                  <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-2 text-center transition-colors group-hover:bg-black/55">
                    <span className="text-3xl font-black tracking-tight">
                      +{count - 5}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mt-0.5">
                      More
                    </span>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <LightboxModal
          items={sortedItems}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
};

/**
 * Individual desktop media cell with hover effects and video indicator
 */
const DesktopMediaCell: React.FC<{
  item: MediaItem;
  onClick: () => void;
}> = ({ item, onClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (item.type !== 'video' || !videoRef.current) return;
    videoRef.current.muted = true;
    videoRef.current.defaultMuted = true;

    const video = videoRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [item.type, item.url]);

  return (
    <div
      onClick={onClick}
      className="relative w-full h-full overflow-hidden bg-black group cursor-pointer"
    >
      {item.type === 'video' ? (
        <div className="w-full h-full relative flex items-center justify-center bg-black">
          <video
            ref={videoRef}
            src={item.url}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="w-full h-full relative">
          <img
            src={item.url}
            alt="Post media"
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Fullscreen Lightbox Modal
 */
const LightboxModal: React.FC<{
  items: MediaItem[];
  initialIndex: number;
  onClose: () => void;
}> = ({ items, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const current = items[currentIndex];

  const next = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  };

  const prev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200"
    >
      {/* Top Header: Counter & Close Button */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-0 inset-x-0 p-4 flex items-center justify-between text-white z-50 bg-gradient-to-b from-black/80 to-transparent"
      >
        <div className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs font-mono">
          {currentIndex + 1} of {items.length}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-5xl max-h-[85vh] w-full mx-4 flex items-center justify-center"
      >
        {current.type === 'video' ? (
          <video
            src={current.url}
            controls
            autoPlay
            loop
            playsInline
            className="max-h-[82vh] max-w-full rounded-xl shadow-2xl bg-black"
          />
        ) : (
          <img
            src={current.url}
            alt={`Media ${currentIndex + 1}`}
            className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl select-none"
          />
        )}
      </div>

      {/* Navigation Arrows (if multiple items) */}
      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer z-50 shadow-xl"
            title="Previous (Left arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer z-50 shadow-xl"
            title="Next (Right arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Bottom Thumbnail Strip */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-4 inset-x-0 flex justify-center gap-2 px-4 overflow-x-auto z-50"
          >
            {items.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  currentIndex === idx
                    ? 'border-indigo-500 scale-105 shadow-md'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                {item.type === 'video' ? (
                  <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-white">
                    <VideoIcon className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

