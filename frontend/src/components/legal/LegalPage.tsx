import React, { useEffect } from 'react';
import { ArrowLeft, Cookie, Shield, FileText, Sun, Moon } from 'lucide-react';
import { Fotter } from '../Fotter';

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
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        isDark ? 'bg-[#020202] text-neutral-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Floating / Fixed Header */}
      <header
        className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${
          isDark
            ? 'border-neutral-800/80 bg-[#020202]/85'
            : 'border-slate-200/80 bg-white/85'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand Logo & Back to Home */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={handleGoHome}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold ${
                isDark
                  ? 'border-neutral-800 bg-[#0A0A0A] text-neutral-300 hover:text-white hover:border-neutral-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:border-slate-300 shadow-xs'
              }`}
              title="Return to home page"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </button>

            <button
              type="button"
              onClick={handleGoHome}
              className="flex items-center gap-2 cursor-pointer focus:outline-hidden"
            >
              <img
                src={isDark ? '/logo.png' : '/logo-light.png'}
                alt="GitToScale"
                className="h-7 sm:h-8 w-auto object-contain"
              />
            </button>
          </div>

          {/* Center: Legal Tabs */}
          <div
            className={`hidden md:flex items-center p-1 rounded-full border ${
              isDark
                ? 'bg-[#0A0A0A] border-neutral-800/90'
                : 'bg-slate-200/60 border-slate-300/80'
            }`}
          >
            <button
              type="button"
              onClick={() => handleTabClick('cookie')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                type === 'cookie'
                  ? isDark
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-900 shadow-xs font-semibold'
                  : isDark
                  ? 'text-neutral-400 hover:text-neutral-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cookie className="w-3.5 h-3.5" />
              <span>Cookie Policy</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('privacy')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                type === 'privacy'
                  ? isDark
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-900 shadow-xs font-semibold'
                  : isDark
                  ? 'text-neutral-400 hover:text-neutral-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('terms')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                type === 'terms'
                  ? isDark
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-900 shadow-xs font-semibold'
                  : isDark
                  ? 'text-neutral-400 hover:text-neutral-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Terms of Service</span>
            </button>
          </div>

          {/* Right: Theme Toggle */}
          <div className="flex items-center gap-2">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  isDark
                    ? 'border-neutral-800 bg-[#0A0A0A] text-neutral-300 hover:text-white hover:border-neutral-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:border-slate-300 shadow-xs'
                }`}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? <Sun className="w-4 h-4 text-slate-700 dark:text-neutral-300" /> : <Moon className="w-4 h-4 text-slate-700 dark:text-neutral-300" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div
          className={`md:hidden flex items-center justify-around border-t px-2 py-2 ${
            isDark ? 'border-neutral-800/80 bg-[#060608]' : 'border-slate-200/80 bg-white'
          }`}
        >
          <button
            type="button"
            onClick={() => handleTabClick('cookie')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer ${
              type === 'cookie'
                ? isDark
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-white'
                : isDark
                ? 'text-neutral-400'
                : 'text-slate-600'
            }`}
          >
            <Cookie className="w-3.5 h-3.5" />
            <span>Cookies</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('privacy')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer ${
              type === 'privacy'
                ? isDark
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-white'
                : isDark
                ? 'text-neutral-400'
                : 'text-slate-600'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('terms')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer ${
              type === 'terms'
                ? isDark
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-white'
                : isDark
                ? 'text-neutral-400'
                : 'text-slate-600'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms</span>
          </button>
        </div>
      </header>

      {/* Main Document Body */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14">
        {type === 'cookie' && <CookiePolicyContent isDark={isDark} />}
        {type === 'privacy' && <PrivacyPolicyContent isDark={isDark} />}
        {type === 'terms' && <TermsOfServiceContent isDark={isDark} />}
      </main>

      {/* Footer */}
      <Fotter brandName="GitToScale" isDark={isDark} onNavigate={onNavigate} />
    </div>
  );
};

/* =========================================================================
   1. Cookie Policy Content
   ========================================================================= */
const CookiePolicyContent: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  return (
    <article className="space-y-8">
      {/* Document Header */}
      <div className="border-b pb-6 border-neutral-800 dark:border-neutral-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20 mb-3">
          <Cookie className="w-3.5 h-3.5" />
          <span>LEGAL COMPLIANCE</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
          Cookie Policy
        </h1>
        <p className={`mt-2 text-sm ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
          Effective Date: October 2026 &bull; Last Revised: October 29, 2026
        </p>
      </div>

      {/* Introductory Callout */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border ${
          isDark
            ? 'bg-[#0A0A0A] border-neutral-800 text-neutral-300'
            : 'bg-white border-slate-200 text-slate-700 shadow-xs'
        }`}
      >
        <p className="text-sm leading-relaxed">
          This Cookie Policy explains how <strong>GitToScale</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) uses cookies, local storage, and similar web tracking technologies when you use our website, developer sandbox, and architecture simulation platform located at{' '}
          <a href="https://gittoscale.tech" className="text-blue-500 hover:underline">
            https://gittoscale.tech
          </a>{' '}
          and its associated subdomains.
        </p>
      </div>

      {/* Section 1: What Are Cookies */}
      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">1. What Are Cookies and Local Storage?</h2>
        <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
          Cookies are small data files placed on your device (computer, tablet, or smartphone) by websites you visit. They are widely used to make web applications run efficiently, remember your customized interface preferences, and provide analytical telemetry to service operators.
        </p>
        <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
          In addition to standard HTTP cookies, GitToScale utilizes HTML5 Local Storage and Session Storage to preserve local simulation states, baseline snapshots, and client-side UI configurations without sending unnecessary overhead over the network with every request.
        </p>
      </section>

      {/* Section 2: Categories of Cookies We Use */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">2. Categories of Cookies We Use</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#0A0A0A] border-neutral-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <h3 className="text-base font-semibold text-blue-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Strictly Essential Cookies
            </h3>
            <p className={`mt-2 text-xs sm:text-sm leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
              Necessary for the platform to function. They authenticate your developer identity, maintain encrypted session tokens via Supabase Auth, and protect against Cross-Site Request Forgery (CSRF).
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#0A0A0A] border-neutral-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <h3 className="text-base font-semibold text-emerald-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Preference &amp; Customization Cookies
            </h3>
            <p className={`mt-2 text-xs sm:text-sm leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
              Remember your interface choices, such as your dark/light theme setting (<code>gitoscale-theme</code>), collapsed/expanded canvas sidebars, and active view modes.
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#0A0A0A] border-neutral-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <h3 className="text-base font-semibold text-amber-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Simulation Caching
            </h3>
            <p className={`mt-2 text-xs sm:text-sm leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
              Temporarily stores architecture node positions, active baseline comparisons, and pending repository analysis queries so your work is never lost during browser reloads.
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-[#0A0A0A] border-neutral-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <h3 className="text-base font-semibold text-purple-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Security &amp; Rate-Limiting
            </h3>
            <p className={`mt-2 text-xs sm:text-sm leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
              Maintains secure tokens for OAuth sign-in with GitHub and Google, preventing replay attacks and ensuring compute resource fairness on simulation clusters.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Third-Party Services */}
      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">3. Third-Party Cookies and Handlers</h2>
        <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
          When you connect via external developer accounts (such as GitHub OAuth or Google Sign-In), those external providers may deploy their own authentication and security cookies in accordance with their respective privacy and cookie guidelines.
        </p>
      </section>

      {/* Section 4: How to Control Cookies */}
      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">4. How to Control or Delete Cookies</h2>
        <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
          Most modern web browsers allow you to manage your cookie preferences through their settings:
        </p>
        <ul className={`list-disc pl-5 space-y-1.5 text-sm sm:text-base ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
          <li>You can configure your browser to reject all cookies or notify you whenever a cookie is set.</li>
          <li>You can clear your local storage and session data via browser developer tools or settings anytime.</li>
          <li>Note: Disabling strictly essential cookies will prevent authentication and repository analysis from operating correctly.</li>
        </ul>
      </section>

      {/* Section 5: Contact Us */}
      <section className={`p-5 rounded-2xl border ${isDark ? 'bg-[#08080a] border-neutral-800' : 'bg-slate-100 border-slate-200'}`}>
        <h2 className="text-lg font-bold">5. Questions &amp; Support</h2>
        <p className={`mt-1 text-sm ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
          For questions regarding our cookie practices, please contact our privacy desk at{' '}
          <a href="mailto:privacy@gittoscale.tech" className="text-blue-500 font-medium hover:underline">
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
const PrivacyPolicyContent: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  return (
    <article className="space-y-8">
      {/* Document Header */}
      <div className="border-b pb-6 border-neutral-800 dark:border-neutral-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-3">
          <Shield className="w-3.5 h-3.5" />
          <span>DATA PROTECTION</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
          Privacy Policy
        </h1>
        <p className={`mt-2 text-sm ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
          Effective Date: October 2026 &bull; Last Revised: October 29, 2026
        </p>
      </div>

      {/* Summary Box */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border ${
          isDark
            ? 'bg-[#0A0A0A] border-neutral-800 text-neutral-300'
            : 'bg-white border-slate-200 text-slate-700 shadow-xs'
        }`}
      >
        <p className="text-sm leading-relaxed">
          At <strong>GitToScale</strong>, your privacy and intellectual property are our top priorities. We build developer tools with a strict security-first philosophy: <strong>we do not sell your personal information, and we never train public AI models on your private codebase or architecture definitions.</strong>
        </p>
      </div>

      {/* Section 1 */}
      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">1. Information We Collect</h2>
        <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
          We collect only the minimum information required to deliver high-performance architecture modeling and simulation:
        </p>
        <ul className={`list-disc pl-5 space-y-2 text-sm sm:text-base ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
          <li>
            <strong>Account Information:</strong> When you register or sign in via GitHub or Google, we receive your email address, display name, and avatar URL to authenticate your session.
          </li>
          <li>
            <strong>Repository Topology &amp; Metadata:</strong> When you import a repository, our scanner parses directory trees, configuration files (e.g. Dockerfiles, Kubernetes manifests, package definitions), and service boundaries. <em>We do not retain raw source code files in permanent cloud databases.</em>
          </li>
          <li>
            <strong>Simulation Telemetry:</strong> User-configured throughput rates (RPS), queue capacity limits, failure scenarios, and latency benchmarks created on the Architecture Canvas.
          </li>
        </ul>
      </section>

      {/* Section 2: How We Use Information */}
      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">2. How We Use Your Information</h2>
        <ul className={`list-disc pl-5 space-y-1.5 text-sm sm:text-base ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
          <li>To construct interactive system architecture node graphs in real time.</li>
          <li>To calculate distributed traffic routing, bottleneck analysis, and capacity forecasting.</li>
          <li>To generate contextual AI architecture recommendations requested by your prompts.</li>
          <li>To save your simulation history and allow you to resume your projects seamlessly.</li>
        </ul>
      </section>

      {/* Section 3: Intellectual Property & Code Security */}
      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">3. Code Security and Non-Retention Commitment</h2>
        <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
          Your codebase is your proprietary intellectual property. GitToScale executes repository analysis in isolated sandboxes and strictly discards temporary abstract syntax tree (AST) files once topology discovery is finalized.
        </p>
      </section>

      {/* Section 4: Data Sharing */}
      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">4. Third-Party Service Providers</h2>
        <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
          We work with trusted enterprise cloud infrastructure providers to run GitToScale:
        </p>
        <ul className={`list-disc pl-5 space-y-1.5 text-sm sm:text-base ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
          <li><strong>Supabase / PostgreSQL:</strong> Secure encrypted database storage for user profiles and project metadata.</li>
          <li><strong>GitHub &amp; Google Cloud:</strong> Secure OAuth authentication verification.</li>
          <li><strong>Cloudflare / Vercel:</strong> Global CDN routing and edge caching with full TLS 1.3 encryption.</li>
        </ul>
      </section>

      {/* Section 5: User Rights */}
      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">5. Your Rights (GDPR &amp; CCPA)</h2>
        <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
          Regardless of your geography, you have the right to inspect, export, or permanently delete your account and all associated project architecture graphs at any time. To request complete account deletion, email{' '}
          <a href="mailto:privacy@gittoscale.tech" className="text-blue-500 hover:underline">
            privacy@gittoscale.tech
          </a>
          .
        </p>
      </section>

      {/* Contact Box */}
      <section className={`p-5 rounded-2xl border ${isDark ? 'bg-[#08080a] border-neutral-800' : 'bg-slate-100 border-slate-200'}`}>
        <h2 className="text-lg font-bold">6. Contact Our Data Protection Officer</h2>
        <p className={`mt-1 text-sm ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
          GitToScale Security &amp; Privacy Office: <a href="mailto:privacy@gittoscale.tech" className="text-blue-500 font-medium hover:underline">privacy@gittoscale.tech</a>.
        </p>
      </section>
    </article>
  );
};

/* =========================================================================
   3. Terms of Service Content
   ========================================================================= */
const TermsOfServiceContent: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  return (
    <article className="space-y-8">
      {/* Document Header */}
      <div className="border-b pb-6 border-neutral-800 dark:border-neutral-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-500 border border-purple-500/20 mb-3">
          <FileText className="w-3.5 h-3.5" />
          <span>USER AGREEMENT</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
          Terms &amp; Conditions
        </h1>
        <p className={`mt-2 text-sm ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
          Effective Date: October 2026 &bull; Last Revised: October 29, 2026
        </p>
      </div>

      {/* Intro Box */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border ${
          isDark
            ? 'bg-[#0A0A0A] border-neutral-800 text-neutral-300'
            : 'bg-white border-slate-200 text-slate-700 shadow-xs'
        }`}
      >
        <p className="text-sm leading-relaxed">
          Welcome to <strong>GitToScale</strong>. By accessing or using our website, APIs, architecture recommender, and capacity simulation engines, you agree to be bound by these Terms and Conditions (&ldquo;Terms&rdquo;). If you do not agree, please do not use the service.
        </p>
      </div>

      {/* Section 1 */}
      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">1. Description of Services</h2>
        <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
          GitToScale provides an interactive developer playground that scans code repositories, models distributed architecture graphs, performs synthetic traffic load simulations based on analytical queueing theory (M/M/m/K models), and delivers AI-assisted architectural guidance.
        </p>
      </section>

      {/* Section 2 */}
      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">2. User Accounts and Responsibilities</h2>
        <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
          You are responsible for maintaining the confidentiality of your authentication credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized account access.
        </p>
      </section>

      {/* Section 3 */}
      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">3. Acceptable Use Policy</h2>
        <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
          You agree not to:
        </p>
        <ul className={`list-disc pl-5 space-y-1.5 text-sm sm:text-base ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
          <li>Use GitToScale to conduct denial-of-service (DoS/DDoS) attacks against third-party production servers.</li>
          <li>Upload repositories containing malicious code, worms, or unauthorized exploits.</li>
          <li>Attempt to decompile, reverse-engineer, or circumvent security protections of our simulation algorithms.</li>
          <li>Resell, sublicense, or redistribute our analytical engine without written authorization.</li>
        </ul>
      </section>

      {/* Section 4 */}
      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">4. Simulation Disclaimer &amp; Limitation of Liability</h2>
        <div
          className={`p-4 rounded-xl border ${
            isDark ? 'bg-amber-950/20 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
        >
          <p className="text-xs sm:text-sm leading-relaxed font-medium">
            <strong>Important Engineering Notice:</strong> Architecture simulations, capacity figures, latency curves, and bottleneck warnings generated by GitToScale are theoretical mathematical approximations intended for capacity planning, system design education, and architectural assessment. They do not constitute a formal guarantee of production SLA performance or substitute for real-world load testing.
          </p>
        </div>
      </section>

      {/* Section 5 */}
      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">5. Intellectual Property Rights</h2>
        <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
          You retain all ownership, copyright, and patent rights to your architecture designs, prompts, and source repositories. GitToScale and its licensors retain all rights, title, and interest in and to the platform, simulation engine, custom node library, UI, and trademarks.
        </p>
      </section>

      {/* Section 6 */}
      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">6. Termination</h2>
        <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
          We reserve the right to suspend or terminate accounts that violate our Acceptable Use Policy or compromise simulation platform integrity, without prior liability.
        </p>
      </section>

      {/* Contact Section */}
      <section className={`p-5 rounded-2xl border ${isDark ? 'bg-[#08080a] border-neutral-800' : 'bg-slate-100 border-slate-200'}`}>
        <h2 className="text-lg font-bold">7. Inquiries &amp; Legal Notices</h2>
        <p className={`mt-1 text-sm ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
          For legal inquiries or notices regarding these terms, contact us at{' '}
          <a href="mailto:legal@gittoscale.tech" className="text-blue-500 font-medium hover:underline">
            legal@gittoscale.tech
          </a>
          .
        </p>
      </section>
    </article>
  );
};

export default LegalPage;

