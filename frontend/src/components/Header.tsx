import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FolderGit2,
  Sun,
  Moon,
  History,
  LogOut,
  User,
  LogIn,
  UserPlus,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScenarioFixture } from '../types';
import { GitHubStarButton } from './GitHubStarButton';

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
  user?: any;
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
  onToggleLeftSidebar?: () => void;
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
  onOpenRecommender,
  onOpenHistory,
  user,
  onOpenAuth,
  onOpenSignUp,
  onSignOut,
  onGoHome,
  isDark = false,
  onToggleTheme,
  isLeftCollapsed: _isLeftCollapsed = false,
  onToggleLeftSidebar: _onToggleLeftSidebar,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

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
            <Sparkles className="w-3.5 h-3.5 text-amber-400 dark:text-amber-500" />
            <span className="hidden sm:inline">New Idea</span>
          </button>
        )}

        {/* GitHub Star Button */}
        <GitHubStarButton className="hidden sm:inline-flex" />

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
                className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border border-slate-200/90 dark:border-neutral-800/90 bg-white/95 dark:bg-[#0C0C0E]/95 backdrop-blur-xl shadow-2xl shadow-slate-300/40 dark:shadow-black/70 p-3.5 z-50 flex flex-col gap-3"
              >
                {/* 1. User Profile or Auth */}
                {user ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-100/70 dark:bg-neutral-900/60 border border-slate-200/60 dark:border-neutral-800/60">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 flex items-center justify-center font-bold text-sm shrink-0">
                        {(user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {user.user_metadata?.full_name || user.email?.split('@')[0]}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                          {user.email}
                        </span>
                      </div>
                    </div>

                    {onSignOut && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onSignOut();
                        }}
                        className="group flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-500 transition-colors" />
                        <span>Sign Out</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 p-1">
                    <div className="px-1 pb-1">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">Account</p>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                        Sign in to save your architecture simulations
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenAuth?.();
                        }}
                        className="group flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#141416] text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-[#1e1e22] transition-colors cursor-pointer shadow-xs"
                      >
                        <LogIn className="w-3.5 h-3.5 text-slate-600 dark:text-neutral-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                        <span>Log In</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          if (onOpenSignUp) {
                            onOpenSignUp();
                          } else if (onOpenAuth) {
                            onOpenAuth();
                          }
                        }}
                        className="group flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 group-hover:text-indigo-400 dark:group-hover:text-indigo-600 transition-colors" />
                        <span>Sign Up</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Workspace Actions: Import Repo & History */}
                <div className="border-t border-slate-200/80 dark:border-neutral-800/80 pt-2.5 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 px-1 uppercase tracking-wider">
                    More Options
                  </span>

                  {/* AI Architect Recommender Wizard */}
                  {onOpenRecommender && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenRecommender();
                      }}
                      className="flex items-center justify-between w-full p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-900/70 transition-colors text-left cursor-pointer group"
                    >
                    </button>
                  )}

                  {/* Import Repository */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenImportRepo();
                    }}
                    className="flex items-center justify-between w-full p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-900/70 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 transition-colors flex items-center justify-center shrink-0">
                        <FolderGit2 className="w-4 h-4 text-slate-700 dark:text-neutral-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                          Import Repository
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                          Scan GitHub or local codebase
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* History */}
                  {onOpenHistory && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenHistory();
                      }}
                      className="flex items-center justify-between w-full p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-900/70 transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 transition-colors flex items-center justify-center shrink-0">
                          <History className="w-4 h-4 text-slate-700 dark:text-neutral-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            Your History
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                            Saved systems &amp; snapshots
                          </span>
                        </div>
                      </div>
                    </button>
                  )}

                </div>

                {/* 4. Appearance / Theme */}
                {onToggleTheme && (
                  <div className="border-t border-slate-200/80 dark:border-neutral-800/80 pt-2.5 flex flex-col gap-1.5">
                    <div className="px-1 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600 dark:text-neutral-400">
                        Appearance
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 dark:text-neutral-500">
                        {isDark ? 'Dark Theme' : 'Light Theme'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100/70 dark:bg-neutral-900/60 border border-slate-200/60 dark:border-neutral-800/60">
                      <button
                        type="button"
                        onClick={() => {
                          if (isDark) onToggleTheme();
                        }}
                        className={`group flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          !isDark
                            ? 'bg-white text-slate-900 shadow-xs font-semibold'
                            : 'text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white'
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5 text-slate-700 dark:text-neutral-300 group-hover:text-amber-500 transition-colors" />
                        <span>Light</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!isDark) onToggleTheme();
                        }}
                        className={`group flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isDark
                            ? 'bg-[#1e1e22] text-white shadow-xs font-semibold'
                            : 'text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white'
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5 text-slate-700 dark:text-neutral-300 group-hover:text-blue-400 transition-colors" />
                        <span>Dark</span>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;
