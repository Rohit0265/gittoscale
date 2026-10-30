import React, { useState } from 'react';
import { api } from '../../services/api';
import {
  ArchitectureRecommendation,
  RecommenderInput,
  ArchitectureNode,
  ArchitectureEdge,
} from '../../types';
import { RequirementsForm } from './RequirementsForm';
import { RecommendationResults } from './RecommendationResults';
import { AlertCircle, RefreshCw, Sun, Moon, ArrowLeft, Sparkles } from 'lucide-react';

interface ArchitectureRecommenderPageProps {
  onSimulate: (nodes: ArchitectureNode[], edges: ArchitectureEdge[]) => void;
  onGoHome: () => void;
  onGoToSimulator: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const ArchitectureRecommenderPage: React.FC<ArchitectureRecommenderPageProps> = ({
  onSimulate,
  onGoHome,
  onGoToSimulator,
  isDark = false,
  onToggleTheme,
}) => {
  const [recommendation, setRecommendation] = useState<ArchitectureRecommendation | null>(null);
  const [lastInput, setLastInput] = useState<RecommenderInput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (input: RecommenderInput) => {
    setIsLoading(true);
    setError(null);
    setLastInput(input);
    try {
      const res = await api.recommendArchitecture(input);
      setRecommendation(res);
    } catch (err: any) {
      console.error('Architecture recommendation error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to generate architecture recommendation. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async (refinementText: string) => {
    if (!lastInput || !recommendation) return;
    setIsRefining(true);
    setError(null);
    try {
      const payload: RecommenderInput = {
        ...lastInput,
        refinementRequest: refinementText,
      };
      const res = await api.recommendArchitecture(payload);
      setRecommendation(res);
    } catch (err: any) {
      console.error('Architecture refinement error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to refine architecture. Please try again.'
      );
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#090B10] font-sans">
      {/* Top Navbar */}
      <header className="h-14 border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onGoHome}
            className="group flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium"
            title="Return to Landing Page"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 group-hover:text-indigo-500 transition-all" />
            <img
              src={isDark ? '/logo.png' : '/logo-light.png'}
              alt="GitToScale"
              className="h-7 w-auto object-contain"
            />
          </button>
          <div className="h-4 w-px bg-slate-200 dark:border-neutral-800 hidden sm:block" />
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-neutral-200">
            <Sparkles className="w-3.5 h-3.5 text-slate-700 dark:text-neutral-300 hover:text-amber-500 transition-colors" />
            <span className="hidden xs:inline">AI Architecture Recommender</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onGoToSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] text-xs font-medium text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <span>Live Simulator</span>
          </button>

          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition-all shadow-xs cursor-pointer flex items-center justify-center"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-slate-700 dark:text-neutral-300 hover:text-amber-400 transition-colors" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 dark:text-neutral-300 hover:text-blue-400 transition-colors" />
              )}
            </button>
          )}
        </div>
      </header>

      {/* Error Notification Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/50 px-4 py-2 flex items-center justify-between text-xs text-red-700 dark:text-red-300 z-30">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-700 dark:text-neutral-300 hover:text-rose-500 transition-colors shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => lastInput && handleGenerate(lastInput)}
            className="flex items-center gap-1 font-semibold text-red-800 dark:text-red-300 hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 overflow-hidden relative">
        {recommendation ? (
          <RecommendationResults
            recommendation={recommendation}
            onSimulate={onSimulate}
            onEditPrompt={() => setRecommendation(null)}
            onRefine={handleRefine}
            isRefining={isRefining}
            isDark={isDark}
          />
        ) : (
          <div className="h-full overflow-y-auto">
            <RequirementsForm
              onSubmit={handleGenerate}
              isLoading={isLoading}
              isDark={isDark}
            />
          </div>
        )}
      </main>
    </div>
  );
};
