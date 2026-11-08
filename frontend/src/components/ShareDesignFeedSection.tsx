import React, { useState, useRef, useEffect } from 'react';
import {
  ThumbsUp,
  MessageSquare,
  Bookmark,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ArrowRight,
  Sparkles,
  Users,
  GitFork,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react';
import { PenHighlight } from './ui/PenShadowLine';

interface ShareDesignFeedSectionProps {
  onNavigate?: (route: string) => void;
  onSelectTestSite?: () => void;
  isDark?: boolean;
}

export const ShareDesignFeedSection: React.FC<ShareDesignFeedSectionProps> = ({
  onNavigate,
  onSelectTestSite,
  isDark: _isDark = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(342);
  const [hasBookmarked, setHasBookmarked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Autoplay video when scrolled into view
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
            video.play().catch(() => {});
            setIsPlaying(true);
          } else {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: [0, 0.3, 0.7] }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [isMuted]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasLiked) {
      setHasLiked(false);
      setLikeCount((prev) => prev - 1);
    } else {
      setHasLiked(true);
      setLikeCount((prev) => prev + 1);
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasBookmarked((prev) => !prev);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + '/feed');
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleExploreFeed = () => {
    if (onNavigate) {
      onNavigate('/feed');
    } else {
      window.history.pushState({}, '', '/feed');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <section
      id="community-feed"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 800px' }}
      className="relative flex min-h-screen flex-col justify-center px-6 sm:px-10 py-20 bg-slate-50/50 dark:bg-[#020202] border-t border-slate-200/80 dark:border-neutral-800/80"
    >
      <div className="mx-auto w-full max-w-6xl">
        {/* Section Header */}
        <div className="mb-12 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Users className="w-3.5 h-3.5" />
            <span>Community Feed</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-[0.94] tracking-tight text-slate-900 dark:text-white">
            {/* Mobile View (< sm) */}
            <span className="sm:hidden flex flex-col items-start">
              <PenHighlight className="block w-fit" highlightClassName="bg-slate-400/85 dark:bg-neutral-500/85">
                Share your design
              </PenHighlight>
              <PenHighlight className="mt-1 block w-fit" highlightClassName="bg-slate-400/85 dark:bg-neutral-500/85">
                with others
              </PenHighlight>
            </span>
            {/* Desktop View (>= sm) */}
            <span className="hidden sm:block">
              <PenHighlight className="block w-fit" highlightClassName="bg-slate-400/85 dark:bg-neutral-500/85">
                Share your design
              </PenHighlight>
              <PenHighlight className="mt-1 block w-fit" highlightClassName="bg-slate-400/85 dark:bg-neutral-500/85">
                with others
              </PenHighlight>
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-neutral-400 leading-relaxed">
            Publish your system designs, live topology simulation videos, and bottleneck post-mortems directly to the GitToScale engineering feed. Get peer feedback from senior distributed systems architects and explore real production topologies.
          </p>
        </div>

        {/* 2-Column Layout: Feed Post Card Preview (Left) + Value Pillars (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* LEFT: Authentic Feed Post Card Showcase */}
          <div className="lg:col-span-7 w-full">
            <div className="relative group">
              {/* Subtle ambient backdrop glow */}
              <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-emerald-500/15 blur-xl opacity-75 group-hover:opacity-100 transition-opacity pointer-events-none" />

              {/* Feed Post Card Frame (mimics Feed Post Card) */}
              <article className="relative w-full rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] p-4 sm:p-5 shadow-xl transition-all">
                {/* Post Author Header */}
                <div className="flex items-center justify-between gap-3 mb-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 text-white font-bold flex items-center justify-center text-sm shadow-xs border border-white/20">
                        DK
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0A0A0A]" />
                    </div>

                    {/* Author Meta */}
                    <div className="min-w-0 flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          David K.
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 font-medium hidden sm:inline">
                          Staff SRE
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-neutral-500">
                        <span className="font-mono">@david_cloud</span>
                        <span>·</span>
                        <span>2h ago</span>
                      </div>
                    </div>
                  </div>

                  {/* Feed badge */}
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Verified Simulation</span>
                  </div>
                </div>

                {/* Post Content */}
                <div className="text-xs sm:text-sm text-slate-800 dark:text-neutral-200 leading-relaxed mb-3 space-y-1.5">
                  <p>
                    Scaled our payment ledger architecture to <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">65,000 req/s</strong> peak burst load with zero queue drops! 🚀
                  </p>
                  <p className="text-slate-600 dark:text-neutral-400 text-xs leading-relaxed">
                    Eliminated our database write-lock bottleneck by pairing a write-behind Redis cache with a partitioned Kafka stream. Check out the full topology walkthrough video below:
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3.5">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400">
                    #SystemDesign
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400">
                    #DistributedSystems
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400">
                    #65kRPS
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold">
                    #GitToScale
                  </span>
                </div>

                {/* Embedded Video Showcase */}
                <div
                  onClick={togglePlay}
                  className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-slate-200 dark:border-neutral-800 mb-3.5 cursor-pointer group/vid select-none"
                >
                  <video
                    ref={videoRef}
                    src="/feed-demo.mp4"
                    className="w-full h-full object-cover"
                    loop
                    playsInline
                    muted={isMuted}
                    preload="metadata"
                  />

                  {/* Top Video Overlay Controls (Mute & Live indicator) */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none z-10">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-mono font-medium">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      <span>SIMULATION VIDEO</span>
                    </div>

                    <button
                      type="button"
                      onClick={toggleMute}
                      className="pointer-events-auto p-1.5 rounded-md bg-black/60 hover:bg-black/80 backdrop-blur-md text-white transition-colors cursor-pointer"
                      title={isMuted ? 'Unmute video' : 'Mute video'}
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Play / Pause Center Overlay Indicator */}
                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg transform transition-transform group-hover/vid:scale-110">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Bottom Video Progress/Status Bar */}
                  <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between text-[10px] text-white/90 font-mono pointer-events-none z-10 px-1">
                    <div className="flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-md">
                      {isPlaying ? <Pause className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current" />}
                      <span>Click to {isPlaying ? 'pause' : 'play'}</span>
                    </div>
                    <span className="bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-md">0:32 / 1:20</span>
                  </div>
                </div>

                {/* Post Actions Bar (Matches PostActions.tsx) */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 dark:border-neutral-800/80">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Like Button */}
                    <button
                      type="button"
                      onClick={handleLike}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        hasLiked
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/50'
                          : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/60'
                      }`}
                      title={hasLiked ? 'Unlike' : 'Like'}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
                      <span>{likeCount}</span>
                    </button>

                    {/* Comments Button */}
                    <button
                      type="button"
                      onClick={handleExploreFeed}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
                      title="View comments"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>42</span>
                    </button>

                    {/* Bookmark Button */}
                    <button
                      type="button"
                      onClick={handleBookmark}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        hasBookmarked
                          ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
                          : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/60'
                      }`}
                      title={hasBookmarked ? 'Bookmarked' : 'Bookmark post'}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${hasBookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Share button */}
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
                    title="Share post link"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'Copied!' : 'Share'}</span>
                  </button>
                </div>
              </article>
            </div>
          </div>

          {/* RIGHT: Feature Pillars & Feed Action Cards */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            <div className="space-y-4">
              {/* Feature 1: One-Click Publishing */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                      1-Click Share to Community
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                      Publish directly from your simulation canvas. Capture video recordings, bottleneck post-mortems, and Mermaid diagrams with zero manual editing.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 2: Peer Review & Feedback */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                      Architect Peer Review
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                      Get feedback and architectural critique from senior backend engineers and cloud architects. Discuss trade-offs before writing production code.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 3: Fork Any Community Design */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <GitFork className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                      Fork &amp; Simulate Any Post
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                      See an interesting high-traffic design on the feed? Fork it straight to your personal workbench and run custom spike scenarios in seconds.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={handleExploreFeed}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-950 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer group"
              >
                <span>Explore Community Feed</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {onSelectTestSite && (
                <button
                  type="button"
                  onClick={onSelectTestSite}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-900 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>Design Architecture</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShareDesignFeedSection;
