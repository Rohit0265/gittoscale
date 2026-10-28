import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export interface VideoItem {
  id: string;
  title: string;
  subtitle?: string;
  videoUrl?: string;
  placeholderImage: string;
  duration?: number; // fallback duration in seconds if no real video source
}

const DEFAULT_VIDEOS: VideoItem[] = [
  {
    id: 'video-1',
    title: 'Automated Codebase Scanner',
    subtitle: 'Deep topology discovery from any repository',
    placeholderImage: '/images.jpeg',
    duration: 6,
  },
  {
    id: 'video-2',
    title: 'Live Architecture Simulation',
    subtitle: 'High-throughput synthetic traffic & load testing',
    placeholderImage: '/images.jpeg',
    duration: 6,
  },
  {
    id: 'video-3',
    title: 'Bottleneck & Latency Detection',
    subtitle: 'Trace slow hops, saturated queues, and failover points',
    placeholderImage: '/images.jpeg',
    duration: 6,
  },
];

interface VideoCarouselProps {
  videos?: VideoItem[];
  className?: string;
  onSelectVideo?: (video: VideoItem) => void;
}

export const VideoCarousel: React.FC<VideoCarouselProps> = ({
  videos = DEFAULT_VIDEOS,
  className = '',
  onSelectVideo,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = videos.length;
  const currentVideo = videos[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handleSelect = (index: number) => {
    setCurrentIndex(index);
    if (onSelectVideo) {
      onSelectVideo(videos[index]);
    }
  };

  // Video playback and fallback advancement handling
  useEffect(() => {
    // Clear any existing fallback timer
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    if (currentVideo?.videoUrl) {
      // If a real video exists, play it and advance strictly onEnded
      if (activeVideoRef.current) {
        activeVideoRef.current.currentTime = 0;
        activeVideoRef.current
          .play()
          .catch(() => {
            // If browser blocks autoplay, advance after duration fallback
            const durationSec = currentVideo.duration || 6;
            fallbackTimerRef.current = setTimeout(handleNext, durationSec * 1000);
          });
      }
    } else {
      // Currently using placeholder image: advance automatically after the item's duration
      const durationSec = currentVideo?.duration || 6;
      fallbackTimerRef.current = setTimeout(handleNext, durationSec * 1000);
    }

    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, [currentIndex, currentVideo]);

  // Determine slot position for each video card relative to the active index
  const getSlot = (index: number) => {
    const diff = (index - currentIndex + total) % total;
    if (diff === 0) return 'center';
    if (diff === 1) return 'right';
    if (diff === total - 1) return 'left';
    return 'hidden';
  };

  return (
    <div className={`relative w-full flex flex-col items-center select-none ${className}`}>
      {/* 3D Stage Container */}
      <div className="relative w-full h-[280px] sm:h-[420px] md:h-[540px] lg:h-[640px] xl:h-[720px] flex items-center justify-center perspective-[1200px] overflow-visible">
        {videos.map((item, index) => {
          const slot = getSlot(index);
          const isCenter = slot === 'center';
          const isLeft = slot === 'left';

          if (slot === 'hidden') return null;

          return (
            <motion.div
              key={item.id}
              onClick={() => {
                if (!isCenter) handleSelect(index);
              }}
              className={`absolute w-[88%] sm:w-[82%] md:w-[78%] lg:w-[74%] aspect-video rounded-2xl sm:rounded-3xl overflow-hidden border transition-shadow cursor-pointer ${
                isCenter
                  ? 'border-slate-300/80 dark:border-neutral-700/80 shadow-2xl shadow-indigo-500/10 dark:shadow-black/70 cursor-default'
                  : 'border-slate-200/50 dark:border-neutral-800/60 shadow-lg hover:border-slate-300 dark:hover:border-neutral-700'
              }`}
              initial={false}
              animate={{
                x: isCenter ? '0%' : isLeft ? '-45%' : '45%',
                scale: isCenter ? 1 : 0.84,
                zIndex: isCenter ? 30 : 10,
                opacity: isCenter ? 1 : 0.55,
                filter: isCenter ? 'brightness(1) blur(0px)' : 'brightness(0.65) blur(0.5px)',
              }}
              transition={{
                duration: 0.65,
                ease: [0.32, 0.72, 0, 1],
              }}
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Media Container */}
              <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
                {item.videoUrl ? (
                  <video
                    ref={isCenter ? activeVideoRef : undefined}
                    src={item.videoUrl}
                    poster={item.placeholderImage}
                    muted
                    playsInline
                    autoPlay={isCenter}
                    onEnded={handleNext}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={item.placeholderImage}
                    alt={item.title}
                    draggable={false}
                    className="w-full h-full object-cover select-none"
                  />
                )}

                {/* Sleek Gradient Overlay for Titles */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-4 sm:p-6 transition-opacity duration-300 ${
                    isCenter ? 'opacity-100' : 'opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 shadow-xs" />
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight">
                      {item.title}
                    </h3>
                  </div>
                  {item.subtitle && (
                    <p className="text-xs sm:text-sm text-neutral-300 mt-1 line-clamp-1">
                      {item.subtitle}
                    </p>
                  )}
                </div>

                {/* Backdrop Click Shield for Side Cards */}
                {!isCenter && (
                  <div className="absolute inset-0 bg-black/25 hover:bg-transparent transition-colors" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default VideoCarousel;
