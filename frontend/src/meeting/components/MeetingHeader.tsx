import React, { useState } from 'react';
import {
  Copy,
  Check,
  Lock,
  Unlock,
  PhoneOff,
  LogOut,
  Users,
  Radio,
  Sun,
  Moon,
  Shield,
  Edit3,
  Eye,
} from 'lucide-react';
import { Meeting, MeetingRole, YjsSyncStatus } from '../types';

interface MeetingHeaderProps {
  meeting: Meeting | null;
  role: MeetingRole;
  isLocked: boolean;
  syncStatus: YjsSyncStatus;
  participantCount: number;
  onToggleParticipants: () => void;
  isParticipantsOpen: boolean;
  onToggleLock?: (locked: boolean) => void;
  onLeaveMeeting: () => void;
  onEndMeeting?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const MeetingHeader: React.FC<MeetingHeaderProps> = ({
  meeting,
  role,
  isLocked,
  syncStatus,
  participantCount,
  onToggleParticipants,
  isParticipantsOpen,
  onToggleLock,
  onLeaveMeeting,
  onEndMeeting,
  isDark = true,
  onToggleTheme,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

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
      {/* Left: Branding & Meeting Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <img
            src={isDark ? '/logo.png' : '/logo-light.png'}
            alt="GitToScale"
            className="h-6 w-auto object-contain"
          />
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-400 text-xs font-semibold">
            <Radio className="w-3 h-3 text-indigo-500 animate-pulse" />
            <span>Live Meeting</span>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-200 dark:bg-neutral-800 hidden sm:block" />

        {/* Meeting Title & ID */}
        <div className="hidden sm:flex flex-col">
          <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 truncate max-w-[200px] md:max-w-[280px]">
            {meeting?.title || 'System Design Meeting'}
          </span>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-neutral-400">
            <span>ID:</span>
            <button
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 font-mono hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title="Copy Meeting ID"
            >
              <span>{meeting?.id ? `${meeting.id.slice(0, 8)}...` : '...'}</span>
              {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Center: Sync Status & Role Indicator */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sync Indicator */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300">
          <span
            className={`w-2 h-2 rounded-full ${
              syncStatus === 'synced'
                ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                : syncStatus === 'syncing'
                ? 'bg-amber-500 animate-pulse'
                : syncStatus === 'connecting'
                ? 'bg-blue-500 animate-pulse'
                : 'bg-rose-500'
            }`}
          />
          <span className="capitalize hidden md:inline">
            {syncStatus === 'synced'
              ? 'Real-Time Sync'
              : syncStatus === 'syncing'
              ? 'Syncing changes...'
              : syncStatus === 'connecting'
              ? 'Connecting...'
              : 'Offline'}
          </span>
        </div>

        {/* User Role Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${
            role === 'host'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300'
              : role === 'editor'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-100 dark:bg-neutral-800/80 border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-300'
          }`}
        >
          {role === 'host' && <Shield className="w-3 h-3 text-amber-500" />}
          {role === 'editor' && <Edit3 className="w-3 h-3 text-emerald-500" />}
          {role === 'viewer' && <Eye className="w-3 h-3 text-slate-400" />}
          <span className="capitalize">{role}</span>
        </div>

        {/* Lock Status */}
        {isLocked && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400">
            <Lock className="w-3 h-3" />
            <span className="hidden sm:inline">Locked</span>
          </div>
        )}
      </div>

      {/* Right Controls: Share, Host Lock, Participants, Leave/End */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Copy Invite Link */}
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
          title="Copy Invitation Link"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{copiedLink ? 'Copied Link!' : 'Invite'}</span>
        </button>

        {/* Host Canvas Lock Toggle */}
        {role === 'host' && onToggleLock && (
          <button
            onClick={() => onToggleLock(!isLocked)}
            className={`p-2 rounded-lg text-xs font-medium border transition-colors ${
              isLocked
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
                : 'bg-slate-100 dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800'
            }`}
            title={isLocked ? 'Unlock Canvas for Editors' : 'Lock Canvas (Freeze Edits)'}
          >
            {isLocked ? <Lock className="w-4 h-4 text-rose-500" /> : <Unlock className="w-4 h-4" />}
          </button>
        )}

        {/* Participants Panel Toggle */}
        <button
          onClick={onToggleParticipants}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            isParticipantsOpen
              ? 'bg-slate-200 dark:bg-neutral-800 border-slate-300 dark:border-neutral-700 text-slate-900 dark:text-white'
              : 'bg-slate-100 dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800'
          }`}
          title="Toggle Participants Panel"
        >
          <Users className="w-3.5 h-3.5" />
          <span>{participantCount}</span>
        </button>

        {/* Theme Toggle */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}

        {/* End Meeting (Host Only) */}
        {role === 'host' && onEndMeeting && (
          <button
            onClick={onEndMeeting}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all"
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
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-900 hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 transition-colors"
            title="Leave Meeting"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Leave</span>
          </button>
        )}
      </div>
    </header>
  );
};
