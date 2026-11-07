import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  User,
  ChevronDown,
  Download,
  FileCode,
  Code2,
  FileText,
  Copy,
  Check,
  X,
  Share2,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScenarioFixture, ArchitectureNode, ArchitectureEdge } from '../types';
import {
  generateMermaidDiagram,
  generateArchitectureJson,
  generateSystemDesignReport,
  downloadFile,
  copyToClipboard,
} from '../utils/exportDiagram';
import { captureArchitectureSnapshot } from '../utils/captureSnapshot';
import { AutoSaveStatus } from '../services/playgroundPersistence';
import { UserDropdownMenu } from './UserDropdownMenu';

interface HeaderProps {
  scenarios: ScenarioFixture[];
  currentScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  isRunning?: boolean;
  onToggleRun?: () => void;
  onReset: () => void;
  onOpenCompare?: () => void;
  onOpenImportRepo: () => void;
  onOpenNewProject?: () => void;
  onOpenRecommender?: () => void;
  onOpenHistory?: () => void;
  onOpenFeed?: () => void;
  user?: any;
  token?: string | null;
  onNavigateToProfile?: (userId: string) => void;
  onViewLikes?: () => void;
  onViewSaved?: () => void;
  onOpenAuth?: () => void;
  onOpenSignUp?: () => void;
  onSignOut?: () => void;
  hasBaseline?: boolean;
  onGoHome?: () => void;
  viewMode?: 'basic' | 'detailed';
  onToggleViewMode?: (mode: 'basic' | 'detailed') => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  isLeftCollapsed?: boolean;
  nodes?: ArchitectureNode[];
  edges?: ArchitectureEdge[];
  projectName?: string;
  saveStatus?: AutoSaveStatus;
  lastSaved?: Date | null;
  onForceSync?: () => void;
  onShareToFeed?: (snapshotDataUrl: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  scenarios: _scenarios,
  currentScenarioId: _currentScenarioId,
  onSelectScenario: _onSelectScenario,
  isRunning = true,
  onToggleRun,
  onReset,
  onOpenImportRepo,
  onOpenNewProject,
  onOpenRecommender: _onOpenRecommender,
  onOpenHistory,
  onOpenFeed: _onOpenFeed,
  user,
  token,
  onNavigateToProfile,
  onViewLikes,
  onViewSaved,
  onOpenAuth,
  onOpenSignUp,
  onSignOut,
  onGoHome,
  isDark = true,
  onToggleTheme,
  isLeftCollapsed: _isLeftCollapsed = false,
  nodes = [],
  edges = [],
  projectName = 'GitToScale System Design',
  saveStatus: _saveStatus,
  lastSaved: _lastSaved,
  onForceSync: _onForceSync,
  onShareToFeed,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<'mermaid' | 'json' | 'report'>('mermaid');
  const [copiedType, setCopiedType] = useState<'mermaid' | 'json' | 'report' | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleShareToFeed = async () => {
    try {
      setIsCapturing(true);
      const snapshotDataUrl = await captureArchitectureSnapshot(nodes || [], edges || [], projectName, isDark);
      setIsExportOpen(false);
      if (onShareToFeed) {
        onShareToFeed(snapshotDataUrl);
      }
    } catch (err) {
      console.error('[Header] Failed to capture snapshot:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsExportOpen(false);
        setIsPreviewModalOpen(false);
      }
    };

    if (isMenuOpen || isExportOpen || isPreviewModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen, isExportOpen, isPreviewModalOpen]);

  const safeFilename = (projectName || 'architecture')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 40) || 'architecture';

  const handleDownloadMermaid = () => {
    const content = generateMermaidDiagram(nodes, edges, projectName);
    downloadFile(content, `${safeFilename}.mmd`, 'text/plain;charset=utf-8');
    setIsExportOpen(false);
  };

