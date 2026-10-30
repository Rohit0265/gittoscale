import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  RotateCcw,
  Bot,
  User,
  PanelLeftClose,
  Zap,
  Layers,
  Activity,
} from 'lucide-react';
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
}

const CHAT_STORAGE_KEY = 'gitoscale_ai_chat_session_v2';
const MAX_CONTEXT_MESSAGES = 200;

const DEFAULT_GREETING = `👋 **Hello! I'm your Playground AI Architect Agent.**

I have direct real-time access to this canvas. Tell me what to build or change:
• ➕ **Add components**: *"Add Redis cache between API and Database"* or *"Add Kafka queue"*
• 🎯 **Add more requirements**: *"Add more requirement: must handle 50k req/s and include payment service"*
• ⚙️ **Scale & modify**: *"Scale backend to 5 instances"* or *"Set traffic to 5000 req/s"*
• 🔍 **Diagnose**: *"What are the bottlenecks right now?"*`;

const QUICK_COMMANDS = [
  { label: 'Add Redis Cache', prompt: 'Add redis cache between API Gateway and Database' },
  { label: 'Add PostgreSQL DB', prompt: 'Add PostgreSQL database' },
  { label: 'Add Kafka Queue', prompt: 'Add Kafka event queue' },
  { label: 'Add Auth Service', prompt: 'Add Auth microservice' },
  { label: 'Add 50k req/s Requirement', prompt: 'Add more requirement: must handle 50,000 req/s peak load with high availability' },
  { label: 'Scale Traffic to 5,000', prompt: 'Set incoming traffic to 5000 req/s' },
  { label: 'Diagnose Bottlenecks', prompt: 'What are the bottlenecks in my system?' },
];

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
  incomingTrafficRate = 1000,
  simulationResult,
}) => {
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

    const thinkId = `think-${Date.now()}`;
    const thinkBubble: ChatBubble = {
      id: thinkId,
      sender: 'ai',
      text: '',
      isThinking: true,
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
    <aside className="w-72 sm:w-84 h-full flex flex-col border-r border-slate-200 dark:border-neutral-800/80 bg-white dark:bg-[#0A0B0E] select-none shrink-0 overflow-hidden font-sans">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-neutral-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="group w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 flex items-center justify-center font-bold">
            <Bot className="w-4 h-4 group-hover:text-indigo-500 transition-colors" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800 dark:text-neutral-100 flex items-center gap-1.5">
              AI Architecture Agent
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </p>
            <p className="text-[10px] text-slate-400 dark:text-neutral-500">
              Live Canvas Access · 200 Chat Memory
            </p>
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

      {/* Live Playground Status Strip */}
      <div className="px-3.5 py-2 bg-slate-50/80 dark:bg-[#07080A] border-b border-slate-100 dark:border-neutral-800/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-neutral-400 shrink-0">
        <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Active Playground</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[9.5px]">
          <span className="flex items-center gap-1 bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-neutral-800/60">
            <Layers className="w-2.5 h-2.5 text-slate-600 dark:text-neutral-400 hover:text-indigo-500 transition-colors" />
            {nodes.length} nodes
          </span>
          <span className="flex items-center gap-1 bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-neutral-800/60">
            <Activity className="w-2.5 h-2.5 text-slate-600 dark:text-neutral-400 hover:text-blue-500 transition-colors" />
            {incomingTrafficRate.toLocaleString()} req/s
          </span>
          {simulationResult && (
            <span
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${
                simulationResult.bottlenecks && simulationResult.bottlenecks.length > 0
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {simulationResult.bottlenecks && simulationResult.bottlenecks.length > 0 ? (
                <span>⚠️ {simulationResult.bottlenecks.length} issue</span>
              ) : (
                <span>✓ Healthy</span>
              )}
            </span>
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
                  Modifying Playground Architecture…
                </span>
              </div>
            ) : (
              <div
                className={`max-w-[94%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 dark:bg-neutral-700 text-white rounded-br-sm font-medium'
                    : 'bg-slate-100/90 dark:bg-[#121316] border border-slate-200/80 dark:border-neutral-800 text-slate-800 dark:text-neutral-100 rounded-bl-sm shadow-xs'
                }`}
              >
                {msg.text}
              </div>
            )}
          </div>
        ))}

        {/* Dynamic Quick Action Chips (rendered when user wants instant playground actions) */}
        <div className="pt-2 flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500 px-0.5 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3 text-slate-600 dark:text-neutral-400 hover:text-amber-500 transition-colors" />
            Quick Playground Actions
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_COMMANDS.map((qc, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => executeCommand(qc.prompt)}
                disabled={isProcessingCommand}
                className="text-left px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121316] hover:bg-slate-50 dark:hover:bg-neutral-800 text-[11px] font-medium text-slate-700 dark:text-neutral-300 transition-all cursor-pointer shadow-2xs hover:border-indigo-400 dark:hover:border-indigo-500 disabled:opacity-50"
              >
                {qc.label}
              </button>
            ))}
          </div>
        </div>

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
    </aside>
  );
};

export default ContextualQuerySidebar;
