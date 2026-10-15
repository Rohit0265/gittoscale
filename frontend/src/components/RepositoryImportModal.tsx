import React, { useState, useEffect } from 'react';
import {
  X,
  Github,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  Key,
  Lock,
  Share2,
} from 'lucide-react';
import { api } from '../services/api';
import { ArchitectureNode, ArchitectureEdge } from '../types';

interface RepositoryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportArchitecture: (
    nodes: ArchitectureNode[],
    edges: ArchitectureEdge[],
    repoName: string,
    basicGraph?: { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] },
    detailedGraph?: { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] }
  ) => void;
}

export const RepositoryImportModal: React.FC<RepositoryImportModalProps> = ({
  isOpen,
  onClose,
  onImportArchitecture,
}) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // LLM Configuration state
  const [showLLMSettings, setShowLLMSettings] = useState(true);
  const [llmProvider, setLlmProvider] = useState('gemini');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [llmModel, setLlmModel] = useState('gemini-3.1-flash-lite');
  const [envKeyConfigured, setEnvKeyConfigured] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    testing: boolean;
    message?: string;
    success?: boolean;
  }>({ testing: false });

  useEffect(() => {
    if (isOpen) {
      api
        .getLLMStatus()
        .then((status) => {
          if (status.hasKey) {
            setEnvKeyConfigured(true);
            if (status.provider && status.provider !== 'none') {
              setLlmProvider(status.provider);
            }
            if (status.model) {
              setLlmModel(status.model);
            }
          }
        })
        .catch(() => {
          // Fallback silently if status endpoint fails
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProviderChange = (newProvider: string) => {
    setLlmProvider(newProvider);
    if (newProvider === 'gemini') {
      setLlmModel('gemini-3.1-flash-lite');
    } else if (newProvider === 'openai') {
      setLlmModel('gpt-4o-mini');
    } else if (newProvider === 'anthropic') {
      setLlmModel('claude-3-5-sonnet-20241022');
    }
  };

  const handleTestLLM = async () => {
    setTestStatus({ testing: true });
    try {
      const res = await api.testLLM({
        provider: llmProvider,
        apiKey: llmApiKey.trim() || undefined,
      });
      setTestStatus({
        testing: false,
        message: res.message || 'LLM connection verified successfully!',
        success: res.success,
      });
    } catch (err: any) {
      setTestStatus({
        testing: false,
        message:
          err.response?.data?.message || err.message || 'Failed to connect to LLM provider',
        success: false,
      });
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = repoUrl.trim();
    if (!trimmed) {
      setError('Please enter a GitHub repository URL or workspace path.');
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

      if (llmApiKey.trim()) {
        payload.llmConfig = {
          provider: llmProvider,
          apiKey: llmApiKey.trim(),
          model: llmModel,
        };
      }

      const res = await api.analyzeRepository(payload);

      const repoName =
        res.repoName ||
        trimmed.split('/').pop()?.replace('.git', '') ||
        'Repository';

      onImportArchitecture(res.nodes, res.edges, repoName, res.basicGraph, res.detailedGraph);
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Failed to scan repository.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Provider branding rendering
  const renderProviderIcon = () => {
    if (llmProvider === 'gemini') {
      return (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      );
    }
    if (llmProvider === 'openai') {
      return (
        <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
          AI
        </span>
      );
    }
    return (
      <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
        A
      </span>
    );
  };

  const providerNames: Record<string, string> = {
    gemini: 'Google Gemini',
    openai: 'OpenAI',
    anthropic: 'Anthropic',
  };

  const isConfigured = envKeyConfigured || Boolean(llmApiKey.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0E0F15] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#20222C] w-full max-w-[560px] overflow-hidden text-xs text-slate-800 dark:text-neutral-100 p-6 sm:p-7 space-y-6 transition-all">
        {/* Header matching Image 2 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-11 h-11 rounded-2xl bg-[#524bf7] text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Share2 className="w-5 h-5 text-white stroke-[2.2]" />
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
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleScan} className="space-y-5">
          {/* GitHub Repository URL Input with integrated GitHub icon */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-neutral-200 mb-2 block">
              GitHub Repository URL
            </label>
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

          {/* AI Configuration Collapsible Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#20222C] bg-slate-50/50 dark:bg-[#121319] p-4 space-y-4 transition-all">
            {/* Header row with toggle */}
            <div
              onClick={() => setShowLLMSettings(!showLLMSettings)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center">
                <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 shrink-0">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white ml-2.5">
                  AI Configuration
                </span>
                <span
                  className={`ml-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium border ${
                    isConfigured
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isConfigured
                        ? 'bg-emerald-500 dark:bg-emerald-400'
                        : 'bg-amber-500 dark:bg-amber-400'
                    }`}
                  />
                  {isConfigured ? 'API key configured' : 'API key needed'}
                </span>
              </div>
              <button
                type="button"
                className="p-1 text-slate-400 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                {showLLMSettings ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Collapsible settings fields */}
            {showLLMSettings && (
              <div className="space-y-3.5 pt-1">
                {/* Provider and Model row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-neutral-400 mb-1.5 block">
                      Provider
                    </label>
                    <div className="relative h-10 px-3 rounded-xl border border-slate-200 dark:border-[#262833] bg-white dark:bg-[#181922] flex items-center justify-between text-xs text-slate-800 dark:text-neutral-200 cursor-pointer">
                      <div className="flex items-center gap-2 min-w-0">
                        {renderProviderIcon()}
                        <span className="font-medium truncate">
                          {providerNames[llmProvider] || 'Google Gemini'}
                        </span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400 ml-2 shrink-0 pointer-events-none" />
                      <select
                        value={llmProvider}
                        onChange={(e) => handleProviderChange(e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      >
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-neutral-400 mb-1.5 block">
                      Model
                    </label>
                    <input
                      type="text"
                      value={llmModel}
                      onChange={(e) => setLlmModel(e.target.value)}
                      className="h-10 px-3 rounded-xl border border-slate-200 dark:border-[#262833] bg-white dark:bg-[#181922] font-mono text-xs text-slate-800 dark:text-neutral-200 outline-none focus:border-indigo-500 w-full"
                    />
                  </div>
                </div>

                {/* API Key row */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-neutral-400 mb-1.5 block">
                    API Key
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center h-10 px-3 rounded-xl border border-slate-200 dark:border-[#262833] bg-white dark:bg-[#181922] focus-within:border-indigo-500">
                      <Key className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400 mr-2.5 shrink-0" />
                      <input
                        type="password"
                        placeholder="••••••••••••••••"
                        value={llmApiKey}
                        onChange={(e) => setLlmApiKey(e.target.value)}
                        className="w-full bg-transparent font-mono text-xs text-slate-800 dark:text-neutral-200 placeholder:text-slate-400 dark:placeholder:text-neutral-500 outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleTestLLM}
                      disabled={testStatus.testing}
                      className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-[#262833] bg-white dark:bg-[#181922] hover:bg-slate-100 dark:hover:bg-[#20212d] text-xs font-semibold text-slate-700 dark:text-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {testStatus.testing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                      )}
                      <span>Test</span>
                    </button>
                  </div>

                  {testStatus.message && (
                    <div
                      className={`mt-2 p-2 rounded-xl text-[11px] flex items-center gap-2 ${
                        testStatus.success
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60'
                      }`}
                    >
                      {testStatus.success ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                      )}
                      <span>{testStatus.message}</span>
                    </div>
                  )}

                  {/* Security disclaimer matching Image 2 */}
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
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons matching Image 2 */}
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
    </div>
  );
};

export default RepositoryImportModal;
