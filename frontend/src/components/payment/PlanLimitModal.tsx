import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, X, ShieldCheck, Zap } from 'lucide-react';

export interface PlanLimitEventDetail {
  error?: string;
  message?: string;
  upgradeUrl?: string;
  plan?: string;
  used?: number;
  limit?: number;
}

interface PlanLimitModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onUpgrade?: () => void;
  message?: string;
  isDark?: boolean;
}

export const PlanLimitModal: React.FC<PlanLimitModalProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onUpgrade,
  message: initialMessage,
  isDark = true,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [limitData, setLimitData] = useState<PlanLimitEventDetail | null>(null);

  useEffect(() => {
    const handlePlanLimit = (e: Event) => {
      const customEvent = e as CustomEvent<PlanLimitEventDetail>;
      setLimitData(customEvent.detail || {});
      setInternalIsOpen(true);
    };

    window.addEventListener('gitoscale:plan_limit', handlePlanLimit);
    return () => {
      window.removeEventListener('gitoscale:plan_limit', handlePlanLimit);
    };
  }, []);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleGoToPayment = () => {
    handleClose();
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.history.pushState({}, '', '/payment');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  if (!isOpen) return null;

  const displayMessage =
    limitData?.message ||
    initialMessage ||
    'You have reached your free plan limit. Upgrade your plan to continue using AI-powered architecture generation.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-lg p-6 rounded-2xl border shadow-2xl transition-all ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-limit-title"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${
            isDark
              ? 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
              Free Plan Limit
            </span>
            <h3 id="plan-limit-title" className="text-xl font-bold tracking-tight mt-1">
              Upgrade to GitToScale Pro
            </h3>
          </div>
        </div>

        {/* Message */}
        <div
          className={`p-4 rounded-xl border mb-5 text-sm leading-relaxed ${
            isDark
              ? 'bg-neutral-800/60 border-neutral-700/60 text-neutral-200'
              : 'bg-neutral-50 border-neutral-200 text-neutral-700'
          }`}
        >
          <p className={`font-semibold text-base mb-1 ${isDark ? 'text-white' : 'text-neutral-900'}`}>{displayMessage}</p>
          <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
            Free accounts include 3 AI architecture generations and 3 live collaborative meetings.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-2 mb-6 text-sm">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className={isDark ? 'text-neutral-300' : 'text-neutral-700'}>
              <strong>Unlimited AI generation &amp; AI Architect chat</strong>
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className={isDark ? 'text-neutral-300' : 'text-neutral-700'}>
              <strong>Unlimited live collaborative meetings</strong>
            </span>
          </div>
          <div className={`flex items-center gap-2.5 text-xs pl-6 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
            <span>✨ Note: Manual architecture diagram editing is always 100% unlimited.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleGoToPayment}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-600/20 transition-all cursor-pointer"
          >
            <span>Upgrade Plan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleClose}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
              isDark
                ? 'border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                : 'border-neutral-300 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Continue Editing Manually
          </button>
        </div>
      </div>
    </div>
  );
};
