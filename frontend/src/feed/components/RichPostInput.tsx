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
  placeholder = 'Write a post with rich text and architecture markdown...',
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
    <div className="w-full rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/40 overflow-hidden focus-within:border-slate-400 dark:focus-within:border-neutral-600 transition-colors">
      {/* Top Action Bar: Mode Tabs + Rich Text Formatting Actions + Word Count Limit */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-200/80 dark:border-neutral-800/80 bg-slate-100/60 dark:bg-neutral-900/80 gap-2 flex-wrap">
        {/* Mode Selector */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-200/60 dark:bg-neutral-800/80 text-[11px] font-semibold">
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

        {/* Formatting Actions (in write mode) */}
        {activeTab === 'write' && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => applySurround('**', '**', 'bold')}
              disabled={disabled}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 transition-colors cursor-pointer"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applySurround('*', '*', 'italic')}
              disabled={disabled}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 transition-colors cursor-pointer"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyLinePrefix('### ', 'Heading')}
              disabled={disabled}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 transition-colors cursor-pointer"
              title="Heading"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applySurround('`', '`', 'code')}
              disabled={disabled}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 transition-colors cursor-pointer"
              title="Inline Code (Ctrl+E)"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyLinePrefix('- ', 'Item')}
              disabled={disabled}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 transition-colors cursor-pointer"
              title="Bullet List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyLinePrefix('1. ', 'Item')}
              disabled={disabled}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 transition-colors cursor-pointer"
              title="Numbered List"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyLinePrefix('> ', 'Quote')}
              disabled={disabled}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 transition-colors cursor-pointer"
              title="Quote"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applySurround('[', '](https://example.com)', 'link')}
              disabled={disabled}
              className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 transition-colors cursor-pointer"
              title="Link (Ctrl+K)"
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 2500 Word Counter Badge */}
        <div className="ml-auto text-[11px] font-mono">
          <span
            className={
              isOverLimit
                ? 'text-rose-500 dark:text-rose-400 font-bold'
                : 'text-slate-500 dark:text-neutral-400'
            }
          >
            {wordCount.toLocaleString()} / {maxWords.toLocaleString()} words
          </span>
        </div>
      </div>

      {/* Editor Body */}
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
          className="w-full bg-transparent px-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-hidden resize-y font-normal leading-relaxed"
        />
      ) : (
        <div
          style={{ minHeight }}
          className="w-full px-3 py-2.5 overflow-y-auto text-xs leading-relaxed text-slate-800 dark:text-neutral-200"
        >
          {value.trim() ? (
            <div className="prose prose-xs dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-1.5 prose-code:bg-slate-200 dark:prose-code:bg-neutral-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-sm">
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
                  code: ({ node, inline, children, ...props }: any) => {
                    if (inline) {
                      return (
                        <code className="px-1 py-0.5 rounded-sm bg-slate-200 dark:bg-neutral-800 font-mono text-[11px]" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto my-1.5">
                        <code {...props}>{children}</code>
                      </pre>
                    );
                  },
                }}
              >
                {value}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-slate-400 dark:text-neutral-500 italic">
              Nothing to preview yet. Switch to "Write" and format your architecture post!
            </p>
          )}
        </div>
      )}
    </div>
  );
};

