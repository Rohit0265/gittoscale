import React from 'react';
import { CheckCircle2, RefreshCw, HardDrive, CloudOff } from 'lucide-react';
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
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 select-none ${className}`}
        title="Syncing playground changes to database..."
      >
        <RefreshCw className="w-3 h-3 animate-spin shrink-0 text-amber-500" />
        <span className="hidden sm:inline">Saving changes...</span>
        <span className="sm:hidden">Saving...</span>
      </div>
    );
  }

  if (status === 'saved') {
    return (
      <div
        onClick={onForceSync}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 select-none cursor-default ${className}`}
        title={`All edits safely committed to browser storage & cloud database. Last saved at ${formatTime(lastSaved)}`}
      >
        <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400 shrink-0" />
        <span className="hidden sm:inline">Saved to cloud & browser</span>
        <span className="sm:hidden">Saved</span>
      </div>
    );
  }

  if (status === 'local_only') {
    return (
      <div
        onClick={onForceSync}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700 select-none ${className}`}
        title={`Saved safely in browser storage (offline / guest mode). Sign in to automatically sync to cloud database. Last saved at ${formatTime(lastSaved)}`}
      >
        <HardDrive className="w-3 h-3 text-slate-500 dark:text-neutral-400 shrink-0" />
        <span className="hidden sm:inline">Saved to browser storage</span>
        <span className="sm:hidden">Saved locally</span>
      </div>
    );
  }

  return (
    <div
      onClick={onForceSync}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 select-none cursor-pointer ${className}`}
      title="Saved locally. Click to retry syncing to cloud database."
    >
      <CloudOff className="w-3 h-3 text-rose-500 shrink-0" />
      <span>Saved locally (Sync pending)</span>
    </div>
  );
};