  const handleCopyMermaid = async () => {
    const content = generateMermaidDiagram(nodes, edges, projectName);
    const success = await copyToClipboard(content);
    if (success) {
      setCopiedType('mermaid');
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const handleDownloadJson = () => {
    const content = generateArchitectureJson(nodes, edges, projectName);
    downloadFile(content, `${safeFilename}.json`, 'application/json;charset=utf-8');
    setIsExportOpen(false);
  };

  const handleCopyJson = async () => {
    const content = generateArchitectureJson(nodes, edges, projectName);
    const success = await copyToClipboard(content);
    if (success) {
      setCopiedType('json');
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const handleDownloadReport = () => {
    const content = generateSystemDesignReport(nodes, edges, projectName);
    downloadFile(content, `${safeFilename}_system_design.md`, 'text/markdown;charset=utf-8');
    setIsExportOpen(false);
  };

  const handleCopyReport = async () => {
    const content = generateSystemDesignReport(nodes, edges, projectName);
    const success = await copyToClipboard(content);
    if (success) {
      setCopiedType('report');
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  // const activeScenario = _scenarios.find((s) => s.id === _currentScenarioId);

  return (
    <header className="h-14 border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#020202] px-2.5 sm:px-4 flex items-center justify-between z-40 shrink-0 transition-colors w-full">
      {/* Brand & Title */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <button
          onClick={onGoHome}
          className="flex items-center text-left group hover:opacity-85 transition-opacity cursor-pointer"
          title="Return to Landing Page"
        >
          <img
            src={isDark ? '/logo.png' : '/logo-light.png'}
            alt="GitToScale"
            className="h-6 sm:h-7 md:h-8 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </button>
      </div>

      {/* Main Operational Controls (Play/Pause, Reset, AI Architect, Stars, and User Button) */}
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 shrink-0">
        {/* Play/Pause Simulation Button */}
        {onToggleRun && (
          <button
            onClick={onToggleRun}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0 ${
              isRunning
                ? 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black'
                : 'bg-slate-800 hover:bg-slate-700 text-white dark:bg-neutral-200 dark:hover:bg-white dark:text-black'
            }`}
            title={isRunning ? 'Pause request flow simulation' : 'Play live request simulation'}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current text-white dark:text-black" />
                <span className="hidden xs:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-white dark:text-black" />
                <span className="hidden xs:inline">Start</span>
              </>
            )}
          </button>
        )}

        {/* Reset button */}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-900 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm cursor-pointer shrink-0"
          title="Reset architecture to initial scenario values"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600 dark:text-neutral-300" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {/* Start New Project / Enter Idea or Import Repo */}
        {onOpenNewProject && (
          <button
            onClick={onOpenNewProject}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-neutral-950 hover:bg-slate-800 dark:hover:bg-neutral-100 transition-all shadow-xs cursor-pointer shrink-0"
            title="Enter an architecture idea or import repository"
          >
            <span className="hidden sm:inline">New Project</span>
          </button>
        )}

        {/* Export Design (JSON or Mermaid) */}
        <div ref={exportRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsExportOpen((prev) => !prev)}
            aria-label="Export architecture as JSON or Mermaid"
            aria-expanded={isExportOpen}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-900 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs cursor-pointer shrink-0"
            title="Export design as JSON or Mermaid diagram"
          >
            <Download className="w-3.5 h-3.5 text-slate-600 dark:text-neutral-300" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown
              className={`w-3 h-3 text-slate-400 dark:text-neutral-500 transition-transform duration-200 ${
                isExportOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Export Dropdown Menu */}
          <AnimatePresence>
            {isExportOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-200/90 dark:border-neutral-800/90 bg-white dark:bg-[#0C0C0E] shadow-xl p-1.5 z-50 flex flex-col gap-0.5"
              >
                <button
                  type="button"
                  onClick={handleShareToFeed}
                  disabled={isCapturing}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800/70 transition-colors cursor-pointer text-left disabled:opacity-50"
                >
                  {isCapturing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  ) : (
                    <Share2 className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                  )}
                  <span>{isCapturing ? 'Capturing Snapshot...' : 'Share to Community Feed'}</span>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-neutral-800/80" />

                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800/70 transition-colors cursor-pointer text-left"
                >
                  <FileText className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                  <span>Download Report (.md)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadMermaid}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800/70 transition-colors cursor-pointer text-left"
                >
                  <FileCode className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                  <span>Download Mermaid (.mmd)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800/70 transition-colors cursor-pointer text-left"
                >
                  <Code2 className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                  <span>Download JSON (.json)</span>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-neutral-800/80" />

                <button
                  type="button"
                  onClick={() => {
                    setIsExportOpen(false);
                    setIsPreviewModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors cursor-pointer text-left"
                >
                  <FileCode className="w-4 h-4" />
                  <span>Preview & Export Report</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* GitHub Star Button */}

        {/* User Button: Container for User Profile, Theme, Import Repo, History, and Scenario */}
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="User profile, workspace tools, and settings"
            aria-expanded={isMenuOpen}
            className="flex items-center gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] hover:bg-slate-50 dark:hover:bg-[#141416] text-slate-700 dark:text-neutral-200 transition-all shadow-xs cursor-pointer shrink-0"
          >
            {user ? (
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 flex items-center justify-center font-bold text-xs shrink-0 relative">
                {(user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-slate-400 dark:bg-neutral-500 border border-white dark:border-[#0A0A0A]" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-700 dark:text-neutral-300 shrink-0">
                <User className="w-3.5 h-3.5 text-slate-600 dark:text-neutral-300" />
              </div>
            )}
            <span className="text-xs font-semibold hidden md:inline max-w-[90px] truncate">
              {user ? (user.user_metadata?.full_name || user.email?.split('@')[0]) : 'Account'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 transition-transform duration-200 ${
                isMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* User Dropdown Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 top-full mt-2 z-50"
              >
                <UserDropdownMenu
                  user={user}
                  token={token}
                  isDark={isDark}
                  onToggleTheme={onToggleTheme}
                  onNavigateToProfile={onNavigateToProfile}
                  onViewLikes={onViewLikes}
                  onViewSaved={onViewSaved}
                  onOpenImportRepo={onOpenImportRepo}
                  onOpenHistory={onOpenHistory}
                  onSignOut={onSignOut}
                  onClose={() => setIsMenuOpen(false)}
                  onOpenAuth={onOpenAuth}
                  onOpenSignUp={onOpenSignUp}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Code & Diagram Preview Modal */}
      <AnimatePresence>
        {isPreviewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0c0d10] shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-neutral-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Export Architecture Design
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      {projectName || 'System Design'} · {nodes?.length || 0} nodes, {edges?.length || 0} edges
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (previewTab === 'mermaid') handleCopyMermaid();
                      else if (previewTab === 'report') handleCopyReport();
                      else handleCopyJson();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedType === previewTab ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>
                          Copy {previewTab === 'mermaid' ? 'Mermaid' : previewTab === 'report' ? 'Report' : 'JSON'}
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (previewTab === 'mermaid') handleDownloadMermaid();
                      else if (previewTab === 'report') handleDownloadReport();
                      else handleDownloadJson();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPreviewModalOpen(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 px-5 pt-3 pb-2 border-b border-slate-100 dark:border-neutral-800/60 bg-slate-50/50 dark:bg-neutral-900/30 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setPreviewTab('report')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    previewTab === 'report'
                      ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>System Design Report (.md)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('mermaid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    previewTab === 'mermaid'
                      ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Mermaid Flowchart (.mmd)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('json')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    previewTab === 'json'
                      ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Architecture JSON (.json)</span>
                </button>
              </div>

              {/* Code Viewer Body */}
              <div className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-[#07080a] text-slate-800 dark:text-slate-100 font-mono text-xs leading-relaxed border-t border-slate-200 dark:border-neutral-800 selection:bg-indigo-600 selection:text-white">
                <pre className="whitespace-pre overflow-x-auto">
                  {previewTab === 'mermaid'
                    ? generateMermaidDiagram(nodes || [], edges || [], projectName)
                    : previewTab === 'report'
                    ? generateSystemDesignReport(nodes || [], edges || [], projectName)
                    : generateArchitectureJson(nodes || [], edges || [], projectName)}
                </pre>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
