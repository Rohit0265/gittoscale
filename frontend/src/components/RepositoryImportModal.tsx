import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Github,
  ArrowRight,
  Loader2,
  AlertCircle,
  Lock,
  Globe,
  Search,
  Key,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ArchitectureNode, ArchitectureEdge } from '../types';

interface RepositoryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportArchitecture: (
    nodes: ArchitectureNode[],
    edges: ArchitectureEdge[],
    repoName: string,
    basicGraph?: { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] },
    detailedGraph?: { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] },
    repoUrl?: string
  ) => void;
  isUserAuthenticated?: boolean;
  onRequireAuth?: (repoUrl: string, llmConfig?: any) => void;
}

interface UserGithubRepo {
  id: number;
  name: string;
  fullName: string;
  htmlUrl: string;
  private: boolean;
  description?: string | null;
  language?: string | null;
  stars: number;
  updatedAt: string;
}

export const RepositoryImportModal: React.FC<RepositoryImportModalProps> = ({
  isOpen,
  onClose,
  onImportArchitecture,
  isUserAuthenticated = true,
  onRequireAuth,
}) => {
  const { signInWithOAuth } = useAuth();
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GitHub OAuth & Private Repos state
  const [githubToken, setGithubToken] = useState<string>(() => {
    try {
      return localStorage.getItem('gts_github_token') || '';
    } catch {
      return '';
    }
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repos, setRepos] = useState<UserGithubRepo[]>([]);
  const [githubUser, setGithubUser] = useState<{ login: string; name?: string; avatarUrl?: string } | null>(null);
  const [repoSearch, setRepoSearch] = useState('');
  const [repoFetchError, setRepoFetchError] = useState<string | null>(null);
  const [showPatInput, setShowPatInput] = useState(false);
  const [patInput, setPatInput] = useState('');

  // Fetch repositories when githubToken is present
  const fetchRepos = async (token: string) => {
    if (!token) return;
    setLoadingRepos(true);
    setRepoFetchError(null);
    try {
      const data = await api.getUserGithubRepos(token);
      if (data.success) {
        setRepos(data.repos || []);
        if (data.user) {
          setGithubUser(data.user);
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to load repositories from GitHub.';
      setRepoFetchError(msg);
      // If token expired or unauthorized, reset
      if (err.response?.status === 401 || err.response?.status === 403) {
        try {
          localStorage.removeItem('gts_github_token');
        } catch {}
        setGithubToken('');
        setGithubUser(null);
        setRepos([]);
      }
    } finally {
      setLoadingRepos(false);
    }
  };

  useEffect(() => {
    if (isOpen && githubToken) {
      fetchRepos(githubToken);
    }
  }, [isOpen, githubToken]);

  // Handle OAuth Connect
  const handleConnectGithub = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const res = await signInWithOAuth('github');
      if (res.error) {
        setError(res.error.message || 'Failed to authenticate with GitHub.');
        setIsConnecting(false);
        return;
      }

      // Check token in localStorage or polling briefly for popup callback
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        const token = localStorage.getItem('gts_github_token');
        if (token) {
          clearInterval(interval);
          setGithubToken(token);
          fetchRepos(token);
          setIsConnecting(false);
        } else if (attempts > 30) {
          clearInterval(interval);
          setIsConnecting(false);
        }
      }, 500);
    } catch (err: any) {
      setError(err?.message || 'Failed to start GitHub authentication.');
      setIsConnecting(false);
    }
  };

  const handleDisconnectGithub = () => {
    try {
      localStorage.removeItem('gts_github_token');
    } catch {}
    setGithubToken('');
    setGithubUser(null);
    setRepos([]);
    setRepoFetchError(null);
  };

  const handleSavePat = () => {
    const trimmed = patInput.trim();
    if (!trimmed) return;
    try {
      localStorage.setItem('gts_github_token', trimmed);
    } catch {}
    setGithubToken(trimmed);
    fetchRepos(trimmed);
    setPatInput('');
    setShowPatInput(false);
  };

  // Perform Analysis
  const executeScan = async (targetUrl: string) => {
    const trimmed = targetUrl.trim();
    if (!trimmed) {
      setError('Please enter a GitHub repository URL or workspace path.');
      return;
    }

    if (!isUserAuthenticated && onRequireAuth) {
      onClose();
      onRequireAuth(trimmed);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        githubToken: githubToken || undefined,
        viewMode: 'basic',
      };
      if (
        trimmed.startsWith('/') ||
        trimmed.startsWith('./') ||
        (!trimmed.includes('github.com') && !trimmed.includes('http'))
      ) {
        payload.localPath = trimmed;
      } else {
        payload.repoUrl = trimmed;
      }

      const res = await api.analyzeRepository(payload);

      const repoName =
        res.repoName ||
        trimmed.split('/').pop()?.replace('.git', '') ||
        'Repository';

      onImportArchitecture(res.nodes, res.edges, repoName, res.basicGraph, res.detailedGraph, trimmed);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to scan repository.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeScan(repoUrl);
  };

  // Filtered repositories based on search
  const filteredRepos = useMemo(() => {
    if (!repoSearch.trim()) return repos;
    const q = repoSearch.toLowerCase().trim();
    return repos.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.fullName.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.language && r.language.toLowerCase().includes(q))
    );
  }, [repos, repoSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2.5 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0E0F15] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#20222C] w-full max-w-[580px] max-h-[92vh] overflow-y-auto text-xs text-slate-800 dark:text-neutral-100 p-4 sm:p-6 md:p-7 space-y-5 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>Analyze Repository Design</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 font-normal">
                Inspect public or private repositories and map runtime dependencies
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 hover:text-rose-500 transition-colors" />
          </button>
        </div>

        {/* Top: Manual GitHub URL Input Form */}
        <form onSubmit={handleScan} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-neutral-200 block mb-2">
              GitHub Repository URL
            </label>

            <div className="flex items-center h-12 px-3.5 rounded-xl border border-slate-200 dark:border-[#222430] bg-slate-50/70 dark:bg-[#121319] focus-within:border-neutral-400 dark:focus-within:border-neutral-600 focus-within:ring-1 focus-within:ring-neutral-400 dark:focus-within:ring-neutral-600 transition-all">
              <Github className="w-5 h-5 text-slate-800 dark:text-white shrink-0 mr-3" />
              <div className="w-[1px] h-5 bg-slate-300 dark:bg-neutral-700/80 mr-3 shrink-0" />
              <input
                type="text"
                placeholder="https://github.com/owner/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full bg-transparent text-xs font-mono text-slate-900 dark:text-neutral-200 placeholder:text-slate-400 dark:placeholder:text-neutral-500 outline-none"
              />
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#262833] bg-white dark:bg-[#16171F] hover:bg-slate-100 dark:hover:bg-[#20212d] text-xs font-semibold text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !repoUrl.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing repository...</span>
                </>
              ) : (
                <>
                  <span>Analyze repository</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Centered 'or' divider (Matches drawing in sketch) */}
        <div className="relative flex items-center justify-center pt-1">
          <div className="border-t border-slate-200 dark:border-neutral-800 w-full" />
          <span className="bg-white dark:bg-[#0E0F15] px-3.5 text-xs font-semibold text-slate-400 dark:text-neutral-500 lowercase tracking-wider">
            or
          </span>
          <div className="border-t border-slate-200 dark:border-neutral-800 w-full" />
        </div>

        {/* Bottom Section: GitHub Connected Repositories / Connect GitHub */}
        <div className="space-y-3">
          {!githubToken ? (
            /* State A: GitHub NOT Connected */
            <div className="p-4 sm:p-5 rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-[#121319]/60 flex flex-col items-center text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex items-center justify-center text-slate-900 dark:text-white">
                <Github className="w-5 h-5" />
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                  <span>Scan Private Repositories</span>
                  <Lock className="w-3 h-3 text-amber-500" />
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 max-w-sm">
                  Connect your GitHub account to view and analyze your private repositories with zero configuration.
                </p>
              </div>

              <div className="w-full max-w-xs pt-1 space-y-2">
                <button
                  type="button"
                  onClick={handleConnectGithub}
                  disabled={isConnecting}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting to GitHub...</span>
                    </>
                  ) : (
                    <>
                      <Github className="w-4 h-4" />
                      <span>Connect GitHub Account</span>
                    </>
                  )}
                </button>

                {/* Personal Access Token alternative */}
                {!showPatInput ? (
                  <button
                    type="button"
                    onClick={() => setShowPatInput(true)}
                    className="text-[11px] text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <Key className="w-3 h-3" />
                    <span>Or enter a Personal Access Token</span>
                  </button>
                ) : (
                  <div className="pt-2 text-left space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        value={patInput}
                        onChange={(e) => setPatInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSavePat}
                        disabled={!patInput.trim()}
                        className="px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black text-xs font-semibold disabled:opacity-40 cursor-pointer"
                      >
                        Connect
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-neutral-500">
                      Requires token with <code>repo</code> scope to scan private codebases.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* State B: GitHub Connected - Show user repositories */
            <div className="space-y-3">
              {/* Account Bar */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-[#222430] bg-slate-50/70 dark:bg-[#121319]">
                <div className="flex items-center gap-2 min-w-0">
                  {githubUser?.avatarUrl ? (
                    <img
                      src={githubUser.avatarUrl}
                      alt={githubUser.login}
                      className="w-6 h-6 rounded-full border border-slate-300 dark:border-neutral-700 object-cover"
                    />
                  ) : (
                    <Github className="w-5 h-5 text-slate-800 dark:text-white" />
                  )}
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      @{githubUser?.login || 'Connected User'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Private Repos Active</span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDisconnectGithub}
                  className="text-[11px] font-medium text-slate-400 hover:text-rose-500 transition-colors cursor-pointer px-2 py-1 rounded"
                  title="Disconnect GitHub account"
                >
                  Disconnect
                </button>
              </div>

              {/* Repositories Search Filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search your repositories (private & public)..."
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/80 dark:bg-[#121319] text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
              </div>

              {/* Repositories List (Renders cards matching the 3 drawn boxes in user sketch) */}
              <div className="max-h-64 sm:max-h-72 overflow-y-auto space-y-2.5 pr-0.5">
                {loadingRepos ? (
                  <div className="space-y-2.5 py-2">
                    {[1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl border border-slate-200 dark:border-[#222430] bg-slate-50/50 dark:bg-[#121319] animate-pulse space-y-2"
                      >
                        <div className="h-4 bg-slate-200 dark:bg-neutral-800 rounded w-1/2" />
                        <div className="h-3 bg-slate-200 dark:bg-neutral-800 rounded w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : repoFetchError ? (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between">
                    <span>{repoFetchError}</span>
                    <button
                      type="button"
                      onClick={() => fetchRepos(githubToken)}
                      className="underline font-semibold hover:text-rose-700"
                    >
                      Retry
                    </button>
                  </div>
                ) : filteredRepos.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 dark:text-neutral-500 border border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl p-4">
                    {repoSearch.trim() ? 'No matching repositories found.' : 'No repositories found on this GitHub account.'}
                  </div>
                ) : (
                  filteredRepos.map((repo) => (
                    <div
                      key={repo.id}
                      onClick={() => {
                        setRepoUrl(repo.htmlUrl);
                      }}
                      className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 group ${
                        repoUrl === repo.htmlUrl
                          ? 'border-neutral-800 dark:border-white bg-slate-100/90 dark:bg-[#1A1C25] shadow-xs'
                          : 'border-slate-200 dark:border-[#222430] bg-slate-50/60 dark:bg-[#121319] hover:border-slate-400 dark:hover:border-neutral-700 hover:bg-slate-100/70 dark:hover:bg-[#161822]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-white font-mono truncate group-hover:text-black dark:group-hover:text-white">
                              {repo.fullName}
                            </span>

                            {/* Public/Private Badge */}
                            {repo.private ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                                <Lock className="w-2.5 h-2.5" />
                                <span>Private</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/10 text-slate-600 dark:text-neutral-400 border border-slate-500/20 shrink-0">
                                <Globe className="w-2.5 h-2.5" />
                                <span>Public</span>
                              </span>
                            )}
                          </div>

                          {repo.description && (
                            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 line-clamp-1">
                              {repo.description}
                            </p>
                          )}
                        </div>

                        {/* Scan button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRepoUrl(repo.htmlUrl);
                            executeScan(repo.htmlUrl);
                          }}
                          disabled={loading}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 shadow-2xs"
                        >
                          <span>Scan</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-neutral-500 pt-0.5">
                        {repo.language && (
                          <span className="flex items-center gap-1 text-slate-600 dark:text-neutral-300 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {repo.language}
                          </span>
                        )}
                        {repo.stars > 0 && <span>⭐ {repo.stars}</span>}
                        <span>Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepositoryImportModal;
