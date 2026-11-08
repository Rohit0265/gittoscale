import React, { useEffect } from 'react';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { Fotter } from '../Fotter';
import { FloatingFeedbackButton } from '../FloatingFeedbackButton';
import { useSmoothScroll } from '../../utils/useSmoothScroll';

export type LegalDocType = 'cookie' | 'privacy' | 'terms';

interface LegalPageProps {
  type: LegalDocType;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onGoHome?: () => void;
  onNavigate?: (route: string) => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({
  type,
  isDark = true,
  onToggleTheme,
  onGoHome,
  onNavigate,
}) => {
  useSmoothScroll({ lerp: 0.085, enabled: true });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const titleMap: Record<LegalDocType, string> = {
      cookie: 'Cookie Policy — GitToScale',
      privacy: 'Privacy Policy — GitToScale',
      terms: 'Terms of Service — GitToScale',
    };
    document.title = titleMap[type] || 'Legal Documents — GitToScale';
  }, [type]);

  const handleTabClick = (targetType: LegalDocType) => {
    const route = targetType === 'cookie' ? '/cookie' : targetType === 'privacy' ? '/privacy' : '/terms';
    if (onNavigate) {
      onNavigate(route);
    } else {
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-200 ${
        isDark ? 'bg-[#060709] text-slate-100' : 'bg-[#FAFAFA] text-slate-900'
      }`}
    >
      {/* Top Sticky Header */}
      <header
        className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${
          isDark
            ? 'border-neutral-800/80 bg-[#060709]/90'
            : 'border-slate-200/80 bg-white/90'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left: Brand Logo & Back to Home */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGoHome}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
                isDark
                  ? 'border-neutral-800 bg-[#0E1015] text-neutral-300 hover:text-white hover:border-neutral-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:border-slate-300 shadow-xs'
              }`}
              title="Return to home page"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <button
              type="button"
              onClick={handleGoHome}
              className="flex items-center gap-2 cursor-pointer focus:outline-none"
            >
              <img
                src={isDark ? '/logo.png' : '/logo-light.png'}
                alt="GitToScale"
                className="h-6 sm:h-7 w-auto object-contain"
              />
            </button>
          </div>

          {/* Center: Clean Segmented Control */}
          <nav
            aria-label="Legal Document Switcher"
            className={`hidden md:flex items-center p-0.5 rounded-lg border ${
              isDark
                ? 'bg-[#0E1015] border-neutral-800'
                : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={() => handleTabClick('cookie')}
              className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer ${
                type === 'cookie'
                  ? isDark
                    ? 'bg-neutral-800 text-white font-semibold shadow-xs'
                    : 'bg-white text-slate-900 font-semibold shadow-xs'
                  : isDark
                  ? 'text-neutral-400 hover:text-neutral-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cookie Policy
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('privacy')}
              className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer ${
                type === 'privacy'
                  ? isDark
                    ? 'bg-neutral-800 text-white font-semibold shadow-xs'
                    : 'bg-white text-slate-900 font-semibold shadow-xs'
                  : isDark
                  ? 'text-neutral-400 hover:text-neutral-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Privacy Policy
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('terms')}
              className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer ${
                type === 'terms'
                  ? isDark
                    ? 'bg-neutral-800 text-white font-semibold shadow-xs'
                    : 'bg-white text-slate-900 font-semibold shadow-xs'
                  : isDark
                  ? 'text-neutral-400 hover:text-neutral-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Terms of Service
            </button>
          </nav>

          {/* Right: Theme Toggle */}
          <div className="flex items-center gap-2">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                  isDark
                    ? 'border-neutral-800 bg-[#0E1015] text-neutral-300 hover:text-white hover:border-neutral-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:border-slate-300 shadow-xs'
                }`}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-neutral-300 hover:text-amber-300 transition-colors" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700 hover:text-indigo-600 transition-colors" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div
          className={`md:hidden flex items-center justify-around border-t px-2 py-1.5 ${
            isDark ? 'border-neutral-800/80 bg-[#060709]' : 'border-slate-200/80 bg-white'
          }`}
        >
          <button
            type="button"
            onClick={() => handleTabClick('cookie')}
            className={`px-2.5 py-1 rounded-md text-xs cursor-pointer transition-colors ${
              type === 'cookie'
                ? isDark
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'bg-slate-200 text-slate-900 font-semibold'
                : isDark
                ? 'text-neutral-400'
                : 'text-slate-600'
            }`}
          >
            Cookies
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('privacy')}
            className={`px-2.5 py-1 rounded-md text-xs cursor-pointer transition-colors ${
              type === 'privacy'
                ? isDark
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'bg-slate-200 text-slate-900 font-semibold'
                : isDark
                ? 'text-neutral-400'
                : 'text-slate-600'
            }`}
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('terms')}
            className={`px-2.5 py-1 rounded-md text-xs cursor-pointer transition-colors ${
              type === 'terms'
                ? isDark
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'bg-slate-200 text-slate-900 font-semibold'
            : isDark
            ? 'text-neutral-400'
            : 'text-slate-600'
            }`}
          >
            Terms
          </button>
        </div>
      </header>

      {/* Main Document Body — Measured at 68-72ch for optimal reading flow */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16">
        {type === 'cookie' && <CookiePolicyContent isDark={isDark} />}
        {type === 'privacy' && <PrivacyPolicyContent isDark={isDark} />}
        {type === 'terms' && <TermsOfServiceContent isDark={isDark} />}
      </main>

      {/* Global Footer */}
      <Fotter brandName="GitToScale" isDark={isDark} onNavigate={onNavigate} />

      {/* Sticky Floating Feedback Button */}
      <FloatingFeedbackButton />
    </div>
  );
};

