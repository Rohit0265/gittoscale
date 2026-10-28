import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import {
  Sparkles,
  FolderGit2,
  Search,
  ExternalLink,
  Trash2,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  LogOut,
  Sun,
  Moon,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface HistoryDashboardProps {
  onGoHome: () => void;
  onOpenArchitecture: (architectureData: any, prompt: string, title?: string) => void;
  onOpenRepository: (architectureData: any, repoName: string, repoUrl: string) => void;
  onNavigateToSimulator: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const HistoryDashboard: React.FC<HistoryDashboardProps> = ({
  onGoHome,
  onOpenArchitecture,
  onOpenRepository,
  onNavigateToSimulator,
  isDark = true,
  onToggleTheme,
}) => {
  const { profile, signOut, getAuthToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'architectures' | 'repositories'>('architectures');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Data states
  const [architectures, setArchitectures] = useState<any[]>([]);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [totalArch, setTotalArch] = useState(0);
  const [totalRepo, setTotalRepo] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch histories
  const fetchHistories = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getAuthToken();

    try {
      const [archRes, repoRes] = await Promise.all([
        api.getArchitectureHistory(token, {
          q: searchQuery.trim() || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
        api.getRepositoryHistory(token, {
          q: searchQuery.trim() || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
      ]);

      let archList = archRes.data || [];
      let repoList = repoRes.data || [];

      if (sortOrder === 'asc') {
        archList = [...archList].reverse();
        repoList = [...repoList].reverse();
      }

      setArchitectures(archList);
      setTotalArch(archRes.total || archList.length);
      setRepositories(repoList);
      setTotalRepo(repoRes.total || repoList.length);
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
  const handleDeleteArchitecture = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this saved architecture?')) return;
    setDeletingId(id);
    try {
      const token = getAuthToken();
      await api.deleteArchitectureHistory(token, id);
      setArchitectures((prev) => prev.filter((a) => a.id !== id));
      setTotalArch((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete record');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle Delete Repository
  const handleDeleteRepository = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this repository scan?')) return;
    setDeletingId(id);
    try {
      const token = getAuthToken();
      await api.deleteRepositoryHistory(token, id);
      setRepositories((prev) => prev.filter((r) => r.id !== id));
      setTotalRepo((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete record');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Just now';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#070709] text-slate-900 dark:text-neutral-100 flex flex-col font-sans transition-colors">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-slate-200 dark:border-neutral-800/80 bg-white dark:bg-[#0A0A0E] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onGoHome}
            className="flex items-center text-left group hover:opacity-85 transition-opacity cursor-pointer"
            title="Return to Landing Page"
          >
            <img
              src={isDark ? '/logo.png' : '/logo-light.png'}
              alt="GitToScale"
              className="h-7 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </button>
          <div className="h-4 w-px bg-slate-200 dark:bg-neutral-800" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
            History & Workspace
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Launch Simulator button */}
          <button
            onClick={onNavigateToSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">New Simulation</span>
          </button>

          {/* Theme Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0E] text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          )}

          {/* User Profile Badge & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-neutral-800">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 leading-tight">
                {profile?.fullName || 'Engineer'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-neutral-400 leading-tight truncate max-w-[140px]">
                {profile?.email}
              </span>
            </div>
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col">
        {/* Title & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Architecture & Repository History
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
              Reopen, review, and continue simulating any architecture created with GitToScale.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-neutral-900/90 border border-slate-300 dark:border-neutral-800 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('architectures')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'architectures'
                  ? 'bg-white dark:bg-[#14151F] text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Prompt Architectures ({totalArch})</span>
            </button>

            <button
              onClick={() => setActiveTab('repositories')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'repositories'
                  ? 'bg-white dark:bg-[#14151F] text-cyan-600 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>GitHub Repositories ({totalRepo})</span>
            </button>
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
                  ? 'Search by prompt or title...'
                  : 'Search by repository name or URL...'
              }
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-[#14151F] border border-slate-200 dark:border-neutral-800 rounded-lg text-xs text-slate-800 dark:text-neutral-200 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
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
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
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

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-44 rounded-xl bg-slate-100 dark:bg-[#0D0E15] border border-slate-200 dark:border-neutral-800/80 animate-pulse p-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-neutral-800 rounded-sm w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-neutral-800 rounded-sm w-full" />
                  <div className="h-3 bg-slate-200 dark:bg-neutral-800 rounded-sm w-1/2" />
                </div>
                <div className="h-8 bg-slate-200 dark:bg-neutral-800 rounded-md w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Tab 1: Architecture History List */}
        {!loading && activeTab === 'architectures' && (
          <div>
            {architectures.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white dark:bg-[#0D0E15] border border-slate-200 dark:border-neutral-800/80 rounded-2xl flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-500 mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-neutral-200 mb-1">
                  No architecture history found
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mb-4">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try clearing your search query or status filter.'
                    : 'Submit a system prompt in the playground or synthesizer to generate and save your first production architecture.'}
                </p>
                <button
                  onClick={onNavigateToSimulator}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
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

                  return (
                    <div
                      key={arch.id}
                      onClick={() =>
                        onOpenArchitecture(arch.architecture_data, arch.prompt, arch.title)
                      }
                      className="group relative bg-white dark:bg-[#0D0E15] border border-slate-200 dark:border-neutral-800/80 hover:border-blue-500/50 dark:hover:border-blue-500/50 rounded-xl p-4.5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Title and Status */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-500 transition-colors">
                            {arch.title || arch.prompt.slice(0, 40)}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide shrink-0 ${
                              arch.status === 'completed'
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                                : arch.status === 'failed'
                                ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40'
                                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
                            }`}
                          >
                            {arch.status}
                          </span>
                        </div>

                        {/* Prompt Description */}
                        <p className="text-xs text-slate-600 dark:text-neutral-400 line-clamp-3 mb-4 leading-relaxed font-normal">
                          &ldquo;{arch.prompt}&rdquo;
                        </p>
                      </div>

                      {/* Footer & Meta */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-500 mb-3 pt-3 border-t border-slate-100 dark:border-neutral-800/60">
                          <div className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-blue-500" />
                            <span>{nodeCount} Components</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(arch.created_at)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-semibold group-hover:bg-blue-600 group-hover:text-white transition-all cursor-pointer"
                          >
                            <span>Open in Canvas</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteArchitecture(e, arch.id)}
                            disabled={deletingId === arch.id}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-400 dark:text-neutral-500 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                            title="Delete architecture"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Repository Scan History List */}
        {!loading && activeTab === 'repositories' && (
          <div>
            {repositories.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white dark:bg-[#0D0E15] border border-slate-200 dark:border-neutral-800/80 rounded-2xl flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/50 flex items-center justify-center text-cyan-500 mb-3">
                  <FolderGit2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-neutral-200 mb-1">
                  No repository scan history found
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mb-4">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try clearing your search query or status filter.'
                    : 'Import a public GitHub repository in the simulator to automatically scan its code and persist its architecture graph.'}
                </p>
                <button
                  onClick={onNavigateToSimulator}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                >
                  Import Repository
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {repositories.map((repo) => {
                  const nodeCount = repo.architecture_data?.nodes?.length || 0;
                  const repoDisplayName =
                    repo.repository_name || repo.repository_url.split('/').pop() || 'Repository';

                  return (
                    <div
                      key={repo.id}
                      onClick={() =>
                        onOpenRepository(
                          repo.architecture_data,
                          repoDisplayName,
                          repo.repository_url
                        )
                      }
                      className="group relative bg-white dark:bg-[#0D0E15] border border-slate-200 dark:border-neutral-800/80 hover:border-cyan-500/50 dark:hover:border-cyan-500/50 rounded-xl p-4.5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Name and Status */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-cyan-500 transition-colors">
                            {repoDisplayName}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide shrink-0 ${
                              repo.status === 'completed'
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                                : 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40'
                            }`}
                          >
                            {repo.status}
                          </span>
                        </div>

                        {/* URL snippet */}
                        <a
                          href={repo.repository_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 mb-3 truncate"
                        >
                          <span className="truncate">{repo.repository_url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>

                        {/* Scan detected badges */}
                        {repo.scan_result?.language && (
                          <div className="flex items-center gap-1.5 mb-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800 text-[10px] font-medium text-slate-700 dark:text-neutral-300">
                              {repo.scan_result.language}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Footer & Meta */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-500 mb-3 pt-3 border-t border-slate-100 dark:border-neutral-800/60">
                          <div className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-cyan-500" />
                            <span>{nodeCount} Nodes Detected</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(repo.created_at)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900/40 text-cyan-600 dark:text-cyan-400 text-xs font-semibold group-hover:bg-cyan-600 group-hover:text-white transition-all cursor-pointer"
                          >
                            <span>Open Architecture</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteRepository(e, repo.id)}
                            disabled={deletingId === repo.id}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-400 dark:text-neutral-500 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                            title="Delete repository"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
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

