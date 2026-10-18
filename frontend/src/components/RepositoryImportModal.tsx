import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  X,
  Github,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  Key,
  Lock,
  GitBranch,
  Check,
  Eye,
  EyeOff,
  Server,
  Globe,
  RotateCcw,
} from 'lucide-react';
import { api } from '../services/api';
import { ArchitectureNode, ArchitectureEdge } from '../types';

interface RepositoryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportArchitecture: (
    nodes: ArchitectureNode[],
    edges: ArchitectureEdge[],
    repoName: string,
    basicGraph?: { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] },
    detailedGraph?: { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] },
    repoUrl?: string
  ) => void;
}

type ProviderId = 'gemini' | 'openai' | 'anthropic' | 'other';

interface ProviderOption {
  id: ProviderId;
  name: string;
  defaultModel: string;
}

const PROVIDER_OPTIONS: ProviderOption[] = [
  { id: 'gemini', name: 'Google Gemini', defaultModel: 'gemini-3.1-flash-lite' },
  { id: 'openai', name: 'OpenAI', defaultModel: 'gpt-4o-mini' },
  { id: 'anthropic', name: 'Anthropic', defaultModel: 'claude-3-5-sonnet-20241022' },
  { id: 'other', name: 'Other LLM', defaultModel: '' },
];