/* =========================================================================
   1. Cookie Policy Content
   ========================================================================= */
const CookiePolicyContent: React.FC<{ isDark: boolean }> = ({ isDark: _isDark }) => {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      {/* Title & Metadata */}
      <header className="border-b pb-6 border-slate-200 dark:border-neutral-800">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          Cookie Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 font-mono">
          Effective: October 2026 &middot; Last Revised: October 29, 2026
        </p>
      </header>

      {/* Overview */}
      <div className="mt-8 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-neutral-300">
        <p>
          This Cookie Policy explains how <strong>GitToScale</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) uses cookies, local browser storage, and related web technologies when you use our system architecture modeling workbench and distributed load simulation engine at{' '}
          <a
            href="https://gittoscale.tech"
            className="text-slate-900 dark:text-white underline underline-offset-4 decoration-slate-400 dark:decoration-neutral-600 hover:decoration-slate-900 dark:hover:decoration-white font-medium"
          >
            https://gittoscale.tech
          </a>{' '}
          and its associated subdomains.
        </p>
      </div>

      {/* Section 1 */}
      <section className="mt-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
          1. What Are Cookies and Local Storage?
        </h2>
        <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-neutral-300 mb-3">
          Cookies are small text records transferred to your device to store state between HTTP sessions. In addition to HTTP cookies, GitToScale utilizes HTML5 Local Storage to preserve interactive node placements, unsaved architecture edits, and custom capacity parameters directly in your browser.
        </p>
        <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-neutral-300">
          This client-side persistence model guarantees that sudden power interruptions or network disconnects do not destroy your architecture topologies, while avoiding unnecessary bandwidth overhead on every simulated request.
        </p>
      </section>

      {/* Section 2: Storage Registry Table */}
      <section className="mt-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
          2. Cookies &amp; Local Storage Registry
        </h2>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0B0E]">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-neutral-800 bg-slate-50/80 dark:bg-neutral-900/60 font-semibold text-slate-700 dark:text-neutral-200">
                <th className="py-3 px-4">Identifier / Key</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4">Lifespan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800 text-slate-600 dark:text-neutral-300">
              <tr>
                <td className="py-3 px-4 font-mono text-xs text-slate-900 dark:text-neutral-100">sb-*-auth-token</td>
                <td className="py-3 px-4 font-medium text-slate-800 dark:text-neutral-200">Essential</td>
                <td className="py-3 px-4">Maintains encrypted JWT session state and validates Supabase user authentication.</td>
                <td className="py-3 px-4">Session / 1 Year</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono text-xs text-slate-900 dark:text-neutral-100">gitoscale-theme</td>
                <td className="py-3 px-4 font-medium text-slate-800 dark:text-neutral-200">Preference</td>
                <td className="py-3 px-4">Remembers your dark or light visual interface preference across visits.</td>
                <td className="py-3 px-4">1 Year</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono text-xs text-slate-900 dark:text-neutral-100">gitoscale_playground_*</td>
                <td className="py-3 px-4 font-medium text-slate-800 dark:text-neutral-200">Functional</td>
                <td className="py-3 px-4">Instant browser crash-recovery cache preserving canvas nodes, traffic rates, and edges.</td>
                <td className="py-3 px-4">Persistent Local</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono text-xs text-slate-900 dark:text-neutral-100">gitoscale_project_*</td>
                <td className="py-3 px-4 font-medium text-slate-800 dark:text-neutral-200">Functional</td>
                <td className="py-3 px-4">Offline project title and repository identification index for quick switching.</td>
                <td className="py-3 px-4">Persistent Local</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono text-xs text-slate-900 dark:text-neutral-100">X-Trace-Id</td>
                <td className="py-3 px-4 font-medium text-slate-800 dark:text-neutral-200">Telemetry</td>
                <td className="py-3 px-4">Ephemeral request correlation ID for diagnosing slow server queries and simulator latency.</td>
                <td className="py-3 px-4">Per Request</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3 */}
      <section className="mt-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
          3. Third-Party Authentication Handlers
        </h2>
        <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-neutral-300">
          When initiating single sign-on authentication through external providers (such as GitHub OAuth or Google Identity), those third parties may deploy functional session cookies in accordance with their respective security policies. We do not pass tracking telemetry to third-party ad networks.
        </p>
      </section>

      {/* Section 4 */}
      <section className="mt-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
          4. How to Manage or Clear Cookies
        </h2>
        <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-neutral-300 mb-3">
          You can inspect, clear, or block cookies and local storage directly via your browser&rsquo;s developer tools or privacy settings:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-slate-600 dark:text-neutral-300">
          <li>Chrome / Brave / Edge: Settings &rarr; Privacy and security &rarr; Third-party cookies.</li>
          <li>Firefox: Settings &rarr; Privacy &amp; Security &rarr; Cookies and Site Data.</li>
          <li>Safari: Preferences &rarr; Privacy &rarr; Manage Website Data.</li>
        </ul>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-3 border-l-2 border-slate-300 dark:border-neutral-700 pl-3 italic">
          Note: Clearing essential authentication tokens will sign you out of your account, while clearing local storage will purge unsaved local canvas prototypes that have not yet been synced to cloud history.
        </p>
      </section>

      {/* Section 5 */}
      <section className="mt-12 pt-6 border-t border-slate-200 dark:border-neutral-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">5. Privacy Desk Contact</h2>
        <p className="text-sm text-slate-600 dark:text-neutral-300">
          For technical questions regarding our cookie practices, reach our engineering desk at{' '}
          <a
            href="mailto:privacy@gittoscale.tech"
            className="text-slate-900 dark:text-white underline underline-offset-4 font-medium"
          >
            privacy@gittoscale.tech
          </a>
          .
        </p>
      </section>
    </article>
  );
};

