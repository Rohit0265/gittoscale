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
  GitFork,
  CheckCircle2,
  Activity,
  Zap,
  Check,
  Flame,
  Terminal,
  X,
  CornerDownRight,
  Send,
} from 'lucide-react';
import { PenHighlight } from './ui/PenShadowLine';

interface ShareDesignFeedSectionProps {
  onNavigate?: (route: string) => void;
  onSelectTestSite?: () => void;
  isDark?: boolean;
}

interface CommunityFeedPost {
  id: string;
  tabLabel: string;
  tagline: string;
  author: {
    name: string;
    handle: string;
    role: string;
    avatarInitials: string;
    verified: boolean;
  };
  timeAgo: string;
  title: string;
  body: string;
  metrics: {
    label: string;
    value: string;
    status: 'healthy' | 'stressed' | 'critical';
  }[];
  tags: string[];
  likes: number;
  commentsCount: number;
  forksCount: number;
  featuredComment: {
    author: string;
    handle: string;
    text: string;
    reply?: {
      author: string;
      text: string;
    };
  };
}

const FEED_SHOWCASE_POSTS: CommunityFeedPost[] = [
  {
    id: 'post-1',
    tabLabel: '65k RPS Ledger Burst',
    tagline: 'High-Throughput Distributed Cache',
    author: {
      name: 'David K.',
      handle: '@david_cloud',
      role: 'Staff SRE · Stripe Alumni',
      avatarInitials: 'DK',
      verified: true,
    },
    timeAgo: '2h ago',
    title: 'Scaled payment ledger architecture to 65,000 req/s peak burst load with zero queue drops.',
    body: 'Eliminated our database write-lock bottleneck by pairing a write-behind Redis cache with a partitioned Kafka stream. Simulated 5x spike traffic with zero cascading failures.',
    metrics: [
      { label: 'Burst Throughput', value: '65,400 req/s', status: 'healthy' },
      { label: 'P99 Latency', value: '14.2 ms', status: 'healthy' },
      { label: 'Queue Drops', value: '0.00%', status: 'healthy' },
      { label: 'Downstream Services', value: '8 Nodes', status: 'healthy' },
    ],
    tags: ['#SystemDesign', '#DistributedSystems', '#65kRPS', '#GitToScale'],
    likes: 342,
    commentsCount: 42,
    forksCount: 118,
    featuredComment: {
      author: 'Elena Rostova',
      handle: '@elena_infra',
      text: 'How does the write-behind cache handle sudden Redis node failure during high-throughput bursts?',
      reply: {
        author: 'David K.',
        text: 'We paired dual-sentinel failover with a local NVMe WAL before acking to Kafka. Check the node settings in the forked canvas!',
      },
    },
  },
  {
    id: 'post-2',
    tabLabel: 'Kafka Consumer Lag Spike',
    tagline: 'Cascading Bottleneck Analysis',
    author: {
      name: 'Marcus Vance',
      handle: '@marcus_arch',
      role: 'Principal Architect · FinTech',
      avatarInitials: 'MV',
      verified: true,
    },
    timeAgo: '5h ago',
    title: 'Diagnosing consumer lag collapse under 120k req/s black swan stress test.',
    body: 'Discovered that worker thread starvation in downstream payment processors triggered backpressure all the way up to ingress gateways. Here is the before-and-after fix topology.',
    metrics: [
      { label: 'Ingress Volume', value: '120,000 req/s', status: 'stressed' },
      { label: 'Kafka Lag', value: '1.4M events', status: 'critical' },
      { label: 'Recovery Window', value: '48 sec', status: 'healthy' },
      { label: 'Buffer Headroom', value: '82%', status: 'healthy' },
    ],
    tags: ['#Kafka', '#EventDriven', '#Backpressure', '#CapacityPlanning'],
    likes: 289,
    commentsCount: 38,
    forksCount: 94,
    featuredComment: {
      author: 'Aarav Patel',
      handle: '@aarav_distrib',
      text: 'Increasing partition count from 16 to 64 completely resolved our consumer thread contention!',
      reply: {
        author: 'Marcus Vance',
        text: 'Exactly! Fork this topology and verify the partition concurrency multiplier yourself.',
      },
    },
  },
  {
    id: 'post-3',
    tabLabel: 'Zero-Downtime Split',
    tagline: 'Database Sharding Simulation',
    author: {
      name: 'Sophia Chen',
      handle: '@sophia_core',
      role: 'Dist. Systems Lead',
      avatarInitials: 'SC',
      verified: true,
    },
    timeAgo: 'Yesterday',
    title: 'Zero-downtime database sharding simulation across 4 regional read-replicas.',
    body: 'Modeled cross-region latency replication delays and consistency boundaries. Proved that read-replicas absorb 88% of analytical query pressure without degrading transaction latency.',
    metrics: [
      { label: 'Replica Offload', value: '88.4%', status: 'healthy' },
      { label: 'Cross-Region Lag', value: '28 ms', status: 'healthy' },
      { label: 'Primary DB Load', value: '18% util', status: 'healthy' },
      { label: 'Redundancy', value: '3x Active', status: 'healthy' },
    ],
    tags: ['#Postgres', '#Sharding', '#HighAvailability', '#MultiRegion'],
    likes: 415,
    commentsCount: 56,
    forksCount: 167,
    featuredComment: {
      author: 'Jonas Weber',
      handle: '@jonas_scale',
      text: 'Did you evaluate proxy routing latency overhead with pgBouncer vs RDS Proxy?',
      reply: {
        author: 'Sophia Chen',
        text: 'Yes! Added connection pooling nodes in this model. Latency overhead was sub-millisecond.',
      },
    },
  },
];

