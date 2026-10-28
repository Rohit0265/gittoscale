import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Database,
  Globe,
  Bot,
  User,
  ArrowRight,
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
}

interface ChatChoice {
  id: string;
  category: 'scale' | 'budget' | 'consistency' | 'region';
  label: string;
  detail: string;
  badge?: string;
}

interface ChatBubble {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  choices?: ChatChoice[];
  category?: 'scale' | 'budget' | 'consistency' | 'region';
}

const QUESTION_STEPS: Array<{
  category: 'scale' | 'budget' | 'consistency' | 'region';
  questionText: string;
  choices: ChatChoice[];
}> = [
  {
    category: 'scale',
    questionText: 'What is your target peak throughput & concurrency?',
    choices: [
      {
        id: 'scale_mvp',
        category: 'scale',
        label: 'MVP (< 1,000 req/s)',
        detail: 'Single instance API with lightweight in-memory cache.',
        badge: 'Lean MVP',
      },
      {
        id: 'scale_growth',
        category: 'scale',
        label: 'Growth Tier (10,000 req/s)',
        detail: 'Horizontally scaled services + Redis cluster & read replicas.',
        badge: 'Recommended',
      },
      {
        id: 'scale_burst',
        category: 'scale',
        label: 'Flash Sale Burst (50,000+ req/s)',
        detail: 'Asynchronous event streaming with Kafka & partitioned databases.',
        badge: 'Hyper-Scale',
      },
    ],
  },
  {
    category: 'budget',
    questionText: 'What is your monthly cloud infrastructure budget?',
    choices: [
      {
        id: 'budget_frugal',
        category: 'budget',
        label: 'Serverless Frugal (< $100/mo)',
        detail: 'Cloudflare Workers + Serverless Postgres; scales to zero.',
        badge: 'Lowest Cost',
      },
      {
        id: 'budget_balanced',
        category: 'budget',
        label: 'Balanced Cloud ($500–$2,000/mo)',
        detail: 'Containerized ECS/Cloud Run + Multi-AZ managed databases.',
        badge: 'Standard',
      },
      {
        id: 'budget_enterprise',
        category: 'budget',
        label: 'Enterprise Dedicated ($5,000+/mo)',
        detail: 'Dedicated Kubernetes cluster with multi-region replication.',
        badge: 'Enterprise',
      },
    ],
  },
  {
    category: 'consistency',
    questionText: 'What transactional data consistency model is required?',
    choices: [
      {
        id: 'consistency_acid',
        category: 'consistency',
        label: 'Strict ACID Compliance',
        detail: 'PostgreSQL 16 Primary with synchronous write-ahead logs.',
        badge: 'Relational',
      },
      {
        id: 'consistency_eventual',
        category: 'consistency',
        label: 'High Ingestion / Eventual Consistency',
        detail: 'Event-sourced Kafka stream + DynamoDB / Cassandra ledgers.',
        badge: 'Distributed',
      },
    ],
  },
  {
    category: 'region',
    questionText: 'What is your target geographic deployment strategy?',
    choices: [
      {
        id: 'deploy_single',
        category: 'region',
        label: 'Single Region (Multi-AZ HA)',
        detail: '3 Availability Zones failover inside primary cloud region.',
        badge: 'High-Availability',
      },
      {
        id: 'deploy_multiregion',
        category: 'region',
        label: 'Global Multi-Region Active/Active',
        detail: 'Anycast DNS edge routing with geo-distributed database replicas.',
        badge: 'Global DR',
      },
    ],
  },
];