export const RepositoryImportModal: React.FC<RepositoryImportModalProps> = ({
  isOpen,
  onClose,
  onImportArchitecture,
}) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // LLM Configuration state
  const [showLLMSettings, setShowLLMSettings] = useState(true);
  const [llmProvider, setLlmProvider] = useState<ProviderId>('gemini');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [llmModel, setLlmModel] = useState('gemini-3.1-flash-lite');
  const [llmBaseUrl, setLlmBaseUrl] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Validation states
  const [baseUrlError, setBaseUrlError] = useState<string | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);

  // Tooltip & Dropdown states
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [focusedOptionIndex, setFocusedOptionIndex] = useState(-1);

  // Dropdown Portal positioning refs
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const infoButtonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [menuCoords, setMenuCoords] = useState<{
    top: number;
    left: number;
    width: number;
    openUpwards: boolean;
  } | null>(null);

  const [envKeyConfigured, setEnvKeyConfigured] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    testing: boolean;
    message?: string;
    success?: boolean;
  }>({ testing: false });

  // Calculate dynamic dropdown placement
  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 180;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpwards = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    const left = Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8));
    const width = Math.min(rect.width, window.innerWidth - 16);

    setMenuCoords({
      left,
      width,
      top: openUpwards ? Math.max(10, rect.top - dropdownHeight - 6) : rect.bottom + 6,
      openUpwards,
    });
  }, []);

  useEffect(() => {
    if (isDropdownOpen) {
      updateMenuPosition();
      const handleScrollOrResize = () => updateMenuPosition();
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);
      return () => {
        window.removeEventListener('resize', handleScrollOrResize);
        window.removeEventListener('scroll', handleScrollOrResize, true);
      };
    }
  }, [isDropdownOpen, updateMenuPosition]);

  // Click outside listener for dropdown and tooltip
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        isDropdownOpen &&
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsDropdownOpen(false);
      }

      if (
        showInfoTooltip &&
        infoButtonRef.current &&
        !infoButtonRef.current.contains(target) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(target)
      ) {
        setShowInfoTooltip(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isDropdownOpen, showInfoTooltip]);

  // Fetch initial LLM status
  useEffect(() => {
    if (isOpen) {
      api
        .getLLMStatus()
        .then((status) => {
          if (status.hasKey) {
            setEnvKeyConfigured(true);
            if (
              status.provider &&
              status.provider !== 'none' &&
              ['gemini', 'openai', 'anthropic', 'other'].includes(status.provider)
            ) {
              setLlmProvider(status.provider as ProviderId);
            }
            if (status.model) {
              setLlmModel(status.model);
            }
          }
        })
        .catch(() => {
          // Fallback silently if status endpoint fails
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectProvider = (newProvider: ProviderId) => {
    setLlmProvider(newProvider);
    setIsDropdownOpen(false);
    setBaseUrlError(null);
    setModelError(null);
    setTestStatus({ testing: false });

    if (newProvider === 'gemini') {
      setLlmModel('gemini-3.1-flash-lite');
    } else if (newProvider === 'openai') {
      setLlmModel('gpt-4o-mini');
    } else if (newProvider === 'anthropic') {
      setLlmModel('claude-3-5-sonnet-20241022');
    } else if (newProvider === 'other') {
      if (
        !llmModel ||
        llmModel.startsWith('gemini') ||
        llmModel.startsWith('gpt') ||
        llmModel.startsWith('claude')
      ) {
        setLlmModel('meta-llama/Llama-3-70b-chat-hf');
      }
      if (!llmBaseUrl) {
        setLlmBaseUrl('https://api.together.xyz/v1');
      }
    }
    triggerRef.current?.focus();
  };

  const handleResetToDefault = () => {
    setLlmProvider('gemini');
    setLlmModel('gemini-3.1-flash-lite');
    setLlmApiKey('');
    setLlmBaseUrl('');
    setBaseUrlError(null);
    setModelError(null);
    setTestStatus({ testing: false });
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsDropdownOpen(true);
      const currentIndex = PROVIDER_OPTIONS.findIndex((p) => p.id === llmProvider);
      setFocusedOptionIndex(currentIndex >= 0 ? currentIndex : 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsDropdownOpen(true);
      const currentIndex = PROVIDER_OPTIONS.findIndex((p) => p.id === llmProvider);
      setFocusedOptionIndex(currentIndex >= 0 ? currentIndex : PROVIDER_OPTIONS.length - 1);
    }
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedOptionIndex((prev) => (prev + 1) % PROVIDER_OPTIONS.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedOptionIndex((prev) => (prev - 1 + PROVIDER_OPTIONS.length) % PROVIDER_OPTIONS.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (focusedOptionIndex >= 0 && focusedOptionIndex < PROVIDER_OPTIONS.length) {
        handleSelectProvider(PROVIDER_OPTIONS[focusedOptionIndex].id);
      }
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setIsDropdownOpen(false);
      triggerRef.current?.focus();
    }
  };

  const handleTestLLM = async () => {
    // Validate custom provider requirements before testing
    if (llmProvider === 'other') {
      const trimmedUrl = llmBaseUrl.trim();
      if (!trimmedUrl) {
        setBaseUrlError('Base URL is required to test custom LLM.');
        return;
      }
      if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        setBaseUrlError('Please enter a valid HTTP or HTTPS base URL.');
        return;
      }
    }

    setTestStatus({ testing: true });
    try {
      const res = await api.testLLM({
        provider: llmProvider,
        apiKey: llmApiKey.trim() || undefined,
        baseUrl: llmProvider === 'other' ? llmBaseUrl.trim() : undefined,
        model: llmModel.trim() || undefined,
      });
      setTestStatus({
        testing: false,
        message: res.message || 'LLM connection verified successfully!',
        success: res.success,
      });
    } catch (err: any) {
      setTestStatus({
        testing: false,
        message:
          err.response?.data?.message || err.message || 'Failed to connect to LLM provider',
        success: false,
      });
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = repoUrl.trim();
    if (!trimmed) {
      setError('Please enter a GitHub repository URL or workspace path.');
      return;
    }

    // Validate fields if custom provider is chosen and populated
    if (llmProvider === 'other' && (llmBaseUrl.trim() || llmApiKey.trim())) {
      const trimmedUrl = llmBaseUrl.trim();
      if (trimmedUrl && !trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        setBaseUrlError('Please enter a valid HTTP or HTTPS base URL (e.g. http://localhost:11434/v1).');
        return;
      }
      if (trimmedUrl && !llmModel.trim()) {
        setModelError('Model name is required for custom LLM.');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const payload: any = {};
      if (
        trimmed.startsWith('/') ||
        trimmed.startsWith('./') ||
        (!trimmed.includes('github.com') && !trimmed.includes('http'))
      ) {
        payload.localPath = trimmed;
      } else {
        payload.repoUrl = trimmed;
      }

      // AI Configuration is completely optional.
      // Only attach llmConfig if user actually configured an API key or custom endpoint!
      const hasCustomConfig =
        Boolean(llmApiKey.trim()) ||
        (llmProvider === 'other' && Boolean(llmBaseUrl.trim()));

      if (hasCustomConfig) {
        payload.llmConfig = {
          provider: llmProvider,
          apiKey: llmApiKey.trim() || undefined,
          model: llmModel.trim() || undefined,
          baseUrl: llmProvider === 'other' ? llmBaseUrl.trim() : undefined,
        };
      }

      const res = await api.analyzeRepository(payload);

      const repoName =
        res.repoName ||
        trimmed.split('/').pop()?.replace('.git', '') ||
        'Repository';

      onImportArchitecture(res.nodes, res.edges, repoName, res.basicGraph, res.detailedGraph, trimmed);
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Failed to scan repository.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Provider logo rendering
  const renderProviderLogo = (providerId: string, className = 'w-4 h-4 shrink-0') => {
    switch (providerId) {
      case 'gemini':
        return (
          <svg className={className} viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        );
      case 'openai':
        return (
          <svg className={`${className} text-[#10A37F]`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.259 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7466-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1683a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4947zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1683a.0757.0757 0 0 1-.071 0l-4.8303-2.7866A4.504 4.504 0 0 1 2.3408 7.8956zm16.0993 3.8558L12.5973 8.3829l2.02-1.1636a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.402-.6862zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.6627zM8.3065 12.863l-2.02-1.1635a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813v6.7227zm1.1449-2.0742l3.4443-1.9871 3.4442 1.9871v3.9742l-3.4442 1.9871-3.4443-1.9871z" />
          </svg>
        );
      case 'anthropic':
        return (
          <svg className={`${className} text-[#D97757]`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 4.095a.732.732 0 0 0-.693-.495H13.67a.732.732 0 0 0-.693.495L7.26 19.905a.732.732 0 0 0 .693.972h3.109a.732.732 0 0 0 .693-.495l1.096-3.147h3.987l1.096 3.147a.732.732 0 0 0 .693.495h3.109a.732.732 0 0 0 .693-.972L17.472 4.095zm-3.567 10.428l1.396-4.008 1.396 4.008h-2.792z" />
          </svg>
        );
      case 'other':
        return <Server className={`${className} text-indigo-500 dark:text-indigo-400`} />;
      default:
        return <Cpu className={`${className} text-slate-400`} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2.5 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0E0F15] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#20222C] w-full max-w-[560px] max-h-[92vh] overflow-y-auto text-xs text-slate-800 dark:text-neutral-100 p-4 sm:p-6 md:p-7 space-y-5 sm:space-y-6 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 dark:bg-[#524bf7] dark:border-transparent dark:text-white flex items-center justify-center shadow-xs dark:shadow-md dark:shadow-indigo-500/25 shrink-0 transition-colors">
              <GitBranch className="w-5 h-5 text-indigo-600 dark:text-white stroke-[2.2]" />
            </div>
            <div className="ml-3.5 flex flex-col justify-center">
              <h2 className="text-base sm:text-[17px] font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                Analyze Repository Architecture
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 font-normal">
                Inspect services and map runtime dependencies
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleScan} className="space-y-5">
          {/* GitHub Repository URL Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-neutral-200 mb-2 block">
              GitHub Repository URL
            </label>
            <div className="flex items-center h-12 px-3.5 rounded-xl border border-slate-200 dark:border-[#222430] bg-slate-50/70 dark:bg-[#121319] focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
              <Github className="w-5 h-5 text-slate-800 dark:text-white shrink-0 mr-3" />
              <div className="w-[1px] h-5 bg-slate-300 dark:bg-neutral-700/80 mr-3 shrink-0" />
              <input
                type="text"
                required
                placeholder="https://github.com/owner/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full bg-transparent text-xs font-mono text-slate-900 dark:text-neutral-200 placeholder:text-slate-400 dark:placeholder:text-neutral-500 outline-none"
              />
            </div>
          </div>

          {/* AI Configuration Section (Optional) */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#20222C] bg-slate-50/50 dark:bg-[#121319] p-4 space-y-4 transition-all">
            {/* Header row */}
            <div className="flex items-center justify-between select-none">
              <div className="flex items-center flex-wrap gap-y-1">
                <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 shrink-0">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white ml-2">
                  AI Configuration
                </span>
                <span className="text-[11px] font-normal text-slate-500 dark:text-neutral-400 ml-1">
                  (Optional)
                </span>

                {/* Info button & tooltip */}
                {/* <div className="relative inline-flex items-center ml-1.5">
                  <button
                    ref={infoButtonRef}
                    type="button"
                    tabIndex={0}
                    aria-label="AI Configuration information"
                    onMouseEnter={() => setShowInfoTooltip(true)}
                    onMouseLeave={() => setShowInfoTooltip(false)}
                    onFocus={() => setShowInfoTooltip(true)}
                    onBlur={() => setShowInfoTooltip(false)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowInfoTooltip((prev) => !prev);
                    }}
                    className="w-4 h-4 rounded-full border border-slate-300 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-neutral-500 flex items-center justify-center text-[10.5px] font-bold leading-none transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    ?
                  </button>

                  {showInfoTooltip && (
                    <div
                      ref={tooltipRef}
                      role="tooltip"
                      className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-2.5 rounded-xl bg-slate-900 text-slate-100 dark:bg-[#1E202B] dark:text-neutral-200 border border-slate-700 dark:border-[#323546] shadow-xl text-[11px] leading-relaxed z-50 pointer-events-auto"
                    >
                      Want to use your own LLM? Configure it here. Otherwise, leave this blank and the default model will be used.
                      <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-[1px] border-4 border-transparent border-t-slate-900 dark:border-t-[#1E202B]" />
                    </div>
                  )}
                </div> */}

                {/* Status indicator pill */}
                {/* <span
                  className={`ml-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                    isCustomConfigured
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-neutral-400 border-slate-200 dark:border-white/[0.08]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isCustomConfigured
                        ? 'bg-emerald-500 dark:bg-emerald-400'
                        : 'bg-slate-400 dark:bg-neutral-500'
                    }`}
                  />
                  {isCustomConfigured ? 'Custom LLM configured' : 'Using built-in default'}
                </span> */}
              </div>

              {/* Reset to default action and collapse chevron */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  title="Reset AI configuration to default"
                  className="text-[11px] font-medium text-slate-400 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Reset to default</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowLLMSettings(!showLLMSettings)}
                  aria-label={showLLMSettings ? 'Collapse AI settings' : 'Expand AI settings'}
                  className="p-1 text-slate-400 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {showLLMSettings ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Collapsible settings fields */}
            {showLLMSettings && (
              <div className="space-y-3.5 pt-1">
                {/* Provider and Model row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Provider Custom Dropdown */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-neutral-400 mb-1.5 block">
                      Provider
                    </label>
                    <button
                      ref={triggerRef}
                      type="button"
                      role="combobox"
                      aria-expanded={isDropdownOpen}
                      aria-haspopup="listbox"
                      aria-label="AI Provider"
                      onClick={() => {
                        setIsDropdownOpen((prev) => !prev);
                        const currentIndex = PROVIDER_OPTIONS.findIndex(
                          (p) => p.id === llmProvider
                        );
                        setFocusedOptionIndex(currentIndex >= 0 ? currentIndex : 0);
                      }}
                      onKeyDown={handleTriggerKeyDown}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-[#262833] bg-white dark:bg-[#181922] hover:bg-slate-50 dark:hover:bg-[#1c1d27] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between text-xs text-slate-800 dark:text-neutral-200 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {renderProviderLogo(llmProvider)}
                        <span className="font-medium truncate">
                          {PROVIDER_OPTIONS.find((p) => p.id === llmProvider)?.name ||
                            'Google Gemini'}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 dark:text-neutral-400 ml-2 shrink-0 transition-transform duration-200 ${
                          isDropdownOpen ? 'rotate-180 text-indigo-500 dark:text-indigo-400' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Model Input */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-neutral-400 mb-1.5 block">
                      Model
                    </label>
                    <input
                      type="text"
                      placeholder={
                        llmProvider === 'other'
                          ? 'e.g. meta-llama/Llama-3-70b'
                          : 'Model identifier'
                      }
                      value={llmModel}
                      onChange={(e) => {
                        setLlmModel(e.target.value);
                        if (modelError) setModelError(null);
                      }}
                      className="h-10 px-3 rounded-xl border border-slate-200 dark:border-[#262833] bg-white dark:bg-[#181922] font-mono text-xs text-slate-800 dark:text-neutral-200 outline-none focus:border-indigo-500 w-full placeholder:text-slate-400 dark:placeholder:text-neutral-600"
                    />
                    {modelError && (
                      <p className="text-[10.5px] text-red-500 mt-1 font-medium">{modelError}</p>
                    )}
                  </div>
                </div>

                {/* Extra Base URL field if Other LLM is chosen */}
                {llmProvider === 'other' && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-neutral-400 mb-1.5 block">
                      Base URL (OpenAI-compatible endpoint)
                    </label>
                    <div className="flex items-center h-10 px-3 rounded-xl border border-slate-200 dark:border-[#262833] bg-white dark:bg-[#181922] focus-within:border-indigo-500">
                      <Globe className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400 mr-2.5 shrink-0" />
                      <input
                        type="text"
                        placeholder="http://localhost:11434/v1 or https://api.together.xyz/v1"
                        value={llmBaseUrl}
                        onChange={(e) => {
                          setLlmBaseUrl(e.target.value);
                          if (baseUrlError) setBaseUrlError(null);
                        }}
                        className="w-full bg-transparent font-mono text-xs text-slate-800 dark:text-neutral-200 placeholder:text-slate-400 dark:placeholder:text-neutral-600 outline-none"
                      />
                    </div>
                    {baseUrlError && (
                      <p className="text-[10.5px] text-red-500 mt-1 font-medium">{baseUrlError}</p>
                    )}
                  </div>
                )}

                {/* API Key row */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-neutral-400 block">
                      API Key{' '}
                      {envKeyConfigured && !llmApiKey ? (
                        <span className="font-normal text-emerald-600 dark:text-emerald-400 text-[10px]">
                          (Server env key active)
                        </span>
                      ) : llmProvider === 'other' ? (
                        <span className="font-normal text-slate-400 dark:text-neutral-500 text-[10px]">
                          (Optional for local LLMs like Ollama)
                        </span>
                      ) : null}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center h-10 px-3 rounded-xl border border-slate-200 dark:border-[#262833] bg-white dark:bg-[#181922] focus-within:border-indigo-500">
                      <Key className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400 mr-2.5 shrink-0" />
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        placeholder={envKeyConfigured ? '•••••••• (using server key)' : '••••••••••••••••'}
                        value={llmApiKey}
                        onChange={(e) => setLlmApiKey(e.target.value)}
                        className="w-full bg-transparent font-mono text-xs text-slate-800 dark:text-neutral-200 placeholder:text-slate-400 dark:placeholder:text-neutral-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                        className="text-slate-400 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1"
                      >
                        {showApiKey ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestLLM}
                      disabled={testStatus.testing}
                      className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-[#262833] bg-white dark:bg-[#181922] hover:bg-slate-100 dark:hover:bg-[#20212d] text-xs font-semibold text-slate-700 dark:text-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {testStatus.testing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                      )}
                      <span>Test</span>
                    </button>
                  </div>

                  {testStatus.message && (
                    <div
                      className={`mt-2 p-2 rounded-xl text-[11px] flex items-center gap-2 ${
                        testStatus.success
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60'
                      }`}
                    >
                      {testStatus.success ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                      )}
                      <span>{testStatus.message}</span>
                    </div>
                  )}

                  {/* Security disclaimer */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-neutral-400 mt-2">
                    <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400 shrink-0" />
                    <span>Your API key is only used for this analysis and is never stored.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#262833] bg-white dark:bg-[#16171F] hover:bg-slate-100 dark:hover:bg-[#20212d] text-xs font-semibold text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#524bf7] hover:bg-[#4338ca] text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing repository...</span>
                </>
              ) : (
                <>
                  <span>Analyze repository</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Custom Dropdown Portal - Rendered directly to document.body to prevent any container clipping */}
      {isDropdownOpen &&
        menuCoords &&
        ReactDOM.createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-label="AI Provider Options"
            tabIndex={-1}
            onKeyDown={handleMenuKeyDown}
            style={{
              position: 'fixed',
              left: `${menuCoords.left}px`,
              top: `${menuCoords.top}px`,
              width: `${menuCoords.width}px`,
              zIndex: 9999,
            }}
            className="bg-white dark:bg-[#181922] border border-slate-200 dark:border-[#262833] rounded-xl shadow-2xl p-1.5 space-y-0.5 outline-none animate-in fade-in zoom-in-95 duration-100"
          >
            {PROVIDER_OPTIONS.map((option, index) => {
              const isSelected = llmProvider === option.id;
              const isFocused = focusedOptionIndex === index;
              return (
                <div
                  key={option.id}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                  onClick={() => handleSelectProvider(option.id)}
                  onMouseEnter={() => setFocusedOptionIndex(index)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      : isFocused
                      ? 'bg-slate-100 dark:bg-[#222430] text-slate-900 dark:text-white'
                      : 'text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#222430]'
                  }`}
                >
                  {renderProviderLogo(option.id)}
                  <span className="truncate">{option.name}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-auto" />
                  )}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
};

export default RepositoryImportModal;
