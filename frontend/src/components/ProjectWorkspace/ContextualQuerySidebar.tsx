import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  RotateCcw,
  CheckCircle2,
  Bot,
  User,
  ArrowRight,
  Zap,
  PanelLeftClose,
} from 'lucide-react';
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
  activePrompt: string;
  selectedAnswers: {
    scale?: string;
    budget?: string;
    consistency?: string;
    region?: string;
  };
  onAnswerSelected: (
    category: 'scale' | 'budget' | 'consistency' | 'region',
    optionId: string,
    label: string
  ) => void;
  onApplyRefinements: () => void;
  onResetQuestions: () => void;
  onSendCustomMessage?: (message: string) => void;
  onExecuteChatCommand?: (
    message: string,
    history: ChatBubble[]
  ) => Promise<{ reply: string; actionDone?: string; updatedAnswers?: any } | void>;
  onRestoreSession?: (session: {
    selectedAnswers: Record<string, string>;
    activePrompt?: string;
  }) => void;
  isGenerating: boolean;
  isHydrated: boolean;
  isDark?: boolean;
  onToggleCollapse?: () => void;
  user?: any;
}

const QUESTION_STEPS: Array<{
  category: 'scale' | 'budget' | 'consistency' | 'region';
  questionText: string;
  choices: ChatChoice[];
}> = [
  {
    category: 'scale',
    questionText: 'What peak throughput does your system need to handle?',
    choices: [
      { id: 'scale_mvp', category: 'scale', label: 'MVP  ·  < 1,000 req/s', detail: 'Single-instance API, lightweight in-memory cache.' },
      { id: 'scale_growth', category: 'scale', label: 'Growth  ·  10,000 req/s', detail: 'Horizontal pod scaling + Redis cluster & read replicas.' },
      { id: 'scale_burst', category: 'scale', label: 'Burst  ·  50,000+ req/s', detail: 'Kafka event streaming + sharded databases.' },
    ],
  },
  {
    category: 'budget',
    questionText: 'What is your monthly cloud infrastructure budget?',
    choices: [
      { id: 'budget_frugal', category: 'budget', label: 'Lean  ·  < $100/mo', detail: 'Serverless functions + managed Postgres, scales to zero.' },
      { id: 'budget_balanced', category: 'budget', label: 'Standard  ·  $500–$2k/mo', detail: 'Containerised ECS / Cloud Run + multi-AZ RDS.' },
      { id: 'budget_enterprise', category: 'budget', label: 'Enterprise  ·  $5k+/mo', detail: 'Dedicated Kubernetes + multi-region Aurora.' },
    ],
  },
  {
    category: 'consistency',
    questionText: 'What data consistency model fits your domain?',
    choices: [
      { id: 'consistency_acid', category: 'consistency', label: 'Strict ACID', detail: 'PostgreSQL 16 primary with synchronous standby.' },
      { id: 'consistency_eventual', category: 'consistency', label: 'Eventual / Event-sourced', detail: 'Kafka + DynamoDB or Cassandra for high-ingestion writes.' },
    ],
  },
  {
    category: 'region',
    questionText: 'Where and how do you need to deploy?',
    choices: [
      { id: 'deploy_single', category: 'region', label: 'Single region  ·  Multi-AZ', detail: 'Three AZ failover inside one cloud region.' },
      { id: 'deploy_multiregion', category: 'region', label: 'Global  ·  Active / Active', detail: 'Anycast DNS + geo-distributed read replicas.' },
    ],
  },
];

const THINKING_DURATION_MS = 1000;
const CHAT_STORAGE_KEY = 'gitoscale_ai_chat_session_v2';
const MAX_CONTEXT_MESSAGES = 200;

