import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bold,
  Italic,
  Heading2,
  Code,
  List,
  ListOrdered,
  Quote,
  Link2,
  Eye,
  Edit3,
} from 'lucide-react';

interface RichPostInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  minHeight?: string;
  maxWords?: number;
}

export const RichPostInput: React.FC<RichPostInputProps> = ({
  value,
  onChange,
  placeholder = 'What are you designing? Share an architecture, question, or latency finding...',
  rows = 3,
  disabled = false,
  minHeight = '95px',
  maxWords = 2500,
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Compute word count accurately
  const wordCount = value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0;
  const isOverLimit = wordCount > maxWords;
  const isNearLimit = wordCount > maxWords * 0.9 && !isOverLimit;

  const applySurround = (prefix: string, suffix: string = prefix, defaultText = 'text') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || defaultText;
    const replacement = `${prefix}${selected}${suffix}`;
    const nextVal = value.slice(0, start) + replacement + value.slice(end);

    onChange(nextVal);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  };

  const applyLinePrefix = (prefix: string, defaultText = 'text') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);

    const lastNewline = value.lastIndexOf('\n', start - 1);
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;

    if (selected) {
      const lines = selected.split('\n');
      const prefixed = lines.map((l) => `${prefix}${l}`).join('\n');
      const nextVal = value.slice(0, start) + prefixed + value.slice(end);
      onChange(nextVal);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + prefixed.length);
      });
    } else {
      const nextVal = value.slice(0, lineStart) + `${prefix}${defaultText} ` + value.slice(lineStart);
      onChange(nextVal);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length + defaultText.length);
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        applySurround('**', '**', 'bold text');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        applySurround('*', '*', 'italic text');
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        applySurround('`', '`', 'code');
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        applySurround('[', '](https://example.com)', 'link title');
      }
    }
  };

  return (
    <div className="w-full rounded-xl sm:rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50/60 dark:bg-neutral-900/40 overflow-hidden focus-within:border-slate-400 dark:focus-within:border-neutral-600 transition-colors">
      {/* 1. Header Bar: Never wraps, rock solid on both mobile & desktop */}
      <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 border-b border-slate-200/80 dark:border-neutral-800/80 bg-slate-100/70 dark:bg-neutral-900/80 gap-2">
        {/* Mode Selector Tabs */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-200/70 dark:bg-neutral-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              activeTab === 'write'
                ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Edit3 className="w-3 h-3 text-slate-500 dark:text-neutral-400" />
            <span>Write</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Eye className="w-3 h-3 text-slate-500 dark:text-neutral-400" />
            <span>Preview</span>
          </button>
        </div>

        {/* Word Counter Pill */}
        <div className="text-[11px] font-mono shrink-0">
          <span
            className={
              isOverLimit
                ? 'text-rose-500 dark:text-rose-400 font-bold'
                : isNearLimit
                ? 'text-amber-500 dark:text-amber-400 font-semibold'
                : 'text-slate-500 dark:text-neutral-400'
            }
          >
            {wordCount.toLocaleString()}{' '}
            <span className="hidden sm:inline">/ {maxWords.toLocaleString()} words</span>
            <span className="sm:hidden font-sans text-[10px]">/{maxWords >= 1000 ? `${maxWords / 1000}k` : maxWords}w</span>
          </span>
        </div>
      </div>

      {/* 2. Formatting Toolbar Strip (shown in Write mode)
          Smooth horizontal scroll without scrollbars so it never breaks into messy rows on small screens */}
      {activeTab === 'write' && (
        <div className="flex items-center gap-0.5 px-2 py-1 border-b border-slate-200/50 dark:border-neutral-800/60 bg-slate-50/40 dark:bg-neutral-900/30 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            type="button"
            onClick={() => applySurround('**', '**', 'bold')}
            disabled={disabled}
            className="p-1.5 rounded-md hover:bg-slate-200/70 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 transition-colors cursor-pointer shrink-0"
            title="Bold (Ctrl+B)"
            aria-label="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applySurround('*', '*', 'italic')}
            disabled={disabled}
            className="p-1.5 rounded-md hover:bg-slate-200/70 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 transition-colors cursor-pointer shrink-0"
            title="Italic (Ctrl+I)"
            aria-label="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyLinePrefix('### ', 'Heading')}
            disabled={disabled}
            className="p-1.5 rounded-md hover:bg-slate-200/70 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 transition-colors cursor-pointer shrink-0"
            title="Heading"
            aria-label="Heading"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applySurround('`', '`', 'code')}
            disabled={disabled}
            className="p-1.5 rounded-md hover:bg-slate-200/70 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 transition-colors cursor-pointer shrink-0"
            title="Inline Code (Ctrl+E)"
            aria-label="Inline Code"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-slate-200 dark:bg-neutral-800 mx-1 shrink-0" />
          <button
            type="button"
            onClick={() => applyLinePrefix('- ', 'Item')}
            disabled={disabled}
            className="p-1.5 rounded-md hover:bg-slate-200/70 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 transition-colors cursor-pointer shrink-0"
            title="Bullet List"
            aria-label="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyLinePrefix('1. ', 'Item')}
            disabled={disabled}
            className="p-1.5 rounded-md hover:bg-slate-200/70 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 transition-colors cursor-pointer shrink-0"
            title="Numbered List"
            aria-label="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyLinePrefix('> ', 'Quote')}
            disabled={disabled}
            className="p-1.5 rounded-md hover:bg-slate-200/70 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 transition-colors cursor-pointer shrink-0"
            title="Quote"
            aria-label="Quote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applySurround('[', '](https://example.com)', 'link')}
            disabled={disabled}
            className="p-1.5 rounded-md hover:bg-slate-200/70 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 transition-colors cursor-pointer shrink-0"
            title="Link (Ctrl+K)"
            aria-label="Link"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Editor Body: text-base on mobile to avoid iOS Safari auto-zoom, text-sm on desktop */}
      {activeTab === 'write' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          style={{ minHeight }}
          className="w-full bg-transparent px-3 sm:px-3.5 py-2.5 sm:py-3 text-base sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-hidden resize-y font-normal leading-relaxed"
        />
      ) : (
        <div
          style={{ minHeight }}
          className="w-full px-3.5 py-3 overflow-y-auto text-sm leading-relaxed text-slate-800 dark:text-neutral-200"
        >
          {value.trim() ? (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-headings:my-2 prose-code:bg-slate-200 dark:prose-code:bg-neutral-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-sm">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ node, ...props }) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    />
                  ),
                  pre: ({ node, ...props }: any) => (
                    <pre className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono text-xs overflow-x-auto my-2 border border-slate-200 dark:border-slate-800" {...props} />
                  ),
                  code: ({ node, className, children, ...props }: any) => {
                    return (
                      <code className={className || "px-1.5 py-0.5 rounded-sm bg-slate-200 dark:bg-neutral-800 font-mono text-xs text-indigo-600 dark:text-indigo-400"} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {value}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-slate-400 dark:text-neutral-500 italic text-xs sm:text-sm">
              Nothing to preview yet. Switch to &ldquo;Write&rdquo; to draft your architecture post.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
