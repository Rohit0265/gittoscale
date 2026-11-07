import React, { useState } from 'react';
import {
  Zap,
  Sliders,
  ChevronDown,
  ChevronUp,
  Cpu,
  ArrowRight,
  Shield,
  Clock,
  DollarSign,
  Cloud,
  Lock,
  Key,
} from 'lucide-react';
import { RecommenderInput } from '../../types';

interface RequirementsFormProps {
  onSubmit: (input: RecommenderInput) => void;
  isLoading: boolean;
  isDark?: boolean;
}

const EXAMPLE_PROJECTS = [
  {
    title: 'E-Commerce with Flash Sales',
    description:
      'High-throughput e-commerce platform with flash sales, inventory locking, shopping carts, and Stripe payments. Must handle traffic spikes without double-selling inventory.',
    scale: '100k - 1M DAU',
    patternHint: 'Event-Driven / Cache-heavy',
  },
  {
    title: 'Real-Time Chat & Collaboration',
    description:
      'Team messaging platform like Slack with WebSockets, presence indicators, rich channels, message history, and push notifications.',
    scale: '100k DAU',
    patternHint: 'Real-time WebSocket / Redis PubSub',
  },
  {
    title: 'Multi-Tenant B2B SaaS Platform',
    description:
      'Cloud analytics and billing platform for enterprise clients. Requires multi-tenant data isolation, role-based access control (RBAC), and scheduled report generation.',
    scale: 'Startup / MVP (<10k DAU)',
    patternHint: 'Modular Monolith / PostgreSQL',
  },
  {
    title: 'High-Volume IoT Telemetry Stream',
    description:
      'Ingestion pipeline collecting sensor metrics from 20,000 edge devices at 5-second intervals. Needs fast time-series aggregation, alerts, and live dashboard visualizer.',
    scale: 'Hyper-scale (10M+ events/day)',
    patternHint: 'Kafka / Time-series DB',
  },
];

const PREFERRED_TECH_OPTIONS = [
  'Node.js / TypeScript',
  'Go',
  'Python / FastAPI',
  'PostgreSQL',
  'MongoDB',
  'Redis',
  'Apache Kafka / RabbitMQ',
  'React / Next.js',
  'Docker / Kubernetes',
  'AWS Lambda / Serverless',
];