export const ShareDesignFeedSection: React.FC<ShareDesignFeedSectionProps> = ({
  onNavigate,
  onSelectTestSite,
  isDark: _isDark = true,
}) => {
  const [activePostIndex, setActivePostIndex] = useState(0);
  const activePost = FEED_SHOWCASE_POSTS[activePostIndex];

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(38);

  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(activePost.likes);
  const [hasBookmarked, setHasBookmarked] = useState(false);
  const [isForked, setIsForked] = useState(false);
  const [forkCount, setForkCount] = useState(activePost.forksCount);
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [customComment, setCustomComment] = useState('');
  const [userComments, setUserComments] = useState<string[]>([]);

  // Sync state when active post changes
  useEffect(() => {
    setLikeCount(activePost.likes);
    setForkCount(activePost.forksCount);
    setHasLiked(false);
    setHasBookmarked(false);
    setIsForked(false);
  }, [activePostIndex, activePost]);

  // Video autoplay with IntersectionObserver
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
            video.play().catch(() => {});
            setIsPlaying(true);
          } else {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: [0, 0.25, 0.7] }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [isMuted]);

  // Video time tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration) {
        setVideoProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

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

  const handleFork = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isForked) {
      setIsForked(true);
      setForkCount((prev) => prev + 1);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(window.location.origin + '/feed#' + activePost.id).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2400);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customComment.trim()) return;
    setUserComments((prev) => [...prev, customComment.trim()]);
    setCustomComment('');
  };

  const handleExploreFeed = () => {
    if (onNavigate) {
      onNavigate('/feed');
    } else {
      window.location.href = '/feed';
    }
  };

  return (
    <section
      id="community-feed"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 900px' }}
      className="relative flex min-h-screen flex-col justify-center px-4 sm:px-8 lg:px-12 py-20 bg-slate-50/70 dark:bg-[#020202] border-t border-slate-200/80 dark:border-neutral-800/80 transition-colors"
    >
      <div className="mx-auto w-full max-w-6xl">
        {/* Section Heading & Subtitle (Craft Floor compliant: No kicker pills, pure weight & scale) */}
        <div className="mb-10 max-w-3xl">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-[0.95] tracking-tight text-slate-900 dark:text-white">
            <span className="block sm:inline">
              <PenHighlight className="block w-fit" highlightClassName="bg-slate-400/85 dark:bg-neutral-500/85">
                Share your design
              </PenHighlight>
            </span>
            <span className="block mt-1 sm:mt-1.5 sm:inline sm:ml-2">
              <PenHighlight className="block w-fit" highlightClassName="bg-slate-400/85 dark:bg-neutral-500/85">
                with others
              </PenHighlight>
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-600 dark:text-neutral-400 leading-relaxed max-w-2xl">
            Don&apos;t keep your system architecture locked in slide decks. Record live capacity runs, publish bottleneck post-mortems with one click, and get actionable critique from senior distributed systems engineers.
          </p>
        </div>

        {/* Live Community Activity Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-[#080808] border border-slate-200 dark:border-neutral-800 text-xs text-slate-600 dark:text-neutral-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>GitToScale Community Feed</span>
            </div>
            <span className="hidden sm:inline text-slate-300 dark:text-neutral-700">|</span>
            <div className="hidden sm:flex items-center gap-1 text-slate-500 dark:text-neutral-400">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span>48 architects online exploring live topologies</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExploreFeed}
            className="flex items-center gap-1 text-xs font-semibold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer group"
          >
            <span>Browse Full Feed</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Studio Frame Container: Interactive Workstation */}
        <div className="relative rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#070707] shadow-xl overflow-hidden">
          {/* Studio Top Navigation Bar (Switch Between Real Community Architectures) */}
          <div className="border-b border-slate-200 dark:border-neutral-800 bg-slate-50/90 dark:bg-[#0B0B0C] px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-0.5">
              {FEED_SHOWCASE_POSTS.map((post, idx) => {
                const isActive = idx === activePostIndex;
                return (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => {
                      setActivePostIndex(idx);
                      setShowCommentsDrawer(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-neutral-700'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-neutral-900'
                    }`}
                  >
                    {idx === 0 ? (
                      <Flame className={`w-3.5 h-3.5 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                    ) : idx === 1 ? (
                      <Zap className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                    ) : (
                      <GitFork className={`w-3.5 h-3.5 ${isActive ? 'text-sky-500' : 'text-slate-400'}`} />
                    )}
                    <span>{post.tabLabel}</span>
                  </button>
                );
              })}
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Verified Mathematical Queue Model</span>
            </div>
          </div>

          {/* Main Grid: Post Card Presentation (Left) + Architectural Insight Strip (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-neutral-800">
            {/* LEFT COLUMN: Authentic GitToScale Feed Post (8 Cols) */}
            <div className="lg:col-span-8 p-4 sm:p-6 flex flex-col justify-between">
              <div>
                {/* Author Metadata Header */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-neutral-800 text-white font-bold flex items-center justify-center text-sm shadow-xs border border-slate-700 dark:border-neutral-700">
                        {activePost.author.avatarInitials}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#070707]" />
                    </div>

                    <div className="min-w-0 flex flex-col">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {activePost.author.name}
                        </span>
                        {activePost.author.verified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        )}
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 font-medium hidden sm:inline">
                          {activePost.author.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-neutral-500">
                        <span className="font-mono">{activePost.author.handle}</span>
                        <span>·</span>
                        <span>{activePost.timeAgo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fork to Sandbox Button */}
                  <button
                    type="button"
                    onClick={handleFork}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isForked
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/80'
                        : 'bg-slate-100 dark:bg-neutral-800/80 text-slate-700 dark:text-neutral-200 hover:bg-slate-200 dark:hover:bg-neutral-700 border border-slate-200 dark:border-neutral-700'
                    }`}
                    title="Fork this topology into your simulation canvas"
                  >
                    {isForked ? <Check className="w-3.5 h-3.5" /> : <GitFork className="w-3.5 h-3.5" />}
                    <span>{isForked ? 'Forked to Canvas' : 'Fork Topology'}</span>
                    <span className="text-[11px] font-mono opacity-80">({forkCount})</span>
                  </button>
                </div>

                {/* Post Title & Description */}
                <div className="space-y-1.5 mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {activePost.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
                    {activePost.body}
                  </p>
                </div>

                {/* Embedded Video Showcase with HUD Telemetry Overlay */}
                <div
                  onClick={togglePlay}
                  className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-slate-200 dark:border-neutral-800 mb-4 cursor-pointer group/vid select-none"
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

                  {/* Top HUD Status Badges */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-10">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-white text-[11px] font-mono">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>BURST SIMULATION WALKTHROUGH</span>
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-emerald-400 text-[11px] font-mono">
                        <span>P99: 14.2ms</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={toggleMute}
                      className="pointer-events-auto p-1.5 rounded-md bg-black/70 hover:bg-black/90 backdrop-blur-md text-white transition-colors cursor-pointer"
                      title={isMuted ? 'Unmute video' : 'Mute video'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Center Play Indicator */}
                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[1px] transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-2xl transform transition-transform group-hover/vid:scale-105">
                        <Play className="w-6 h-6 fill-current ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Scrubber Progress Bar & Controls */}
                  <div className="absolute bottom-3 inset-x-3 flex flex-col gap-1.5 pointer-events-none z-10">
                    <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-150"
                        style={{ width: `${videoProgress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-white/90 font-mono">
                      <div className="flex items-center gap-1.5 bg-black/70 px-2 py-0.5 rounded-md backdrop-blur-md">
                        {isPlaying ? <Pause className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current" />}
                        <span>Click video to {isPlaying ? 'pause' : 'play'}</span>
                      </div>
                      <span className="bg-black/70 px-2 py-0.5 rounded-md backdrop-blur-md">
                        0:{Math.floor((videoProgress * 80) / 100).toString().padStart(2, '0')} / 1:20
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Post Metrics Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {activePost.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-neutral-800 flex flex-col"
                    >
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-neutral-400">
                        {metric.label}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {metric.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Tags Strip */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {activePost.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Feed Action Bar (Matches real PostActions.tsx UX) */}
              <div className="pt-3 border-t border-slate-200/80 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Like Button */}
                  <button
                    type="button"
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      hasLiked
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/60'
                    }`}
                    title={hasLiked ? 'Unlike post' : 'Like post'}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
                    <span>{likeCount}</span>
                  </button>

                  {/* Comments Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setShowCommentsDrawer((prev) => !prev)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      showCommentsDrawer
                        ? 'bg-slate-200/80 dark:bg-neutral-800 text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/60'
                    }`}
                    title="Toggle peer review comments"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{activePost.commentsCount + userComments.length} Comments</span>
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
                    title={hasBookmarked ? 'Bookmarked' : 'Save post'}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${hasBookmarked ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Share Link */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
                  title="Copy shareable link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
                </button>
              </div>

              {/* Interactive In-Card Comments Drawer (Opens when user clicks Comments) */}
              {showCommentsDrawer && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-neutral-800 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Architect Peer Review Thread
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCommentsDrawer(false)}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3 mb-3">
                    {/* Featured Senior Architect Comment */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/70 border border-slate-200/80 dark:border-neutral-800 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white mb-1">
                        <span>{activePost.featuredComment.author}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {activePost.featuredComment.handle}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-neutral-300 leading-relaxed">
                        {activePost.featuredComment.text}
                      </p>

                      {activePost.featuredComment.reply && (
                        <div className="mt-2 pl-3 border-l-2 border-emerald-500/60 flex items-start gap-1.5">
                          <CornerDownRight className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                          <div className="text-[11px] text-slate-600 dark:text-neutral-300">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {activePost.featuredComment.reply.author}:{' '}
                            </span>
                            {activePost.featuredComment.reply.text}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Any User Added Comments */}
                    {userComments.map((comment, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-xs animate-in fade-in"
                      >
                        <div className="font-semibold text-slate-900 dark:text-white mb-0.5">
                          You (Guest Architect)
                        </div>
                        <p className="text-slate-700 dark:text-neutral-300 leading-relaxed">
                          {comment}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Add a comment quick input */}
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={customComment}
                      onChange={(e) => setCustomComment(e.target.value)}
                      placeholder="Add an architectural question or suggestion..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={!customComment.trim()}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold disabled:opacity-40 cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Reply</span>
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: The Architect's Publishing Loop (4 Cols) */}
            <div className="lg:col-span-4 p-5 sm:p-6 bg-slate-50/50 dark:bg-[#0A0A0A] flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-mono text-slate-500 dark:text-neutral-400 font-semibold mb-1">
                    The Publishing Loop
                  </h4>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    How designs move from simulator to community
                  </p>
                </div>

                {/* Step 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    01
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Simulate &amp; Record
                    </h5>
                    <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-relaxed mt-0.5">
                      Inject traffic spikes or downstream failures on the canvas. Auto-record the bottleneck post-mortem.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    02
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      1-Click Feed Broadcast
                    </h5>
                    <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-relaxed mt-0.5">
                      Publish your node configuration, latency curves, and video to the global GitToScale feed.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    03
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Peer Review &amp; Forking
                    </h5>
                    <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-relaxed mt-0.5">
                      Senior infrastructure architects stress-test your assumptions and fork the model to test alternate topologies.
                    </p>
                  </div>
                </div>

                {/* Live Community Proof Box */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900/90 border border-slate-200 dark:border-neutral-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 font-mono text-[10px]">
                    <span>COMMUNITY SCALE</span>
                    <span className="text-emerald-500 font-bold">LIVE STATS</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-900 dark:text-white font-bold">
                    <div>
                      <span className="text-base sm:text-lg block">1,420+</span>
                      <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-normal">Topologies Shared</span>
                    </div>
                    <div>
                      <span className="text-base sm:text-lg block">&lt; 15 min</span>
                      <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-normal">Avg Peer Review</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleExploreFeed}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-950 text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer group"
                >
                  <span>Explore Community Feed</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {onSelectTestSite && (
                  <button
                    type="button"
                    onClick={onSelectTestSite}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#070707] text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-900 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Open Architecture Canvas</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShareDesignFeedSection;
