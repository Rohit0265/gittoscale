import React, { useState } from 'react';
import {
  X,
  FolderGit2,
  Github,
  Folder,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Cpu,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { ArchitectureNode, ArchitectureEdge } from '../types';

interface RepositoryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportArchitecture: (
    nodes: ArchitectureNode[],
    edges: ArchitectureEdge[],
    repoName: string
  ) => void;
}

export const RepositoryImportModal: React.FC<RepositoryImportModalProps> = ({
  isOpen,
  onClose,
  onImportArchitecture,
}) => {
  const [activeTab, setActiveTab] = useState<'github' | 'local'>('github');
  const [repoUrl, setRepoUrl] = useState('');
  const [localPath, setLocalPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedServices, setDetectedServices] = useState<string[]>([]);

  // LLM Configuration state
  const [showLLMSettings, setShowLLMSettings] = useState(false);
  const [llmProvider, setLlmProvider] = useState('openai');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [llmModel, setLlmModel] = useState('gpt-4o-mini');
  const [envKeyConfigured, setEnvKeyConfigured] = useState(false);
  const [testStatus, setTestStatus] = useState<{ testing: boolean; message?: string; success?: boolean }>({
    testing: false,
  });

  React.useEffect(() => {
    if (isOpen) {
      api.getLLMStatus().then((status) => {
        if (status.hasKey) {
          setEnvKeyConfigured(true);
          if (status.provider && status.provider !== 'none') {
            setLlmProvider(status.provider);
          }
          if (status.model) {
            setLlmModel(status.model);
          }
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestLLM = async () => {
    if (!llmApiKey.trim()) {
      setTestStatus({ testing: false, success: false, message: 'Please enter an API key to test.' });
      return;
    }
    setTestStatus({ testing: true });
    try {
      const res = await api.testLLM({ provider: llmProvider, apiKey: llmApiKey.trim() });
      setTestStatus({ testing: false, success: res.success, message: res.message });
    } catch (e: any) {
      setTestStatus({
        testing: false,
        success: false,
        message: e.response?.data?.message || e.message || 'Connection test failed.',
      });
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setDetectedServices([]);

    try {
      const payload: any =
        activeTab === 'github'
          ? { repoUrl: repoUrl.trim() }
          : { localPath: localPath.trim() };

      if (llmApiKey.trim()) {
        payload.llmConfig = {
          provider: llmProvider,
          apiKey: llmApiKey.trim(),
          model: llmModel,
        };
      }

      const res = await api.analyzeRepository(payload);
      setDetectedServices(res.detectedServices || []);

      const repoName =
        res.repoName ||
        (activeTab === 'github'
          ? repoUrl.trim().split('/').pop()?.replace('.git', '') || 'GitHub Repo'
          : localPath.trim().split('/').pop() || 'Local Repo');

      onImportArchitecture(res.nodes, res.edges, repoName);
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Failed to scan repository.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden text-xs max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-800">
                Analyze Repository Architecture
              </h2>
              <p className="text-[11px] text-slate-500">
                Deterministic static inspection + LLM runtime classification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 p-2 gap-2 text-xs shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('github');
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'github'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            GitHub URL
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('local');
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'local'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            Local Directory Path
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleScan} className="p-5 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'github' ? (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">
                GitHub Repository URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  required
                  placeholder="https://github.com/username/repository"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full pl-3 pr-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Inspects project structure, application entrypoints, and communication clients.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">
                Local Workspace / Repository Path
              </label>
              <input
                type="text"
                required
                placeholder="/home/my/Desktop/gitoscale or ./my-project"
                value={localPath}
                onChange={(e) => setLocalPath(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <p className="text-[10px] text-slate-500">
                Scans entry files, docker-compose, scripts, and distinguishes runtime services from shared packages.
              </p>
            </div>
          )}

          {/* Collapsible LLM Config */}
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
            <button
              type="button"
              onClick={() => setShowLLMSettings(!showLLMSettings)}
              className="w-full p-2.5 flex items-center justify-between text-left hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-semibold text-slate-800">
                  LLM Provider Configuration
                </span>
                {envKeyConfigured && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    .env Key Active
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium text-indigo-600">
                {showLLMSettings ? 'Hide' : envKeyConfigured ? 'Edit Settings' : 'Configure'}
              </span>
            </button>

            {showLLMSettings && (
              <div className="p-3 border-t border-slate-200 bg-white space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">
                      Provider
                    </label>
                    <select
                      value={llmProvider}
                      onChange={(e) => setLlmProvider(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs bg-slate-50"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="gemini">Google Gemini</option>
                      <option value="anthropic">Anthropic</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      value={llmModel}
                      onChange={(e) => setLlmModel(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-slate-200 font-mono text-xs bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">
                    API Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="sk-..."
                      value={llmApiKey}
                      onChange={(e) => setLlmApiKey(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded border border-slate-200 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleTestLLM}
                      disabled={testStatus.testing}
                      className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 font-medium text-slate-700 text-xs shrink-0 flex items-center gap-1"
                    >
                      {testStatus.testing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-3 h-3 text-indigo-600" />
                      )}
                      Test
                    </button>
                  </div>
                </div>

                {testStatus.message && (
                  <div
                    className={`p-2 rounded text-[11px] ${
                      testStatus.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {testStatus.message}
                  </div>
                )}
                <p className="text-[10px] text-slate-400">
                  Keys are only forwarded to the backend proxy and never persisted in frontend logs or storage.
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {detectedServices.length > 0 && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Runtime Services Identified ({detectedServices.length}):</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-mono">
                {detectedServices.join(', ')}
              </p>
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <span className="font-semibold text-slate-800 block">
              Architectural Classification Principles:
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-500 text-[10px]">
              <li>Never turns shared folders or utility packages into servers</li>
              <li>Detects actual runtime server listeners, background workers &amp; databases</li>
              <li>Maps evidenced communication relationships directly onto the simulator canvas</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors disabled:opacity-50 shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Analyzing Repository...
                </>
              ) : (
                <>
                  <span>Analyze &amp; Generate Diagram</span>
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
