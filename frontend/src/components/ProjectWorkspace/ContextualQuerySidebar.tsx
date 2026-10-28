import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

export interface ContextualQuestion {
  id: string;
  category: 'scale' | 'budget' | 'storage' | 'cloud';
  title: string;
  description: string;
  icon: React.ReactNode;
  options: Array<{
    id: string;
    label: string;
    detail: string;
    architecturalImpact: string;
  }>;
  selectedOptionId?: string;
}

interface ContextualQuerySidebarProps {
  questions: ContextualQuestion[];
  onAnswerQuestion: (questionId: string, optionId: string) => void;
  onApplyRefinements: () => void;
  onResetQuestions: () => void;
  isGenerating: boolean;
  refinementProgress: number; // 0 to 100
  isDark?: boolean;
}

export const ContextualQuerySidebar: React.FC<ContextualQuerySidebarProps> = ({
  questions,
  onAnswerQuestion,
  onApplyRefinements,
  onResetQuestions,
  isGenerating,
  refinementProgress,
}) => {
  const answeredCount = questions.filter((q) => q.selectedOptionId).length;

  return (
    <aside className="w-80 sm:w-96 h-full flex flex-col border-r border-slate-200 dark:border-neutral-800 bg-white/95 dark:bg-[#0B0C10]/95 backdrop-blur-md select-none shrink-0 overflow-hidden font-sans">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200 dark:border-neutral-800 flex flex-col gap-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Architect Refinement
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                Interactive Context Questions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onResetQuestions}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            title="Reset options to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Refinement Progress Meter */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-neutral-400">
            <span>Progressive Precision</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {refinementProgress}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-500 rounded-full"
              style={{ width: `${refinementProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-neutral-500 pt-0.5">
            <span>{answeredCount} of {questions.length} answered</span>
            <span>{answeredCount === questions.length ? 'Fully Tailored' : 'Skeleton Mode'}</span>
          </div>
        </div>
      </div>

      {/* Dynamic Questions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {questions.map((q, idx) => {
          const isAnswered = Boolean(q.selectedOptionId);

          return (
            <div
              key={q.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isAnswered
                  ? 'border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/20'
                  : 'border-slate-200 dark:border-neutral-800/80 bg-slate-50/50 dark:bg-neutral-900/40'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start gap-2.5 mb-2.5">
                <span className="p-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700/80 text-slate-700 dark:text-neutral-300 shrink-0">
                  {q.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                      Step 0{idx + 1}
                    </span>
                    {isAnswered && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {q.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                    {q.description}
                  </p>
                </div>
              </div>

              {/* Options Cards */}
              <div className="space-y-1.5 mt-2">
                {q.options.map((opt) => {
                  const isSelected = q.selectedOptionId === opt.id;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onAnswerQuestion(q.id, opt.id)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-white dark:bg-neutral-800/90 shadow-xs'
                          : 'border-slate-200/80 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 bg-white/70 dark:bg-neutral-900/60'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full border mt-0.5 shrink-0 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 dark:border-indigo-400 dark:bg-indigo-400'
                            : 'border-slate-300 dark:border-neutral-600'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-neutral-950" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-semibold ${
                              isSelected
                                ? 'text-indigo-600 dark:text-indigo-300 font-bold'
                                : 'text-slate-800 dark:text-neutral-200'
                            }`}
                          >
                            {opt.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                          {opt.detail}
                        </p>
                        {isSelected && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-500 dark:text-indigo-400 font-medium">
                            <span>Impact:</span>
                            <span className="truncate">{opt.architecturalImpact}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer Action */}
      <div className="p-4 border-t border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-[#0E0F14] shrink-0">
        <button
          type="button"
          onClick={onApplyRefinements}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          {isGenerating ? (
            <span>Refining Architecture...</span>
          ) : (
            <>
              <span>Apply &amp; Hydrate Diagram</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default ContextualQuerySidebar;
