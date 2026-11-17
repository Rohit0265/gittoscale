import React, { memo } from 'react';
import { ViewportPortal } from '@xyflow/react';
import { RemoteCursor } from '../types';

interface LiveCursorOverlayProps {
  cursors: RemoteCursor[];
}

export const LiveCursorOverlay: React.FC<LiveCursorOverlayProps> = memo(({ cursors }) => {
  // Do not render live cursors for participants with 'viewer' role
  const visibleCursors = (cursors || []).filter((cursor) => cursor && cursor.role !== 'viewer');
  if (visibleCursors.length === 0) return null;

  return (
    <ViewportPortal>
      {visibleCursors.map((cursor) => (
        <div
          key={cursor.userId}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)`,
            pointerEvents: 'none',
            zIndex: 1000,
            transition: 'transform 80ms linear',
          }}
          className="flex flex-col items-start select-none"
        >
          {/* Custom Cursor SVG pointer */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            style={{
              filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.35))',
            }}
          >
            <path
              d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
              fill={cursor.color || '#4F46E5'}
            />
          </svg>

          {/* Participant Name Badge */}
          <div
            style={{
              backgroundColor: cursor.color || '#4F46E5',
            }}
            className="mt-0.5 ml-3 px-2 py-0.5 rounded-md text-[10px] font-semibold text-white shadow-md whitespace-nowrap truncate max-w-[130px]"
          >
            {cursor.userName || 'Participant'}
          </div>
        </div>
      ))}
    </ViewportPortal>
  );
});
