import React from 'react';
import {
  Shield,
  Edit3,
  Eye,
  UserX,
  Sparkles,
} from 'lucide-react';
import { MeetingParticipant, MeetingRole, ParticipantPresence } from '../types';

interface MeetingParticipantsPanelProps {
  isOpen: boolean;
  onClose?: () => void;
  participants: MeetingParticipant[];
  presences: ParticipantPresence[];
  currentUserId?: string;
  isHost: boolean;
  onSetRole?: (userId: string, role: MeetingRole) => void;
  onKickParticipant?: (userId: string) => void;
}

export const MeetingParticipantsPanel: React.FC<MeetingParticipantsPanelProps> = ({
  isOpen,
  participants,
  presences,
  currentUserId,
  isHost,
  onSetRole,
  onKickParticipant,
}) => {
  if (!isOpen) return null;

  // Build presence map for active status, editing state, and colors
  const presenceMap = new Map<string, ParticipantPresence>();
  presences.forEach((p) => presenceMap.set(p.userId, p));

  return (
    <div className="h-full flex flex-col overflow-hidden select-none transition-colors">
      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {participants.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 dark:text-neutral-500">
            No participants connected yet.
          </div>
        ) : (
          participants.map((p) => {
            const presence = presenceMap.get(p.user_id);
            const isMe = p.user_id === currentUserId;
            const isUserHost = p.role === 'host';
            const userColor = presence?.color || p.color || '#4F46E5';
            const isEditing = presence?.isEditing;

            return (
              <div
                key={p.user_id}
                className="p-2.5 rounded-xl border border-slate-100 dark:border-neutral-800/80 bg-slate-50/50 dark:bg-neutral-900/40 hover:bg-slate-100/70 dark:hover:bg-neutral-800/60 transition-all flex items-center justify-between gap-2"
              >
                {/* Left: Avatar & Identity */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    {p.user_avatar ? (
                      <img
                        src={p.user_avatar}
                        alt={p.user_name}
                        className="w-8 h-8 rounded-full object-cover border-2"
                        style={{ borderColor: userColor }}
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm"
                        style={{ backgroundColor: userColor }}
                      >
                        {p.user_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    {/* Online Presence Dot */}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-neutral-900 ${
                        presence ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-neutral-600'
                      }`}
                      title={presence ? 'Online' : 'Offline'}
                    />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 truncate">
                        {p.user_name || 'Anonymous'}
                      </span>
                      {isMe && (
                        <span className="text-[10px] font-medium text-slate-400 dark:text-neutral-500">
                          (You)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      {/* Role Pill */}
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium ${
                          p.role === 'host'
                            ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
                            : p.role === 'editor'
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                            : 'text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800'
                        }`}
                      >
                        {p.role === 'host' && <Shield className="w-2.5 h-2.5" />}
                        {p.role === 'editor' && <Edit3 className="w-2.5 h-2.5" />}
                        {p.role === 'viewer' && <Eye className="w-2.5 h-2.5" />}
                        <span className="capitalize">{p.role}</span>
                      </span>

                      {/* Live Editing indicator */}
                      {isEditing && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-medium animate-pulse">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Editing</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Host Actions (Cannot change own host role or kick self) */}
                {isHost && !isMe && !isUserHost && (
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Toggle Editor / Viewer Role */}
                    <button
                      onClick={() =>
                        onSetRole?.(p.user_id, p.role === 'editor' ? 'viewer' : 'editor')
                      }
                      className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                        p.role === 'editor'
                          ? 'border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-50'
                          : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                      }`}
                      title={p.role === 'editor' ? 'Demote to Viewer' : 'Promote to Editor'}
                    >
                      {p.role === 'editor' ? 'Make Viewer' : 'Make Editor'}
                    </button>

                    {/* Kick Participant */}
                    <button
                      onClick={() => onKickParticipant?.(p.user_id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Remove participant"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Panel Footer Info */}
      <div className="p-3 border-t border-slate-200 dark:border-neutral-800 text-[11px] text-slate-500 dark:text-neutral-400 bg-slate-50/50 dark:bg-neutral-900/30">
        {isHost ? (
          <p>
            You are the <strong>Host</strong>. You can promote participants to <strong>Editor</strong> or restrict them to <strong>Viewer</strong>.
          </p>
        ) : (
          <p>
            Only the <strong>Host</strong> can grant editing permissions or lock the architecture.
          </p>
        )}
      </div>
    </div>
  );
};
