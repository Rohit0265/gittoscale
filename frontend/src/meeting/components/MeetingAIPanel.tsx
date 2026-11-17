import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, ArrowUp, Sparkles, AlertTriangle, Check, Wand2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../../services/api';
import { parseMermaidToArchitecture } from '../../utils/exportDiagram';
import { toVerticalTree } from '../../utils/treeLayout';

interface AiChatBubble {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  streaming?: boolean;
  error?: boolean;
}

interface MeetingAIPanelProps {
  nodes: any[];
  edges: any[];
  projectDescription?: string;
  canEdit: boolean;
  token?: string | null;
  onApplyArchitecture: (nodes: any[], edges: any[]) => void;
}

const WELCOME: AiChatBubble = {
  id: 'ai-welcome',
  sender: 'ai',
  text:
    "👋 I'm your Architecture Copilot for this meeting. Ask about the current architecture, scaling trade-offs, or request improvements. Suggested changes are only applied when you click **Apply**.",
};

export const MeetingAIPanel: React.FC<MeetingAIPanelProps> = ({
  nodes,
  edges,
  projectDescription,
  canEdit,
  token,
  onApplyArchitecture,
}) => {
  const [messages, setMessages] = useState<AiChatBubble[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [proposal, setProposal] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [applied, setApplied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const streamIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, processing]);

  const extractProposal = useCallback((reply: string): { nodes: any[]; edges: any[] } | null => {
    const mermaidMatch = reply.match(/```(?:mermaid)?\s*\n?([\s\S]*?)```/i);
    if (!mermaidMatch || !mermaidMatch[1]) return null;
    try {
      const parsed = parseMermaidToArchitecture(mermaidMatch[1]);
      if (parsed.nodes && parsed.nodes.length > 0) {
        const verticalNodes = toVerticalTree(parsed.nodes, parsed.edges);
        return { nodes: verticalNodes, edges: parsed.edges };
      }
    } catch (e) {
      console.warn('[MeetingAIPanel] Mermaid parse failed:', e);
    }
    return null;
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || processing) return;

    const userBubble: AiChatBubble = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
    };
    const streamId = `ai-${Date.now()}`;
    streamIdRef.current = streamId;
    const aiBubble: AiChatBubble = {
      id: streamId,
      sender: 'ai',
      text: '',
      streaming: true,
    };

    const nextMessages: AiChatBubble[] = [
      ...messages.slice(-25),
      userBubble,
      aiBubble,
    ];
    setMessages(nextMessages);
    setInput('');
    setProcessing(true);
    setProposal(null);
    setApplied(false);

    let accumulated = '';
    try {
      const result = await api.streamChatMessage(
        token || null,
        {
          message: text,
          history: messages
            .filter((m) => m.text && !m.error)
            .slice(-25)
            .map((m) => ({ sender: m.sender === 'user' ? 'user' : 'assistant', text: m.text })),
          architectureContext: {
            nodes,
            edges,
            projectDescription: projectDescription || undefined,
            activePrompt: projectDescription || undefined,
          },
        },
        (_tok, fullText) => {
          accumulated = fullText;
          if (streamIdRef.current === streamId) {
            setMessages((prev) =>
              prev.map((m) => (m.id === streamId ? { ...m, text: fullText } : m))
            );
          }
        }
      );
      const reply = result?.reply || accumulated;
      if (streamIdRef.current === streamId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === streamId ? { ...m, text: reply, streaming: false } : m))
        );
        setProposal(extractProposal(reply));
      }
    } catch (err: any) {
      console.warn('[MeetingAIPanel] AI request failed:', err);
      if (streamIdRef.current === streamId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamId
              ? {
                  ...m,
                  text: err?.message || 'Something went wrong. Please try again.',
                  streaming: false,
                  error: true,
                }
              : m
          )
        );
      }
    } finally {
      streamIdRef.current = null;
      setProcessing(false);
    }
  };

  const handleApply = () => {
    if (!proposal || !canEdit) return;
    onApplyArchitecture(proposal.nodes, proposal.edges);
    setApplied(true);
    setProposal(null);
    setTimeout(() => setApplied(false), 2500);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* AI chat stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm font-medium whitespace-pre-wrap'
                  : msg.error
                  ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-bl-sm'
                  : 'bg-slate-100 dark:bg-[#121316] border border-slate-200/80 dark:border-neutral-800 text-slate-800 dark:text-neutral-100 rounded-bl-sm shadow-xs'
              }`}
            >
              {msg.sender === 'user' ? (
                msg.text
              ) : (
                <div className="ai-markdown-chat-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                  {msg.streaming && (
                    <span className="inline-block w-1.5 h-3 ml-0.5 bg-indigo-500 animate-pulse align-middle" />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* AI loading state while waiting for first token */}
        {processing && messages[messages.length - 1]?.text === '' && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-slate-100 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700/50 w-fit">
            <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
            <span className="text-[10.5px] text-slate-500 dark:text-neutral-400 font-medium">
              Consulting Architecture Copilot...
            </span>
          </div>
        )}

        {/* Apply suggestion */}
        {proposal && !applied && (
          <div className="flex flex-col items-start gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>
                AI generated an architecture suggestion ({proposal.nodes.length} nodes,{' '}
                {proposal.edges.length} connections).
              </span>
            </div>
            {canEdit ? (
              <button
                onClick={handleApply}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Apply to Shared Architecture</span>
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-lg text-[11px] bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400">
                Viewer access — ask the host or an editor to apply this suggestion.
              </span>
            )}
          </div>
        )}

        {applied && (
          <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs">
            <Check className="w-3.5 h-3.5" />
            <span>Applied and synced to all participants.</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error banner */}
      {!canEdit && (
        <div className="px-3 py-2 border-t border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>You have Viewer access — AI suggestions won't modify the canvas.</span>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-neutral-800 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this architecture…"
          disabled={processing}
          className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!input.trim() || processing}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-all cursor-pointer shrink-0"
          title="Ask AI (Enter)"
        >
          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};

export default MeetingAIPanel;
