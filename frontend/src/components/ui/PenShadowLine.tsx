import React from 'react';

export interface PenHighlightProps {
  children: React.ReactNode;
  className?: string;
  highlightClassName?: string;
}

/**
 * Hand-drawn marker pen stripe behind heading text,
 * styled after a chisel-tip marker pen stroke in grey.
 */
export const PenHighlight: React.FC<PenHighlightProps> = ({
  children,
  className = '',
  highlightClassName = '',
}) => {
  return (
    <span className={`relative isolate inline-block ${className}`}>
      <span className="relative z-10">{children}</span>
      {/* Pen marker line behind text */}
      <span
        aria-hidden="true"
        className={`absolute -inset-x-1.5 sm:-inset-x-2.5 bottom-[10%] sm:bottom-[12%] h-[38%] sm:h-[42%] z-0 bg-slate-300/80 dark:bg-neutral-700/70 rounded-[2px] transform -rotate-[0.4deg] pointer-events-none select-none transition-all ${highlightClassName}`}
        style={{
          clipPath: 'polygon(0.8% 0%, 100% 3%, 99.2% 100%, 0% 97%)',
        }}
      />
    </span>
  );
};

export const PenShadowLine: React.FC<{ className?: string; color?: string }> = ({
  className = '',
  color = 'bg-slate-300/80 dark:bg-neutral-700/70',
}) => {
  return (
    <span
      aria-hidden="true"
      className={`absolute -inset-x-1.5 sm:-inset-x-2.5 bottom-[10%] sm:bottom-[12%] h-[38%] sm:h-[42%] -z-10 rounded-[2px] transform -rotate-[0.4deg] pointer-events-none select-none ${color} ${className}`}
      style={{
        clipPath: 'polygon(0.8% 0%, 100% 3%, 99.2% 100%, 0% 97%)',
      }}
    />
  );
};

export default PenHighlight;