/* =========================================================================
   2. Privacy Policy Content
   ========================================================================= */
const PrivacyPolicyContent: React.FC<{ isDark: boolean }> = ({ isDark: _isDark }) => {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      {/* Title & Metadata */}
      <header className="border-b pb-6 border-slate-200 dark:border-neutral-800">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 font-mono">
          Effective: October 2026 &middot; Last Revised: October 29, 2026
        </p>
      </header>

      {/* Core Principle Callout */}
      <div className="mt-8 p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/60 dark:bg-neutral-900/40 text-sm leading-relaxed text-slate-800 dark:text-neutral-200 font-medium">
        Developer Trust Commitment: We do not sell your personal data, and we strictly never train public foundation AI models on your private codebase, repository files, or architecture designs.
      </div>

      {/* Section 1 */}
      <section className="mt-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
          1. Information We Collect
        </h2>
        <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-neutral-300 mb-3">
          GitToScale operates on a principle of data minimization, collecting only what is strictly required to simulate architectures and calculate traffic bottlenecks:
        </p>
        <ul className="list-disc pl-5 space-y-2.5 text-sm sm:text-base text-slate-600 dark:text-neutral-300">
          <li>
            <strong>Authentication Metadata:</strong> When registering via GitHub or Google, we store your email address, display name, and avatar URL to authenticate your session.
          </li>
          <li>
            <strong>Repository Topology Definitions:</strong> When using the repository scanner, our parser extracts high-level module structure (package manifests, Dockerfiles, Kubernetes manifests, and entrypoint routes). <em>Raw proprietary source code is processed in memory and never stored in persistent databases.</em>
          </li>
          <li>
            <strong>Simulation Telemetry &amp; Node Graphs:</strong> The node-and-edge graphs, configured requests-per-second rates, queue policies, and capacity numbers you design on the canvas.
          </li>
          <li>
            <strong>Feedback Submissions:</strong> Suggestions, recommendation notes, or bug reports you explicitly transmit through the feedback dialog.
          </li>
        </ul>
      </section>

      {/* Section 2 */}
      <section className="mt-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
          2. How Your Information Is Used
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-slate-600 dark:text-neutral-300">
          <li>To construct interactive system topology graphs on the React Flow canvas.</li>
          <li>To compute deterministic M/M/m/K queue propagation, latency percentiles, and bottleneck rankings.</li>
          <li>To synthesize contextual architecture recommendations requested by your prompts.</li>
          <li>To synchronize your project history to secure cloud storage so you can resume work across devices.</li>
        </ul>
      </section>

      {/* Section 3 */}
      <section className="mt-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
          3. Code Security &amp; Ephemeral Processing
        </h2>
        <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-neutral-300">
          Your codebase is your proprietary intellectual property. GitToScale executes repository AST parsing inside isolated execution boundaries and strictly discards temporary tree objects once topological discovery finishes. At no point are your private business logic files indexed for training third-party AI models.
        </p>
      </section>

      {/* Section 4 */}
      <section className="mt-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
          4. Infrastructure &amp; Cloud Sub-processors
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0B0E] mt-3">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-neutral-800 bg-slate-50/80 dark:bg-neutral-900/60 font-semibold text-slate-700 dark:text-neutral-200">
                <th className="py-2.5 px-4">Provider</th>
                <th className="py-2.5 px-4">Function</th>
                <th className="py-2.5 px-4">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800 text-slate-600 dark:text-neutral-300">
              <tr>
                <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">Neon / Supabase</td>
                <td className="py-2.5 px-4">Encrypted PostgreSQL cloud database storage for accounts and architecture JSON.</td>
                <td className="py-2.5 px-4">United States / Global</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">Cloudflare R2</td>
                <td className="py-2.5 px-4">Object storage for uploaded diagram snapshots, video demonstrations, and media.</td>
                <td className="py-2.5 px-4">Global Edge Network</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">Google Cloud &amp; Groq</td>
                <td className="py-2.5 px-4">Inference gateways for conversational architecture copilot queries with zero retention.</td>
                <td className="py-2.5 px-4">United States</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 5 */}
      <section className="mt-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
          5. Developer Rights (GDPR &amp; CCPA Compliance)
        </h2>
        <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-neutral-300">
          You retain full rights to inspect, download (via JSON or Mermaid export), or permanently purge your account and all associated project architecture graphs. To request complete, irreversible account data deletion, email our data desk at{' '}
          <a
            href="mailto:privacy@gittoscale.tech"
            className="text-slate-900 dark:text-white underline underline-offset-4 font-medium"
          >
            privacy@gittoscale.tech
          </a>
          .
        </p>
      </section>

      {/* Contact Section */}
      <section className="mt-12 pt-6 border-t border-slate-200 dark:border-neutral-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">6. Security &amp; Privacy Contact</h2>
        <p className="text-sm text-slate-600 dark:text-neutral-300">
          Direct inquiries to our Data Protection Officer:{' '}
          <a
            href="mailto:privacy@gittoscale.tech"
            className="text-slate-900 dark:text-white underline underline-offset-4 font-medium"
          >
            privacy@gittoscale.tech
          </a>
          .
        </p>
      </section>
    </article>
  );
};

