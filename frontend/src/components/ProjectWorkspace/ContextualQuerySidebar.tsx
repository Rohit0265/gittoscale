import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  RotateCcw,
  Bot,
  User,
  PanelLeftClose,
} from 'lucide-react';
import { Streamdown } from 'streamdown';
import 'streamdown/styles.css';
import { ArchitectureNode, ArchitectureEdge, SimulationResult } from '../../types';
import { api } from '../../services/api';

export interface ChatChoice {
  id: string;
  category: 'scale' | 'budget' | 'consistency' | 'region';
  label: string;
  detail: string;
}

export interface ChatBubble {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  choices?: ChatChoice[];
  isThinking?: boolean;
  thinkingText?: string;
  isAction?: boolean;
  category?: 'scale' | 'budget' | 'consistency' | 'region';
  actionDone?: string;
  timestamp?: string;
}

export interface ContextualQuerySidebarProps {
  activePrompt?: string;
  selectedAnswers?: {
    scale?: string;
    budget?: string;
    consistency?: string;
    region?: string;
  };
  onAnswerSelected?: (
    category: 'scale' | 'budget' | 'consistency' | 'region',
    optionId: string,
    label: string
  ) => void;
  onApplyRefinements?: () => void;
  onResetQuestions?: () => void;
  onSendCustomMessage?: (message: string) => void;
  onExecuteChatCommand?: (
    message: string,
    history: ChatBubble[]
  ) => Promise<{ reply: string; actionDone?: string; updatedAnswers?: any } | void>;
  onRestoreSession?: (session: {
    selectedAnswers: Record<string, string>;
    activePrompt?: string;
  }) => void;
  isGenerating?: boolean;
  isHydrated?: boolean;
  isDark?: boolean;
  onToggleCollapse?: () => void;
  user?: any;
  nodes?: ArchitectureNode[];
  edges?: ArchitectureEdge[];
  incomingTrafficRate?: number;
  simulationResult?: SimulationResult | null;
  width?: number;
  onWidthChange?: (width: number) => void;
  onDragStateChange?: (isDragging: boolean) => void;
  isResizable?: boolean;
}

const CHAT_STORAGE_KEY = 'gitoscale_ai_chat_session_v2';
const MAX_CONTEXT_MESSAGES = 200;

const DEFAULT_GREETING = `👋 **Hello! I'm your Playground AI Architect Agent.**

I have direct real-time access to this canvas. Tell me what to build or change:
• ➕ **Add components**: *"Add Redis cache between API and Database"* or *"Add Kafka queue"*
• 🎯 **Add more requirements**: *"Add more requirement: must handle 50k req/s and include payment service"*
• ⚙️ **Scale & modify**: *"Scale backend to 5 instances"* or *"Set traffic to 5000 req/s"*
• 🔍 **Diagnose**: *"What are the bottlenecks right now?"*`;

