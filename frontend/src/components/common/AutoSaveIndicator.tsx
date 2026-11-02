import React from 'react';
import { AutoSaveStatus } from '../../services/playgroundPersistence';
import { div } from 'framer-motion/client';

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
      <div>
      </div>
    );
  }

  if (status === 'saved') {
    const timeStr = formatTime(lastSaved);
    return (
      <div>
      </div>
    );
  }

  if (status === 'local_only') {
    return (
      <div>

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