export const RequirementsForm: React.FC<RequirementsFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const [description, setDescription] = useState('');
  const [expectedScale, setExpectedScale] = useState('Growth (100k - 1M DAU)');
  const [budgetConstraint, setBudgetConstraint] = useState('Moderate');
  const [deploymentPreference, setDeploymentPreference] = useState('Cloud Containers (ECS / Cloud Run)');
  const [reliabilityRequirement, setReliabilityRequirement] = useState('High Availability (99.9%)');
  const [securityRequirement, setSecurityRequirement] = useState('Standard HTTPS & OAuth2 / JWT');
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // AI Provider & Mercury-3 configuration
  const [aiProvider, setAiProvider] = useState<'auto' | 'mercury'>(() => {
    try {
      const saved = localStorage.getItem('gitoscale_preferred_ai_provider');
      return saved === 'mercury' ? 'mercury' : 'auto';
    } catch {
      return 'auto';
    }
  });
  const [mercuryApiKey, setMercuryApiKey] = useState(() => {
    try {
      return localStorage.getItem('gitoscale_mercury_api_key') || '';
    } catch {
      return '';
    }
  });
  const [mercuryBaseUrl, setMercuryBaseUrl] = useState(() => {
    try {
      return localStorage.getItem('gitoscale_mercury_base_url') || 'https://api.inceptionlabs.ai/v1';
    } catch {
      return 'https://api.inceptionlabs.ai/v1';
    }
  });
  const [mercuryModel, setMercuryModel] = useState(() => {
    try {
      return localStorage.getItem('gitoscale_mercury_model') || 'mercury-3';
    } catch {
      return 'mercury-3';
    }
  });

  const toggleTech = (tech: string) => {
    setSelectedTech((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  const handleSelectExample = (example: (typeof EXAMPLE_PROJECTS)[0]) => {
    setDescription(example.description);
    setExpectedScale(example.scale);
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      setValidationError('Please provide a project description with at least 10 characters.');
      return;
    }
    setValidationError(null);

    const inputPayload: RecommenderInput = {
      projectDescription: description.trim(),
      expectedScale: showAdvanced ? expectedScale : undefined,
      budgetConstraint: showAdvanced ? budgetConstraint : undefined,
      preferredTech: showAdvanced && selectedTech.length > 0 ? selectedTech : undefined,
      deploymentPreference: showAdvanced ? deploymentPreference : undefined,
      reliabilityRequirement: showAdvanced ? reliabilityRequirement : undefined,
      securityRequirement: showAdvanced ? securityRequirement : undefined,
    };

    if (aiProvider === 'mercury') {
      try {
        localStorage.setItem('gitoscale_preferred_ai_provider', 'mercury');
        if (mercuryApiKey) localStorage.setItem('gitoscale_mercury_api_key', mercuryApiKey);
        if (mercuryBaseUrl) localStorage.setItem('gitoscale_mercury_base_url', mercuryBaseUrl);
        if (mercuryModel) localStorage.setItem('gitoscale_mercury_model', mercuryModel);
        localStorage.setItem(
          'gitoscale_mercury_config',
          JSON.stringify({
            enabled: true,
            apiKey: mercuryApiKey || undefined,
            baseUrl: mercuryBaseUrl || 'https://api.inceptionlabs.ai/v1',
            model: mercuryModel || 'mercury-3',
          })
        );
      } catch {}

      inputPayload.llmConfig = {
        provider: 'mercury',
        apiKey: mercuryApiKey.trim() || undefined,
        baseUrl: mercuryBaseUrl.trim() || undefined,
        model: mercuryModel.trim() || 'mercury-3',
      };
    } else {
      try {
        localStorage.setItem('gitoscale_preferred_ai_provider', 'auto');
        localStorage.removeItem('gitoscale_mercury_config');
      } catch {}
    }

    onSubmit(inputPayload);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Title & Headline */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Describe your system. Get a production architecture.
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Explain what software application you want to build in plain English. The AI evaluates your
          functional needs, scale, and trade-offs to generate an interactive system topology and technology stack.
        </p>
      </div>

      {/* Example Prompt Chips */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-2.5">
          Or start with a pre-configured architecture brief:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {EXAMPLE_PROJECTS.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectExample(ex)}
              className="text-left p-3 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0E0E10] hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-neutral-900/60 transition-all shadow-2xs group cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                <span>{ex.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400">
                  {ex.patternHint}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                {ex.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Input Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0C] p-4 sm:p-6 shadow-xl"
      >
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-800 dark:text-neutral-200 mb-1.5">
            Project Description & Requirements <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <textarea
              rows={5}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="e.g. I need to build a ride-sharing mobile application connecting passengers and drivers. Key features: live GPS tracking via WebSockets, ride request matching algorithm, payment checkout with receipts, and driver rating system. We expect 50k active daily rides..."
              className="w-full rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-[#121214] p-3.5 text-sm text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all resize-y"
              disabled={isLoading}
            />
            <div className="absolute right-3 bottom-3 text-[11px] text-slate-400 dark:text-neutral-500">
              {description.length} / 5000 chars
            </div>
          </div>
          {validationError && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
              {validationError}
            </p>
          )}
        </div>

        {/* Collapsible Advanced Constraints */}
        <div className="border-t border-slate-200 dark:border-neutral-800/80 pt-4 mb-5">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-xs font-semibold text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer py-1"
          >
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-700 dark:text-neutral-300 hover:text-indigo-500 transition-colors" />
              <span>Tailor Constraints (Scale, Budget, Preferred Tech)</span>
            </span>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showAdvanced && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Expected Scale */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400 hover:text-amber-500 transition-colors" />
                  Expected Scale
                </label>
                <select
                  value={expectedScale}
                  onChange={(e) => setExpectedScale(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#121214] p-2 text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="Startup / MVP (<10k DAU)">Startup / MVP (&lt;10k DAU)</option>
                  <option value="Growth (100k - 1M DAU)">Growth (100k - 1M DAU)</option>
                  <option value="Hyper-scale (10M+ DAU)">Hyper-scale (10M+ DAU)</option>
                </select>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-500 transition-colors" />
                  Budget Constraint
                </label>
                <select
                  value={budgetConstraint}
                  onChange={(e) => setBudgetConstraint(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#121214] p-2 text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="Low / Bootstrap (Minimal idle cost)">Low / Bootstrap (Minimal idle cost)</option>
                  <option value="Moderate (Balanced cost & elasticity)">Moderate (Balanced cost & elasticity)</option>
                  <option value="Enterprise (High availability first)">Enterprise (High availability first)</option>
                </select>
              </div>

              {/* Deployment Preference */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1 flex items-center gap-1">
                  <Cloud className="w-3.5 h-3.5 text-slate-400 hover:text-sky-500 transition-colors" />
                  Deployment Preference
                </label>
                <select
                  value={deploymentPreference}
                  onChange={(e) => setDeploymentPreference(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#121214] p-2 text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="Cloud Containers (ECS / Cloud Run)">Cloud Containers (ECS / Cloud Run)</option>
                  <option value="Serverless Functions (AWS Lambda / Workers)">Serverless Functions (Lambda / Workers)</option>
                  <option value="Kubernetes (EKS / GKE)">Kubernetes (EKS / GKE)</option>
                  <option value="Single VPS (Hetzner / DigitalOcean)">Single VPS (Hetzner / DigitalOcean)</option>
                </select>
              </div>

              {/* Reliability Requirement */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-slate-400 hover:text-purple-500 transition-colors" />
                  Availability Target
                </label>
                <select
                  value={reliabilityRequirement}
                  onChange={(e) => setReliabilityRequirement(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#121214] p-2 text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="Standard Availability (99.9%)">Standard Availability (99.9%)</option>
                  <option value="High Availability Multi-AZ (99.99%)">High Availability Multi-AZ (99.99%)</option>
                  <option value="Mission Critical Multi-Region">Mission Critical Multi-Region</option>
                </select>
              </div>

              {/* Security & Compliance Requirement */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400 hover:text-rose-500 transition-colors" />
                  Security & Compliance
                </label>
                <select
                  value={securityRequirement}
                  onChange={(e) => setSecurityRequirement(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#121214] p-2 text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="Standard HTTPS & OAuth2 / JWT">Standard HTTPS & OAuth2 / JWT</option>
                  <option value="SOC2 / GDPR Sensitive Data Protection">SOC2 / GDPR Sensitive Data Protection</option>
                  <option value="HIPAA / PCI-DSS Strict Isolation">HIPAA / PCI-DSS Strict Isolation</option>
                  <option value="Zero-Trust mTLS & Encrypted Vault">Zero-Trust mTLS & Encrypted Vault</option>
                </select>
              </div>

              {/* Preferred Tech Tags */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-neutral-400 mb-1.5 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500 transition-colors" />
                  Preferred Stack & Technologies (Optional)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PREFERRED_TECH_OPTIONS.map((tech) => {
                    const isSelected = selectedTech.includes(tech);
                    return (
                      <button
                        key={tech}
                        type="button"
                        onClick={() => toggleTech(tech)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                            : 'border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-[#141416] text-slate-700 dark:text-neutral-300 hover:border-slate-300 dark:hover:border-neutral-700'
                        }`}
                      >
                        {tech}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Synthesis Engine Selector */}
        <div className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-[#141417]/80 p-3.5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200">
                AI Synthesis Engine
              </span>
            </div>
            <div className="flex items-center bg-slate-200/80 dark:bg-neutral-800 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setAiProvider('auto')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  aiProvider === 'auto'
                    ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Auto (Gemini / Groq)
              </button>
              <button
                type="button"
                onClick={() => setAiProvider('mercury')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  aiProvider === 'mercury'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-amber-500'
                }`}
              >
                <Zap className="w-3 h-3 fill-current" />
                Mercury-3 (Diffusion LLM)
              </button>
            </div>
          </div>

          {aiProvider === 'mercury' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs border-t border-slate-200/70 dark:border-neutral-800/80">
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-medium text-slate-500 dark:text-neutral-400 mb-1 flex items-center gap-1">
                  <Key className="w-3 h-3 text-amber-500" /> Mercury API Key
                </label>
                <input
                  type="password"
                  value={mercuryApiKey}
                  onChange={(e) => setMercuryApiKey(e.target.value)}
                  placeholder="il_live_... (or backend env)"
                  className="w-full rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#101012] px-2.5 py-1.5 text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-medium text-slate-500 dark:text-neutral-400 mb-1 flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-slate-400" /> Base URL
                </label>
                <input
                  type="text"
                  value={mercuryBaseUrl}
                  onChange={(e) => setMercuryBaseUrl(e.target.value)}
                  placeholder="https://api.inceptionlabs.ai/v1"
                  className="w-full rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#101012] px-2.5 py-1.5 text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-mono text-[11px]"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-medium text-slate-500 dark:text-neutral-400 mb-1 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-slate-400" /> Model
                </label>
                <input
                  type="text"
                  value={mercuryModel}
                  onChange={(e) => setMercuryModel(e.target.value)}
                  placeholder="mercury-3"
                  className="w-full rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#101012] px-2.5 py-1.5 text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-mono text-[11px]"
                />
              </div>
              <div className="sm:col-span-3 text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-1.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 p-2 rounded-lg border border-amber-500/20">
                <Zap className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span>
                  <strong>Mercury-3:</strong> Inception Labs diffusion LLM running at 1,000+ tokens/sec with sub-second schema-enforced topology synthesis.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500 dark:text-neutral-400">
            Generates topology, trade-offs, and simulation parameters.
          </span>
          <button
            type="submit"
            disabled={isLoading || description.trim().length < 5}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white shadow-md transition-all cursor-pointer ${
              isLoading || description.trim().length < 5
                ? 'bg-indigo-400 dark:bg-indigo-800/60 cursor-not-allowed opacity-75'
                : 'bg-indigo-600 hover:bg-indigo-500 active:scale-98 shadow-indigo-600/20'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Architecting System...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>Generate Architecture</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
