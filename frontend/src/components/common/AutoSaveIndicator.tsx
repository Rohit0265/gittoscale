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
      <div className={`text-xs text-muted-foreground ${className}`}>
        Saving...
      </div>
    );
  }

  if (status === 'saved') {
    const timeStr = formatTime(lastSaved);
    return (
      <div className={`text-xs text-muted-foreground ${className}`} title={timeStr ? `Saved at ${timeStr}` : undefined}>
        Saved {timeStr ? `(${timeStr})` : ''}
      </div>
    );
  }

  if (status === 'local_only') {
    return (
      <div className={`text-xs text-amber-500 ${className}`}>
        Saved locally
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={`text-xs text-red-500 flex items-center gap-1 ${className}`}>
        Save failed
        {onForceSync && (
          <button onClick={onForceSync} className="underline hover:text-red-600">
            Retry
          </button>
        )}
      </div>
    );
  }

  return null;
};