export const ContextualQuerySidebar: React.FC<ContextualQuerySidebarProps> = ({
  activePrompt,
  selectedAnswers,
  onAnswerSelected,
  onApplyRefinements,
  onResetQuestions,
  onSendCustomMessage,
  isGenerating,
  isHydrated,
}) => {
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize conversation based on current prompt
  useEffect(() => {
    const initialBubbles: ChatBubble[] = [
      {
        id: 'msg-welcome',
        sender: 'ai',
        text: `👋 I've initialized the architectural blueprint for: "${activePrompt}".\n\nTo tailor the infrastructure to production standards, I need a few mandatory engineering parameters.`,
      },
    ];

    // Add first question
    const firstStep = QUESTION_STEPS[0];
    initialBubbles.push({
      id: `msg-q-${firstStep.category}`,
      sender: 'ai',
      text: firstStep.questionText,
      choices: firstStep.choices,
      category: firstStep.category,
    });

    setMessages(initialBubbles);
    setCurrentStepIndex(0);
  }, [activePrompt]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStepIndex]);

  // Handle user selecting a choice
  const handleSelectChoice = (choice: ChatChoice) => {
    // 1. Add user answer bubble
    const userBubble: ChatBubble = {
      id: `user-ans-${Date.now()}`,
      sender: 'user',
      text: choice.label,
    };

    onAnswerSelected(choice.category, choice.id, choice.label);

    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);

    // 2. Prepare next AI response
    let nextAiBubbles: ChatBubble[] = [userBubble];

    if (nextIndex < QUESTION_STEPS.length) {
      const nextStep = QUESTION_STEPS[nextIndex];
      nextAiBubbles.push({
        id: `msg-q-${nextStep.category}`,
        sender: 'ai',
        text: nextStep.questionText,
        choices: nextStep.choices,
        category: nextStep.category,
      });
    } else {
      // All mandatory questions answered!
      nextAiBubbles.push({
        id: 'msg-complete',
        sender: 'ai',
        text: 'All mandatory parameters locked! 🎯\nYour blueprint is ready to be synthesized into concrete microservices, caches, and databases.',
      });
    }

    setMessages((prev) => [...prev, ...nextAiBubbles]);
  };

  // Handle sending a custom prompt or refinement
  const handleSendCustomInput = (e: React.FormEvent) => {
    e.preventDefault();
    const text = customInput.trim();
    if (!text) return;

    const userBubble: ChatBubble = {
      id: `custom-user-${Date.now()}`,
      sender: 'user',
      text,
    };

    const aiBubble: ChatBubble = {
      id: `custom-ai-${Date.now()}`,
      sender: 'ai',
      text: `Incorporating parameter: "${text}" into the architecture configuration.`,
    };

    setMessages((prev) => [...prev, userBubble, aiBubble]);
    setCustomInput('');

    if (onSendCustomMessage) {
      onSendCustomMessage(text);
    }
  };

  const handleRestart = () => {
    onResetQuestions();
    setCurrentStepIndex(0);
    const firstStep = QUESTION_STEPS[0];
    setMessages([
      {
        id: 'msg-welcome-restart',
        sender: 'ai',
        text: `Conversation reset. Let's configure your requirements for: "${activePrompt}".`,
      },
      {
        id: `msg-q-${firstStep.category}`,
        sender: 'ai',
        text: firstStep.questionText,
        choices: firstStep.choices,
        category: firstStep.category,
      },
    ]);
  };

  // Count answered mandatory categories
  const answeredCount = Object.values(selectedAnswers).filter(Boolean).length;
  const isAllAnswered = answeredCount >= 4;

  return (
    <aside className="w-80 sm:w-96 h-full flex flex-col border-r border-slate-200 dark:border-neutral-800 bg-white/95 dark:bg-[#0B0C10]/95 backdrop-blur-md select-none shrink-0 overflow-hidden font-sans">
      {/* 1. Chat Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-neutral-900/40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>AI Architect Assistant</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-neutral-400">
              Conversational Requirements Querying
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRestart}
          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Restart questionnaire"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* 2. Mandatory Inputs Summary Strip (Always showing current specs) */}
      <div className="px-3.5 py-2 border-b border-slate-200 dark:border-neutral-800/80 bg-slate-100/50 dark:bg-[#08090C] flex flex-wrap gap-1.5 text-[10px] shrink-0">
        <span className="font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider text-[9px] mr-1 flex items-center">
          Specs:
        </span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium ${
            selectedAnswers.scale
              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800/60 text-sky-700 dark:text-sky-300'
              : 'bg-slate-200/50 dark:bg-neutral-800/40 border-dashed border-slate-300 dark:border-neutral-700 text-slate-400'
          }`}
        >
          <TrendingUp className="w-2.5 h-2.5" />
          {selectedAnswers.scale ? 'Scale Set' : 'Traffic: ?'}
        </span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium ${
            selectedAnswers.budget
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-200/50 dark:bg-neutral-800/40 border-dashed border-slate-300 dark:border-neutral-700 text-slate-400'
          }`}
        >
          <DollarSign className="w-2.5 h-2.5" />
          {selectedAnswers.budget ? 'Budget Set' : 'Budget: ?'}
        </span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium ${
            selectedAnswers.consistency
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60 text-amber-700 dark:text-amber-300'
              : 'bg-slate-200/50 dark:bg-neutral-800/40 border-dashed border-slate-300 dark:border-neutral-700 text-slate-400'
          }`}
        >
          <Database className="w-2.5 h-2.5" />
          {selectedAnswers.consistency ? 'ACID / Store' : 'Store: ?'}
        </span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium ${
            selectedAnswers.region
              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800/60 text-purple-700 dark:text-purple-300'
              : 'bg-slate-200/50 dark:bg-neutral-800/40 border-dashed border-slate-300 dark:border-neutral-700 text-slate-400'
          }`}
        >
          <Globe className="w-2.5 h-2.5" />
          {selectedAnswers.region ? 'Region Set' : 'Region: ?'}
        </span>
      </div>

      {/* 3. Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            {/* Sender Header Icon & Label */}
            <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400 dark:text-neutral-500 font-medium">
              {msg.sender === 'ai' ? (
                <>
                  <Bot className="w-3 h-3 text-indigo-500" />
                  <span>AI Architect</span>
                </>
              ) : (
                <>
                  <span>You</span>
                  <User className="w-3 h-3 text-sky-500" />
                </>
              )}
            </div>

            {/* Bubble Container */}
            <div
              className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-xs font-medium'
                  : 'bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-neutral-200 rounded-bl-xs'
              }`}
            >
              {msg.text}
            </div>

            {/* Choice Chips (if AI asked a question in this bubble) */}
            {msg.choices && msg.choices.length > 0 && (
              <div className="mt-2.5 flex flex-col gap-1.5 w-full max-w-[92%] pl-1">
                {msg.choices.map((choice) => {
                  const isCurrentSelected =
                    choice.category === 'scale'
                      ? selectedAnswers.scale === choice.id
                      : choice.category === 'budget'
                      ? selectedAnswers.budget === choice.id
                      : choice.category === 'consistency'
                      ? selectedAnswers.consistency === choice.id
                      : selectedAnswers.region === choice.id;

                  return (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => handleSelectChoice(choice)}
                      className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                        isCurrentSelected
                          ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-900 dark:text-white shadow-xs'
                          : 'border-slate-200 dark:border-neutral-800/80 hover:border-indigo-400/60 bg-white dark:bg-[#101218] hover:bg-slate-50 dark:hover:bg-[#141620] text-slate-700 dark:text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-slate-900 dark:text-white">
                          {choice.label}
                        </span>
                        {choice.badge && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold uppercase tracking-wider">
                            {choice.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-neutral-400 line-clamp-2">
                        {choice.detail}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* Action Button: Hydrate / Generate Architecture */}
        {isAllAnswered && !isHydrated && (
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={onApplyRefinements}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing Components...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Synthesize Production Architecture</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        )}

        {isHydrated && (
          <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>Architecture is hydrated! You can simulate load or toggle Detailed View.</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* 4. Bottom Custom Input Bar (Freeform prompt / refinement) */}
      <form
        onSubmit={handleSendCustomInput}
        className="p-3 border-t border-slate-200 dark:border-neutral-800 bg-white/95 dark:bg-[#0B0C10]/95 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Ask AI or refine (e.g. 'Add Redis cluster')..."
          className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-neutral-200 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!customInput.trim()}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          title="Send refinement to AI"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </aside>
  );
};

export default ContextualQuerySidebar;
