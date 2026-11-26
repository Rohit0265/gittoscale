import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { LandingHeader } from '../LandingHeader';
import {
  Search,
  ExternalLink,
  Trash2,
  Calendar,
  Layers,
  RefreshCw,
  AlertCircle,
  Plus,
  Github,
  Users,
  Radio,
  UserCheck,
} from 'lucide-react';

interface HistoryCardProps {
  title: string;
  nodeCount: number;
  createdAt?: string;
  isDeleting: boolean;
  deleteTitle: string;
  isGithub?: boolean;
  isCollab?: boolean;
  meetingStatus?: string;
  hostName?: string;
  actionLabel?: string;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  onOpen: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const HistoryCard: React.FC<HistoryCardProps> = ({
  title,
  createdAt,
  isDeleting,
  deleteTitle,
  isGithub = false,
  isCollab = false,
  meetingStatus,
  hostName,
  actionLabel = 'Continue',
  secondaryAction,
  onOpen,
  onDelete,
}) => {
  const formatCardDate = (dateString?: string) => {
    if (!dateString) return 'Just now';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      onClick={onOpen}
      className="group relative bg-transparent border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 rounded-2xl p-5 shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 overflow-hidden"
    >
      {/* Subtle ambient hairline highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-neutral-700/60 to-transparent pointer-events-none" />

      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="text-sm sm:text-[15px] font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1 group-hover:text-black dark:group-hover:text-white transition-colors tracking-tight">
              {title}
            </h3>
          </div>

          {/* GitHub Repository small icon & badge */}
          {isGithub && (
            <div
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800/90 border border-slate-200 dark:border-neutral-700/80 text-[11px] font-medium text-slate-700 dark:text-neutral-300 shrink-0 shadow-2xs"
              title="Scanned from GitHub Repository"
            >
              <Github className="w-3.5 h-3.5 text-slate-800 dark:text-neutral-200" />
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold">GitHub</span>
            </div>
          )}

          {/* Collab Live / Ended status badge */}
          {isCollab && (
            <div className="shrink-0">
              {meetingStatus === 'active' ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Live</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700">
                  <span>Ended</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Collab Host Info */}
        {isCollab && hostName && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400 mt-1">
            <UserCheck className="w-3.5 h-3.5 text-neutral-400" />
            <span className="truncate">Host: {hostName}</span>
          </div>
        )}
      </div>

      {/* Footer & Meta */}
      <div>
        <div className="flex items-center justify-end text-[11px] mb-3.5 pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
            <Calendar className="w-3.5 h-3.5 opacity-70" />
            <span>{formatCardDate(createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 text-xs font-semibold transition-all shadow-xs group/btn cursor-pointer active:scale-[0.98]"
            title={actionLabel}
          >
            <span>{actionLabel}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </button>

          {secondaryAction && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                secondaryAction.onClick();
              }}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
              title={secondaryAction.label}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{secondaryAction.label}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/60 text-slate-400 dark:text-neutral-500 hover:text-red-500 hover:border-red-300 dark:hover:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
            title={deleteTitle}
          >
            <Trash2 className="w-3.5 h-3.5 hover:text-red-500 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface HistoryDashboardProps {
  onGoHome: () => void;
  onOpenArchitecture: (architectureData: any, prompt: string, title?: string, id?: string) => void;
  onOpenRepository: (architectureData: any, repoName: string, repoUrl: string, id?: string) => void;
  onNavigateToSimulator: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onOpenAuth?: () => void;
  onOpenSignUp?: () => void;
  onNavigate?: (route: string) => void;
}

const HistoryDashboardComponent: React.FC<HistoryDashboardProps> = ({
  onGoHome,
  onOpenArchitecture,
  onOpenRepository,
  onNavigateToSimulator,
  isDark = true,
  onToggleTheme,
  onOpenAuth,
  onOpenSignUp,
  onNavigate,
}) => {
  const { signOut, getAuthToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'architectures' | 'collab'>('architectures');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Data states
  const [architectures, setArchitectures] = useState<any[]>([]);
  const [collabMeetings, setCollabMeetings] = useState<any[]>([]);
  const [totalArch, setTotalArch] = useState(0);
  const [totalCollab, setTotalCollab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch histories
  const fetchHistories = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getAuthToken();

    try {
      const [archRes, repoRes, meetingRes] = await Promise.all([
        api.getArchitectureHistory(token, {
          q: searchQuery.trim() || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
        api.getRepositoryHistory(token, {
          q: searchQuery.trim() || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
        api.getUserMeetings(token),
      ]);

      const rawArchList = archRes.data || [];
      const rawRepoList = repoRes.data || [];
      const meetingsList = meetingRes.meetings || [];

      // 1. Process and deduplicate prompt architectures
      const seenArch = new Set<string>();
      const processedArchs: any[] = [];

      for (const item of rawArchList) {
        const normPrompt = (item.prompt || '').trim().toLowerCase();
        const normTitle = (item.title || '').trim().toLowerCase();
        const projId = item.generation_config?.projectId;

        // Skip blank records
        if (!normPrompt && !normTitle) continue;
        if (
          !projId &&
          (normPrompt === 'custom scalable architecture' || !normPrompt) &&
          (normTitle === 'playground architecture' || !normTitle)
        ) {
          continue;
        }

        const key = projId ? `proj_${projId}` : `prompt_${normPrompt}`;
        if (!seenArch.has(key)) {
          seenArch.add(key);
          const isFromRepo = Boolean(
            item.repository_url ||
            item.generation_config?.repo ||
            item.generation_config?.repositoryUrl ||
            (item.prompt && item.prompt.includes('github.com'))
          );

          processedArchs.push({
            ...item,
            isGithub: isFromRepo,
          });
        }
      }

      // 2. Merge GitHub scanned repositories into the architectures section
      const mappedRepoItems = rawRepoList.map((repo: any) => ({
        id: repo.id,
        isGithub: true,
        title: repo.repository_name || repo.repository_url?.split('/').pop() || 'GitHub Repository',
        prompt: repo.repository_url || '',
        repository_url: repo.repository_url,
        repository_name: repo.repository_name,
        architecture_data: repo.architecture_data,
        created_at: repo.created_at,
        updated_at: repo.updated_at || repo.created_at,
      }));

      // Combine architectures + repositories
      let mergedArchitectures = [...processedArchs, ...mappedRepoItems];

      // Sort by creation date
      mergedArchitectures.sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });

      // Filter search if query exists
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        mergedArchitectures = mergedArchitectures.filter((item) => {
          const t = (item.title || '').toLowerCase();
          const p = (item.prompt || '').toLowerCase();
          const r = (item.repository_name || '').toLowerCase();
          return t.includes(q) || p.includes(q) || r.includes(q);
        });
      }

      // Process Collab Meetings
      let processedMeetings = [...meetingsList];
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        processedMeetings = processedMeetings.filter((m) => {
          const t = (m.title || '').toLowerCase();
          const h = (m.host_name || '').toLowerCase();
          return t.includes(q) || h.includes(q);
        });
      }

      processedMeetings.sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });

      setArchitectures(mergedArchitectures);
      setTotalArch(mergedArchitectures.length);
      setCollabMeetings(processedMeetings);
      setTotalCollab(processedMeetings.length);
    } catch (err: any) {
      console.error('Failed to load history:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch history records.');
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, searchQuery, statusFilter, sortOrder]);

  useEffect(() => {
    fetchHistories();
  }, [fetchHistories]);

  // Handle Delete Architecture
  const handleDeleteArchitecture = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    const isRepo = item.isGithub && item.repository_url;
    const confirmMsg = isRepo
      ? 'Are you sure you want to delete this repository scan?'
      : 'Are you sure you want to delete this saved architecture?';
    if (!window.confirm(confirmMsg)) return;

    setDeletingId(item.id);
    try {
      const token = getAuthToken();
      if (isRepo) {
        await api.deleteRepositoryHistory(token, item.id);
      } else {
        await api.deleteArchitectureHistory(token, item.id);
      }
      setArchitectures((prev) => prev.filter((a) => a.id !== item.id));
      setTotalArch((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete record');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle Delete Collab Meeting
  const handleDeleteMeeting = async (e: React.MouseEvent, meetingId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this collaborative meeting from history?')) return;
    setDeletingId(meetingId);
    try {
      const token = getAuthToken();
      await api.deleteMeeting(token, meetingId);
      setCollabMeetings((prev) => prev.filter((m) => m.id !== meetingId));
      setTotalCollab((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete meeting');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#070709] text-slate-900 dark:text-neutral-100 flex flex-col font-sans transition-colors scroll-smooth">
      {/* Floating Pill Landing Header */}
      <LandingHeader
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onGoHome={onGoHome}
        onOpenAuth={onOpenAuth}
        onOpenSignUp={onOpenSignUp}
        onSignOut={signOut}
        onNavigate={onNavigate}
        isApp={false}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-24 pb-12 flex flex-col scroll-smooth">
        {/* Title & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              History &amp; Workspaces
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
              Reopen, review, and continue simulating any architecture or collaborative meeting created with GitToScale.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Launch Simulator button */}
            <button
              onClick={onNavigateToSimulator}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">New Simulation</span>
            </button>

            {/* Tabs: Architectures (Merged with Repos) & Collab Meetings */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-neutral-900/90 border border-slate-300 dark:border-neutral-800 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setActiveTab('architectures')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'architectures'
                    ? 'bg-white dark:bg-[#14151F] text-black dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Architectures ({totalArch})</span>
              </button>

              <button
                onClick={() => setActiveTab('collab')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'collab'
                    ? 'bg-white dark:bg-[#14151F] text-black dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Collab ({totalCollab})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search, Filter & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-[#0D0E15] border border-slate-200 dark:border-neutral-800/80 rounded-xl shadow-2xs mb-6">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'architectures'
                  ? 'Search by prompt, title, or GitHub repo...'
                  : 'Search by meeting title or host...'
              }
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-[#14151F] border border-slate-200 dark:border-neutral-800 rounded-lg text-xs text-slate-800 dark:text-neutral-200 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-[#14151F] border border-slate-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
              className="bg-slate-50 dark:bg-[#14151F] border border-slate-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>

            {/* Refresh */}
            <button
              onClick={fetchHistories}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#14151F] text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Refresh History"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-slate-700 dark:text-neutral-300 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchHistories}
              className="font-semibold underline hover:no-underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white dark:bg-[#0E1017] border border-slate-200/80 dark:border-neutral-800/80 shadow-xs space-y-4 animate-pulse"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5 flex-1 pr-2">
                    <div className="h-4 bg-slate-200 dark:bg-neutral-800 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-neutral-800 rounded w-1/2" />
                  </div>
                  <div className="w-6 h-6 rounded-md bg-slate-200 dark:bg-neutral-800 shrink-0" />
                </div>

                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-neutral-800 rounded w-full" />
                  <div className="h-3 bg-slate-200 dark:bg-neutral-800 rounded w-5/6" />
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-neutral-800/70 flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className="w-12 h-5 rounded-full bg-slate-200 dark:bg-neutral-800" />
                    <div className="w-12 h-5 rounded-full bg-slate-200 dark:bg-neutral-800" />
                  </div>
                  <div className="w-16 h-7 rounded-lg bg-slate-200 dark:bg-neutral-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 1: Architectures (Merged Prompt Architectures & GitHub Scanned Repos) */}
        {!loading && activeTab === 'architectures' && (
          <div>
            {architectures.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white dark:bg-[#0D0E15] border border-slate-200 dark:border-neutral-800/80 rounded-2xl flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 flex items-center justify-center text-slate-700 dark:text-neutral-300 mb-3">
                  <Layers className="w-6 h-6 text-slate-700 dark:text-neutral-300" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-neutral-200 mb-1">
                  No architecture history found
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mb-4">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try clearing your search query or status filter.'
                    : 'Submit a system prompt or scan a GitHub repository in the simulator to generate and persist your architecture graph.'}
                </p>
                <button
                  onClick={onNavigateToSimulator}
                  className="px-4 py-2 rounded-xl bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black text-xs font-semibold transition-all shadow-xs cursor-pointer"
                >
                  Create New Architecture
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {architectures.map((arch) => {
                  const nodeCount =
                    arch.architecture_data?.nodes?.length ||
                    (Array.isArray(arch.architecture_data) ? arch.architecture_data.length : 0);

                  const rawHeading = (arch.title || arch.prompt || '').trim();
                  const headingWords = rawHeading.split(/\s+/).filter(Boolean);
                  const cardHeading =
                    headingWords.length <= 4
                      ? headingWords.join(' ')
                      : headingWords.slice(0, 4).join(' ') + '...';

                  return (
                    <HistoryCard
                      key={arch.id}
                      title={cardHeading}
                      nodeCount={nodeCount}
                      createdAt={arch.created_at}
                      isDeleting={deletingId === arch.id}
                      deleteTitle="Delete architecture"
                      isGithub={Boolean(arch.isGithub)}
                      onOpen={() => {
                        if (arch.isGithub && arch.repository_url) {
                          onOpenRepository(
                            arch.architecture_data,
                            arch.title,
                            arch.repository_url,
                            arch.id
                          );
                        } else {
                          onOpenArchitecture(
                            arch.architecture_data,
                            arch.prompt,
                            arch.title,
                            arch.id
                          );
                        }
                      }}
                      onDelete={(e) => handleDeleteArchitecture(e, arch)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Collab Meetings (Inspect Final Synced Architectures) */}
        {!loading && activeTab === 'collab' && (
          <div>
            {collabMeetings.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white dark:bg-[#0D0E15] border border-slate-200 dark:border-neutral-800/80 rounded-2xl flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 flex items-center justify-center text-slate-700 dark:text-neutral-300 mb-3">
                  <Users className="w-6 h-6 text-neutral-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-neutral-200 mb-1">
                  No collaborative meeting history found
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mb-4">
                  Host or join a live collaborative room with your team. All final architectures synchronized during the meeting are automatically preserved here.
                </p>
                <a
                  href="/collab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black text-xs font-semibold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Start Collab Meeting</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {collabMeetings.map((meeting) => {
                  const nodeCount =
                    meeting.architecture_state?.nodes?.length ||
                    (Array.isArray(meeting.architecture_state) ? meeting.architecture_state.length : 0);

                  const title = meeting.title || 'Collaborative Architecture Session';

                  return (
                    <HistoryCard
                      key={meeting.id}
                      title={title}
                      nodeCount={nodeCount}
                      createdAt={meeting.created_at}
                      isDeleting={deletingId === meeting.id}
                      deleteTitle="Remove collaborative meeting"
                      isCollab={true}
                      meetingStatus={meeting.status}
                      hostName={meeting.host_name}
                      actionLabel="View Final Architecture"
                      secondaryAction={
                        meeting.status === 'active'
                          ? {
                              label: 'Join Room',
                              onClick: () => {
                                window.open(`/meeting/${meeting.id}`, '_blank', 'noopener,noreferrer');
                              },
                            }
                          : undefined
                      }
                      onOpen={() => {
                        onOpenArchitecture(
                          meeting.architecture_state,
                          `Collab Meeting: ${title}`,
                          title,
                          meeting.id
                        );
                      }}
                      onDelete={(e) => handleDeleteMeeting(e, meeting.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export const HistoryDashboard = React.memo(HistoryDashboardComponent);
export default HistoryDashboard;
