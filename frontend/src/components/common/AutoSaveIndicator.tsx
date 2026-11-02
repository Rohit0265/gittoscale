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
      <div>
      </div>
    );
  }

  if (status === 'saved') {
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

  return (
    <div>
    </div>
  );
};

