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
  isGenerating: boolean;
  isHydrated: boolean;
  isDark?: boolean;
  onToggleCollapse?: () => void;
}

interface ChatChoice {
  id: string;
  category: 'scale' | 'budget' | 'consistency' | 'region';
  label: string;
  detail: string;
}

interface ChatBubble {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  choices?: ChatChoice[];
  isThinking?: boolean;
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

const THINKING_DURATION_MS = 1400;

export const ContextualQuerySidebar: React.FC<ContextualQuerySidebarProps> = ({
  activePrompt,
  selectedAnswers,
  onAnswerSelected,
  onApplyRefinements,
  onResetQuestions,
  onSendCustomMessage,
  isGenerating,
  isHydrated,
  onToggleCollapse,
}) => {
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Post a "thinking" bubble, then after THINKING_DURATION_MS replace it with the real bubble
  const postWithThinking = (buildBubble: () => ChatBubble) => {
    const thinkId = `think-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: thinkId, sender: 'ai', text: '', isThinking: true } as ChatBubble,
    ]);
    setTimeout(() => {
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== thinkId);
        return [...filtered, buildBubble()];
      });
    }, THINKING_DURATION_MS);
  };

  // Initialise the chat
  useEffect(() => {
    const step = QUESTION_STEPS[0];

    const welcome: ChatBubble = {
      id: 'msg-welcome',
      sender: 'ai',
      text: `Initialised a blueprint for:\n"${activePrompt}"\n\nI'll ask a few targeted questions to configure the topology.`,
    };

    // Think, then post first question
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
          } as ChatBubble,
        ];
      });
    }, THINKING_DURATION_MS);
  }, [activePrompt]);

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
    };

    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    setMessages((prev) => [...prev, userBubble]);

    if (nextIndex < QUESTION_STEPS.length) {
      const nextStep = QUESTION_STEPS[nextIndex];
      postWithThinking(() => ({
        id: `msg-q-${nextStep.category}`,
        sender: 'ai',
        text: nextStep.questionText,
        choices: nextStep.choices,
        category: nextStep.category,
      }));
    } else {
      postWithThinking(() => ({
        id: 'msg-complete',
        sender: 'ai',
        text: 'All parameters captured. Ready to synthesise your production topology.',
      }));
    }
  };

  const handleSendCustomInput = (e: React.FormEvent) => {
    e.preventDefault();
    const text = customInput.trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      { id: `custom-user-${Date.now()}`, sender: 'user', text } as ChatBubble,
    ]);
    setCustomInput('');

    postWithThinking(() => ({
      id: `custom-ai-${Date.now()}`,
      sender: 'ai',
      text: `Noted: "${text}" — I've incorporated this constraint into the configuration.`,
    }));

    onSendCustomMessage?.(text);
  };

  const handleRestart = () => {
    onResetQuestions();
    setCurrentStepIndex(0);
    const step = QUESTION_STEPS[0];
    const resetMsg: ChatBubble = {
      id: 'msg-reset',
      sender: 'ai',
      text: `Conversation reset.\n"${activePrompt}"`,
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
          } as ChatBubble,
        ];
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
          </div>
        </div>
        <div className="flex items-center gap-2">
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
                  Analysing…
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
            <span>Topology synthesised. Switch to Detailed View or run a load simulation.</span>
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
          placeholder="Add a constraint or ask a question…"
          className="flex-1 px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700/50 text-slate-800 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:border-slate-400 dark:focus:border-neutral-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!customInput.trim()}
          className="p-2 rounded-lg bg-slate-800 dark:bg-neutral-100 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-900 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </aside>
  );
};

export default ContextualQuerySidebar;
