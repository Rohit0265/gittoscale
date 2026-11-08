import React, { useState } from 'react';
import {
  ThumbsUp,
  MessageSquare,
  Share2,
  ArrowRight,
  GitFork,
  Check,
} from 'lucide-react';

interface ShareDesignFeedSectionProps {
  onNavigate?: (route: string) => void;
  onSelectTestSite?: () => void;
  isDark?: boolean;
}

const SHOWCASE_ITEMS = [
  {
    id: 'post-1',
    author: { name: 'David K.', handle: '@david_cloud', initials: 'DK' },
    timeAgo: '2h ago',
    title: 'Scaled payment ledger to 65,000 req/s peak burst load with zero queue drops.',
    summary: 'Write-behind Redis cache paired with partitioned Kafka stream. Eliminated database write-lock contention under 5x spike.',
    nodes: ['Envoy Gateway', 'Redis Cache', 'Kafka Stream', 'Postgres Master'],
    metrics: [
      { label: 'Throughput', value: '65,400 req/s' },
      { label: 'P99 Latency', value: '14.2 ms' },
      { label: 'Queue Drops', value: '0.00%' },
    ],
    likes: 342,
    comments: 42,
    forks: 118,
  },
  {
    id: 'post-2',
    author: { name: 'Marcus V.', handle: '@marcus_arch', initials: 'MV' },
    timeAgo: '5h ago',
    title: 'Diagnosed Kafka consumer lag collapse under 120k req/s stress test.',
    summary: 'Re-partitioned topics from 16 to 64 with priority backpressure shedding. Recovered consumer lag within 48 seconds.',
    nodes: ['Ingress API', 'Kafka 64-Partitions', '32 Worker Pods', 'Event Store'],
    metrics: [
      { label: 'Peak Ingress', value: '120,000 req/s' },
      { label: 'Recovery', value: '48 sec' },
      { label: 'Buffer Headroom', value: '82%' },
    ],
    likes: 289,
    comments: 38,
    forks: 94,
  },
  {
    id: 'post-3',
    author: { name: 'Sophia C.', handle: '@sophia_core', initials: 'SC' },
    timeAgo: 'Yesterday',
    title: 'Zero-downtime database sharding across 4 regional read-replicas.',
    summary: 'Modeled cross-region latency and consistency boundaries. Replicas absorbed 88% of analytical query pressure.',
    nodes: ['Anycast DNS', 'Primary DB', 'US-East Replica', 'EU-West Replica'],
    metrics: [
      { label: 'Replica Offload', value: '88.4%' },
      { label: 'Primary DB CPU', value: '18% util' },
      { label: 'Replication Lag', value: '28 ms' },
    ],
    likes: 415,
    comments: 56,
    forks: 167,
  },
];

export const ShareDesignFeedSection: React.FC<ShareDesignFeedSectionProps> = ({
  onNavigate: _onNavigate,
  onSelectTestSite: _onSelectTestSite,
  isDark: _isDark = true,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [forked, setForked] = useState(false);
  const [copied, setCopied] = useState(false);

  const current = SHOWCASE_ITEMS[activeIndex];

  const handleSelect = (idx: number) => {
    setActiveIndex(idx);
    setLiked(false);
    setForked(false);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.origin + '/feed#' + current.id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenFeed = () => {
    window.open('/feed', '_blank', 'noopener,noreferrer');
  };

  return (
    <section
      id="community-feed"
      className="relative px-4 sm:px-8 lg:px-12 py-12 sm:py-16 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black transition-colors"
    >
      {/* Subtle monochrome animation keyframe */}
      <style>{`
        @keyframes monoPacketFlow {
          0% { stroke-dashoffset: 40; }
          100% { stroke-dashoffset: 0; }
        }
        .anim-mono-flow {
          stroke-dasharray: 4 4;
          animation: monoPacketFlow 1.6s linear infinite;
        }
      `}</style>

      <div className="mx-auto w-full max-w-5xl">
        {/* Compact Header: Simple & Impactful */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
              Share your design with others.
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-lg leading-relaxed">
              Publish verified architectures, capacity benchmarks, and post-mortems to the community feed. Fork, review, and stress-test topologies together.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenFeed}
            className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-neutral-100 hover:opacity-70 transition-opacity cursor-pointer whitespace-nowrap"
          >
            <span>Explore Community Feed</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Compact Selector Tabs */}
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto scrollbar-none pb-1">
          {SHOWCASE_ITEMS.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(idx)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                idx === activeIndex
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 font-semibold'
                  : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              {item.nodes[1]}
            </button>
          ))}
        </div>

        {/* The Card: Monochrome, High-Impact, Minimal Height */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950 p-4 sm:p-5">
          {/* Author Header */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-neutral-800 text-white dark:text-neutral-100 font-mono text-xs font-bold flex items-center justify-center">
                {current.author.initials}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {current.author.name}
                </span>
                <span className="text-[11px] font-mono text-neutral-500">
                  {current.author.handle} · {current.timeAgo}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setForked((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                forked
                  ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 dark:border-neutral-100'
                  : 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900'
              }`}
            >
              <GitFork className="w-3 h-3" />
              <span>{forked ? 'Forked' : 'Fork Topology'}</span>
              <span className="text-[10px] font-mono opacity-70">({current.forks + (forked ? 1 : 0)})</span>
            </button>
          </div>

          {/* Title & Short Summary */}
          <div className="space-y-1 mb-3">
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
              {current.title}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {current.summary}
            </p>
          </div>

          {/* Compact Monochrome Animated Architecture Flow */}
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-black p-3 mb-3">
            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 mb-2">
              <span>LIVE TOPOLOGY STREAM</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-pulse" />
                <span>60 FPS</span>
              </span>
            </div>

            {/* Visual Vector Flow: 4 nodes + animated connecting line */}
            <div className="relative py-1">
              <svg className="w-full h-8" preserveAspectRatio="none" viewBox="0 0 400 32">
                <line
                  x1="20"
                  y1="16"
                  x2="380"
                  y2="16"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-neutral-200 dark:text-neutral-800"
                />
                <line
                  x1="20"
                  y1="16"
                  x2="380"
                  y2="16"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-neutral-700 dark:text-neutral-300 anim-mono-flow"
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-between px-2">
                {current.nodes.map((node) => (
                  <div key={node} className="flex flex-col items-center">
                    <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-[10px] sm:text-[11px] font-mono font-medium text-neutral-900 dark:text-neutral-200">
                      {node}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Metrics & Social Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-800/80">
            {/* Metrics */}
            <div className="flex items-center gap-3 sm:gap-5">
              {current.metrics.map((m) => (
                <div key={m.label} className="text-left">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                    {m.label}
                  </span>
                  <span className="text-xs sm:text-sm font-bold font-mono text-neutral-900 dark:text-neutral-100">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Social Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLiked((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  liked
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                }`}
              >
                <ThumbsUp className={`w-3 h-3 ${liked ? 'fill-current' : ''}`} />
                <span>{current.likes + (liked ? 1 : 0)}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenFeed}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3 h-3" />
                <span>{current.comments}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                title="Copy link"
              >
                {copied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShareDesignFeedSection;