export const ContextualQuerySidebar: React.FC<ContextualQuerySidebarProps> = ({
  activePrompt,
  selectedAnswers,
  onAnswerSelected,
  onApplyRefinements,
  onResetQuestions,
  onSendCustomMessage,
  onExecuteChatCommand,
  onRestoreSession,
  isGenerating,
  isHydrated,
  onToggleCollapse,
  user,
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

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(CHAT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed.currentStepIndex === 'number') {
            return parsed.currentStepIndex;
          }
        }
      } catch (e) {}
    }
    return 0;
  });

  const [customInput, setCustomInput] = useState('');
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const saveDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const hasRestoredRef = useRef<boolean>(messages.length > 0);

  // Post a thinking bubble then replace with final bubble
  const postWithThinking = (buildBubble: () => ChatBubble) => {
    const thinkId = `think-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: thinkId, sender: 'ai', text: '', isThinking: true } as ChatBubble,
    ]);
    setTimeout(() => {
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== thinkId);
        return [...filtered, buildBubble()].slice(-MAX_CONTEXT_MESSAGES);
      });
    }, THINKING_DURATION_MS);
  };

  // Initialise chat: only if NO prior messages exist in storage
  useEffect(() => {
    if (hasRestoredRef.current && messages.length > 0) {
      hasRestoredRef.current = false;
      // Sync stored answers up to parent if present
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
      const step = QUESTION_STEPS[0];
      const welcome: ChatBubble = {
        id: 'msg-welcome',
        sender: 'ai',
        text: `Initialised blueprint for:\n"${activePrompt}"\n\nI'll ask a few targeted questions to configure the topology, or you can give me direct architecture instructions anytime.`,
        timestamp: new Date().toISOString(),
      };

      setMessages([welcome]);
      setCurrentStepIndex(0);

      const thinkId = 'think-initial';
      setMessages((prev) => [
        ...prev,
        { id: thinkId, sender: 'ai', text: '', isThinking: true } as ChatBubble,
      ]);
      setTimeout(() => {
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== thinkId);
          return [
            ...filtered,
            {
              id: `msg-q-${step.category}`,
              sender: 'ai',
              text: step.questionText,
              choices: step.choices,
              category: step.category,
              timestamp: new Date().toISOString(),
            } as ChatBubble,
          ].slice(-MAX_CONTEXT_MESSAGES);
        });
      }, THINKING_DURATION_MS);
    }
  }, [activePrompt]);

  // Persist conversation to localStorage & database (capped at 200 messages)
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      const session = {
        version: 2,
        activePrompt,
        selectedAnswers,
        currentStepIndex,
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
          }).catch((err) => {
            console.warn('[ContextualQuerySidebar] Background DB sync note:', err.message);
          });
        }, 1500);
      }
    }
  }, [messages, selectedAnswers, currentStepIndex, activePrompt, user]);

  // Auto-scroll
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectChoice = (choice: ChatChoice) => {
    onAnswerSelected(choice.category, choice.id, choice.label);

    const userBubble: ChatBubble = {
      id: `user-ans-${Date.now()}`,
      sender: 'user',
      text: choice.label,
      timestamp: new Date().toISOString(),
    };

    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    setMessages((prev) => [...prev, userBubble].slice(-MAX_CONTEXT_MESSAGES));

    if (nextIndex < QUESTION_STEPS.length) {
      const nextStep = QUESTION_STEPS[nextIndex];
      postWithThinking(() => ({
        id: `msg-q-${nextStep.category}`,
        sender: 'ai',
        text: nextStep.questionText,
        choices: nextStep.choices,
        category: nextStep.category,
        timestamp: new Date().toISOString(),
      }));
    } else {
      postWithThinking(() => ({
        id: 'msg-complete',
        sender: 'ai',
        text: 'All parameters captured. Ready to synthesise your production topology, or give me live instructions like **"add redis cache after API gateway"**.',
        timestamp: new Date().toISOString(),
      }));
    }
  };

  const handleSendCustomInput = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = customInput.trim();
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
        const replyText = result?.reply || `Executed instruction for: "${text}".`;

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
                text: `Noted: "${text}" — I've incorporated this constraint into the configuration.`,
                timestamp: new Date().toISOString(),
              },
            ].slice(-MAX_CONTEXT_MESSAGES);
          });
        }, THINKING_DURATION_MS);

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

  const handleRestart = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    }
    onResetQuestions();
    setCurrentStepIndex(0);
    const step = QUESTION_STEPS[0];
    const resetMsg: ChatBubble = {
      id: 'msg-reset',
      sender: 'ai',
      text: `Conversation reset.\n"${activePrompt}"\n\nI'll ask a few targeted questions, or you can give me direct instructions anytime.`,
      timestamp: new Date().toISOString(),
    };
    setMessages([resetMsg]);
    const thinkId = 'think-reset';
    setMessages((prev) => [
      ...prev,
      { id: thinkId, sender: 'ai', text: '', isThinking: true } as ChatBubble,
    ]);
    setTimeout(() => {
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== thinkId);
        return [
          ...filtered,
          {
            id: `msg-q-reset-${step.category}`,
            sender: 'ai',
            text: step.questionText,
            choices: step.choices,
            category: step.category,
            timestamp: new Date().toISOString(),
          } as ChatBubble,
        ].slice(-MAX_CONTEXT_MESSAGES);
      });
    }, THINKING_DURATION_MS);
  };

  const isAllAnswered = Object.values(selectedAnswers).filter(Boolean).length >= 4;

  return (
    <aside className="w-72 sm:w-80 h-full flex flex-col border-r border-slate-200 dark:border-neutral-800/80 bg-white dark:bg-[#0A0B0E] select-none shrink-0 overflow-hidden font-sans">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-neutral-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-neutral-800 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-slate-600 dark:text-neutral-300" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800 dark:text-neutral-100 flex items-center gap-1.5">
              AI Architect
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </p>
            <p className="text-[10px] text-slate-400 dark:text-neutral-500">
              Interactive Agent · 200 Chat Memory
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRestart}
            className="text-[11px] text-slate-400 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-200 flex items-center gap-1 transition-colors cursor-pointer"
            title="Reset conversation and start fresh"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:text-neutral-500 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Collapse AI Architect"
              aria-label="Collapse AI Architect"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Stream */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            {/* Sender label */}
            <span className="text-[10px] text-slate-400 dark:text-neutral-500 mb-1 px-0.5 flex items-center gap-1">
              {msg.sender === 'ai' ? (
                <><Bot className="w-2.5 h-2.5" /> AI Architect</>
              ) : (
                <><User className="w-2.5 h-2.5" /> You</>
              )}
            </span>

            {/* Thinking indicator */}
            {msg.isThinking ? (
              <div className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-slate-100 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700/50">
                <span className="flex items-center gap-0.5">
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-neutral-400 animate-bounce"
                      style={{ animationDelay: `${delay}s`, animationDuration: '1s' }}
                    />
                  ))}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-neutral-400 font-medium">
                  Analysing &amp; Executing…
                </span>
              </div>
            ) : (
              <>
                {/* Bubble */}
                <div
                  className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-slate-800 dark:bg-neutral-700 text-white rounded-br-sm font-medium'
                      : 'bg-slate-100 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700/50 text-slate-800 dark:text-neutral-100 rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Choices */}
                {msg.choices && msg.choices.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1.5 w-full">
                    {msg.choices.map((choice) => {
                      const isSelected =
                        choice.category === 'scale' ? selectedAnswers.scale === choice.id :
                        choice.category === 'budget' ? selectedAnswers.budget === choice.id :
                        choice.category === 'consistency' ? selectedAnswers.consistency === choice.id :
                        selectedAnswers.region === choice.id;

                      return (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() => handleSelectChoice(choice)}
                          className={`text-left px-3 py-2.5 rounded-lg border transition-all cursor-pointer group ${
                            isSelected
                              ? 'border-slate-800 dark:border-neutral-300 bg-slate-800 dark:bg-neutral-200 text-white dark:text-slate-900'
                              : 'border-slate-200 dark:border-neutral-700/60 bg-white dark:bg-neutral-900/40 hover:bg-slate-50 dark:hover:bg-neutral-800/60 hover:border-slate-300 dark:hover:border-neutral-600 text-slate-700 dark:text-neutral-200'
                          }`}
                        >
                          <p className="font-semibold text-[11px]">{choice.label}</p>
                          <p className={`text-[10px] mt-0.5 ${
                            isSelected ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400 dark:text-neutral-400'
                          }`}>
                            {choice.detail}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {/* Synthesise CTA */}
        {isAllAnswered && !isHydrated && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onApplyRefinements}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  Synthesising…
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  Synthesise Architecture
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        )}

        {isHydrated && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
            <span>Topology active. You can give commands like <strong>"add redis cache after API gateway"</strong> or <strong>"set traffic to 5000"</strong>.</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Freeform input */}
      <form
        onSubmit={handleSendCustomInput}
        className="px-3 py-3 border-t border-slate-100 dark:border-neutral-800/80 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder='e.g. "add redis cache between API and DB"…'
          disabled={isProcessingCommand}
          className="flex-1 px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700/50 text-slate-800 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:border-slate-400 dark:focus:border-neutral-500 transition-colors disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!customInput.trim() || isProcessingCommand}
          className="p-2 rounded-lg bg-slate-800 dark:bg-neutral-100 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-900 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          title="Send command to AI Architect"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </aside>
  );
};

export default ContextualQuerySidebar;
