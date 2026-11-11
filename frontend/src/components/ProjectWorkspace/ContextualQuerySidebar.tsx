import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowUp,
  PanelLeftClose,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  isStreaming?: boolean;
  thinkingText?: string;
  isAction?: boolean;
  category?: 'scale' | 'budget' | 'consistency' | 'region';
  actionDone?: string;
  timestamp?: string;
}

export interface ContextualQuerySidebarProps {
  projectId?: string;
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
    history: ChatBubble[],
    onToken?: (token: string, fullText: string) => void
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

const getChatStorageKey = (projectId?: string) =>
  projectId ? `gitoscale_ai_chat_session_${projectId}` : 'gitoscale_ai_chat_session_v2';
const MAX_CONTEXT_MESSAGES = 200;

/**
 * Detects if a user prompt is vague, underspecified, or lacks architectural parameters.
 */
/**
 * Sanitizes chat text for display, stripping raw Mermaid code syntax blocks
 * so user reads clean, professional rationale while the visual canvas handles diagram rendering.
 */
function cleanDisplayContent(rawText: string, isStreaming?: boolean): string {
  if (!rawText) return '';
  let cleaned = rawText;
  // Strip complete mermaid code blocks
  cleaned = cleaned.replace(/```(?:mermaid)?[\s\S]*?```/gi, '');
  // If actively streaming, strip unclosed mermaid blocks so raw syntax doesn't glitch onto screen
  if (isStreaming) {
    cleaned = cleaned.replace(/```(?:mermaid)?[\s\S]*$/gi, '');
  }
  cleaned = cleaned.trim();
  if (!cleaned && rawText.includes('mermaid')) {
    return '✨ System architecture synthesized and rendered on canvas.';
  }
  return cleaned || rawText;
}

export function isVagueRequirement(promptText: string): boolean {
  if (!promptText || promptText === 'Scalable distributed cloud architecture') return true;
  const clean = promptText.trim().toLowerCase();
  const words = clean.split(/\s+/).filter(Boolean);

  // Very short prompts (< 4 words or < 22 characters)
  if (words.length <= 3 || clean.length < 22) {
    const hasSpecificTech =
      /(kafka|redis|postgres|postgresql|mysql|mongodb|mongo|grpc|graphql|rabbitmq|dynamodb|elasticsearch|cassandra|k8s|kubernetes|microservice|event-driven|pubsub)/i.test(
        clean
      );
    return !hasSpecificTech;
  }

  // Generic requests without architectural details
  const isGenericStarter =
    /^(build|create|make|design|want|need|develop)\s+(a|an|the)?\s*(simple\s+|scalable\s+|modern\s+)?(app|application|website|web app|system|platform|project|tool|software|ecommerce|shop|chat|dashboard)$/i.test(
      clean
    );
  if (isGenericStarter) return true;

  // Lacks technical dimensions
  const hasArchitectureDimensions =
    /(scale|traffic|rps|req\/s|load|cache|db|database|queue|stream|latency|worker|replica|sharding|cluster|event|async|sync|rest|grpc|auth|payment|realtime|real-time|websocket)/i.test(
      clean
    );
  return !hasArchitectureDimensions && words.length < 8;
}

/**
 * Generates initial AI response: asking clarifying questions for vague prompts,
 * or confirming architecture analysis for specific prompts.
 */
export function getClarifyingQuestionsOrSummary(promptText: string, isVague: boolean): string {
  if (isVague) {
    const title = promptText && promptText !== 'Scalable distributed cloud architecture' ? `"${promptText}"` : 'your architecture idea';
    return `👋 I've received your request for **${title}**.

To design the most accurate and cost-effective distributed architecture without guessing, could you clarify a few key requirements?

1. ⚡ **Target Scale & Load**: What is your expected peak traffic (e.g., early MVP < 1,000 req/s, or Growth 10k–50k req/s)?
2. 🔄 **Workload Characteristic**: Is your application primarily read-heavy (e.g. feeds/catalogs) or write-heavy (e.g. transactions/telemetry)?
3. 💾 **Data Persistence**: Do you need strict ACID compliance (PostgreSQL) or flexible document/NoSQL storage (MongoDB/DynamoDB)?
4. 📬 **Communication Pattern**: Do you require asynchronous event streaming (Kafka/RabbitMQ) or synchronous REST/gRPC APIs?

*(Feel free to reply with your answers, or say **"use recommended defaults"** to proceed with a balanced production setup!)*`;
  }

  return `🎯 **Architecture Analyzed**:
I've evaluated your prompt: **"${promptText}"** and initialized your distributed architecture topology on the canvas.

• **Ingress & Gateway**: Configured routing, rate-limiting, and TLS termination.
• **Processing Tier**: Core microservice layer sized for your workload.
• **Data & Caching**: Spliced persistence and in-memory caching to eliminate bottlenecks.

What component, scaling threshold, or failure scenario would you like to explore next?`;
}

const ContextualQuerySidebarComponent: React.FC<ContextualQuerySidebarProps> = ({
  projectId,
  activePrompt = 'Scalable distributed cloud architecture',
  selectedAnswers = {},
  onSendCustomMessage,
  onExecuteChatCommand,
  onRestoreSession,
  onToggleCollapse,
  isGenerating = false,
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
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        return Math.min(380, Math.max(280, window.innerWidth - 24));
      }
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
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        const mobileWidth = Math.min(380, Math.max(280, window.innerWidth - 24));
        setInternalWidth(mobileWidth);
        onWidthChange?.(mobileWidth);
        return;
      }
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
    if (!isResizable || (typeof window !== 'undefined' && window.innerWidth < 768)) return;
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

  const createInitialMessages = useCallback(
    (promptText: string, generating: boolean): ChatBubble[] => {
      const isBlank =
        !promptText ||
        promptText.trim() === '' ||
        promptText.toLowerCase().includes('blank');

      if (isBlank) {
        return [
          {
            id: 'msg-welcome',
            sender: 'ai',
            text: `👋 **Blank Canvas Ready!**\n\nYou're on a clean ground with no pre-configured nodes.\n\n• Use the **Components** panel on the right or tap **Add Component** on the canvas to start building.\n• Whenever you want advice on scaling, architecture patterns, or trade-offs, type your requirement here!`,
            timestamp: new Date().toISOString(),
          },
        ];
      }

