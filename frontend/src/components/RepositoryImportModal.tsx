import React, { useState } from 'react';
import {
  X,
  Github,
  ArrowRight,
  Loader2,
  AlertCircle,
  Key,
  Lock,
  GitBranch,
  Eye,
  EyeOff,
  Globe,
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

  // Private repository & GitHub token authorization state
  const [isPrivateRepo, setIsPrivateRepo] = useState(false);
  const [githubToken, setGithubToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gts_github_token') || '';
    }
    return '';
  });
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [isAuthorizingGithub, setIsAuthorizingGithub] = useState(false);

  const handleAuthorizeGitHub = async () => {
    setIsAuthorizingGithub(true);
    setError(null);
    try {
      const { error: authErr } = await signInWithOAuth('github');
      if (authErr) {
        setError(`GitHub authorization failed: ${authErr.message}`);
      } else {
        const token = localStorage.getItem('gts_github_token') || '';
        if (token) {
          setGithubToken(token);
          setIsPrivateRepo(true);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to authorize GitHub');
    } finally {
      setIsAuthorizingGithub(false);
    }
  };

  if (!isOpen) return null;

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = repoUrl.trim();
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
      const payload: any = {};
      if (
        trimmed.startsWith('/') ||
        trimmed.startsWith('./') ||
        (!trimmed.includes('github.com') && !trimmed.includes('http'))
      ) {
        payload.localPath = trimmed;
      } else {
        payload.repoUrl = trimmed;
      }

      if (githubToken.trim()) {
        payload.githubToken = githubToken.trim();
        try {
          localStorage.setItem('gts_github_token', githubToken.trim());
        } catch {}
      } else if (isPrivateRepo) {
        setError("Please authorize GitHub or enter a Personal Access Token with 'repo' scope to scan private repositories.");
        setLoading(false);
        return;
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
      if (
        msg.toLowerCase().includes('private') ||
        msg.toLowerCase().includes('not found') ||
        msg.toLowerCase().includes('denied') ||
        msg.toLowerCase().includes('scope') ||
        msg.toLowerCase().includes('404')
      ) {
        setIsPrivateRepo(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2.5 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0E0F15] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#20222C] w-full max-w-[560px] max-h-[92vh] overflow-y-auto text-xs text-slate-800 dark:text-neutral-100 p-4 sm:p-6 md:p-7 space-y-5 sm:space-y-6 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 dark:bg-neutral-800 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 flex items-center justify-center shrink-0 transition-colors">
              <GitBranch className="w-5 h-5 text-slate-800 dark:text-white stroke-[2.2] hover:text-indigo-500 transition-colors" />
            </div>
            <div className="ml-3.5 flex flex-col justify-center">
              <h2 className="text-base sm:text-[17px] font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                Analyze Repository Architecture
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 font-normal">
                Inspect services and map runtime dependencies
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

        {/* Form Body */}
        <form onSubmit={handleScan} className="space-y-5">
          {/* GitHub Repository URL Input & Visibility Toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-neutral-200 block">
                GitHub Repository URL
              </label>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#1a1b22] p-0.5 rounded-lg border border-slate-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsPrivateRepo(false)}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    !isPrivateRepo
                      ? 'bg-white dark:bg-[#252733] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>Public</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrivateRepo(true)}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    isPrivateRepo
                      ? 'bg-white dark:bg-[#252733] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
                  }`}
                >
                  <Lock className="w-3 h-3 text-amber-500" />
                  <span>Private</span>
                </button>
              </div>
            </div>

            <div className="flex items-center h-12 px-3.5 rounded-xl border border-slate-200 dark:border-[#222430] bg-slate-50/70 dark:bg-[#121319] focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
              <Github className="w-5 h-5 text-slate-800 dark:text-white shrink-0 mr-3" />
              <div className="w-[1px] h-5 bg-slate-300 dark:bg-neutral-700/80 mr-3 shrink-0" />
              <input
                type="text"
                required
                placeholder="https://github.com/owner/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full bg-transparent text-xs font-mono text-slate-900 dark:text-neutral-200 placeholder:text-slate-400 dark:placeholder:text-neutral-500 outline-none"
              />
            </div>
          </div>

          {/* Private Repository Authorization Section */}
          {isPrivateRepo && (
            <div className="rounded-2xl border border-amber-500/30 dark:border-amber-500/25 bg-amber-500/5 p-4 space-y-3.5 transition-all animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Private Repository Authorization
                    </span>
                    <span className="text-[11px] font-normal text-slate-500 dark:text-neutral-400 ml-1.5 hidden sm:inline">
                      (Requires &apos;repo&apos; scope access)
                    </span>
                  </div>
                </div>

                {githubToken ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    Authorized
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-semibold">
                    Authorization Needed
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-relaxed">
                To inspect private codebases, authorize access using your GitHub account or paste a GitHub Personal Access Token (PAT).
              </p>

              {/* 1-Click Authorize with GitHub */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleAuthorizeGitHub}
                  disabled={isAuthorizingGithub}
                  className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-neutral-950 hover:bg-slate-800 dark:hover:bg-neutral-100 text-xs font-semibold shadow-xs hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isAuthorizingGithub ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Github className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>{githubToken ? 'Re-authorize with GitHub' : 'Authorize with GitHub'}</span>
                </button>

                <span className="text-slate-400 dark:text-neutral-500 text-[11px] text-center sm:text-left font-medium">
                  or use Personal Access Token below
                </span>
              </div>

              {/* Personal Access Token Input */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-neutral-300">
                    GitHub Personal Access Token (PAT)
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=GitToScale%20Repository%20Scanner"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10.5px] text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>Generate token on GitHub</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </a>
                </div>

                <div className="flex items-center h-10 px-3 rounded-xl border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#0E0F15] focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                  <Key className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-2" />
                  <input
                    type={showGithubToken ? 'text' : 'password'}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_..."
                    value={githubToken}
                    onChange={(e) => {
                      setGithubToken(e.target.value);
                      try {
                        localStorage.setItem('gts_github_token', e.target.value.trim());
                      } catch {}
                    }}
                    className="w-full bg-transparent text-xs font-mono text-slate-900 dark:text-neutral-200 placeholder:text-slate-400 dark:placeholder:text-neutral-600 outline-none"
                  />
                  {githubToken && (
                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <button
                        type="button"
                        onClick={() => setShowGithubToken((prev) => !prev)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 transition-colors cursor-pointer p-1"
                        title={showGithubToken ? 'Hide token' : 'Show token'}
                      >
                        {showGithubToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setGithubToken('');
                          try {
                            localStorage.removeItem('gts_github_token');
                          } catch {}
                        }}
                        className="text-slate-400 hover:text-rose-500 transition-colors text-[10px] font-semibold px-1.5 py-0.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Disconnect token"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Configuration Section (Optional) */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#20222C] bg-slate-50/50 dark:bg-[#121319] p-4 space-y-4 transition-all">
            {/* Header row */}
            <div className="flex items-center justify-between select-none">
              <div className="flex items-center flex-wrap gap-y-1">
                <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 shrink-0">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white ml-2">
                  AI Configuration
                </span>
                <span className="text-[11px] font-normal text-slate-500 dark:text-neutral-400 ml-1">
                  (Optional)
                </span>

                {/* Info button & tooltip */}
                {/* <div className="relative inline-flex items-center ml-1.5">
                  <button
                    ref={infoButtonRef}
                    type="button"
                    tabIndex={0}
                    aria-label="AI Configuration information"
                    onMouseEnter={() => setShowInfoTooltip(true)}
                    onMouseLeave={() => setShowInfoTooltip(false)}
                    onFocus={() => setShowInfoTooltip(true)}
                    onBlur={() => setShowInfoTooltip(false)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowInfoTooltip((prev) => !prev);
                    }}
                    className="w-4 h-4 rounded-full border border-slate-300 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-neutral-500 flex items-center justify-center text-[10.5px] font-bold leading-none transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    ?
                  </button>

                  {showInfoTooltip && (
                    <div
                      ref={tooltipRef}
                      role="tooltip"
                      className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-2.5 rounded-xl bg-slate-900 text-slate-100 dark:bg-[#1E202B] dark:text-neutral-200 border border-slate-700 dark:border-[#323546] shadow-xl text-[11px] leading-relaxed z-50 pointer-events-auto"
                    >
                      Want to use your own LLM? Configure it here. Otherwise, leave this blank and the default model will be used.
                      <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-[1px] border-4 border-transparent border-t-slate-900 dark:border-t-[#1E202B]" />
                    </div>
                  )}
                </div> */}

                {/* Status indicator pill */}
                {/* <span
                  className={`ml-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                    isCustomConfigured
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-neutral-400 border-slate-200 dark:border-white/[0.08]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isCustomConfigured
                        ? 'bg-emerald-500 dark:bg-emerald-400'
                        : 'bg-slate-400 dark:bg-neutral-500'
                    }`}
                  />
                  {isCustomConfigured ? 'Custom LLM configured' : 'Using built-in default'}
                </span> */}
              </div>

              {/* Reset to default action and collapse chevron */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  title="Reset AI configuration to default"
                  className="text-[11px] font-medium text-slate-400 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Reset to default</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowLLMSettings(!showLLMSettings)}
                  aria-label={showLLMSettings ? 'Collapse AI settings' : 'Expand AI settings'}
                  className="p-1 text-slate-400 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {showLLMSettings ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Collapsible settings fields */}
            {showLLMSettings && (
              <div className="space-y-3.5 pt-1">
                {/* Provider and Model row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Provider Custom Dropdown */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-neutral-400 mb-1.5 block">
                      Provider
                    </label>
                    <button
                      ref={triggerRef}
                      type="button"
                      role="combobox"
                      aria-expanded={isDropdownOpen}
                      aria-haspopup="listbox"
                      aria-label="AI Provider"
                      onClick={() => {
                        setIsDropdownOpen((prev) => !prev);
                        const currentIndex = PROVIDER_OPTIONS.findIndex(
                          (p) => p.id === llmProvider
                        );
                        setFocusedOptionIndex(currentIndex >= 0 ? currentIndex : 0);
                      }}
                      onKeyDown={handleTriggerKeyDown}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-[#262833] bg-white dark:bg-[#181922] hover:bg-slate-50 dark:hover:bg-[#1c1d27] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between text-xs text-slate-800 dark:text-neutral-200 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {renderProviderLogo(llmProvider)}
                        <span className="font-medium truncate">
                          {PROVIDER_OPTIONS.find((p) => p.id === llmProvider)?.name ||
                            'Google Gemini'}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 dark:text-neutral-400 ml-2 shrink-0 transition-transform duration-200 ${
                          isDropdownOpen ? 'rotate-180 text-indigo-500 dark:text-indigo-400' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Model Input */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-neutral-400 mb-1.5 block">
                      Model
                    </label>
                    <input
                      type="text"
                      placeholder={
                        llmProvider === 'other'
                          ? 'e.g. meta-llama/Llama-3-70b'
                          : 'Model identifier'
                      }
                      value={llmModel}
                      onChange={(e) => {
                        setLlmModel(e.target.value);
                        if (modelError) setModelError(null);
                      }}
                      className="h-10 px-3 rounded-xl border border-slate-200 dark:border-[#262833] bg-white dark:bg-[#181922] font-mono text-xs text-slate-800 dark:text-neutral-200 outline-none focus:border-indigo-500 w-full placeholder:text-slate-400 dark:placeholder:text-neutral-600"
                    />
                    {modelError && (
                      <p className="text-[10.5px] text-red-500 mt-1 font-medium">{modelError}</p>
                    )}
                  </div>
                </div>

                {/* Extra Base URL field if Other LLM is chosen */}
                {llmProvider === 'other' && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-neutral-400 mb-1.5 block">
                      Base URL (OpenAI-compatible endpoint)
                    </label>
                    <div className="flex items-center h-10 px-3 rounded-xl border border-slate-200 dark:border-[#262833] bg-white dark:bg-[#181922] focus-within:border-indigo-500">
                      <Globe className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400 mr-2.5 shrink-0" />
                      <input
                        type="text"
                        placeholder="http://localhost:11434/v1 or https://api.together.xyz/v1"
                        value={llmBaseUrl}
                        onChange={(e) => {
                          setLlmBaseUrl(e.target.value);
                          if (baseUrlError) setBaseUrlError(null);
                        }}
                        className="w-full bg-transparent font-mono text-xs text-slate-800 dark:text-neutral-200 placeholder:text-slate-400 dark:placeholder:text-neutral-600 outline-none"
                      />
                    </div>
                    {baseUrlError && (
                      <p className="text-[10.5px] text-red-500 mt-1 font-medium">{baseUrlError}</p>
                    )}
                  </div>
                )}

                {/* API Key row */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-neutral-400 block">
                      API Key{' '}
                      {envKeyConfigured && !llmApiKey ? (
                        <span className="font-normal text-emerald-600 dark:text-emerald-400 text-[10px]">
                          (Server env key active)
                        </span>
                      ) : llmProvider === 'other' ? (
                        <span className="font-normal text-slate-400 dark:text-neutral-500 text-[10px]">
                          (Optional for local LLMs like Ollama)
                        </span>
                      ) : null}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center h-10 px-3 rounded-xl border border-slate-200 dark:border-[#262833] bg-white dark:bg-[#181922] focus-within:border-indigo-500">
                      <Key className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400 mr-2.5 shrink-0" />
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        placeholder={envKeyConfigured ? '•••••••• (using server key)' : '••••••••••••••••'}
                        value={llmApiKey}
                        onChange={(e) => setLlmApiKey(e.target.value)}
                        className="w-full bg-transparent font-mono text-xs text-slate-800 dark:text-neutral-200 placeholder:text-slate-400 dark:placeholder:text-neutral-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                        className="text-slate-400 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1"
                      >
                        {showApiKey ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestLLM}
                      disabled={testStatus.testing}
                      className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-[#262833] bg-white dark:bg-[#181922] hover:bg-slate-100 dark:hover:bg-[#20212d] text-xs font-semibold text-slate-700 dark:text-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {testStatus.testing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500 dark:text-neutral-400" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-700 dark:text-neutral-300 hover:text-emerald-500 transition-colors" />
                      )}
                      <span>Test</span>
                    </button>
                  </div>

                  {testStatus.message && (
                    <div
                      className={`mt-2 p-2 rounded-xl text-[11px] flex items-center gap-2 ${
                        testStatus.success
                          ? 'bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700'
                          : 'bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700'
                      }`}
                    >
                      {testStatus.success ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-slate-700 dark:text-neutral-300 hover:text-emerald-500 transition-colors" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-slate-700 dark:text-neutral-300 hover:text-rose-500 transition-colors" />
                      )}
                      <span>{testStatus.message}</span>
                    </div>
                  )}

                  {/* Security disclaimer */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-neutral-400 mt-2">
                    <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400 shrink-0" />
                    <span>Your API key is only used for this analysis and is never stored.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-slate-700 dark:text-neutral-300 hover:text-rose-500 transition-colors" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#262833] bg-white dark:bg-[#16171F] hover:bg-slate-100 dark:hover:bg-[#20212d] text-xs font-semibold text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#524bf7] hover:bg-[#4338ca] text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
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
      </div>

      {/* Custom Dropdown Portal - Rendered directly to document.body to prevent any container clipping */}
      {isDropdownOpen &&
        menuCoords &&
        ReactDOM.createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-label="AI Provider Options"
            tabIndex={-1}
            onKeyDown={handleMenuKeyDown}
            style={{
              position: 'fixed',
              left: `${menuCoords.left}px`,
              top: `${menuCoords.top}px`,
              width: `${menuCoords.width}px`,
              zIndex: 9999,
            }}
            className="bg-white dark:bg-[#181922] border border-slate-200 dark:border-[#262833] rounded-xl shadow-2xl p-1.5 space-y-0.5 outline-none animate-in fade-in zoom-in-95 duration-100"
          >
            {PROVIDER_OPTIONS.map((option, index) => {
              const isSelected = llmProvider === option.id;
              const isFocused = focusedOptionIndex === index;
              return (
                <div
                  key={option.id}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                  onClick={() => handleSelectProvider(option.id)}
                  onMouseEnter={() => setFocusedOptionIndex(index)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      : isFocused
                      ? 'bg-slate-100 dark:bg-[#222430] text-slate-900 dark:text-white'
                      : 'text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#222430]'
                  }`}
                >
                  {renderProviderLogo(option.id)}
                  <span className="truncate">{option.name}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white shrink-0 ml-auto" />
                  )}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
};

export default RepositoryImportModal;