/* =========================================================================
   3. Terms of Service Content
   ========================================================================= */
const TermsOfServiceContent: React.FC<{ isDark: boolean }> = ({ isDark: _isDark }) => {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      {/* Title & Metadata */}
      <header className="border-b pb-6 border-slate-200 dark:border-neutral-800">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          Terms of Service
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 font-mono">
          Effective: October 2026 &middot; Last Revised: October 29, 2026
        </p>
      </header>

      {/* Intro */}
      <div className="mt-8 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-neutral-300">
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of <strong>GitToScale</strong>, an interactive system architecture modeling, repository scanning, and capacity simulation platform. By accessing or using our platform or APIs, you agree to be bound by these Terms.
        </p>
      </div>

      {/* Section 1 */}
      <section className="mt-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
          1. Description of Services
        </h2>
        <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-neutral-300">
          GitToScale provides an interactive web engineering environment that models microservice topologies, executes synthetic traffic propagation simulations using analytical queueing models (M/M/m/K), identifies capacity bottlenecks, and provides AI-driven architectural advice.
        </p>
      </section>

      {/* Section 2 */}
      <section className="mt-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
          2. Account Responsibilities &amp; API Keys
        </h2>
        <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-neutral-300 mb-3">
          You are responsible for maintaining the security of your authentication sessions and any custom Bring-Your-Own-Key (BYOK) credentials configured for LLM providers. GitToScale encrypts client configuration parameters and does not expose private API keys in client-side bundles.
        </p>
      </section>

      {/* Section 3 */}
      <section className="mt-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
          3. Acceptable Use Policy
        </h2>
        <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-neutral-300 mb-3">
          You agree not to use GitToScale for any of the following prohibited activities:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-slate-600 dark:text-neutral-300">
          <li>Launching unauthorized denial-of-service tests or destructive load against third-party production servers.</li>
          <li>Submitting repositories containing malicious viruses, trojans, or unauthorized exploit code.</li>
          <li>Attempting to bypass access controls, API rate limits, or reverse-engineer proprietary simulation algorithms.</li>
          <li>Reselling, sublicensing, or duplicating our analytical engine without explicit prior written authorization.</li>
        </ul>
      </section>

      {/* Section 4: Engineering Notice & Disclaimer */}
      <section className="mt-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
          4. Simulation Disclaimer &amp; Engineering Notice
        </h2>
        <div className="p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-900/50">
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-neutral-300 font-medium">
            <strong>Important Technical Disclaimer:</strong> Throughput metrics, queue saturation figures, latency curves, and bottleneck diagnostics generated by GitToScale are theoretical mathematical calculations grounded in queueing network theory. They serve as architectural design, capacity planning, and educational benchmarks. They do not constitute an operational Service Level Agreement (SLA) guarantee of production infrastructure performance, and should be evaluated alongside physical load tests prior to production rollout.
          </p>
        </div>
      </section>

      {/* Section 5 */}
      <section className="mt-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
          5. Intellectual Property Rights
        </h2>
        <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-neutral-300">
          You retain 100% full ownership, copyright, and patent rights to your architecture designs, custom prompts, code repositories, and exported diagrams. GitToScale and its licensors retain all proprietary rights, title, and interest in and to the platform codebase, simulation algorithms, UI design system, and trademarks.
        </p>
      </section>

      {/* Section 6 */}
      <section className="mt-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
          6. Termination &amp; Account Suspension
        </h2>
        <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-neutral-300">
          We reserve the right to suspend or terminate accounts that breach this Acceptable Use Policy or attempt to compromise the security and availability of the platform, without prior notice.
        </p>
      </section>

      {/* Section 7 */}
      <section className="mt-12 pt-6 border-t border-slate-200 dark:border-neutral-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">7. Legal Inquiries &amp; Notices</h2>
        <p className="text-sm text-slate-600 dark:text-neutral-300">
          For formal inquiries, DMCA notifications, or legal matters, contact:{' '}
          <a
            href="mailto:legal@gittoscale.tech"
            className="text-slate-900 dark:text-white underline underline-offset-4 font-medium"
          >
            legal@gittoscale.tech
          </a>
          .
        </p>
      </section>
    </article>
  );
};

export default LegalPage;
