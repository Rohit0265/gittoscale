import React, { useState } from 'react';
import { X, FolderGit2, Github, Folder, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
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

  if (!isOpen) return null;

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setDetectedServices([]);

    try {
      const payload =
        activeTab === 'github'
          ? { repoUrl: repoUrl.trim() }
          : { localPath: localPath.trim() };

      const res = await api.analyzeRepository(payload);
      setDetectedServices(res.detectedServices || []);

      const repoName =
        activeTab === 'github'
          ? repoUrl.trim().split('/').pop()?.replace('.git', '') || 'GitHub Repo'
          : localPath.trim().split('/').pop() || 'Local Repo';

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
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-800">
                Import / Scan Repository Architecture
              </h2>
              <p className="text-[11px] text-slate-500">
                Enter your repository to automatically discover services and simulate traffic
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
        <div className="flex border-b border-slate-200 bg-slate-100/60 p-2 gap-2 text-xs">
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
        <form onSubmit={handleScan} className="p-5 space-y-4">
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
                Supports public repositories containing docker-compose manifests, microservices folders, or package workspaces.
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
                Scans directory manifests (docker-compose, package.json workspaces, sub-services).
              </p>
            </div>
          )}

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
                <span>Detected Services ({detectedServices.length}):</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-mono">
                {detectedServices.join(', ')}
              </p>
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <span className="font-semibold text-slate-800 block">What happens when you import?</span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-500 text-[10px]">
              <li>Discovers services, gateways, databases, and caches in the repository</li>
              <li>Generates an interactive topology on the architecture canvas</li>
              <li>Allows you to simulate live traffic load and identify potential bottlenecks</li>
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
                  Scanning Repository...
                </>
              ) : (
                <>
                  <span>Import &amp; Visualize</span>
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

