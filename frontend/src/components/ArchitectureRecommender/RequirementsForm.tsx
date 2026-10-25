import React, { useState } from 'react';
import {
  Sparkles,
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
    onSubmit({
      projectDescription: description.trim(),
      expectedScale: showAdvanced ? expectedScale : undefined,
      budgetConstraint: showAdvanced ? budgetConstraint : undefined,
      preferredTech: showAdvanced && selectedTech.length > 0 ? selectedTech : undefined,
      deploymentPreference: showAdvanced ? deploymentPreference : undefined,
      reliabilityRequirement: showAdvanced ? reliabilityRequirement : undefined,
      securityRequirement: showAdvanced ? securityRequirement : undefined,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Title & Headline */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Architecture Architect</span>
        </div>
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
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
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
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
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
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
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
                  <Cloud className="w-3.5 h-3.5 text-slate-400" />
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
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
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
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
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
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
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
