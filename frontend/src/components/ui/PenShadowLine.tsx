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
export const PenHighlight: React.FC<PenHighlightProps> = React.memo(({
  children,
  className = '',
  highlightClassName = '',
}) => {
  const highlightColor = highlightClassName || 'bg-slate-300/80 dark:bg-neutral-700/70';
  return (
    <span className={`relative isolate inline-block whitespace-nowrap ${className}`}>
      <span className="relative z-10">{children}</span>
      {/* Pen marker line behind text */}
      <span
        aria-hidden="true"
        className={`absolute -inset-x-1.5 sm:-inset-x-2.5 bottom-[8%] sm:bottom-[10%] h-[44%] sm:h-[46%] z-0 rounded-[2px] transform -rotate-[0.4deg] pointer-events-none select-none transition-all ${highlightColor}`}
        style={{
          clipPath: 'polygon(0.8% 0%, 100% 3%, 99.2% 100%, 0% 97%)',
        }}
      />
    </span>
  );
});

export const PenShadowLine: React.FC<{ className?: string; color?: string }> = React.memo(({
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
});

export default PenHighlight;