export const ContextualQuerySidebar: React.FC<ContextualQuerySidebarProps> = ({
  activePrompt = 'Scalable distributed cloud architecture',
  selectedAnswers = {},
  onResetQuestions,
  onSendCustomMessage,
  onExecuteChatCommand,
  onRestoreSession,
  onToggleCollapse,
  user,
  nodes = [],
  edges = [],
  incomingTrafficRate: _incomingTrafficRate = 1000,
  simulationResult: _simulationResult,
  width: widthProp,
  onWidthChange,
  onDragStateChange,
  isResizable = true,
}) => {
  const asideRef = useRef<HTMLElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Initialize and clamp width (default 340px, strictly clamped to 2/5 = 40% of screen)
  const [internalWidth, setInternalWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('gitoscale_left_sidebar_width');
        if (saved) {
          const parsed = parseInt(saved, 10);
          const max = Math.floor(window.innerWidth * (2 / 5));
          const min = Math.min(280, max);
          if (!isNaN(parsed) && parsed >= min && parsed <= max) {
            return parsed;
          }
        }
      } catch {}
      return Math.min(340, Math.floor(window.innerWidth * (2 / 5)));
    }
    return 340;
  });

  const currentWidth = widthProp !== undefined ? widthProp : internalWidth;

  // Keep width clamped if window resizes
  useEffect(() => {
    const handleWindowResize = () => {
      const max = Math.floor(window.innerWidth * (2 / 5));
      const min = Math.min(280, max);
      setInternalWidth((prev) => {
        const clamped = Math.max(min, Math.min(prev, max));
        if (clamped !== prev) {
          onWidthChange?.(clamped);
        }
        return clamped;
      });
    };
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [onWidthChange]);

  const startDragging = (clientX: number) => {
    if (!isResizable) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    onDragStateChange?.(true);

    const startX = clientX;
    const startWidth = currentWidth;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const deltaX = currentX - startX;
      const max = Math.floor(window.innerWidth * (2 / 5)); // strictly 2/5 of screen
      const min = Math.min(280, max);
      const nextWidth = Math.max(min, Math.min(startWidth + deltaX, max));

      setInternalWidth(nextWidth);
      onWidthChange?.(nextWidth);
      try {
        localStorage.setItem('gitoscale_left_sidebar_width', String(nextWidth));
      } catch {}
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      onDragStateChange?.(false);
      document.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseup', handlePointerUp);
      document.removeEventListener('touchmove', handlePointerMove);
      document.removeEventListener('touchend', handlePointerUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('mouseup', handlePointerUp);
    document.addEventListener('touchmove', handlePointerMove, { passive: false });
    document.addEventListener('touchend', handlePointerUp);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startDragging(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      startDragging(e.touches[0].clientX);
    }
  };

  const handleResetWidth = () => {
    const defaultWidth = Math.min(340, Math.floor(window.innerWidth * (2 / 5)));
    setInternalWidth(defaultWidth);
    onWidthChange?.(defaultWidth);
    try {
      localStorage.setItem('gitoscale_left_sidebar_width', String(defaultWidth));
    } catch {}
  };
  // Load existing session from localStorage to prevent re-asking on refresh
  const [messages, setMessages] = useState<ChatBubble[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(CHAT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
            return parsed.messages.slice(-MAX_CONTEXT_MESSAGES);
          }
        }
      } catch (e) {
        console.warn('Failed to parse cached chat session:', e);
      }
    }
    return [];
  });

  const [customInput, setCustomInput] = useState('');
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const saveDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const hasRestoredRef = useRef<boolean>(messages.length > 0);

  // Initialise greeting only if NO prior messages exist in storage
  useEffect(() => {
    if (hasRestoredRef.current && messages.length > 0) {
      hasRestoredRef.current = false;
      try {
        const raw = localStorage.getItem(CHAT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.selectedAnswers && onRestoreSession) {
            onRestoreSession({
              selectedAnswers: parsed.selectedAnswers,
              activePrompt: parsed.activePrompt,
            });
          }
        }
      } catch (e) {}
      return;
    }

    if (messages.length === 0) {
      const welcome: ChatBubble = {
        id: 'msg-welcome',
        sender: 'ai',
        text: DEFAULT_GREETING,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcome]);
    }
  }, [activePrompt]);

  // Persist conversation to localStorage & database (capped at 200 messages)
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      const session = {
        version: 2,
        activePrompt,
        selectedAnswers,
        messages: messages.slice(-MAX_CONTEXT_MESSAGES),
        lastUpdated: new Date().toISOString(),
      };

      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(session));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }

      // Debounce sync to PostgreSQL if user is authenticated
      if (user) {
        if (saveDebounceTimer.current) clearTimeout(saveDebounceTimer.current);
        saveDebounceTimer.current = setTimeout(() => {
          const token = localStorage.getItem('sb-access-token') || null;
          api.saveChatHistory(token, {
            prompt: activePrompt,
            messages: messages.slice(-MAX_CONTEXT_MESSAGES),
            selectedAnswers,
            architectureData: { nodes, edges },
          }).catch((err) => {
            console.warn('[ContextualQuerySidebar] Background DB sync note:', err.message);
          });
        }, 1500);
      }
    }
  }, [messages, selectedAnswers, activePrompt, user, nodes, edges]);

  // Auto-scroll
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const executeCommand = async (commandText: string) => {
    const text = commandText.trim();
    if (!text || isProcessingCommand) return;

    const userBubble: ChatBubble = {
      id: `custom-user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    const isAction = /^(add|create|insert|new|remove|delete|drop|connect|wire|link|scale|resize|set traffic|traffic to|change traffic|increase|decrease|update)/i.test(text.trim());
    const thinkId = `think-${Date.now()}`;
    const thinkBubble: ChatBubble = {
      id: thinkId,
      sender: 'ai',
      text: '',
      isThinking: true,
      isAction,
      thinkingText: isAction ? 'Making...' : 'Thinking...',
      timestamp: new Date().toISOString(),
    };

    const currentContext = [...messages, userBubble].slice(-MAX_CONTEXT_MESSAGES);
    setMessages([...currentContext, thinkBubble]);
    setCustomInput('');
    setIsProcessingCommand(true);

    try {
      if (onExecuteChatCommand) {
        const result = await onExecuteChatCommand(text, currentContext);
        const replyText = result?.reply || `Executed instruction for: "${text}". Architecture updated.`;

        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== thinkId);
          return [
            ...filtered,
            {
              id: `custom-ai-${Date.now()}`,
              sender: 'ai' as const,
              text: replyText,
              actionDone: result?.actionDone,
              timestamp: new Date().toISOString(),
            },
          ].slice(-MAX_CONTEXT_MESSAGES);
        });
      } else {
        setTimeout(() => {
          setMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== thinkId);
            return [
              ...filtered,
              {
                id: `custom-ai-${Date.now()}`,
                sender: 'ai' as const,
                text: `Noted: "${text}" — I've updated the architecture configuration.`,
                timestamp: new Date().toISOString(),
              },
            ].slice(-MAX_CONTEXT_MESSAGES);
          });
        }, 800);

        onSendCustomMessage?.(text);
      }
    } catch (err: any) {
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== thinkId);
        return [
          ...filtered,
          {
            id: `custom-ai-${Date.now()}`,
            sender: 'ai' as const,
            text: `⚠️ Error executing instruction "${text}": ${err?.message || 'Action failed'}.`,
            timestamp: new Date().toISOString(),
          },
        ].slice(-MAX_CONTEXT_MESSAGES);
      });
    } finally {
      setIsProcessingCommand(false);
    }
  };

  const handleSendCustomInput = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(customInput);
  };

  const handleRestart = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    }
    onResetQuestions?.();
    const resetMsg: ChatBubble = {
      id: 'msg-reset',
      sender: 'ai',
      text: `🔄 **Conversation cleared.**\n\nI have direct access to your playground. Tell me to add components, add requirements, or scale traffic!`,
      timestamp: new Date().toISOString(),
    };
    setMessages([resetMsg]);
  };

  return (
    <aside
      ref={asideRef}
      style={{
        width: `${currentWidth}px`,
        maxWidth: '40vw',
      }}
      className={`h-full flex flex-col border-r border-slate-200 dark:border-neutral-800/80 bg-white dark:bg-[#0A0B0E] select-none shrink-0 overflow-hidden font-sans relative ${
        isDragging ? 'transition-none select-none' : 'transition-[width] duration-150 ease-out'
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-neutral-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="group w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 flex items-center justify-center font-bold">
            <Bot className="w-4 h-4 group-hover:text-indigo-500 transition-colors" />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRestart}
            className="p-1 rounded-md text-slate-400 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5 hover:text-amber-500 transition-colors" />
          </button>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:text-neutral-500 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4 hover:text-emerald-500 transition-colors" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Stream */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3.5">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            {/* Sender label */}
            <span className="text-[10px] text-slate-400 dark:text-neutral-500 mb-1 px-0.5 flex items-center gap-1">
              {msg.sender === 'ai' ? (
                <><Bot className="w-2.5 h-2.5 text-slate-600 dark:text-neutral-400 hover:text-indigo-500 transition-colors" /> AI Agent</>
              ) : (
                <><User className="w-2.5 h-2.5 text-slate-400 hover:text-blue-500 transition-colors" /> You</>
              )}
            </span>

            {/* Thinking indicator */}
            {msg.isThinking ? (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-slate-100 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700/50">
                <span className="flex items-center gap-0.5">
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-neutral-400 animate-bounce"
                      style={{ animationDelay: `${delay}s`, animationDuration: '1s' }}
                    />
                  ))}
                </span>
                <span className="text-[10.5px] text-slate-500 dark:text-neutral-400 font-medium">
                  {msg.thinkingText || (msg.isAction ? 'Making...' : 'Thinking...')}
                </span>
              </div>
            ) : (
              <div
                className={`max-w-[94%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 dark:bg-neutral-700 text-white rounded-br-sm font-medium streamdown-user whitespace-pre-wrap'
                    : 'bg-slate-100/90 dark:bg-[#121316] border border-slate-200/80 dark:border-neutral-800 text-slate-800 dark:text-neutral-100 rounded-bl-sm shadow-xs streamdown-ai'
                }`}
              >
                {msg.sender === 'user' ? (
                  msg.text
                ) : (
                  <div className="streamdown-chat-body">
                    <Streamdown>{msg.text}</Streamdown>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div ref={chatBottomRef} />
      </div>

      {/* Natural Language Command Bar */}
      <form
        onSubmit={handleSendCustomInput}
        className="p-3 border-t border-slate-100 dark:border-neutral-800/80 bg-white dark:bg-[#0A0B0E] flex items-center gap-2 shrink-0"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder='Add component, add requirement, scale…'
            disabled={isProcessingCommand}
            className="w-full pl-3 pr-2 py-2 rounded-xl text-xs bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={!customInput.trim() || isProcessingCommand}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-xs"
          title="Execute instruction on playground"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
      {/* Right Edge Resize Handle */}
      {isResizable && (
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onDoubleClick={handleResetWidth}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize left sidebar"
          aria-valuenow={currentWidth}
          aria-valuemin={Math.min(280, Math.floor((typeof window !== 'undefined' ? window.innerWidth : 1200) * 0.4))}
          aria-valuemax={Math.floor((typeof window !== 'undefined' ? window.innerWidth : 1200) * 0.4)}
          className={`absolute right-0 top-0 bottom-0 w-3 -mr-1.5 z-40 cursor-col-resize flex items-center justify-center group touch-none select-none transition-colors ${
            isDragging ? 'bg-indigo-500/10 dark:bg-indigo-500/20' : 'hover:bg-indigo-500/10 dark:hover:bg-indigo-500/15'
          }`}
          title={`Drag to resize sidebar (max 2/5 of screen: ${Math.floor((typeof window !== 'undefined' ? window.innerWidth : 1200) * 0.4)}px) · Double-click to reset`}
        >
          {/* Visual grab pill */}
          <div
            className={`w-1 rounded-full transition-all ${
              isDragging
                ? 'h-16 bg-indigo-500 dark:bg-indigo-400 shadow-xs'
                : 'h-8 bg-slate-300 dark:bg-neutral-700 group-hover:h-12 group-hover:bg-indigo-500 dark:group-hover:bg-indigo-400'
            }`}
          />
        </div>
      )}
    </aside>
  );
};

export default ContextualQuerySidebar;
