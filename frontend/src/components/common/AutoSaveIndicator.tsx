import React from 'react';
import { AutoSaveStatus } from '../../services/playgroundPersistence';

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  lastSaved?: Date | null;
  onForceSync?: () => void;
  className?: string;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  status,
  lastSaved,
  onForceSync,
  className = '',
}) => {
  const formatTime = (d?: Date | null) => {
    if (!d) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (status === 'saving') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 ${className}`}
        title="Syncing playground changes..."
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span>Saving...</span>
      </div>
    );
  }

  if (status === 'saved') {
    const timeStr = formatTime(lastSaved);
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${className}`}
        title={timeStr ? `Saved at ${timeStr}` : 'All changes saved to cloud and browser storage'}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>Saved</span>
      </div>
    );
  }

  if (status === 'local_only') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 ${className}`}
        title="Saved to browser storage (sign in to sync to cloud)"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        <span>Saved locally</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <button
        type="button"
        onClick={onForceSync}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors ${className}`}
        title="Sync failed. Click to retry."
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        <span>Sync retry</span>
      </button>
    );
  }

  return null;
};