      const isPlaceholder = promptText === 'Scalable distributed cloud architecture';
      if (isPlaceholder) {
        return [
          {
            id: 'msg-welcome',
            sender: 'ai',
            text: `👋 **Welcome! I'm your AI Systems Architect.**\n\nDescribe any system you'd like to design (e.g., *"Design an event-driven payment processing system"* or *"Build an e-commerce platform"*), and I'll generate the live architecture canvas and guide you through scaling trade-offs.`,
            timestamp: new Date().toISOString(),
          },
        ];
      }

      const userBubble: ChatBubble = {
        id: `user-init-${Date.now()}`,
        sender: 'user',
        text: promptText,
        timestamp: new Date().toISOString(),
      };

      const isVague = isVagueRequirement(promptText);
      const aiBubble: ChatBubble = {
        id: `ai-init-${Date.now() + 1}`,
        sender: 'ai',
        text: generating
          ? 'Evaluating architecture requirements & designing topology...'
          : getClarifyingQuestionsOrSummary(promptText, isVague),
        isThinking: generating,
        timestamp: new Date().toISOString(),
      };

      return [userBubble, aiBubble];
    },
    []
  );

  // Load existing session from localStorage to prevent re-asking on refresh
  const [messages, setMessages] = useState<ChatBubble[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(getChatStorageKey(projectId));
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
    return createInitialMessages(activePrompt, isGenerating);
  });

  const [customInput, setCustomInput] = useState('');
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const saveDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const prevGeneratingRef = useRef(isGenerating);

  // Sync messages when projectId or activePrompt changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = getChatStorageKey(projectId);
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          setMessages(parsed.messages.slice(-MAX_CONTEXT_MESSAGES));
          if (parsed.selectedAnswers && onRestoreSession) {
            onRestoreSession({
              selectedAnswers: parsed.selectedAnswers,
              activePrompt: parsed.activePrompt,
            });
          }
          return;
        }
      }
    } catch (e) {}

    // Initialize with user's prompt as the first message
    setMessages(createInitialMessages(activePrompt, isGenerating));
  }, [projectId, activePrompt, isGenerating, createInitialMessages]);

  // Transition thinking bubble when generation finishes
  useEffect(() => {
    if (prevGeneratingRef.current && !isGenerating) {
      setMessages((prev) => {
        const hasThinking = prev.some((m) => m.isThinking);
        if (!hasThinking) return prev;
        const isVague = isVagueRequirement(activePrompt);
        return prev.map((msg) =>
          msg.isThinking
            ? {
                ...msg,
                isThinking: false,
                text: getClarifyingQuestionsOrSummary(activePrompt, isVague),
              }
            : msg
        );
      });
    }
    prevGeneratingRef.current = isGenerating;
  }, [isGenerating, activePrompt]);

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
        const key = getChatStorageKey(projectId);
        localStorage.setItem(key, JSON.stringify(session));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }

      // Debounce sync to PostgreSQL if user is authenticated
      if (user) {
        if (saveDebounceTimer.current) clearTimeout(saveDebounceTimer.current);
        saveDebounceTimer.current = setTimeout(() => {
          const token = localStorage.getItem('sb-access-token') || null;
          const stableSessionId = projectId
            ? `chat_${projectId}`
            : `chat_${encodeURIComponent(activePrompt || 'default').slice(0, 32)}`;
          api.saveChatHistory(token, {
            sessionId: stableSessionId,
            projectId,
            prompt: activePrompt,
            messages: messages.slice(-MAX_CONTEXT_MESSAGES),
            selectedAnswers,
            architectureData: nodes.length > 0 ? { nodes, edges } : undefined,
          }).catch((err) => {
            console.warn('[ContextualQuerySidebar] Background DB sync note:', err.message);
          });
        }, 1500);
      }
    }
  }, [messages, selectedAnswers, activePrompt, user, nodes, edges, projectId]);
  // Auto-scroll firmly to the bottom without competing smooth-scroll jitter or parent layout jumps
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
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
        let streamAccumulated = '';
        let lastRenderTime = 0;
        let animationFrameId: number | null = null;

        const updateMessageText = (newText: string, isFinal: boolean = false) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === thinkId
                ? {
                    ...m,
                    isThinking: false,
                    isStreaming: !isFinal,
                    text: newText,
                  }
                : m
            )
          );
        };

        const handleToken = (_token: string, fullText: string) => {
          streamAccumulated = fullText;
          const now = Date.now();
          if (now - lastRenderTime > 35) {
            lastRenderTime = now;
            updateMessageText(fullText, false);
          } else if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(() => {
              animationFrameId = null;
              lastRenderTime = Date.now();
              updateMessageText(streamAccumulated, false);
            });
          }
        };

        const result = await onExecuteChatCommand(text, currentContext, handleToken);
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        const replyText = result?.reply || streamAccumulated || `Executed instruction for: "${text}". Architecture updated.`;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === thinkId
              ? {
                  ...m,
                  isThinking: false,
                  isStreaming: false,
                  text: replyText,
                  actionDone: result?.actionDone,
                }
              : m
          ).slice(-MAX_CONTEXT_MESSAGES)
        );
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
            text: 'Traffic is more than expected. Please retry later.',
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

  return (
    <aside
      ref={asideRef}
      style={{
        width: widthProp !== undefined ? '100%' : `${currentWidth}px`,
        maxWidth: widthProp !== undefined ? '100%' : '40vw',
      }}
      className={`h-full w-full flex flex-col border-r border-slate-200 dark:border-neutral-800/80 bg-white dark:bg-[#0A0B0E] shrink-0 overflow-hidden font-sans relative transform-gpu ${
        isDragging ? 'transition-none select-none cursor-col-resize' : ''
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-neutral-800/80 flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold text-slate-900 dark:text-white">
          Architecture Copilot
        </span>
        <div className="flex items-center gap-1.5">
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:text-neutral-500 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4 hover:text-gray-500 transition-colors" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Stream */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3.5 overscroll-contain [scrollbar-gutter:stable]"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>

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
                    ? 'bg-slate-900 dark:bg-neutral-700 text-white rounded-br-sm font-medium whitespace-pre-wrap'
                    : 'bg-slate-100/90 dark:bg-[#121316] border border-slate-200/80 dark:border-neutral-800 text-slate-800 dark:text-neutral-100 rounded-bl-sm shadow-xs'
                }`}
              >
                {msg.sender === 'user' ? (
                  msg.text
                ) : (
                  <div className="ai-markdown-chat-body streamdown-chat-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {cleanDisplayContent(msg.text, msg.isStreaming)}
                    </ReactMarkdown>
                    {msg.isStreaming && (
                      <span className="inline-block w-1.5 h-3 ml-0.5 bg-indigo-500 animate-pulse align-middle" />
                    )}
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
            className="w-full pl-3 pr-2 py-2 rounded-xl text-xs bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={!customInput.trim() || isProcessingCommand}
          className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-xs"
          title="Execute instruction on playground"
        >
          <ArrowUp className="w-4 h-4 text-slate-700 dark:text-neutral-300" />
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

export const ContextualQuerySidebar = React.memo(ContextualQuerySidebarComponent);
export default ContextualQuerySidebar;
