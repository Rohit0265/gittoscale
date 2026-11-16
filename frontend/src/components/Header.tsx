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
  Plus,
  Sparkles,
  GitBranch,
  ExternalLink,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScenarioFixture, ArchitectureNode, ArchitectureEdge, SimulationResult } from '../types';
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
import { extractAccountAvatar } from '../feed/utils/avatarUtils';
import { UserAvatar } from '../feed/components/UserAvatar';

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
  onStartBlankProject?: () => void;
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
  simulationResult?: SimulationResult | null;
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
  onStartBlankProject,
  onOpenRecommender: _onOpenRecommender,
  onOpenHistory,
  onOpenFeed: _onOpenFeed,
  user,
  token,
  onNavigateToProfile: _onNavigateToProfile,
  onViewLikes: _onViewLikes,
  onViewSaved: _onViewSaved,
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
  simulationResult,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<'mermaid' | 'json' | 'report'>('mermaid');
  const [copiedType, setCopiedType] = useState<'mermaid' | 'json' | 'report' | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const newProjectRef = useRef<HTMLDivElement>(null);

  const handleShareToFeed = async () => {
    try {
      setIsCapturing(true);
      const snapshotDataUrl = await captureArchitectureSnapshot(
        nodes || [],
        edges || [],
        projectName,
        isDark,
        simulationResult?.nodeResults
      );
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
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(target)) {
        setIsExportOpen(false);
      }
      if (newProjectRef.current && !newProjectRef.current.contains(target)) {
        setIsNewProjectOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsExportOpen(false);
        setIsNewProjectOpen(false);
        setIsPreviewModalOpen(false);
      }
    };

    if (isMenuOpen || isExportOpen || isNewProjectOpen || isPreviewModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen, isExportOpen, isNewProjectOpen, isPreviewModalOpen]);

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
      {/* Brand & Collab Navigation */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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

        {/* Collab Navigation Link */}
        <a
          href="/collab"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border border-indigo-200/90 dark:border-indigo-900/80 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 hover:text-indigo-900 dark:hover:text-indigo-200 transition-all shadow-2xs group cursor-pointer"
          title="Open GitToScale Collab in new tab"
        >
          <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Collab</span>
          <ExternalLink className="w-3 h-3 text-indigo-500/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </a>
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

        {/* Start New Project (Dropdown: Blank Project, Describe Idea, or Import GitHub Repo) */}
        {onOpenNewProject && (
          <div ref={newProjectRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsNewProjectOpen((prev) => !prev)}
              aria-label="Create new project"
              aria-expanded={isNewProjectOpen}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-neutral-950 hover:bg-slate-800 dark:hover:bg-neutral-100 transition-all shadow-xs cursor-pointer shrink-0"
              title="Start a new project (Blank Canvas, AI Prompt, or GitHub Repo)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Project</span>
              <ChevronDown
                className={`w-3 h-3 text-slate-300 dark:text-neutral-700 transition-transform duration-200 ${
                  isNewProjectOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* New Project Dropdown Menu */}
            <AnimatePresence>
              {isNewProjectOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-60 rounded-xl border border-slate-200/90 dark:border-neutral-800/90 bg-white dark:bg-[#0C0C0E] shadow-xl p-1.5 z-50 flex flex-col gap-1"
                >
                  {onStartBlankProject && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewProjectOpen(false);
                        onStartBlankProject();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800/70 transition-colors cursor-pointer text-left group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">Blank Project</div>
                        <div className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">Clean canvas, no AI prompt</div>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsNewProjectOpen(false);
                      onOpenNewProject();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800/70 transition-colors cursor-pointer text-left group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">Describe Idea</div>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">AI generates initial design</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsNewProjectOpen(false);
                      onOpenImportRepo();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800/70 transition-colors cursor-pointer text-left group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-600 dark:text-neutral-300 shrink-0">
                      <GitBranch className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">Import Repository</div>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">Scan code from GitHub URL</div>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
              <div className="relative shrink-0">
                <UserAvatar
                  src={extractAccountAvatar(user)}
                  name={user.user_metadata?.full_name || user.email?.split('@')[0]}
                  seed={user.id || user.email}
                  className="w-6 h-6 rounded-full"
                  fallbackClassName="w-6 h-6 rounded-full text-white flex items-center justify-center font-bold text-[11px]"
                />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-[#0A0A0A]" />
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
                  variant="app"
                  user={user}
                  token={token}
                  isDark={isDark}
                  onToggleTheme={onToggleTheme}
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
              <div className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-[#07080a] text-slate-900 dark:text-neutral-100 font-mono text-xs leading-relaxed border-t border-slate-200 dark:border-neutral-800">
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
