import React, { useState, useEffect, useRef } from 'react';
import {
  Copy,
  Check,
  Lock,
  Unlock,
  PhoneOff,
  LogOut,
  ChevronDown,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserDropdownMenu } from '../../components/UserDropdownMenu';
import { UserAvatar } from '../../feed/components/UserAvatar';
import { extractAccountAvatar } from '../../feed/utils/avatarUtils';
import { Meeting, MeetingRole, YjsSyncStatus } from '../types';

interface MeetingHeaderProps {
  meeting: Meeting | null;
  role: MeetingRole;
  isLocked: boolean;
  syncStatus: YjsSyncStatus;
  participantCount?: number;
  onToggleParticipants?: () => void;
  isParticipantsOpen?: boolean;
  onToggleLock?: (locked: boolean) => void;
  onLeaveMeeting: () => void;
  onEndMeeting?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  user?: any;
  token?: string | null;
  onSignOut?: () => void;
  onOpenAuth?: () => void;
  onOpenSignUp?: () => void;
  onOpenHistory?: () => void;
  onNavigateToProfile?: (userId: string) => void;
  onViewLikes?: () => void;
  onViewSaved?: () => void;
  onGoHome?: () => void;
  onTapLogo?: () => void;
}

export const MeetingHeader: React.FC<MeetingHeaderProps> = ({
  meeting,
  role,
  isLocked,
  syncStatus,
  onToggleLock,
  onLeaveMeeting,
  onEndMeeting,
  isDark = true,
  onToggleTheme,
  user,
  token,
  onSignOut,
  onOpenAuth,
  onOpenSignUp,
  onOpenHistory,
  onNavigateToProfile,
  onViewLikes,
  onViewSaved,
  onGoHome,
  onTapLogo,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleCopyLink = () => {
    if (!meeting) return;
    const url = `${window.location.origin}/meeting/${meeting.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyId = () => {
    if (!meeting) return;
    navigator.clipboard.writeText(meeting.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <header className="h-14 border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#020202] px-3 sm:px-5 flex items-center justify-between z-40 shrink-0 w-full select-none transition-colors">
      {/* Left: GitToScale Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onTapLogo || onGoHome}
          className="flex items-center text-left group hover:opacity-85 transition-opacity cursor-pointer"
          title="Return to GitToScale"
        >
          <img
            src={isDark ? '/logo.png' : '/logo-light.png'}
            alt="GitToScale"
            className="h-6 sm:h-7 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </button>
      </div>

      {/* Center: Meeting Code with Copy Button & Live Sync indicator (Code only visible to Host) */}
      <div className="flex items-center gap-2">
        {role === 'host' ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs text-slate-700 dark:text-neutral-200 shadow-2xs">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                syncStatus === 'synced'
                  ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                  : syncStatus === 'syncing'
                  ? 'bg-amber-500 animate-pulse'
                  : syncStatus === 'connecting'
                  ? 'bg-neutral-400 dark:bg-neutral-500 animate-pulse'
                  : 'bg-rose-500'
              }`}
              title={syncStatus === 'synced' ? 'Real-Time Synchronized' : syncStatus}
            />
            <span className="text-slate-400 dark:text-neutral-500 text-[11px] hidden xs:inline">Meeting Code:</span>
            <span className="font-mono font-semibold tracking-wide text-slate-900 dark:text-white select-all text-xs">
              {meeting?.id || '...'}
            </span>
            <button
              onClick={handleCopyId}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Copy Meeting Code"
            >
              {copiedId ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs text-slate-700 dark:text-neutral-200 shadow-2xs">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                syncStatus === 'synced'
                  ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                  : syncStatus === 'syncing'
                  ? 'bg-amber-500 animate-pulse'
                  : syncStatus === 'connecting'
                  ? 'bg-neutral-400 dark:bg-neutral-500 animate-pulse'
                  : 'bg-rose-500'
              }`}
              title={syncStatus === 'synced' ? 'Real-Time Synchronized' : syncStatus}
            />
            <span className="text-slate-600 dark:text-neutral-300 text-xs font-semibold max-w-[200px] truncate">
              {meeting?.title || 'Architecture Session'}
            </span>
          </div>
        )}

        {/* Canvas Lock Status if locked */}
        {isLocked && (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400">
            <Lock className="w-3 h-3" />
            <span className="hidden sm:inline">Locked</span>
          </div>
        )}
      </div>

      {/* Right Controls: Invite, Host Lock, Leave/End, User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Copy Invite Link (Host Only) */}
        {role === 'host' && (
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 border border-neutral-700/60 dark:border-transparent shadow-xs transition-all cursor-pointer"
            title="Copy Invitation Link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied Link!' : 'Invite'}</span>
          </button>
        )}

        {/* Host Canvas Lock Toggle */}
        {role === 'host' && onToggleLock && (
          <button
            onClick={() => onToggleLock(!isLocked)}
            className={`p-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              isLocked
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
                : 'bg-slate-100 dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800'
            }`}
            title={isLocked ? 'Unlock Canvas for Editors' : 'Lock Canvas (Freeze Edits)'}
          >
            {isLocked ? <Lock className="w-4 h-4 text-rose-500" /> : <Unlock className="w-4 h-4" />}
          </button>
        )}

        {/* End Meeting (Host Only) */}
        {role === 'host' && onEndMeeting && (
          <button
            onClick={onEndMeeting}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer"
            title="End Meeting for Everyone"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span className="hidden md:inline">End</span>
          </button>
        )}

        {/* Leave Meeting (Non-Host or Host fallback) */}
        {role !== 'host' && (
          <button
            onClick={onLeaveMeeting}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-900 hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
            title="Leave Meeting"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Leave</span>
          </button>
        )}

        {/* User Profile Menu (After End/Leave) */}
        <div ref={menuRef} className="relative shrink-0 ml-1">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-800/80 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-neutral-700 cursor-pointer"
            title="User Account Menu"
          >
            {user ? (
              <div className="relative shrink-0">
                <UserAvatar
                  src={extractAccountAvatar(user)}
                  name={user.user_metadata?.full_name || user.email?.split('@')[0]}
                  seed={user.id || user.email}
                  className="w-7 h-7 rounded-full"
                  fallbackClassName="w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-xs"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-[#0A0A0A]" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-700 dark:text-neutral-300">
                <User className="w-4 h-4 text-slate-600 dark:text-neutral-300" />
              </div>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 transition-transform duration-200 ${
                isMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

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
                  onNavigateToProfile={onNavigateToProfile}
                  onViewLikes={onViewLikes}
                  onViewSaved={onViewSaved}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
