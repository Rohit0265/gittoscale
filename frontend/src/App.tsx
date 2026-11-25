import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { api } from './services/api';
import {
  ArchitectureFixture,
  ScenarioFixture,
  ArchitectureNode,
  ArchitectureEdge,
  SimulationResult,
  BaselineSnapshot,
  ComponentType,
  RecommenderInput,
} from './types';
import { LandingPage } from './components/LandingPage';
import { usePageMeta } from './utils/usePageMeta';
import { FloatingFeedbackButton } from './components/FloatingFeedbackButton';
import { SkeletonCanvas } from './components/ProjectWorkspace/SkeletonCanvas';
import { useAuth } from './contexts/AuthContext';
import { isOAuthPopup } from './utils/oauthHelper';
import { toVerticalTree } from './utils/treeLayout';
import { executeArchitectureCommand, isArchitectureGenerationRequest } from './services/aiAgentExecutor';
import { buildDetailedArchitecture } from './utils/detailedArchitecture';
import {
  usePlaygroundPersistence,
  loadPlaygroundFromBrowserStorage,
} from './services/playgroundPersistence';
import {
  restoreArchitectureFromDb,
  formatArchitectureForDb,
  parseMermaidToArchitecture,
} from './utils/exportDiagram';
import { AlertCircle, RefreshCw, PanelLeftOpen, PanelRightOpen, Layers, Plus } from 'lucide-react';

// Code-split heavy interactive canvas & simulator modules so initial landing page bundle is tiny & ultra-fast
const Header = React.lazy(() => import('./components/Header').then((m) => ({ default: m.Header })));
const MetricsStrip = React.lazy(() => import('./components/MetricsStrip').then((m) => ({ default: m.MetricsStrip })));
const ContextualQuerySidebar = React.lazy(() =>
  import('./components/ProjectWorkspace/ContextualQuerySidebar').then((m) => ({ default: m.ContextualQuerySidebar }))
);
const ArchitectureCanvas = React.lazy(() =>
  import('./components/Canvas/ArchitectureCanvas').then((m) => ({ default: m.ArchitectureCanvas }))
);
const RightSidebar = React.lazy(() => import('./components/RightSidebar').then((m) => ({ default: m.RightSidebar })));

// Code-split heavy routes and modals for fast loading on slow phones & networks
const BaselineComparisonModal = React.lazy(() =>
  import('./components/BaselineComparisonModal').then((m) => ({ default: m.BaselineComparisonModal }))
);
const RepositoryImportModal = React.lazy(() =>
  import('./components/RepositoryImportModal').then((m) => ({ default: m.RepositoryImportModal }))
);
const StartProjectModal = React.lazy(() =>
  import('./components/StartProjectModal').then((m) => ({ default: m.StartProjectModal }))
);
const ArchitectureRecommenderPage = React.lazy(() =>
  import('./components/ArchitectureRecommender/ArchitectureRecommenderPage').then((m) => ({
    default: m.ArchitectureRecommenderPage,
  }))
);
const ProjectWorkspace = React.lazy(() =>
  import('./components/ProjectWorkspace/ProjectWorkspace').then((m) => ({ default: m.ProjectWorkspace }))
);
const ModernLoginSignup = React.lazy(() => import('./components/ui/modern-login-signup'));
const ForgotPasswordPage = React.lazy(() =>
  import('./components/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
);
const AuthCallback = React.lazy(() =>
  import('./components/auth/AuthCallback').then((m) => ({ default: m.AuthCallback }))
);
const HistoryDashboard = React.lazy(() =>
  import('./components/history/HistoryDashboard').then((m) => ({ default: m.HistoryDashboard }))
);
const LegalPage = React.lazy(() =>
  import('./components/legal/LegalPage').then((m) => ({ default: m.LegalPage }))
);
const NotFoundPage = React.lazy(() =>
  import('./components/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);
const UnverifiedProjectPage = React.lazy(() =>
  import('./components/UnverifiedProjectPage').then((m) => ({ default: m.UnverifiedProjectPage }))
);
const FeedPage = React.lazy(() =>
  import('./feed/pages/FeedPage').then((m) => ({ default: m.FeedPage }))
);
const ProfilePage = React.lazy(() =>
  import('./feed/pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const AdminPage = React.lazy(() =>
  import('./components/admin/AdminPage').then((m) => ({ default: m.AdminPage }))
);
const MeetingLandingPage = React.lazy(() =>
  import('./meeting').then((m) => ({ default: m.MeetingLandingPage }))
);
const MeetingPage = React.lazy(() =>
  import('./meeting').then((m) => ({ default: m.MeetingPage }))
);
const PaymentPage = React.lazy(() =>
  import('./components/payment/PaymentPage').then((m) => ({ default: m.PaymentPage }))
);
const PaymentHistoryPage = React.lazy(() =>
  import('./components/payment/PaymentHistoryPage').then((m) => ({ default: m.PaymentHistoryPage }))
);
import { PlanLimitModal } from './components/payment/PlanLimitModal';
import { StartMeetingModal } from './meeting';

import {
  AppWorkspaceSkeleton,
  HistoryPageSkeleton,
  RecommenderPageSkeleton,
  LegalPageSkeleton,
  AuthModalSkeleton,
} from './components/common/SkeletonScreens';

const EMPTY_NODE_RESULTS: Record<string, any> = {};
const EMPTY_EDGE_RESULTS: Record<string, any> = {};

export interface ProjectRouteInfo {
  projectId: string;
  prompt?: string;
}

const getProjectRouteInfo = (): ProjectRouteInfo | null => {
  if (typeof window === 'undefined') return null;
  const match = window.location.pathname.match(/\/(?:project|product|app)\/([a-zA-Z0-9_-]+)/);
  const search = new URLSearchParams(window.location.search);
  const promptQuery = search.get('prompt') || undefined;
  if (match && match[1]) {
    const savedPrompt = promptQuery || (typeof window !== 'undefined' ? localStorage.getItem(`gitoscale_project_${match[1]}`) || undefined : undefined);
    return {
      projectId: match[1],
      prompt: savedPrompt,
    };
  }
  const projectQuery = search.get('project') || search.get('product');
  if (projectQuery) {
    const savedPrompt = promptQuery || (typeof window !== 'undefined' ? localStorage.getItem(`gitoscale_project_${projectQuery}`) || undefined : undefined);
    return {
      projectId: projectQuery,
      prompt: savedPrompt,
    };
  }
  return null;
};

const isAuthUrl = () => {
  if (typeof window === 'undefined') return false;
  const search = new URLSearchParams(window.location.search);
  return (
    search.has('auth') ||
    search.has('login') ||
    search.has('signup') ||
    window.location.pathname.startsWith('/auth') ||
    window.location.pathname.startsWith('/login')
  );
};

const isRecommenderUrl = () => {
  if (typeof window === 'undefined') return false;
  const search = new URLSearchParams(window.location.search);
  return (
    search.has('architect') ||
    search.has('recommender') ||
    window.location.pathname.startsWith('/architect') ||
    window.location.pathname.startsWith('/recommender')
  );
};

const isAppDomain = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  return (
    host === 'app.gittoscale.tech' ||
    host.startsWith('app.') ||
    window.location.pathname.startsWith('/app') ||
    window.location.pathname.startsWith('/project') ||
    window.location.pathname.startsWith('/product') ||
    search.has('app') ||
    search.has('repo') ||
    search.has('demo')
  );
};

export const getCollabMeetingId = (): string | null => {
  if (typeof window === 'undefined') return null;
  const match =
    window.location.pathname.match(/\/meeting\/([a-zA-Z0-9_-]+)/i) ||
    window.location.pathname.match(/\/collab\/meeting\/([a-zA-Z0-9_-]+)/i) ||
    window.location.pathname.match(/\/collab\/([a-zA-Z0-9_-]+)/i);
  if (match && match[1] && match[1].toLowerCase() !== 'meeting' && match[1].toLowerCase() !== 'join') {
    return match[1];
  }
  return null;
};

export type AppView =
  | 'landing'
  | 'simulator'
  | 'recommender'
  | 'projectWorkspace'
  | 'signup'
  | 'signin'
  | 'forgot-password'
  | 'auth-callback'
  | 'history'
  | 'cookie-policy'
  | 'privacy-policy'
  | 'terms'
  | 'not-found'
  | 'unverified'
  | 'feed'
  | 'feed-profile'
  | 'collab-landing'
  | 'collab-meeting'
  | 'payment'
  | 'payment-history'
  | 'admin';

const SeamlessPageFallback: React.FC<{ isDark?: boolean }> = ({ isDark = true }) => (
  <div className={`min-h-screen w-full ${isDark ? 'bg-[#020202]' : 'bg-slate-50'} transition-opacity duration-150`} />
);

const isValidAppPath = (path: string): boolean => {
  const normalized = path.toLowerCase().replace(/\/+$/, '') || '/';
  if (normalized === '/' || normalized === '') return true;
  if (normalized === '/app' || normalized.startsWith('/app/')) return true;
  if (normalized === '/collab' || normalized.startsWith('/collab')) return true;
  if (normalized === '/meeting' || normalized.startsWith('/meeting')) return true;
  if (normalized === '/feed' || normalized.startsWith('/feed')) return true;
  if (normalized === '/profile' || normalized.startsWith('/profile')) return true;
  if (normalized === '/admin' || normalized.startsWith('/admin')) return true;
  if (normalized === '/payment' || normalized.startsWith('/payment') || normalized === '/pricing') return true;
  if (normalized === '/signup' || normalized === '/signin' || normalized === '/forgot-password') return true;
  if (normalized.startsWith('/auth')) return true;
  if (normalized === '/history') return true;
  if (normalized === '/architect' || normalized === '/recommender') return true;
  if (normalized.startsWith('/project/') || normalized.startsWith('/product/')) return true;
  if (
    normalized === '/cookie' ||
    normalized === '/cookies' ||
    normalized === '/cookie-policy' ||
    normalized === '/cokkie' ||
    normalized.startsWith('/cookie') ||
    normalized.startsWith('/cokkie')
  ) {
    return true;
  }
  if (
    normalized === '/privacy' ||
    normalized === '/privacy-policy' ||
    normalized === '/provacy' ||
    normalized.startsWith('/privacy') ||
    normalized.startsWith('/provacy')
  ) {
    return true;
  }
  if (
    normalized === '/terms' ||
    normalized === '/terms-and-conditions' ||
    normalized === '/terms-of-service' ||
    normalized.startsWith('/terms')
  ) {
    return true;
  }
  return false;
};

const getInitialView = (): AppView => {
  if (typeof window === 'undefined') return 'landing';
  if (isOAuthPopup()) return 'auth-callback';
  const rawPath = window.location.pathname.toLowerCase();
  const path = rawPath.replace(/\/+$/, '') || '/';
  if (path === '/admin' || path.startsWith('/admin')) return 'admin';
  if (path === '/payment/history' || path === '/payment-history' || path === '/billing' || path === '/subscription') return 'payment-history';
  if (path === '/payment' || path.startsWith('/payment') || path === '/pricing') return 'payment';
  if (path === '/collab' || path === '/meeting') return 'collab-landing';
  if (path.startsWith('/collab/') || path.startsWith('/meeting/')) {
    const mId = getCollabMeetingId();
    if (mId) return 'collab-meeting';
    return 'collab-landing';
  }
  if (path === '/feed') return 'feed';
  if (path === '/profile' || path.startsWith('/profile') || path.startsWith('/feed/profile/')) return 'feed-profile';
  if (path === '/signup') return 'signup';
  if (path === '/signin') return 'signin';
  if (path === '/forgot-password') return 'forgot-password';
  if (path.startsWith('/auth/callback')) return 'auth-callback';
  if (path === '/history') return 'history';
  if (
    path === '/cookie' ||
    path === '/cookies' ||
    path === '/cookie-policy' ||
    path === '/cokkie' ||
    path.startsWith('/cookie') ||
    path.startsWith('/cokkie')
  ) {
    return 'cookie-policy';
  }
  if (
    path === '/privacy' ||
    path === '/privacy-policy' ||
    path === '/provacy' ||
    path.startsWith('/privacy') ||
    path.startsWith('/provacy')
  ) {
    return 'privacy-policy';
  }
  if (
    path === '/terms' ||
    path === '/terms-and-conditions' ||
    path === '/terms-of-service' ||
    path.startsWith('/terms')
  ) {
    return 'terms';
  }
  if (getProjectRouteInfo()) return 'simulator';
  if (isRecommenderUrl()) return 'recommender';
  if (isAppDomain()) return 'simulator';
  if (path === '/' || path === '') return 'landing';

  // Unknown path / typo -> 404 Not Found
  return 'not-found';
};

export const App: React.FC = () => {
  const {
    user,
    isLoading: isAuthLoading,
    savePendingAction,
    pendingAction,
    clearPendingAction,
    getAuthToken,
    signOut,
  } = useAuth();

  const [activeProject, setActiveProject] = useState<ProjectRouteInfo | null>(() => getProjectRouteInfo());
  const [unverifiedProjectId, setUnverifiedProjectId] = useState<string | null>(null);
  const authToken = getAuthToken();

  // Navigation mode
  const [currentView, setCurrentView] = useState<AppView>(() => getInitialView());
  usePageMeta(currentView);

  // Modern login/signup modal state
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(() => isAuthUrl());

  // Active prompt for architecture generation
  const [activePromptText, setActivePromptText] = useState<string>(() => {
    const route = getProjectRouteInfo();
    return route?.prompt || '';
  });
  const [isGeneratingArchitecture, setIsGeneratingArchitecture] = useState<boolean>(false);
  const loadedHistoryProjectsRef = useRef<Set<string>>(new Set());

  // Pending post to be pre-populated when sharing system design to feed
  const [pendingFeedPost, setPendingFeedPost] = useState<{
    content?: string;
    media?: import('./feed/components/CreatePost').InitialPostMedia[];
  } | null>(null);

  // Selected mandatory parameters for AI Architect chat
  const [selectedAnswers, setSelectedAnswers] = useState<{
    scale?: string;
    budget?: string;
    consistency?: string;
    region?: string;
  }>({
    scale: 'scale_growth',
    budget: 'budget_balanced',
    consistency: 'consistency_acid',
    region: 'deploy_single',
  });

  // Theme state: dark mode as default across all users & visitors
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gitoscale-theme');
      if (saved) return saved === 'dark';
      // Default to dark mode
      return true;
    }
    return true;
  });

  // When an authenticated user is present, ensure they always see dark mode by default
  useEffect(() => {
    if (user) {
      setIsDark(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('gitoscale-theme', 'dark');
        document.documentElement.classList.add('dark');
      }
    }
  }, [user]);

  useEffect(() => {
    const root = document.documentElement;
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (isDark) {
      root.classList.add('dark');
      if (meta) meta.setAttribute('content', 'dark');
    } else {
      root.classList.remove('dark');
      if (meta) meta.setAttribute('content', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem('gitoscale-theme');
      if (!saved && !user) {
        setIsDark(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [user]);

  const handleToggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem('gitoscale-theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const handleGoHome = useCallback(() => {
    window.history.pushState({}, '', '/');
    setActiveProject(null);
    setActivePromptText('');
    setSelectedNodeId(null);
    setSimulationResult(null);
    setCurrentView('landing');
  }, []);

  const handleNavigate = useCallback((viewName: string) => {
    const rawName = viewName.trim();
    const cleanName = rawName.toLowerCase().replace(/\/+$/, '') || '/';
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (cleanName === 'signup' || cleanName === '/signup') {
      window.history.pushState({}, '', '/signup');
      setCurrentView('signup');
    } else if (cleanName === 'signin' || cleanName === '/signin') {
      window.history.pushState({}, '', '/signin');
      setCurrentView('signin');
    } else if (cleanName === 'forgot-password' || cleanName === '/forgot-password') {
      window.history.pushState({}, '', '/forgot-password');
      setCurrentView('forgot-password');
    } else if (cleanName === 'history' || cleanName === '/history') {
      window.history.pushState({}, '', '/history');
      setCurrentView('history');
    } else if (cleanName === 'feed' || cleanName === '/feed') {
      window.history.pushState({}, '', '/feed');
      setCurrentView('feed');
    } else if (cleanName === 'collab' || cleanName === '/collab' || cleanName === 'meeting' || cleanName === '/meeting') {
      window.history.pushState({}, '', '/collab');
      setCurrentView('collab-landing');
    } else if (cleanName.startsWith('/collab/') || cleanName.startsWith('/meeting/')) {
      window.history.pushState({}, '', cleanName);
      const mId = getCollabMeetingId();
      if (mId) {
        setCurrentView('collab-meeting');
      } else {
        setCurrentView('collab-landing');
      }
    } else if (
      cleanName === 'payment-history' ||
      cleanName === '/payment-history' ||
      cleanName === 'payment/history' ||
      cleanName === '/payment/history' ||
      cleanName === 'billing' ||
      cleanName === '/billing' ||
      cleanName === 'subscription' ||
      cleanName === '/subscription'
    ) {
      window.history.pushState({}, '', '/payment/history');
      setCurrentView('payment-history');
    } else if (cleanName === 'payment' || cleanName === '/payment' || cleanName === 'pricing' || cleanName === '/pricing') {
      window.history.pushState({}, '', cleanName.includes('pricing') ? '/pricing' : '/payment');
      setCurrentView('payment');
    } else if (cleanName === 'admin' || cleanName === '/admin') {
      window.history.pushState({}, '', '/admin');
      setCurrentView('admin');
    } else if (cleanName === 'profile' || cleanName === '/profile') {
      window.history.pushState({}, '', '/profile');
      setCurrentView('feed-profile');
    } else if (cleanName.startsWith('/feed/profile/')) {
      window.history.pushState({}, '', cleanName);
      setCurrentView('feed-profile');
    } else if (cleanName === 'simulator' || cleanName === '/app') {
      window.history.pushState({}, '', '/app');
      setCurrentView('simulator');
      if (!activePromptText && !activeProject?.prompt) {
        setIsStartProjectModalOpen(true);
      }
    } else if (
      cleanName === 'cookie' ||
      cleanName === 'cookies' ||
      cleanName === 'cookie-policy' ||
      cleanName === 'cokkie' ||
      cleanName === '/cookie' ||
      cleanName === '/cookies' ||
      cleanName === '/cokkie'
    ) {
      window.history.pushState({}, '', '/cookie');
      setCurrentView('cookie-policy');
    } else if (
      cleanName === 'privacy' ||
      cleanName === 'privacy-policy' ||
      cleanName === 'provacy' ||
      cleanName === '/privacy' ||
      cleanName === '/provacy'
    ) {
      window.history.pushState({}, '', '/privacy');
      setCurrentView('privacy-policy');
    } else if (
      cleanName === 'terms' ||
      cleanName === 'terms-and-conditions' ||
      cleanName === 'terms-of-service' ||
      cleanName === '/terms'
    ) {
      window.history.pushState({}, '', '/terms');
      setCurrentView('terms');
    } else if (cleanName === '404' || cleanName === '/404' || cleanName === 'not-found') {
      window.history.pushState({}, '', '/404');
      setCurrentView('not-found');
    } else if (cleanName === '/' || cleanName === '' || cleanName === 'home') {
      window.history.pushState({}, '', '/');
      setActiveProject(null);
      setCurrentView('landing');
    } else if (isValidAppPath(cleanName)) {
      window.history.pushState({}, '', cleanName);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else {
      window.history.pushState({}, '', cleanName.startsWith('/') ? cleanName : `/${cleanName}`);
      setActiveProject(null);
      setCurrentView('not-found');
    }
  }, [activePromptText, activeProject]);

  // Route Protection: Unauthenticated visitors to /app, /history, /project, or app.gittoscale.tech are redirected to /signup
  useEffect(() => {
    if (isAuthLoading) return;
    // Never redirect while we are already on an auth view or unverified view
    if (currentView === 'signup' || currentView === 'signin' || currentView === 'unverified') return;
    const path = window.location.pathname;
    const isAuthRoute =
      path === '/signup' ||
      path === '/signin' ||
      path === '/forgot-password' ||
      path.startsWith('/auth');

    if (isAuthRoute) return;

    const isProtectedRoute =
      path.startsWith('/app') ||
      path.startsWith('/history') ||
      path.startsWith('/project') ||
      path.startsWith('/product');

    if (!user && isProtectedRoute) {
      const destination = path + window.location.search;
      window.history.pushState({}, '', `/signup?redirect=${encodeURIComponent(destination)}`);
      setCurrentView('signup');
    }
  }, [user, isAuthLoading, currentView]);

  useEffect(() => {
    const handlePopState = () => {
      if (isOAuthPopup()) {
        setCurrentView('auth-callback');
        return;
      }
      const rawPath = window.location.pathname.toLowerCase();
      const path = rawPath.replace(/\/+$/, '') || '/';
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (path === '/admin' || path.startsWith('/admin')) {
        setCurrentView('admin');
      } else if (path === '/payment/history' || path === '/payment-history' || path === '/billing' || path === '/subscription') {
        setCurrentView('payment-history');
      } else if (path === '/payment' || path.startsWith('/payment') || path === '/pricing') {
        setCurrentView('payment');
      } else if (path === '/collab' || path === '/meeting') {
        setCurrentView('collab-landing');
      } else if (path.startsWith('/collab/') || path.startsWith('/meeting/')) {
        const mId = getCollabMeetingId();
        if (mId) setCurrentView('collab-meeting');
        else setCurrentView('collab-landing');
      } else if (path === '/feed') {
        setCurrentView('feed');
      } else if (path === '/profile' || path.startsWith('/profile') || path.startsWith('/feed/profile/')) {
        setCurrentView('feed-profile');
      } else if (path === '/signup') {
        setCurrentView('signup');
      } else if (path === '/signin') {
        setCurrentView('signin');
      } else if (path === '/forgot-password') {
        setCurrentView('forgot-password');
      } else if (path.startsWith('/auth/callback')) {
        setCurrentView('auth-callback');
      } else if (path === '/history') {
        setCurrentView('history');
      } else if (
        path === '/cookie' ||
        path === '/cookies' ||
        path === '/cookie-policy' ||
        path === '/cokkie' ||
        path.startsWith('/cookie') ||
        path.startsWith('/cokkie')
      ) {
        setCurrentView('cookie-policy');
      } else if (
        path === '/privacy' ||
        path === '/privacy-policy' ||
        path === '/provacy' ||
        path.startsWith('/privacy') ||
        path.startsWith('/provacy')
      ) {
        setCurrentView('privacy-policy');
      } else if (
        path === '/terms' ||
        path === '/terms-and-conditions' ||
        path === '/terms-of-service' ||
        path.startsWith('/terms')
      ) {
        setCurrentView('terms');
      } else {
        const route = getProjectRouteInfo();
        if (route) {
          setActiveProject(route);
          if (route.prompt) setActivePromptText(route.prompt);
          setCurrentView('simulator');
        } else if (isRecommenderUrl()) {
          setCurrentView('recommender');
        } else if (isAppDomain()) {
          setCurrentView('simulator');
          if (!activePromptText && !activeProject?.prompt && !activeProject?.projectId) {
            setIsStartProjectModalOpen(true);
          }
        } else if (path === '/' || path === '') {
          setActiveProject(null);
          setCurrentView('landing');
        } else {
          setActiveProject(null);
          setCurrentView('not-found');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Mobile detection for responsive drawer layouts
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  // Sidebar collapse states - auto-collapse on smaller screens
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1280;
    }
    return false;
  });

  // Resizable left sidebar width (strictly capped at 2/5 = 40% of screen)
  const [leftSidebarWidth, setLeftSidebarWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('gitoscale_left_sidebar_width');
        if (saved) {
          const parsed = parseInt(saved, 10);
          const max = Math.floor(window.innerWidth * (2 / 5));
          const min = Math.min(280, max);
          if (!isNaN(parsed) && parsed >= min && parsed <= max) {
            return parsed;
          }
        }
      } catch {}
      return Math.min(340, Math.floor(window.innerWidth * (2 / 5)));
    }
    return 340;
  });
  const [isLeftDragging, setIsLeftDragging] = useState<boolean>(false);

  // Keep sidebars non-colliding on window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsLeftCollapsed(true);
        setIsRightCollapsed(true);
      } else if (window.innerWidth < 1024) {
        setIsLeftCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fixture states
  const [defaultArchitecture, setDefaultArchitecture] = useState<ArchitectureFixture | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioFixture[]>([]);
  const [currentScenarioId, setCurrentScenarioId] = useState<string>('normal-traffic');

  // Architecture view mode: 'detailed' (only detailed design)
  const [viewMode, setViewMode] = useState<'basic' | 'detailed'>('detailed');

  // Caches for instant switching between Basic and Detailed views
  const basicGraphCacheRef = useRef<{ nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } | null>(null);
  const detailedGraphCacheRef = useRef<{ nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } | null>(null);
  // Pristine baseline references to apply scenarios onto without mutating original definitions
  const baseBasicGraphRef = useRef<{ nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } | null>(null);
  const baseDetailedGraphRef = useRef<{ nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } | null>(null);

  // Architecture & simulation state
  const [nodes, setNodes] = useState<ArchitectureNode[]>([]);
  const [edges, setEdges] = useState<ArchitectureEdge[]>([]);
  const [incomingTrafficRate, setIncomingTrafficRate] = useState<number>(1000);
  const [durationSeconds, setDurationSeconds] = useState<number>(60);

  // Results & status
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectNode = useCallback(
    (id: string | null) => {
      setSelectedNodeId(id);
      if (id) {
        setIsRightCollapsed(false);
        if (window.innerWidth < 768) {
          setIsLeftCollapsed(true);
        }
      }
    },
    []
  );

  const handleOpenLeft = useCallback(() => {
    setIsLeftCollapsed(false);
    if (window.innerWidth < 768) {
      setIsRightCollapsed(true);
    }
  }, []);

  const handleOpenRight = useCallback(() => {
    setIsRightCollapsed(false);
    if (window.innerWidth < 768) {
      setIsLeftCollapsed(true);
    }
  }, []);

  // Universal Auto-Save: Automatically saves playground edits to browser storage immediately,
  // then debounces persistence to the real database to prevent data loss upon PC shutdown.
  const { saveStatus, lastSaved, forceSyncNow } = usePlaygroundPersistence({
    projectId: activeProject?.projectId || getProjectRouteInfo()?.projectId,
    prompt: activePromptText || activeProject?.prompt || '',
    title: activePromptText ? activePromptText.slice(0, 60) : 'Playground Architecture',
    nodes,
    edges,
    incomingTrafficRate,
    durationSeconds,
    viewMode,
    selectedAnswers,
    basicGraph: basicGraphCacheRef.current || undefined,
    detailedGraph: detailedGraphCacheRef.current || undefined,
    user,
    getAuthToken,
    enabled:
      currentView === 'simulator' &&
      Boolean(activePromptText || activeProject?.projectId || getProjectRouteInfo()?.projectId),
  });

  // Baseline comparison & project modals
  const [baseline, setBaseline] = useState<BaselineSnapshot | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [isImportRepoOpen, setIsImportRepoOpen] = useState<boolean>(false);
  const [isStartMeetingModalOpen, setIsStartMeetingModalOpen] = useState<boolean>(false);
  const [isStartProjectModalOpen, setIsStartProjectModalOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const search = new URLSearchParams(window.location.search);
    const route = getProjectRouteInfo();
    if (route?.prompt || route?.projectId || search.has('repo') || search.has('demo')) {
      return false;
    }
    return (path === '/app' || path === '/simulator') && !route?.projectId;
  });

  // Automatically prompt any user who arrives on /app or simulator without an active project or prompt
  useEffect(() => {
    if (currentView === 'simulator') {
      const search = new URLSearchParams(window.location.search);
      const route = getProjectRouteInfo();
      const hasActiveContext =
        Boolean(activePromptText) ||
        Boolean(activeProject?.prompt) ||
        Boolean(activeProject?.projectId) ||
        Boolean(route?.projectId) ||
        Boolean(route?.prompt) ||
        search.has('repo') ||
        search.has('demo');
      if (!hasActiveContext && nodes.length === 0) {
        setIsStartProjectModalOpen(true);
      }
    }
  }, [currentView, activePromptText, activeProject, nodes.length]);

  // Debounce ref for sliders
  const simulateDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Guard against React 18 StrictMode duplicate initialization
  const hasInitializedRef = useRef<boolean>(false);

  // 1. Load initial fixtures when entering simulator
  useEffect(() => {
    if (currentView !== 'simulator') return;
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    async function init() {
      try {
        setLoading(true);
        const [arch, scens] = await Promise.all([
          api.getArchitecture(),
          api.getScenarios(),
        ]);
        setDefaultArchitecture(arch);
        setScenarios(scens);

        // Populate basic & detailed cache and baseline fixtures
        baseBasicGraphRef.current = { nodes: arch.nodes, edges: arch.edges };
        basicGraphCacheRef.current = { nodes: arch.nodes, edges: arch.edges };
        if (arch.detailedGraph) {
          baseDetailedGraphRef.current = {
            nodes: arch.detailedGraph.nodes,
            edges: arch.detailedGraph.edges,
          };
          detailedGraphCacheRef.current = {
            nodes: arch.detailedGraph.nodes,
            edges: arch.detailedGraph.edges,
          };
        }

        // If URL has ?repo= parameter, automatically load that repository architecture
        const search = new URLSearchParams(window.location.search);
        const repoParam = search.get('repo');
        if (repoParam) {
          try {
            const res = await api.analyzeRepository({ repoUrl: repoParam });
            const repoName =
              res.repoName || repoParam.split('/').pop()?.replace('.git', '') || 'Repository';
            handleImportArchitecture(res.nodes, res.edges, repoName, res.basicGraph, res.detailedGraph, repoParam);
            return;
          } catch (repoErr) {
            console.error('Failed to auto-load repo from URL parameter:', repoErr);
            setError(`Failed to load repository "${repoParam}". Loaded default architecture.`);
          }
        }

        const route = getProjectRouteInfo();

        // 1. Check local ownership mismatch first (instant check for different accounts on same machine)
        if (route?.projectId && user?.id) {
          const storedOwner = localStorage.getItem(`gitoscale_project_owner_${route.projectId}`);
          if (storedOwner && storedOwner !== user.id) {
            setUnverifiedProjectId(route.projectId);
            setCurrentView('unverified');
            return;
          }
        }

        // 2. Recover from Browser Storage (Instant recovery upon sudden PC shutdown or refresh)
        const savedPlayground = loadPlaygroundFromBrowserStorage(route?.projectId, user?.id);
        if (savedPlayground && savedPlayground.nodes && savedPlayground.nodes.length > 0) {
          const targetDetailed = savedPlayground.detailedGraph && savedPlayground.detailedGraph.nodes?.length
            ? savedPlayground.detailedGraph
            : buildDetailedArchitecture(savedPlayground.nodes, savedPlayground.edges || [], savedPlayground.prompt);
          const verticalNodes = toVerticalTree(targetDetailed.nodes, targetDetailed.edges || []);
          setNodes(verticalNodes);
          setEdges(targetDetailed.edges || []);
          if (savedPlayground.incomingTrafficRate) {
            setIncomingTrafficRate(savedPlayground.incomingTrafficRate);
          }
          setViewMode('detailed');
          if (savedPlayground.prompt) {
            setActivePromptText(savedPlayground.prompt);
            lastGeneratedPromptRef.current = savedPlayground.prompt;
          }
          if (route?.projectId) {
            loadedHistoryProjectsRef.current.add(route.projectId);
          }
          baseDetailedGraphRef.current = { nodes: verticalNodes, edges: targetDetailed.edges || [] };
          detailedGraphCacheRef.current = { nodes: verticalNodes, edges: targetDetailed.edges || [] };
          queueSimulation(verticalNodes, targetDetailed.edges || [], savedPlayground.incomingTrafficRate || 1000, 60);
          return;
        }

        // 3. Recover from Cloud Database if user is authenticated and project exists
        if (route?.projectId && getAuthToken) {
          const token = getAuthToken();
          if (token) {
            try {
              const verifyRes = await api.verifyProjectAccess(token, route.projectId);
              if (verifyRes.status === 'unverified') {
                setUnverifiedProjectId(route.projectId);
                setCurrentView('unverified');
                return;
              }
              if (verifyRes.status === 'verified' && verifyRes.data?.architecture_data) {
                const archData = verifyRes.data.architecture_data;
                const restored = restoreArchitectureFromDb(
                  archData,
                  verifyRes.data.prompt
                );
                if (restored.nodes.length > 0) {
                  const genConfig = verifyRes.data.generation_config;
                  const targetDetailed = archData.detailedGraph && archData.detailedGraph.nodes?.length
                    ? archData.detailedGraph
                    : buildDetailedArchitecture(restored.nodes, restored.edges || [], verifyRes.data.prompt);
                  const verticalNodes = toVerticalTree(targetDetailed.nodes, targetDetailed.edges || []);
                  setNodes(verticalNodes);
                  setEdges(targetDetailed.edges || []);
                  if (genConfig?.incomingTrafficRate) {
                    setIncomingTrafficRate(genConfig.incomingTrafficRate);
                  }
                  setViewMode('detailed');
                  if (verifyRes.data.prompt) {
                    setActivePromptText(verifyRes.data.prompt);
                    lastGeneratedPromptRef.current = verifyRes.data.prompt;
                  }
                  loadedHistoryProjectsRef.current.add(route.projectId);
                  baseDetailedGraphRef.current = { nodes: verticalNodes, edges: targetDetailed.edges || [] };
                  detailedGraphCacheRef.current = { nodes: verticalNodes, edges: targetDetailed.edges || [] };
                  queueSimulation(
                    verticalNodes,
                    targetDetailed.edges || [],
                    genConfig?.incomingTrafficRate || 1000,
                    60
                  );
                  return;
                }
              }
            } catch (dbErr) {
              console.warn('Could not load architecture from database:', dbErr);
            }
          }
        }

        if (route?.prompt) {
          // Will be generated by prompt route effect
          return;
        }

        if (search.has('demo')) {
          // Apply normal traffic scenario by default for explicit demo
          applyScenario('normal-traffic', arch, scens, 'detailed');
        } else {
          // Do NOT show pre-canned playground on /app by default: prompt user for idea or repo
          const currentPath = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
          const currentRoute = getProjectRouteInfo();
          if (
            (currentPath === '/app' || currentPath === '/simulator') &&
            !currentRoute?.projectId &&
            !currentRoute?.prompt
          ) {
            setIsStartProjectModalOpen(true);
          }
        }
      } catch (err: unknown) {
        console.error('Failed to load initial fixtures:', err);
        setError('Failed to connect to simulation backend. Please ensure the backend is running.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // 2. Trigger simulation calculation
  const triggerSimulation = useCallback(
    async (
      currentNodes: ArchitectureNode[],
      currentEdges: ArchitectureEdge[],
      rate: number,
      duration: number
    ) => {
      if (!isRunning) return;
      if (!currentNodes || currentNodes.length === 0) return;
      try {
        setLoading(true);
        setError(null);
        const res = await api.simulate({
          nodes: currentNodes,
          edges: currentEdges,
          incomingTrafficRate: rate,
          durationSeconds: duration,
        });
        setSimulationResult(res);
      } catch (err: any) {
        console.error('Simulation request error:', err);
        const msg =
          err.response?.data?.message || err.message || 'Error occurred during simulation';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [isRunning]
  );

  // Debounced simulation runner
  const queueSimulation = useCallback(
    (
      currentNodes: ArchitectureNode[],
      currentEdges: ArchitectureEdge[],
      rate: number,
      duration: number
    ) => {
      if (!isRunning) return;
      if (simulateDebounceTimer.current) {
        clearTimeout(simulateDebounceTimer.current);
      }
      simulateDebounceTimer.current = setTimeout(() => {
        triggerSimulation(currentNodes, currentEdges, rate, duration);
      }, 150);
    },
    [isRunning, triggerSimulation]
  );

  // Generate / synthesize architecture directly from a prompt using vertical tree layout
  const handleGenerateFromPrompt = useCallback(
    async (promptText: string, customAnswers = selectedAnswers, targetProjectId?: string) => {
      if (!promptText.trim()) return;
      setActivePromptText(promptText);
      setIsGeneratingArchitecture(true);
      setError(null);
      try {
        const scaleMap: Record<string, string> = {
          scale_mvp: '< 1,000 req/s MVP',
          scale_growth: '10,000 req/s Growth Tier with Read Replicas',
          scale_burst: '50,000+ req/s Flash Sale Burst with Kafka stream',
        };

        const budgetMap: Record<string, string> = {
          budget_frugal: 'Serverless low cost (<$100/mo)',
          budget_balanced: 'Balanced cloud ECS/RDS ($500-$2000/mo)',
          budget_enterprise: 'Dedicated enterprise multi-region ($5000+/mo)',
        };

        const preferredTech: string[] = [];
        if (customAnswers?.consistency === 'consistency_eventual') {
          preferredTech.push('Event-Driven Queue');
        } else if (customAnswers?.consistency === 'consistency_strong') {
          preferredTech.push('Strong Consistency ACID');
        }
        if (customAnswers?.region === 'deploy_multiregion') {
          preferredTech.push('Global Multi-Region');
        }

        const payload: RecommenderInput = {
          projectDescription: promptText,
          expectedScale: customAnswers?.scale ? scaleMap[customAnswers.scale] : undefined,
          budgetConstraint: customAnswers?.budget ? budgetMap[customAnswers.budget] : undefined,
          preferredTech: preferredTech.length > 0 ? preferredTech : undefined,
          deploymentPreference:
            customAnswers?.region === 'deploy_multiregion' ? 'Multi-Region Active/Active' : undefined,
        };
        const res = await api.recommendArchitecture(payload);

        // Basic top-to-bottom vertical tree layout
        const verticalBasicNodes = toVerticalTree(res.nodes, res.edges);
        baseBasicGraphRef.current = { nodes: verticalBasicNodes, edges: res.edges };
        basicGraphCacheRef.current = { nodes: verticalBasicNodes, edges: res.edges };

        // Detailed architecture topology
        const detailed = buildDetailedArchitecture(res.nodes, res.edges, promptText);
        const verticalDetailedNodes = toVerticalTree(detailed.nodes, detailed.edges);
        baseDetailedGraphRef.current = { nodes: verticalDetailedNodes, edges: detailed.edges };
        detailedGraphCacheRef.current = { nodes: verticalDetailedNodes, edges: detailed.edges };

        setViewMode('detailed');
        setNodes(verticalDetailedNodes);
        setEdges(detailed.edges);
        triggerSimulation(verticalDetailedNodes, detailed.edges, incomingTrafficRate, durationSeconds);

        // Persist to architecture history in PostgreSQL if user is authenticated
        if (user) {
          const token = getAuthToken();
          const projId = targetProjectId || activeProject?.projectId;
          const dbPayload = formatArchitectureForDb(
            verticalBasicNodes,
            res.edges,
            promptText,
            {
              basicGraph: { nodes: verticalBasicNodes, edges: res.edges },
              detailedGraph: { nodes: verticalDetailedNodes, edges: detailed.edges },
              incomingTrafficRate,
              durationSeconds,
            }
          );
          api.saveArchitectureHistory(token, {
            title: promptText.slice(0, 60),
            prompt: promptText,
            generationConfig: {
              ...customAnswers,
              projectId: projId,
              incomingTrafficRate,
              durationSeconds,
              viewMode,
            },
            architectureData: dbPayload,
            status: 'completed',
          }).catch((histErr) => {
            console.warn('Could not persist architecture history:', histErr);
          });
        }
      } catch (err: any) {
        console.error('Error generating architecture for prompt:', err);
        setError(err?.response?.data?.message || err?.message || 'Failed to generate architecture for prompt');
      } finally {
        setIsGeneratingArchitecture(false);
      }
    },
    [incomingTrafficRate, durationSeconds, triggerSimulation, selectedAnswers, user, getAuthToken, activeProject?.projectId, viewMode]
  );

  // AI Refine callback from left sidebar
  const handleRefinePrompt = useCallback(
    async (refinement: string) => {
      const updatedPrompt = activePromptText ? `${activePromptText} • ${refinement}` : refinement;
      await handleGenerateFromPrompt(updatedPrompt);
    },
    [activePromptText, handleGenerateFromPrompt]
  );

  // Full-featured conversational AI command executor (Context of up to 200 chats & DB persistence)
  const handleExecuteChatCommand = useCallback(
    async (
      command: string,
      chatHistory: any[],
      onToken?: (token: string, fullText: string) => void
    ): Promise<{ reply: string; actionDone?: string; updatedAnswers?: any } | void> => {
      // 1. Analyze command via local AI agent executor (DO NOT mutate canvas yet!)
      const execResult = executeArchitectureCommand(
        command,
        nodes,
        edges,
        incomingTrafficRate,
        simulationResult,
        chatHistory,
        viewMode
      );

      // If it's a structural transformation or system generation prompt
      const isSystemGeneration = !execResult.executed && isArchitectureGenerationRequest(command, nodes.length);
      let targetGenerationPrompt = command;

      let generationPromise: Promise<any> | null = null;
      if (isSystemGeneration) {
        const lowerCmd = command.toLowerCase();
        const isMetaCanvasQuery =
          lowerCmd.includes('didnt show') ||
          lowerCmd.includes("didn't show") ||
          lowerCmd.includes('show the architect') ||
          lowerCmd.includes('show the architecture') ||
          lowerCmd.includes('show architecture') ||
          lowerCmd.includes('in the canvas') ||
          lowerCmd.includes('on the canvas') ||
          lowerCmd.includes('on canvas') ||
          lowerCmd.includes('canvas didnt update') ||
          lowerCmd.includes("canvas didn't update");

        if (isMetaCanvasQuery) {
          if (activePromptText && activePromptText.trim().length > 0) {
            targetGenerationPrompt = activePromptText;
          } else {
            const pastUserMsg = chatHistory.findLast(
              (m: any) =>
                m.sender === 'user' &&
                m.text &&
                !m.text.toLowerCase().includes('canvas') &&
                !m.text.toLowerCase().includes('didnt show') &&
                !m.text.toLowerCase().includes("didn't show")
            );
            targetGenerationPrompt =
              pastUserMsg?.text ||
              'Scalable distributed cloud architecture with API Gateway, microservices, and database';
          }
        } else {
          // If the user is requesting a new architecture, use the command directly
          targetGenerationPrompt = command;
        }

        setActivePromptText(targetGenerationPrompt);
        generationPromise = api
          .recommendArchitecture({
            projectDescription: targetGenerationPrompt,
            expectedScale: selectedAnswers?.scale ? undefined : undefined,
          })
          .catch((err) => {
            console.warn('[handleExecuteChatCommand] Architecture generation error:', err);
            return null;
          });
      }

      // Check if user gave an architectural modification instruction that should refine the canvas
      const isRefinementInstruction =
        !isSystemGeneration &&
        (/(?:add|remove|delete|scale|connect|disconnect|update|change|increase|decrease|optimize|refine|improve|tune|set|modify|replace|insert|attach|put|deploy|provision|integrate|include)\s+/i.test(
          command
        ) ||
        /(?:more|higher|lower|less|better)\s+(?:capacity|workers|traffic|load|latency|throughput|cache|replicas)/i.test(
          command
        ));

      let refinementPromise: Promise<any> | null = null;
      if (isRefinementInstruction) {
        refinementPromise = api
          .recommendArchitecture({
            projectDescription: activePromptText || 'Current System Architecture',
            refinementRequest: command,
          })
          .catch((err) => {
            console.warn('[handleExecuteChatCommand] Architecture refinement error:', err);
            return null;
          });
      }

      // 2. Fetch real AI response with token-by-token streaming
      // Canvas is NOT mutated while streaming so the user experiences zero UI jumps/flashes!
      const REFUSAL_TEST_REGEX = /(?:don'?t have (?:direct\s+)?programmatic control to (?:draw|paint|place|render) nodes|cannot (?:directly\s+)?(?:draw|place|render) (?:visual\s+)?nodes on (?:the\s+)?canvas)/i;
      let streamedRefusalDetected = false;
      const fallbackExecExplanation = (execResult.executed && execResult.explanation) ? execResult.explanation : '';

      try {
        const token = getAuthToken();
        const aiResponse = await api.streamChatMessage(
          token,
          {
            message: command,
            history: chatHistory,
            architectureContext: {
              nodes,
              edges,
              trafficRate: incomingTrafficRate,
              bottlenecks: simulationResult?.bottlenecks || [],
              projectDescription: activePromptText || undefined,
              activePrompt: activePromptText || undefined,
            },
          },
          (tokenChunk, fullText) => {
            if (REFUSAL_TEST_REGEX.test(fullText)) {
              streamedRefusalDetected = true;
              if (fallbackExecExplanation) {
                onToken?.('', fallbackExecExplanation);
              }
              return;
            }
            if (!streamedRefusalDetected) {
              onToken?.(tokenChunk, fullText);
            }
          }
        );

        // 3. AI response stream has now COMPLETELY ENDED. Apply topology updates to canvas!
        let finalNodes = nodes;
        let finalEdges = edges;
        let finalRate = incomingTrafficRate;

        // Check A: Did the AI in chat include a Mermaid architecture diagram in its response?
        const replyForDiagram = aiResponse?.reply || '';
        const mermaidMatch = replyForDiagram.match(/```(?:mermaid)?\s*\n?([\s\S]*?)```/i);
        let parsedFromMermaid: { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } | null = null;
        if (mermaidMatch && mermaidMatch[1]) {
          try {
            const parsed = parseMermaidToArchitecture(mermaidMatch[1]);
            if (parsed.nodes && parsed.nodes.length > 0) {
              parsedFromMermaid = parsed;
            }
          } catch (mErr) {
            console.warn('[handleExecuteChatCommand] Mermaid parsing failed:', mErr);
          }
        }

        let canvasUpdated = false;

        if (parsedFromMermaid && parsedFromMermaid.nodes.length > 0) {
          const verticalBasicNodes = toVerticalTree(parsedFromMermaid.nodes, parsedFromMermaid.edges);
          baseBasicGraphRef.current = { nodes: verticalBasicNodes, edges: parsedFromMermaid.edges };
          basicGraphCacheRef.current = { nodes: verticalBasicNodes, edges: parsedFromMermaid.edges };

          const detailed = buildDetailedArchitecture(
            parsedFromMermaid.nodes,
            parsedFromMermaid.edges,
            targetGenerationPrompt || activePromptText || command
          );
          const verticalDetailedNodes = toVerticalTree(detailed.nodes, detailed.edges);
          baseDetailedGraphRef.current = { nodes: verticalDetailedNodes, edges: detailed.edges };
          detailedGraphCacheRef.current = { nodes: verticalDetailedNodes, edges: detailed.edges };

          if (viewMode === 'detailed') {
            finalNodes = verticalDetailedNodes;
            finalEdges = detailed.edges;
          } else {
            finalNodes = verticalBasicNodes;
            finalEdges = parsedFromMermaid.edges;
          }

          setNodes(finalNodes);
          setEdges(finalEdges);
          queueSimulation(finalNodes, finalEdges, finalRate, durationSeconds);
          canvasUpdated = true;
        } else if (generationPromise) {
          const gen = await generationPromise;
          if (gen?.nodes?.length > 0) {
            const verticalBasicNodes = toVerticalTree(gen.nodes, gen.edges);
            baseBasicGraphRef.current = { nodes: verticalBasicNodes, edges: gen.edges };
            basicGraphCacheRef.current = { nodes: verticalBasicNodes, edges: gen.edges };

            const detailed = buildDetailedArchitecture(gen.nodes, gen.edges, targetGenerationPrompt);
            const verticalDetailedNodes = toVerticalTree(detailed.nodes, detailed.edges);
            baseDetailedGraphRef.current = { nodes: verticalDetailedNodes, edges: detailed.edges };
            detailedGraphCacheRef.current = { nodes: verticalDetailedNodes, edges: detailed.edges };

            if (viewMode === 'detailed') {
              finalNodes = verticalDetailedNodes;
              finalEdges = detailed.edges;
            } else {
              finalNodes = verticalBasicNodes;
              finalEdges = gen.edges;
            }

            setNodes(finalNodes);
            setEdges(finalEdges);
            queueSimulation(finalNodes, finalEdges, finalRate, durationSeconds);
            canvasUpdated = true;
          }
        } else if (refinementPromise) {
          const refined = await refinementPromise;
          if (refined?.nodes?.length > 0) {
            const verticalBasicNodes = toVerticalTree(refined.nodes, refined.edges);
            baseBasicGraphRef.current = { nodes: verticalBasicNodes, edges: refined.edges };
            basicGraphCacheRef.current = { nodes: verticalBasicNodes, edges: refined.edges };

            const detailed = buildDetailedArchitecture(refined.nodes, refined.edges, activePromptText);
            const verticalDetailedNodes = toVerticalTree(detailed.nodes, detailed.edges);
            baseDetailedGraphRef.current = { nodes: verticalDetailedNodes, edges: detailed.edges };
            detailedGraphCacheRef.current = { nodes: verticalDetailedNodes, edges: detailed.edges };

            if (viewMode === 'detailed') {
              finalNodes = verticalDetailedNodes;
              finalEdges = detailed.edges;
            } else {
              finalNodes = verticalBasicNodes;
              finalEdges = refined.edges;
            }

            setNodes(finalNodes);
            setEdges(finalEdges);
            queueSimulation(finalNodes, finalEdges, finalRate, durationSeconds);
            canvasUpdated = true;
          }
        } else if (execResult.executed) {
          if (execResult.targetViewMode && execResult.targetViewMode !== viewMode) {
            setViewMode(execResult.targetViewMode);
          }

          if (execResult.updatedNodes) {
            finalNodes = execResult.updatedNodes;
            setNodes(finalNodes);
            if (execResult.targetViewMode === 'detailed' || viewMode === 'detailed') {
              detailedGraphCacheRef.current = { nodes: finalNodes, edges: execResult.updatedEdges || edges };
              baseDetailedGraphRef.current = { nodes: finalNodes, edges: execResult.updatedEdges || edges };
            } else {
              baseBasicGraphRef.current = { nodes: finalNodes, edges: execResult.updatedEdges || edges };
              basicGraphCacheRef.current = { nodes: finalNodes, edges: execResult.updatedEdges || edges };
            }
          }
          if (execResult.updatedEdges) {
            finalEdges = execResult.updatedEdges;
            setEdges(finalEdges);
          }
          if (execResult.updatedTrafficRate) {
            finalRate = execResult.updatedTrafficRate;
            setIncomingTrafficRate(finalRate);
          }

          queueSimulation(finalNodes, finalEdges, finalRate, durationSeconds);
          canvasUpdated = true;
        }

        // Guaranteed fallback: If canvas has not yet been updated, but the command was an architecture generation request
        if (!canvasUpdated && (isSystemGeneration || isArchitectureGenerationRequest(command, nodes.length))) {
          try {
            const fallbackGen = await api.recommendArchitecture({
              projectDescription: targetGenerationPrompt || command,
            });
            if (fallbackGen?.nodes?.length > 0) {
              const verticalBasicNodes = toVerticalTree(fallbackGen.nodes, fallbackGen.edges);
              baseBasicGraphRef.current = { nodes: verticalBasicNodes, edges: fallbackGen.edges };
              basicGraphCacheRef.current = { nodes: verticalBasicNodes, edges: fallbackGen.edges };

              const detailed = buildDetailedArchitecture(
                fallbackGen.nodes,
                fallbackGen.edges,
                targetGenerationPrompt || command
              );
              const verticalDetailedNodes = toVerticalTree(detailed.nodes, detailed.edges);
              baseDetailedGraphRef.current = { nodes: verticalDetailedNodes, edges: detailed.edges };
              detailedGraphCacheRef.current = { nodes: verticalDetailedNodes, edges: detailed.edges };

              finalNodes = viewMode === 'detailed' ? verticalDetailedNodes : verticalBasicNodes;
              finalEdges = viewMode === 'detailed' ? detailed.edges : fallbackGen.edges;

              setNodes(finalNodes);
              setEdges(finalEdges);
              queueSimulation(finalNodes, finalEdges, finalRate, durationSeconds);
            }
          } catch (fallbackErr) {
            console.warn('[handleExecuteChatCommand] Final fallback architecture recommendation error:', fallbackErr);
          }
        }

        const effectiveReply =
          ((streamedRefusalDetected || REFUSAL_TEST_REGEX.test(aiResponse?.reply || '')) && fallbackExecExplanation)
            ? fallbackExecExplanation
            : (aiResponse?.reply || fallbackExecExplanation);

        if (effectiveReply) {
          if (user) {
            api.saveChatHistory(token, {
              prompt: activePromptText,
              messages: [
                ...chatHistory,
                { id: `ai-${Date.now()}`, sender: 'ai', text: effectiveReply },
              ],
              selectedAnswers,
              architectureData: { nodes: finalNodes, edges: finalEdges },
            }).catch((err) => console.warn('Could not sync chat history to DB:', err));
          }
          return {
            reply: effectiveReply,
            actionDone: aiResponse?.actionDone || (execResult.executed ? execResult.actionType : undefined),
          };
        }
      } catch (err) {
        console.warn('[AI Chat Agent] Backend chat request error:', err);
        const errMsg = fallbackExecExplanation || 'Traffic is more than expected. Please retry later.';
        onToken?.(errMsg, errMsg);
        return {
          reply: errMsg,
          actionDone: execResult.executed ? execResult.actionType : undefined,
        };
      }

      return {
        reply: fallbackExecExplanation || 'Traffic is more than expected. Please retry later.',
      };
    },
    [
      nodes,
      edges,
      incomingTrafficRate,
      durationSeconds,
      simulationResult,
      queueSimulation,
      user,
      getAuthToken,
      activePromptText,
      selectedAnswers,
      viewMode,
    ]
  );

  const handleAnswerSelected = useCallback((category: string, optionId: string) => {
    setSelectedAnswers((prev) => {
      const updated = { ...prev, [category]: optionId };
      handleGenerateFromPrompt(activePromptText, updated);
      return updated;
    });
  }, [activePromptText, handleGenerateFromPrompt]);

  const handleApplyRefinements = useCallback(() => {
    handleGenerateFromPrompt(activePromptText);
  }, [activePromptText, handleGenerateFromPrompt]);

  const handleResetQuestions = useCallback(() => {
    setSelectedAnswers({});
  }, []);

  const handleSendCustomMessage = useCallback((msg: string) => {
    handleRefinePrompt(msg);
  }, [handleRefinePrompt]);

  const handleRestoreSession = useCallback(({ selectedAnswers: restored, activePrompt: restoredPrompt }: any) => {
    if (restored) setSelectedAnswers(restored);
    if (restoredPrompt) setActivePromptText(restoredPrompt);
  }, []);

  const handleCollapseLeft = useCallback(() => {
    setIsLeftCollapsed(true);
  }, []);

  // Directly navigate to simulator and generate architecture on prompt submit
  const handleStartProject = useCallback(
    (promptText: string) => {
      const projectId = 'prj_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`gitoscale_project_${projectId}`, promptText);
      }

      const projectPath = `/project/${projectId}?prompt=${encodeURIComponent(promptText)}`;

      if (!user) {
        savePendingAction({
          type: 'prompt',
          prompt: promptText,
          projectId,
          returnUrl: projectPath,
          customAnswers: selectedAnswers,
          createdAt: Date.now(),
        });
        window.history.pushState({}, '', `/signup?redirect=${encodeURIComponent(projectPath)}`);
        setCurrentView('signup');
        return;
      }

      setIsStartProjectModalOpen(false);
      lastGeneratedPromptRef.current = promptText;
      window.history.pushState({ projectId, prompt: promptText }, '', projectPath);
      setActiveProject({ projectId, prompt: promptText });
      setCurrentView('simulator');
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
      setSimulationResult(null);
      baseBasicGraphRef.current = null;
      basicGraphCacheRef.current = null;
      baseDetailedGraphRef.current = null;
      detailedGraphCacheRef.current = null;
      setActivePromptText(promptText);
      handleGenerateFromPrompt(promptText, undefined, projectId);
    },
    [user, savePendingAction, selectedAnswers, handleGenerateFromPrompt]
  );

  const handleStartBlankProject = useCallback(() => {
    const projectId = 'prj_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    const projectPath = `/app/${projectId}`;

    setIsStartProjectModalOpen(false);
    lastGeneratedPromptRef.current = null;
    window.history.pushState({ projectId, prompt: '' }, '', projectPath);
    setActiveProject({ projectId, prompt: '' });
    setCurrentView('simulator');
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setSimulationResult(null);
    baseBasicGraphRef.current = { nodes: [], edges: [] };
    basicGraphCacheRef.current = { nodes: [], edges: [] };
    baseDetailedGraphRef.current = { nodes: [], edges: [] };
    detailedGraphCacheRef.current = { nodes: [], edges: [] };
    // Leave prompt empty: do NOT add any prompt to AI
    setActivePromptText('');
    // Keep AI Architect chat collapsed so the user has the entire blank ground open to build
    setIsLeftCollapsed(true);
    // Keep right sidebar open on Components tab so user can immediately add components
    setIsRightCollapsed(false);

    try {
      localStorage.removeItem(`gitoscale_chat_${projectId}`);
      localStorage.removeItem(`gitoscale_arch_${projectId}`);
      localStorage.removeItem(`gitoscale_project_${projectId}`);
      localStorage.removeItem(`gitoscale_project_state_${projectId}`);
    } catch {}
  }, []);

  const handleRequireAuthForRepo = useCallback(
    (repoUrl: string, llmConfig?: any) => {
      const projectId = 'prj_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      const projectPath = `/project/${projectId}?repo=${encodeURIComponent(repoUrl)}`;

      savePendingAction({
        type: 'repo',
        repoUrl,
        projectId,
        returnUrl: projectPath,
        llmConfig,
        createdAt: Date.now(),
      });
      window.history.pushState({}, '', `/signup?redirect=${encodeURIComponent(projectPath)}`);
      setCurrentView('signup');
    },
    [savePendingAction]
  );

  // Check URL on mount if prompt query is present
  const lastGeneratedPromptRef = useRef<string | null>(null);
  useEffect(() => {
    const route = getProjectRouteInfo();
    if (route?.prompt && lastGeneratedPromptRef.current !== route.prompt) {
      if (currentView === 'unverified') return;
      // Do not send LLM request if project is loaded from history or has existing architecture cached
      if (
        route.projectId &&
        (loadedHistoryProjectsRef.current.has(route.projectId) ||
          localStorage.getItem(`gitoscale_arch_${route.projectId}`) ||
          localStorage.getItem(`gitoscale_project_state_${route.projectId}`))
      ) {
        lastGeneratedPromptRef.current = route.prompt;
        return;
      }
      lastGeneratedPromptRef.current = route.prompt;
      handleGenerateFromPrompt(route.prompt, undefined, route.projectId);
    }
  }, [handleGenerateFromPrompt, currentView]);

  // Helper to apply scenario overrides to any graph without side effects
  const applyScenarioToGraph = (
    baseGraph: { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] },
    scen: ScenarioFixture
  ): { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } => {
    let newNodes: ArchitectureNode[] = structuredClone(baseGraph.nodes);
    let newEdges: ArchitectureEdge[] = structuredClone(baseGraph.edges);

    // Apply node overrides (matching direct node id or parentId for detailed submodules)
    if (scen.nodeOverrides && Object.keys(scen.nodeOverrides).length > 0) {
      newNodes = newNodes.map((node) => {
        const override =
          scen.nodeOverrides?.[node.id] ||
          (node.parentId ? scen.nodeOverrides?.[node.parentId] : undefined);
        if (override) {
          return {
            ...node,
            ...override,
            config: {
              ...node.config,
              ...(override.config || {}),
            },
          };
        }
        return node;
      });
    }

    // Apply edge overrides
    if (scen.edgeOverrides && Object.keys(scen.edgeOverrides).length > 0) {
      newEdges = newEdges.map((edge) => {
        const override = scen.edgeOverrides?.[edge.id];
        if (override) {
          return { ...edge, ...override };
        }
        return edge;
      });
    }

    return { nodes: newNodes, edges: newEdges };
  };

  // 3. Apply scenario logic (respects current viewMode so Detailed View is preserved)
  const applyScenario = (
    scenarioId: string,
    archFixture?: ArchitectureFixture | null,
    scensList = scenarios,
    overrideViewMode?: 'basic' | 'detailed'
  ) => {
    const scen = scensList.find((s) => s.id === scenarioId);
    if (!scen) return;

    setCurrentScenarioId(scenarioId);
    const targetRate = scen.incomingTrafficRate;
    const targetDuration = scen.durationSeconds;
    setIncomingTrafficRate(targetRate);
    setDurationSeconds(targetDuration);

    const activeMode = overrideViewMode || viewMode;

    // 1. Update basic graph cache with this scenario applied to basic baseline
    const basicBase =
      archFixture?.basicGraph ||
      (archFixture && archFixture.nodes ? archFixture : null) ||
      baseBasicGraphRef.current ||
      defaultArchitecture;

    if (basicBase && basicBase.nodes) {
      basicGraphCacheRef.current = applyScenarioToGraph(basicBase, scen);
    }

    // 2. Update detailed graph cache with this scenario applied to detailed baseline
    const detailedBase =
      archFixture?.detailedGraph ||
      baseDetailedGraphRef.current ||
      defaultArchitecture?.detailedGraph;

    if (detailedBase && detailedBase.nodes) {
      detailedGraphCacheRef.current = applyScenarioToGraph(detailedBase, scen);
    }

    // 3. Render the active graph according to the active viewMode
    const activeGraph =
      activeMode === 'detailed'
        ? detailedGraphCacheRef.current
        : basicGraphCacheRef.current;

    if (activeGraph && activeGraph.nodes && activeGraph.nodes.length > 0) {
      setNodes(activeGraph.nodes);
      setEdges(activeGraph.edges);
      triggerSimulation(activeGraph.nodes, activeGraph.edges, targetRate, targetDuration);
    }
  };

  // 4. Parameter handlers
  const handleTrafficChange = (newRate: number) => {
    setIncomingTrafficRate(newRate);
    queueSimulation(nodes, edges, newRate, durationSeconds);
  };

  const handleNodesPositionChange = (updatedNodes: ArchitectureNode[]) => {
    setNodes(updatedNodes);
    // Node position changes do NOT trigger re-simulation
  };

  const handleUpdateNode = (updatedNode: ArchitectureNode) => {
    const updated = nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n));
    setNodes(updated);
    queueSimulation(updated, edges, incomingTrafficRate, durationSeconds);
  };

  const handleToggleNode = (nodeId: string) => {
    const updated = nodes.map((n) => (n.id === nodeId ? { ...n, enabled: !n.enabled } : n));
    setNodes(updated);
    queueSimulation(updated, edges, incomingTrafficRate, durationSeconds);
  };

  const handleDeleteNode = (nodeId: string) => {
    const updatedNodes = nodes.filter((n) => n.id !== nodeId);
    const updatedEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
    setNodes(updatedNodes);
    setEdges(updatedEdges);

    // Keep all internal graph cache refs in sync so deleted nodes don't resurrect
    if (detailedGraphCacheRef.current) {
      detailedGraphCacheRef.current = {
        nodes: detailedGraphCacheRef.current.nodes.filter((n) => n.id !== nodeId),
        edges: detailedGraphCacheRef.current.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      };
    }
    if (baseDetailedGraphRef.current) {
      baseDetailedGraphRef.current = {
        nodes: baseDetailedGraphRef.current.nodes.filter((n) => n.id !== nodeId),
        edges: baseDetailedGraphRef.current.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      };
    }
    if (basicGraphCacheRef.current) {
      basicGraphCacheRef.current = {
        nodes: basicGraphCacheRef.current.nodes.filter((n) => n.id !== nodeId),
        edges: basicGraphCacheRef.current.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      };
    }
    if (baseBasicGraphRef.current) {
      baseBasicGraphRef.current = {
        nodes: baseBasicGraphRef.current.nodes.filter((n) => n.id !== nodeId),
        edges: baseBasicGraphRef.current.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      };
    }

    if (updatedNodes.length === 0) {
      setSimulationResult(null);
    } else {
      queueSimulation(updatedNodes, updatedEdges, incomingTrafficRate, durationSeconds);
    }
  };

  const handleAddNode = (type: ComponentType, name: string) => {
    const newId = `${type}-${Date.now().toString().slice(-4)}`;
    // Avoid nodes piling over each other: use smart 3-column non-overlapping grid layout
    const NODE_W = 280;
    const NODE_H = 160;
    let targetX = 350;
    let targetY = 140;
    for (let i = 0; i < 50; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const testX = 320 + col * (NODE_W + 50);
      const testY = 140 + row * (NODE_H + 50);
      const collides = nodes.some(
        (n) => Math.abs((n.position?.x ?? 0) - testX) < NODE_W && Math.abs((n.position?.y ?? 0) - testY) < NODE_H
      );
      if (!collides) {
        targetX = testX;
        targetY = testY;
        break;
      }
    }
    const newNode: ArchitectureNode = {
      id: newId,
      name,
      type,
      position: { x: targetX, y: targetY },
      capacityPerSecond: type === 'database' ? 600 : type === 'cache' ? 2500 : 800,
      workerCount: 2,
      enabled: true,
      config: {
        baselineLatencyMs: type === 'database' ? 30 : type === 'cache' ? 2 : 15,
        maxQueueSize: 2000,
        overflowPolicy: 'reject',
      },
    };
    const updated = [...nodes, newNode];
    setNodes(updated);
    setSelectedNodeId(newId);

    // Keep cache refs in sync with newly created node
    if (detailedGraphCacheRef.current) {
      detailedGraphCacheRef.current = {
        nodes: [...(detailedGraphCacheRef.current.nodes || []).filter((n) => n.id !== newId), newNode],
        edges: detailedGraphCacheRef.current.edges || edges,
      };
    } else {
      detailedGraphCacheRef.current = { nodes: updated, edges };
    }
    if (baseDetailedGraphRef.current) {
      baseDetailedGraphRef.current = {
        nodes: [...(baseDetailedGraphRef.current.nodes || []).filter((n) => n.id !== newId), newNode],
        edges: baseDetailedGraphRef.current.edges || edges,
      };
    } else {
      baseDetailedGraphRef.current = { nodes: updated, edges };
    }
    if (basicGraphCacheRef.current) {
      basicGraphCacheRef.current = {
        nodes: [...(basicGraphCacheRef.current.nodes || []).filter((n) => n.id !== newId), newNode],
        edges: basicGraphCacheRef.current.edges || edges,
      };
    }

    queueSimulation(updated, edges, incomingTrafficRate, durationSeconds);
  };

  const handleAddEdge = (newEdge: ArchitectureEdge) => {
    const edgeWithDefaults: ArchitectureEdge = {
      isBidirectional: true,
      ...newEdge,
    };
    const updated = [...edges, edgeWithDefaults];
    setEdges(updated);
    if (viewMode === 'detailed' && detailedGraphCacheRef.current) {
      detailedGraphCacheRef.current.edges = updated;
    } else if (viewMode === 'basic' && basicGraphCacheRef.current) {
      basicGraphCacheRef.current.edges = updated;
    }
    queueSimulation(nodes, updated, incomingTrafficRate, durationSeconds);
  };

  const handleToggleEdge = (edgeId: string) => {
    const updated = edges.map((e) => (e.id === edgeId ? { ...e, enabled: !e.enabled } : e));
    setEdges(updated);
    queueSimulation(nodes, updated, incomingTrafficRate, durationSeconds);
  };

  const handleDeleteEdge = (edgeId: string) => {
    const updated = edges.filter((e) => e.id !== edgeId);
    setEdges(updated);
    if (viewMode === 'detailed' && detailedGraphCacheRef.current) {
      detailedGraphCacheRef.current.edges = updated;
    } else if (viewMode === 'basic' && basicGraphCacheRef.current) {
      basicGraphCacheRef.current.edges = updated;
    }
    queueSimulation(nodes, updated, incomingTrafficRate, durationSeconds);
  };

  const handleUpdateEdge = useCallback(
    (edgeId: string, updates: Partial<ArchitectureEdge>) => {
      const updated = edges.map((e) => (e.id === edgeId ? { ...e, ...updates } : e));
      setEdges(updated);
      if (viewMode === 'detailed' && detailedGraphCacheRef.current) {
        detailedGraphCacheRef.current.edges = updated;
      } else if (viewMode === 'basic' && basicGraphCacheRef.current) {
        basicGraphCacheRef.current.edges = updated;
      }
      queueSimulation(nodes, updated, incomingTrafficRate, durationSeconds);
    },
    [edges, nodes, incomingTrafficRate, durationSeconds, viewMode, queueSimulation]
  );

  const handleUpdateEdgeMultiplier = (edgeId: string, multiplier: number) => {
    handleUpdateEdge(edgeId, { requestsPerInput: multiplier });
  };

  // 5. Reset to current scenario fixture
  const handleReset = () => {
    applyScenario(currentScenarioId);
  };

  // 6. Restore original default architecture
  const handleRestoreOriginal = () => {
    if (defaultArchitecture) {
      applyScenario('normal-traffic', defaultArchitecture);
    }
  };

  // 7. Baseline handlers
  const handleSaveBaseline = () => {
    if (simulationResult) {
      const currentScen = scenarios.find((s) => s.id === currentScenarioId);
      setBaseline({
        timestamp: new Date().toLocaleTimeString(),
        scenarioName: currentScen?.name || 'Custom Architecture',
        metrics: { ...simulationResult.metrics },
        nodeResults: { ...simulationResult.nodeResults },
      });
    }
  };

  // 8. View Mode Toggle (Basic <-> Detailed)
  const handleToggleViewMode = async (targetMode: 'basic' | 'detailed') => {
    if (targetMode === viewMode) return;
    setViewMode(targetMode);

    if (targetMode === 'detailed') {
      // Save current basic graph into cache
      basicGraphCacheRef.current = { nodes, edges };

      if (detailedGraphCacheRef.current && detailedGraphCacheRef.current.nodes.length > 0) {
        const nextNodes = detailedGraphCacheRef.current.nodes;
        const nextEdges = detailedGraphCacheRef.current.edges;
        setNodes(nextNodes);
        setEdges(nextEdges);
        setSelectedNodeId(null);
        triggerSimulation(nextNodes, nextEdges, incomingTrafficRate, durationSeconds);
      } else {
        const detailed = buildDetailedArchitecture(nodes, edges, activePromptText);
        const verticalDetailed = toVerticalTree(detailed.nodes, detailed.edges);
        baseDetailedGraphRef.current = { nodes: verticalDetailed, edges: detailed.edges };
        detailedGraphCacheRef.current = { nodes: verticalDetailed, edges: detailed.edges };
        setNodes(verticalDetailed);
        setEdges(detailed.edges);
        setSelectedNodeId(null);
        triggerSimulation(verticalDetailed, detailed.edges, incomingTrafficRate, durationSeconds);
      }
    } else {
      // Switching to Basic View
      detailedGraphCacheRef.current = { nodes, edges };

      if (basicGraphCacheRef.current && basicGraphCacheRef.current.nodes.length > 0) {
        const nextNodes = basicGraphCacheRef.current.nodes;
        const nextEdges = basicGraphCacheRef.current.edges;
        setNodes(nextNodes);
        setEdges(nextEdges);
        setSelectedNodeId(null);
        triggerSimulation(nextNodes, nextEdges, incomingTrafficRate, durationSeconds);
      } else if (defaultArchitecture) {
        setNodes(defaultArchitecture.nodes);
        setEdges(defaultArchitecture.edges);
        setSelectedNodeId(null);
        triggerSimulation(defaultArchitecture.nodes, defaultArchitecture.edges, incomingTrafficRate, durationSeconds);
      }
    }
  };

  const handleNavigateToParent = (parentId: string) => {
    setSelectedNodeId(parentId);
  };

  // 9. Repository Import handler
  const handleImportArchitecture = useCallback(
    (
      newNodes: ArchitectureNode[],
      newEdges: ArchitectureEdge[],
      repoName: string,
      basicGraph?: { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] },
      detailedGraph?: { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] },
      repoUrl?: string
    ) => {
      const basicToUse = basicGraph || { nodes: newNodes, edges: newEdges };
      baseBasicGraphRef.current = structuredClone(basicToUse);
      basicGraphCacheRef.current = structuredClone(basicToUse);

      if (detailedGraph) {
        baseDetailedGraphRef.current = structuredClone(detailedGraph);
        detailedGraphCacheRef.current = structuredClone(detailedGraph);
      } else {
        baseDetailedGraphRef.current = null;
        detailedGraphCacheRef.current = null;
      }

      const promptLabel = repoName ? `Repository: ${repoName}` : 'Imported Repository Architecture';
      const projectId = 'prj_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      const projectPath = `/project/${projectId}${repoUrl ? `?repo=${encodeURIComponent(repoUrl)}` : ''}`;

      window.history.pushState({ projectId, prompt: promptLabel }, '', projectPath);
      setActiveProject({ projectId, prompt: promptLabel });
      setActivePromptText(promptLabel);
      setSelectedNodeId(null);
      setSimulationResult(null);

      const detailedToUse = detailedGraph && detailedGraph.nodes?.length
        ? detailedGraph
        : buildDetailedArchitecture(basicToUse.nodes, basicToUse.edges, promptLabel);

      setViewMode('detailed');
      setNodes(detailedToUse.nodes);
      setEdges(detailedToUse.edges);
      triggerSimulation(detailedToUse.nodes, detailedToUse.edges, incomingTrafficRate, durationSeconds);

      // Persist to repository history if user is authenticated and repoUrl provided
      if (user && repoUrl) {
        const token = getAuthToken();
        api.saveRepositoryHistory(token, {
          repositoryUrl: repoUrl,
          repositoryName: repoName,
          architectureData: { nodes: newNodes, edges: newEdges },
          status: 'completed',
        }).catch((err) => console.warn('Failed to persist repository history:', err));
      }
    },
    [incomingTrafficRate, durationSeconds, triggerSimulation, user, getAuthToken]
  );

  // Resume pending action after authentication
  useEffect(() => {
    if (user && pendingAction) {
      const action = { ...pendingAction };
      clearPendingAction();

      const rawDest = action.returnUrl || '/app';
      const dest = rawDest.startsWith('http')
        ? (() => {
            try {
              const parsed = new URL(rawDest, window.location.origin);
              return parsed.pathname + parsed.search;
            } catch {
              return rawDest;
            }
          })()
        : rawDest;

      if (action.type === 'prompt') {
        window.history.pushState({ projectId: action.projectId, prompt: action.prompt }, '', dest);
        if (action.projectId) {
          setActiveProject({ projectId: action.projectId, prompt: action.prompt });
        }
        setCurrentView('simulator');
        handleGenerateFromPrompt(action.prompt, action.customAnswers);
      } else if (action.type === 'repo') {
        window.history.pushState({ projectId: action.projectId }, '', dest);
        if (action.projectId) {
          setActiveProject({ projectId: action.projectId });
        }
        setCurrentView('simulator');
        (async () => {
          try {
            setLoading(true);
            const res = await api.analyzeRepository({
              repoUrl: action.repoUrl,
              llmConfig: action.llmConfig,
            });
            const repoName =
              res.repoName || action.repoUrl.split('/').pop()?.replace('.git', '') || 'Repository';
            handleImportArchitecture(
              res.nodes,
              res.edges,
              repoName,
              res.basicGraph,
              res.detailedGraph,
              action.repoUrl
            );
          } catch (err: any) {
            console.error('Failed to resume repo import:', err);
            setError(err?.message || 'Failed to resume repository import.');
          } finally {
            setLoading(false);
          }
        })();
      } else if (action.type === 'collab' || (action as any).type === 'meeting') {
        window.history.pushState({}, '', dest);
        setCurrentView('collab-meeting');
      } else if (action.type === 'payment') {
        window.history.pushState({}, '', '/payment?action=checkout');
        setCurrentView('payment');
      }
    }
  }, [user, pendingAction, clearPendingAction, handleGenerateFromPrompt, handleImportArchitecture]);

  const handleOpenArchitectureFromHistory = useCallback(
    (archData: any, prompt: string, _title?: string, id?: string) => {
      if (!archData) return;
      // 1. Reconstruct architecture directly from DB data (Markdown or JSON) without calling LLM
      const restored = restoreArchitectureFromDb(archData, prompt || _title);
      const verticalNodes =
        restored.nodes.length > 0
          ? restored.nodes
          : toVerticalTree(archData.nodes || [], archData.edges || []);
      const rawEdges = restored.edges.length > 0 ? restored.edges : (archData.edges || []);

      const targetDetailed = archData.detailedGraph && archData.detailedGraph.nodes?.length
        ? archData.detailedGraph
        : buildDetailedArchitecture(verticalNodes, rawEdges, prompt || _title);
      const verticalDetailedNodes = toVerticalTree(targetDetailed.nodes, targetDetailed.edges || []);

      const targetId = id || 'arch_' + Date.now().toString(36);
      loadedHistoryProjectsRef.current.add(targetId);
      lastGeneratedPromptRef.current = prompt || '';

      if (typeof window !== 'undefined') {
        if (prompt) {
          localStorage.setItem(`gitoscale_project_${targetId}`, prompt);
        }
        try {
          const dbPayload = formatArchitectureForDb(verticalDetailedNodes, targetDetailed.edges || [], prompt || _title, {
            basicGraph: { nodes: verticalNodes, edges: rawEdges },
            detailedGraph: targetDetailed,
          });
          localStorage.setItem(`gitoscale_arch_${targetId}`, JSON.stringify(dbPayload));
          localStorage.setItem(
            `gitoscale_project_state_${targetId}`,
            JSON.stringify({
              projectId: targetId,
              prompt,
              title: _title,
              nodes: verticalDetailedNodes,
              edges: targetDetailed.edges || [],
              markdown: restored.markdown,
              incomingTrafficRate,
              viewMode: 'detailed',
              timestamp: Date.now(),
              lastSavedIso: new Date().toISOString(),
            })
          );
          if (user?.id) {
            localStorage.setItem(`gitoscale_project_owner_${targetId}`, user.id);
          }
        } catch (e) {
          console.warn('Failed to cache architecture in localStorage:', e);
        }
      }

      // Enter simulator view with Skeleton loading state
      const targetUrl = `/project/${targetId}`;
      window.history.pushState({ projectId: targetId, prompt }, '', targetUrl);
      setActiveProject({ projectId: targetId, prompt });
      setActivePromptText(prompt || '');
      setSelectedNodeId(null);
      setViewMode('detailed');
      setIsGeneratingArchitecture(true);
      setCurrentView('simulator');

      // Once loading animation completes, hydrate canvas directly from DB data with 0 LLM calls
      setTimeout(() => {
        setNodes(verticalDetailedNodes);
        setEdges(targetDetailed.edges || []);
        baseBasicGraphRef.current = { nodes: verticalNodes, edges: rawEdges };
        basicGraphCacheRef.current = { nodes: verticalNodes, edges: rawEdges };
        baseDetailedGraphRef.current = { nodes: verticalDetailedNodes, edges: targetDetailed.edges || [] };
        detailedGraphCacheRef.current = { nodes: verticalDetailedNodes, edges: targetDetailed.edges || [] };
        triggerSimulation(verticalDetailedNodes, targetDetailed.edges || [], incomingTrafficRate, durationSeconds);
        setIsGeneratingArchitecture(false);
      }, 750);
    },
    [incomingTrafficRate, durationSeconds, triggerSimulation, user?.id]
  );

  const handleOpenRepositoryFromHistory = useCallback(
    (archData: any, _repoName: string, _repoUrl: string, id?: string) => {
      if (!archData) return;
      // 1. Reconstruct repository architecture directly from DB data without calling LLM
      const restored = restoreArchitectureFromDb(archData, _repoName);
      const rawNodes = restored.nodes.length > 0 ? restored.nodes : (archData.nodes || []);
      const rawEdges = restored.edges.length > 0 ? restored.edges : (archData.edges || []);
      const verticalNodes = toVerticalTree(rawNodes, rawEdges);

      const targetDetailed = archData.detailedGraph && archData.detailedGraph.nodes?.length
        ? archData.detailedGraph
        : buildDetailedArchitecture(verticalNodes, rawEdges, _repoName);
      const verticalDetailedNodes = toVerticalTree(targetDetailed.nodes, targetDetailed.edges || []);

      const targetId = id || 'repo_' + (_repoName || 'repo').toLowerCase().replace(/[^a-z0-9_]/g, '_');
      loadedHistoryProjectsRef.current.add(targetId);
      lastGeneratedPromptRef.current = _repoName;

      if (typeof window !== 'undefined') {
        localStorage.setItem(`gitoscale_project_${targetId}`, _repoName);
        try {
          const dbPayload = formatArchitectureForDb(verticalDetailedNodes, targetDetailed.edges || [], _repoName, {
            basicGraph: { nodes: verticalNodes, edges: rawEdges },
            detailedGraph: targetDetailed,
          });
          localStorage.setItem(`gitoscale_arch_${targetId}`, JSON.stringify(dbPayload));
          if (user?.id) {
            localStorage.setItem(`gitoscale_project_owner_${targetId}`, user.id);
          }
        } catch (e) {
          console.warn('Failed to cache repo architecture in localStorage:', e);
        }
      }

      // Enter simulator view with Skeleton loading state (Do NOT pass ?repo= to avoid re-triggering LLM analyzer!)
      const targetUrl = `/project/${targetId}`;
      window.history.pushState({ projectId: targetId, prompt: _repoName }, '', targetUrl);
      setActiveProject({ projectId: targetId, prompt: _repoName });
      setActivePromptText(_repoName);
      setSelectedNodeId(null);
      setViewMode('detailed');
      setIsGeneratingArchitecture(true);
      setCurrentView('simulator');

      setTimeout(() => {
        setNodes(verticalDetailedNodes);
        setEdges(targetDetailed.edges || []);
        baseBasicGraphRef.current = { nodes: verticalNodes, edges: rawEdges };
        basicGraphCacheRef.current = { nodes: verticalNodes, edges: rawEdges };
        baseDetailedGraphRef.current = { nodes: verticalDetailedNodes, edges: targetDetailed.edges || [] };
        detailedGraphCacheRef.current = { nodes: verticalDetailedNodes, edges: targetDetailed.edges || [] };
        triggerSimulation(verticalDetailedNodes, targetDetailed.edges || [], incomingTrafficRate, durationSeconds);
        setIsGeneratingArchitecture(false);
      }, 750);
    },
    [incomingTrafficRate, durationSeconds, triggerSimulation, user?.id]
  );

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedNodeResult = selectedNodeId ? simulationResult?.nodeResults[selectedNodeId] : undefined;

  if (currentView === 'signup' || currentView === 'signin') {
    return (
      <Suspense fallback={<AuthModalSkeleton />}>
        <ModernLoginSignup
          onClose={handleGoHome}
          onSuccess={() => {
            setIsAuthOpen(false);

            if (pendingAction) {
              // Handled automatically by the pendingAction useEffect
              return;
            }

            const search = new URLSearchParams(window.location.search);
            const redirectParam = search.get('redirect');

            if (redirectParam) {
              if (redirectParam.startsWith('http://') || redirectParam.startsWith('https://')) {
                try {
                  const targetUrl = new URL(redirectParam);
                  const isAllowedHost =
                    targetUrl.origin === window.location.origin ||
                    targetUrl.hostname === 'gitoscale.com' ||
                    targetUrl.hostname.endsWith('.gitoscale.com') ||
                    targetUrl.hostname === 'gittoscale.tech' ||
                    targetUrl.hostname.endsWith('.gittoscale.tech') ||
                    targetUrl.hostname === 'localhost' ||
                    targetUrl.hostname === '127.0.0.1';
                  if (isAllowedHost) {
                    window.location.href = redirectParam;
                    return;
                  }
                } catch {
                  // Fall through to safe default for invalid or untrusted URLs
                }
                window.history.pushState({}, '', '/');
                setCurrentView('landing');
                return;
              }
              if (redirectParam.startsWith('//')) {
                // Prevent protocol-relative URL redirection exploits
                window.history.pushState({}, '', '/');
                setCurrentView('landing');
                return;
              }
              if (redirectParam === '/') {
                window.history.pushState({}, '', '/');
                setCurrentView('landing');
                return;
              }
              window.history.pushState({}, '', redirectParam);
              if (redirectParam.startsWith('/app') || redirectParam.startsWith('/project') || redirectParam.startsWith('/product')) {
                setCurrentView('simulator');
                if (!redirectParam.includes('repo=') && !redirectParam.includes('/project/') && !redirectParam.includes('/product/')) {
                  setIsStartProjectModalOpen(true);
                }
              } else if (redirectParam.startsWith('/history')) {
                setCurrentView('history');
              } else if (redirectParam.startsWith('/recommender')) {
                setCurrentView('recommender');
              } else {
                setCurrentView('landing');
              }
              return;
            }

            // Default: If user logged in from / (or without explicit redirect), stay on landing page
            window.history.pushState({}, '', '/');
            setCurrentView('landing');
          }}
        />
      </Suspense>
    );
  }

  if (currentView === 'forgot-password') {
    return (
      <Suspense fallback={<AuthModalSkeleton />}>
        <ForgotPasswordPage onNavigate={handleNavigate} isDark={isDark} />
      </Suspense>
    );
  }

  if (currentView === 'auth-callback') {
    return (
      <Suspense fallback={<AuthModalSkeleton />}>
        <AuthCallback onNavigate={handleNavigate} isDark={isDark} />
      </Suspense>
    );
  }

  if (currentView === 'history') {
    return (
      <Suspense fallback={<HistoryPageSkeleton isDark={isDark} />}>
        <HistoryDashboard
          onGoHome={handleGoHome}
          onOpenArchitecture={handleOpenArchitectureFromHistory}
          onOpenRepository={handleOpenRepositoryFromHistory}
          onNavigateToSimulator={() => {
            window.history.pushState({}, '', '/app');
            setCurrentView('simulator');
          }}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
        />
      </Suspense>
    );
  }

  if (currentView === 'feed') {
    return (
      <Suspense fallback={<SeamlessPageFallback isDark={isDark} />}>
        <FeedPage
          user={user}
          token={authToken}
          isDark={isDark}
          pendingPost={pendingFeedPost}
          onClearPendingPost={() => setPendingFeedPost(null)}
          onToggleTheme={handleToggleTheme}
          onGoHome={handleGoHome}
          onOpenAuth={() => {
            window.history.pushState({}, '', '/signin');
            setCurrentView('signin');
          }}
          onOpenSignUp={() => {
            window.history.pushState({}, '', '/signup');
            setCurrentView('signup');
          }}
          onSignOut={signOut}
          onNavigateToProfile={(profileUserId) => {
            const targetUrl = user?.id && profileUserId === user.id ? '/profile' : `/feed/profile/${profileUserId}`;
            window.history.pushState({}, '', targetUrl);
            setCurrentView('feed-profile');
          }}
        />
      </Suspense>
    );
  }

  if (currentView === 'feed-profile') {
    const rawPath = window.location.pathname;
    const profileIdFromUrl = rawPath === '/profile' || rawPath.startsWith('/profile/')
      ? (user?.id || '')
      : (rawPath.replace(/^\/feed\/profile\/?/, '').split('/')[0] || user?.id || '');
    return (
      <Suspense fallback={<SeamlessPageFallback isDark={isDark} />}>
        <ProfilePage
          profileId={profileIdFromUrl}
          user={user}
          token={authToken}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          onGoHome={handleGoHome}
          onNavigateToFeed={() => {
            window.history.pushState({}, '', '/feed');
            setCurrentView('feed');
          }}
          onOpenAuth={() => {
            window.history.pushState({}, '', '/signin');
            setCurrentView('signin');
          }}
          onOpenSignUp={() => {
            window.history.pushState({}, '', '/signup');
            setCurrentView('signup');
          }}
          onSignOut={signOut}
          onNavigateToProfile={(nextUserId) => {
            const targetUrl = user?.id && nextUserId === user.id ? '/profile' : `/feed/profile/${nextUserId}`;
            window.history.pushState({}, '', targetUrl);
            setCurrentView('feed-profile');
          }}
        />
      </Suspense>
    );
  }

  if (currentView === 'admin') {
    return (
      <Suspense fallback={<SeamlessPageFallback isDark={isDark} />}>
        <AdminPage user={user} token={authToken} onNavigate={handleNavigate} isDark={isDark} />
      </Suspense>
    );
  }

  if (currentView === 'payment') {
    return (
      <Suspense fallback={<SeamlessPageFallback isDark={isDark} />}>
        <PaymentPage
          onGoHome={handleGoHome}
          onOpenAuth={() => {
            window.history.pushState({}, '', '/signin');
            setCurrentView('signin');
          }}
          onOpenSignUp={() => {
            window.history.pushState({}, '', '/signup');
            setCurrentView('signup');
          }}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          onNavigate={handleNavigate}
        />
      </Suspense>
    );
  }

  if (currentView === 'payment-history') {
    return (
      <Suspense fallback={<SeamlessPageFallback isDark={isDark} />}>
        <PaymentHistoryPage
          onGoHome={handleGoHome}
          onOpenAuth={() => {
            window.history.pushState({}, '', '/signin');
            setCurrentView('signin');
          }}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          onNavigate={handleNavigate}
        />
      </Suspense>
    );
  }

  if (currentView === 'collab-landing') {
    return (
      <Suspense fallback={<SeamlessPageFallback isDark={isDark} />}>
        <MeetingLandingPage
          onJoinMeeting={(meetingId) => {
            window.history.pushState({}, '', `/meeting/${meetingId}`);
            setCurrentView('collab-meeting');
          }}
          onGoHome={handleGoHome}
          onOpenAuth={() => {
            window.history.pushState({}, '', '/signin');
            setCurrentView('signin');
          }}
          isDark={isDark}
        />
      </Suspense>
    );
  }

  if (currentView === 'collab-meeting') {
    const meetingId = getCollabMeetingId() || '';
    return (
      <Suspense fallback={<AppWorkspaceSkeleton isDark={isDark} />}>
        <MeetingPage
          meetingId={meetingId}
          onLeaveMeeting={() => {
            window.history.pushState({}, '', '/collab');
            setCurrentView('collab-landing');
          }}
          onOpenAuth={() => {
            window.history.pushState({}, '', '/signin');
            setCurrentView('signin');
          }}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          onGoHome={handleGoHome}
          onOpenSignUp={() => {
            window.history.pushState({}, '', '/signup');
            setCurrentView('signup');
          }}
          onOpenHistory={() => {
            window.history.pushState({}, '', '/history');
            setCurrentView('history');
          }}
          onNavigateToProfile={(profileUserId) => {
            const targetUrl = user?.id && profileUserId === user.id ? '/profile' : `/feed/profile/${profileUserId}`;
            window.history.pushState({}, '', targetUrl);
            setCurrentView('feed-profile');
          }}
          onViewLikes={() => {
            window.history.pushState({}, '', '/feed?filter=liked');
            setCurrentView('feed');
          }}
          onViewSaved={() => {
            window.history.pushState({}, '', '/feed?filter=saved');
            setCurrentView('feed');
          }}
        />
      </Suspense>
    );
  }

  if (currentView === 'cookie-policy' || currentView === 'privacy-policy' || currentView === 'terms') {
    return (
      <Suspense fallback={<LegalPageSkeleton />}>
        <LegalPage
          type={
            currentView === 'cookie-policy'
              ? 'cookie'
              : currentView === 'privacy-policy'
              ? 'privacy'
              : 'terms'
          }
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          onGoHome={handleGoHome}
          onNavigate={handleNavigate}
        />
      </Suspense>
    );
  }

  if (currentView === 'not-found') {
    return (
      <Suspense fallback={<LegalPageSkeleton />}>
        <NotFoundPage
          isDark={isDark}
          onGoHome={handleGoHome}
          onNavigateToSimulator={() => {
            window.history.pushState({}, '', '/app');
            setCurrentView('simulator');
          }}
          onNavigate={handleNavigate}
        />
      </Suspense>
    );
  }

  if (currentView === 'unverified') {
    return (
      <Suspense fallback={<LegalPageSkeleton />}>
        <UnverifiedProjectPage
          projectId={unverifiedProjectId || activeProject?.projectId || ''}
          isDark={isDark}
          onGoHome={handleGoHome}
          onNavigateToSimulator={() => {
            window.history.pushState({}, '', '/app');
            setCurrentView('simulator');
          }}
          onOpenAuth={() => {
            window.history.pushState({}, '', '/signin');
            setCurrentView('signin');
          }}
          onNavigate={handleNavigate}
        />
      </Suspense>
    );
  }

  if (currentView === 'landing') {
    return (
      <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-[#020202]">
        <LandingPage
          isDark={isDark}
          isAppDomain={isAppDomain()}
          user={user}
          onSignOut={signOut}
          onToggleTheme={handleToggleTheme}
          onNavigate={handleNavigate}
          onOpenHistory={() => {
            window.history.pushState({}, '', '/history');
            setCurrentView('history');
          }}
          onOpenRecommender={() => {
            window.history.pushState({}, '', '/recommender');
            setCurrentView('recommender');
          }}
          onOpenAuth={() => {
            window.history.pushState({}, '', '/signin?redirect=/');
            setCurrentView('signin');
          }}
          onOpenSignUp={() => {
            window.history.pushState({}, '', '/signup?redirect=/');
            setCurrentView('signup');
          }}
          onStartProject={handleStartProject}
          onStartBlankProject={handleStartBlankProject}
          onSelectTestSite={() => {
            window.history.pushState({}, '', '/app');
            setCurrentView('simulator');
            if (defaultArchitecture && nodes.length === 0) {
              applyScenario('normal-traffic', defaultArchitecture, scenarios);
            }
          }}
          onSelectUseRepository={() => {
            setIsImportRepoOpen(true);
          }}
        />
        {isImportRepoOpen && (
          <Suspense fallback={null}>
            <RepositoryImportModal
              isOpen={isImportRepoOpen}
              onClose={() => setIsImportRepoOpen(false)}
              isUserAuthenticated={Boolean(user)}
              onRequireAuth={handleRequireAuthForRepo}
              onImportArchitecture={(newNodes, newEdges, repoName, basicGraph, detailedGraph, repoUrl) => {
                handleImportArchitecture(newNodes, newEdges, repoName, basicGraph, detailedGraph, repoUrl);
                setCurrentView('simulator');
              }}
            />
          </Suspense>
        )}
        {isAuthOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs">
            <Suspense fallback={<AuthModalSkeleton />}>
              <ModernLoginSignup
                onClose={() => setIsAuthOpen(false)}
                onSuccess={(_user) => {
                  setIsAuthOpen(false);
                }}
              />
            </Suspense>
          </div>
        )}
      </div>
    );
  }

  if (currentView === 'projectWorkspace' && activeProject) {
    return (
      <Suspense fallback={<AppWorkspaceSkeleton isDark={isDark} />}>
        <ProjectWorkspace
          projectId={activeProject.projectId}
          initialPrompt={activeProject.prompt}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          onGoHome={handleGoHome}
          onSimulate={(_wsNodes, _wsEdges) => {
            window.history.pushState({}, '', '/app');
            setCurrentView('simulator');
          }}
        />
      </Suspense>
    );
  }

  if (currentView === 'recommender') {
    return (
      <Suspense fallback={<RecommenderPageSkeleton isDark={isDark} />}>
        <ArchitectureRecommenderPage
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          onGoHome={handleGoHome}
          onGoToSimulator={() => {
            window.history.pushState({}, '', '/app');
            setCurrentView('simulator');
          }}
          onSimulate={(recNodes: ArchitectureNode[], recEdges: ArchitectureEdge[]) => {
            const basicToUse = { nodes: recNodes, edges: recEdges };
            baseBasicGraphRef.current = structuredClone(basicToUse);
            basicGraphCacheRef.current = structuredClone(basicToUse);

            const detailed = buildDetailedArchitecture(recNodes, recEdges, activePromptText || 'Recommended Architecture');
            const verticalDetailedNodes = toVerticalTree(detailed.nodes, detailed.edges || []);
            baseDetailedGraphRef.current = { nodes: verticalDetailedNodes, edges: detailed.edges || [] };
            detailedGraphCacheRef.current = { nodes: verticalDetailedNodes, edges: detailed.edges || [] };

            setViewMode('detailed');
            setNodes(verticalDetailedNodes);
            setEdges(detailed.edges || []);
            setSelectedNodeId(null);
            window.history.pushState({}, '', '/app');
            setCurrentView('simulator');
            triggerSimulation(verticalDetailedNodes, detailed.edges || [], incomingTrafficRate, durationSeconds);
          }}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<SkeletonCanvas activePrompt={activePromptText} viewMode={viewMode} isDark={isDark} />}>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#090B10] font-sans">
      {/* 1. Header */}
      <Header
        scenarios={scenarios}
        currentScenarioId={currentScenarioId}
        onSelectScenario={(id) => applyScenario(id)}
        isRunning={isRunning}
        onToggleRun={() => {
          const next = !isRunning;
          setIsRunning(next);
          if (next) {
            triggerSimulation(nodes, edges, incomingTrafficRate, durationSeconds);
          }
        }}
        onReset={handleReset}
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenImportRepo={() => setIsImportRepoOpen(true)}
        onOpenNewProject={() => setIsStartProjectModalOpen(true)}
        onStartBlankProject={handleStartBlankProject}
        onOpenRecommender={() => {
          window.history.pushState({}, '', '/recommender');
          setCurrentView('recommender');
        }}
        onOpenHistory={() => {
          window.history.pushState({}, '', '/history');
          setCurrentView('history');
        }}
        onOpenFeed={() => {
          window.history.pushState({}, '', '/feed');
          setCurrentView('feed');
        }}
        user={user}
        token={authToken}
        onNavigateToProfile={(profileUserId) => {
          const targetUrl = user?.id && profileUserId === user.id ? '/profile' : `/feed/profile/${profileUserId}`;
          window.history.pushState({}, '', targetUrl);
          setCurrentView('feed-profile');
        }}
        onViewLikes={() => {
          window.history.pushState({}, '', '/feed?filter=liked');
          setCurrentView('feed');
        }}
        onViewSaved={() => {
          window.history.pushState({}, '', '/feed?filter=saved');
          setCurrentView('feed');
        }}
        onOpenAuth={() => {
          window.history.pushState({}, '', '/signin');
          setCurrentView('signin');
        }}
        onOpenSignUp={() => {
          window.history.pushState({}, '', '/signup');
          setCurrentView('signup');
        }}
        onSignOut={signOut}
        hasBaseline={baseline !== null}
        onGoHome={handleGoHome}
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        isLeftCollapsed={isLeftCollapsed}
        nodes={nodes}
        edges={edges}
        simulationResult={simulationResult}
        projectName={activePromptText || (nodes.length === 0 ? 'Blank Project' : (defaultArchitecture?.description || 'System Architecture'))}
        saveStatus={saveStatus}
        lastSaved={lastSaved}
        onForceSync={forceSyncNow}
        onStartMeeting={() => setIsStartMeetingModalOpen(true)}
        onShareToFeed={async (snapshotDataUrl) => {
          try {
            const res = await fetch(snapshotDataUrl);
            const blob = await res.blob();
            const safeName = (activePromptText || defaultArchitecture?.description || 'architecture')
              .toLowerCase()
              .replace(/[^a-z0-9_-]/g, '_')
              .slice(0, 30);
            const file = new File([blob], `${safeName || 'system'}-design.png`, { type: 'image/png' });

            const topComponents = nodes.map((n) => n.name).slice(0, 4).join(', ');
            const titleName = activePromptText || defaultArchitecture?.description || 'System Architecture';
            const content = `Check out my architecture for "${titleName}"! 🏗️\n\nFeatures ${nodes.length} components (${topComponents}${nodes.length > 4 ? ', ...' : ''}) optimized for high-throughput scaling.\n\nWhat are your thoughts on this system design?`;

            setPendingFeedPost({
              content,
              media: [
                {
                  file,
                  previewUrl: snapshotDataUrl,
                  type: 'image',
                },
              ],
            });

            window.history.pushState({}, '', '/feed');
            setCurrentView('feed');
          } catch (err) {
            console.error('[App] Failed to prepare feed post snapshot:', err);
          }
        }}
      />

      {/* 2. Top Metrics Strip */}
      <MetricsStrip metrics={simulationResult?.metrics} loading={loading} />

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/50 px-4 py-2 flex items-center justify-between text-xs text-red-700 dark:text-red-300 z-20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-700 dark:text-neutral-300 hover:text-rose-500 transition-colors shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => triggerSimulation(nodes, edges, incomingTrafficRate, durationSeconds)}
            className="flex items-center gap-1 font-semibold text-red-800 dark:text-red-300 hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 hover:text-rose-500 transition-colors" /> Retry
          </button>
        </div>
      )}

      {/* 3. Three-Section Workspace */}
      <div className="flex flex-1 overflow-hidden relative w-full h-full">
        {/* Full Canvas: Interactive Architecture Diagram */}
        <main className="w-full h-full absolute inset-0 overflow-hidden bg-slate-50 dark:bg-[#090B10]">
          {isGeneratingArchitecture ? (
            <div className="w-full h-full relative overflow-hidden">
              <SkeletonCanvas
                activePrompt={activePromptText}
                viewMode={viewMode}
                isDark={isDark}
              />
            </div>
          ) : (
            <>
              {nodes.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 p-4">
                  <div className="pointer-events-auto flex flex-col items-center p-6 sm:p-7 rounded-2xl bg-white/95 dark:bg-[#12141a]/95 border border-slate-200 dark:border-neutral-800 shadow-xl max-w-sm text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                      <Layers className="w-5 h-5 text-slate-700 dark:text-neutral-300" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5">
                      Ready to design your system
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 mb-4 leading-relaxed">
                      Start building components on your blank canvas, enter an architecture idea, or import a repository.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        onClick={() => handleAddNode('gateway', 'API Gateway')}
                        className="px-3.5 py-2 bg-slate-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold rounded-lg hover:scale-[1.03] transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Component</span>
                      </button>
                      <button
                        onClick={() => setIsStartProjectModalOpen(true)}
                        className="px-3.5 py-2 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 text-xs font-semibold rounded-lg transition-all cursor-pointer border border-slate-200/60 dark:border-neutral-700/60"
                      >
                        Enter Idea
                      </button>
                      <button
                        onClick={() => setIsImportRepoOpen(true)}
                        className="px-3.5 py-2 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 text-xs font-semibold rounded-lg transition-all cursor-pointer border border-slate-200/60 dark:border-neutral-700/60"
                      >
                        Import Repo
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <ArchitectureCanvas
                nodes={nodes}
                edges={edges}
                nodeResults={simulationResult?.nodeResults || EMPTY_NODE_RESULTS}
                edgeResults={simulationResult?.edgeResults || EMPTY_EDGE_RESULTS}
                selectedNodeId={selectedNodeId}
                onSelectNode={handleSelectNode}
                onNodesChangePosition={handleNodesPositionChange}
                onDeleteNode={handleDeleteNode}
                onUpdateNode={handleUpdateNode}
                scenarios={scenarios}
                currentScenarioId={currentScenarioId}
                onSelectScenario={(id) => applyScenario(id)}
                incomingTrafficRate={incomingTrafficRate}
                onAddEdge={handleAddEdge}
                onToggleEdge={handleToggleEdge}
                onDeleteEdge={handleDeleteEdge}
                onUpdateEdge={handleUpdateEdge}
                viewMode={viewMode}
                isDark={isDark}
                isRunning={isRunning}
                isLeftCollapsed={isLeftCollapsed}
                isRightCollapsed={isRightCollapsed}
                leftSidebarWidth={leftSidebarWidth}
                onAutoLayout={() => {
                  if (nodes.length === 0) return;
                  const laidOut = toVerticalTree(nodes, edges);
                  setNodes(laidOut);
                }}
              />
            </>
          )}
        </main>

        {/* Mobile backdrop for overlay sidebars */}
        {(!isLeftCollapsed || !isRightCollapsed) && (
          <div
            onClick={() => {
              setIsLeftCollapsed(true);
              setIsRightCollapsed(true);
            }}
            className="md:hidden absolute inset-0 bg-black/25 dark:bg-black/50 z-15 backdrop-blur-[1px] transition-opacity cursor-pointer"
          />
        )}

        {/* Left Floating Panel: Whole Left Sidebar for AI Chat (Drawer on mobile, resizable up to 2/5 of screen on desktop) */}
        <div
          style={{
            width: isMobile ? 'calc(100vw - 24px)' : `${leftSidebarWidth}px`,
            maxWidth: isMobile ? '380px' : '40vw',
          }}
          className={`absolute left-0 top-0 bottom-0 z-20 pointer-events-none transform-gpu ${
            isLeftDragging ? 'transition-none select-none' : 'transition-transform duration-300 ease-in-out'
          } ${
            isLeftCollapsed ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'
          }`}
        >
          <div className="w-full h-full flex flex-col pointer-events-none">
            <div className="pointer-events-auto h-full flex flex-col">
              <ContextualQuerySidebar
                projectId={activeProject?.projectId}
                activePrompt={activePromptText || 'Scalable distributed cloud architecture'}
                selectedAnswers={selectedAnswers}
                onAnswerSelected={handleAnswerSelected}
                onApplyRefinements={handleApplyRefinements}
                onResetQuestions={handleResetQuestions}
                onSendCustomMessage={handleSendCustomMessage}
                onExecuteChatCommand={handleExecuteChatCommand}
                onRestoreSession={handleRestoreSession}
                user={user}
                nodes={nodes}
                edges={edges}
                incomingTrafficRate={incomingTrafficRate}
                simulationResult={simulationResult}
                isGenerating={isGeneratingArchitecture}
                isHydrated={nodes.length > 0}
                isDark={isDark}
                onToggleCollapse={handleCollapseLeft}
                width={leftSidebarWidth}
                onWidthChange={setLeftSidebarWidth}
                onDragStateChange={setIsLeftDragging}
              />
            </div>
          </div>
        </div>

        {/* Re-expand trigger for left sidebar */}
        {isLeftCollapsed && (
          <button
            onClick={handleOpenLeft}
            className="absolute left-3 top-3 z-30 flex items-center gap-2 px-2.5 py-1.5 bg-white/95 dark:bg-[#0A0A0A]/95 hover:bg-slate-50 dark:hover:bg-[#141414] border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl shadow-xs transition-all cursor-pointer group"
            title="Expand AI Architect Chat"
          >
            <PanelLeftOpen className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-emerald-500 transition-colors" />
            <span className="text-xs font-medium pr-0.5 hidden sm:inline">AI Architect</span>
          </button>
        )}

        {/* Re-expand trigger for right sidebar */}
        {isRightCollapsed && (
          <button
            onClick={handleOpenRight}
            className="absolute right-3 top-3 z-30 flex items-center gap-2 px-2.5 py-1.5 bg-white/95 dark:bg-[#0A0A0A]/95 hover:bg-slate-50 dark:hover:bg-[#141414] border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl shadow-xs transition-all cursor-pointer group"
            title="Expand right sidebar"
          >
            <PanelRightOpen className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors" />
            <span className="text-xs font-medium pr-0.5 hidden sm:inline">Inspector</span>
          </button>
        )}

        {/* Right Docked Panel: Unified Full-Height Right Sidebar (Components | Inspector | Bottlenecks) */}
        <div
          className={`absolute right-0 top-0 bottom-0 z-20 pointer-events-none transition-transform duration-300 ease-in-out ${
            isRightCollapsed ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
          }`}
        >
          <aside className="w-[calc(100vw-24px)] max-w-[360px] sm:w-[350px] md:w-[360px] h-full flex flex-col shrink-0 overflow-hidden select-none pointer-events-auto bg-white dark:bg-[#0A0A0A] border-l border-slate-200 dark:border-neutral-800 shadow-xl md:shadow-none">
            <RightSidebar
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              selectedNode={selectedNode}
              selectedNodeResult={selectedNodeResult}
              simulationResult={simulationResult}
              onSelectNode={handleSelectNode}
              onAddNode={handleAddNode}
              onDeleteNode={handleDeleteNode}
              onToggleNode={handleToggleNode}
              onUpdateNode={handleUpdateNode}
              onRestoreOriginal={handleRestoreOriginal}
              onUpdateEdgeMultiplier={handleUpdateEdgeMultiplier}
              onDeleteEdge={handleDeleteEdge}
              onChangeIncomingTrafficRate={handleTrafficChange}
              incomingTrafficRate={incomingTrafficRate}
              onNavigateToParent={handleNavigateToParent}
              viewMode={viewMode}
              onToggleCollapse={() => setIsRightCollapsed(true)}
            />
          </aside>
        </div>
      </div>

      {/* Baseline Comparison Modal */}
      {isCompareOpen && (
        <Suspense fallback={null}>
          <BaselineComparisonModal
            isOpen={isCompareOpen}
            onClose={() => setIsCompareOpen(false)}
            baseline={baseline}
            currentResult={simulationResult}
            currentScenarioName={
              scenarios.find((s) => s.id === currentScenarioId)?.name || 'Current Configuration'
            }
            onSaveAsBaseline={handleSaveBaseline}
          />
        </Suspense>
      )}

      {/* Repository Import Modal */}
      {isImportRepoOpen && (
        <Suspense fallback={null}>
          <RepositoryImportModal
            isOpen={isImportRepoOpen}
            onClose={() => setIsImportRepoOpen(false)}
            isUserAuthenticated={Boolean(user)}
            onRequireAuth={handleRequireAuthForRepo}
            onImportArchitecture={handleImportArchitecture}
          />
        </Suspense>
      )}

      {/* Start Collaborative Architecture Meeting Modal */}
      {isStartMeetingModalOpen && (
        <StartMeetingModal
          isOpen={isStartMeetingModalOpen}
          onClose={() => setIsStartMeetingModalOpen(false)}
          initialNodes={nodes}
          initialEdges={edges}
          projectName={activePromptText || defaultArchitecture?.description}
          token={authToken}
          onMeetingCreated={(createdMeeting) => {
            setIsStartMeetingModalOpen(false);
            window.history.pushState({}, '', `/meeting/${createdMeeting.id}`);
            setCurrentView('collab-meeting');
          }}
        />
      )}

      {/* Start Project: Enter Idea or Import Repo Modal */}
      {isStartProjectModalOpen && (
        <Suspense fallback={null}>
          <StartProjectModal
            isOpen={isStartProjectModalOpen}
            onClose={() => setIsStartProjectModalOpen(false)}
            onSubmitPrompt={(prompt) => {
              setIsStartProjectModalOpen(false);
              handleStartProject(prompt);
            }}
            onOpenImportRepo={() => {
              setIsStartProjectModalOpen(false);
              setIsImportRepoOpen(true);
            }}
            onStartBlankProject={handleStartBlankProject}
            onGoHome={handleGoHome}
            isDark={isDark}
          />
        </Suspense>
      )}

      {/* Modern Login / Signup Modal */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs">
          <Suspense fallback={<AuthModalSkeleton />}>
            <ModernLoginSignup
              onClose={() => setIsAuthOpen(false)}
              onSuccess={(_user) => {
                setIsAuthOpen(false);
              }}
            />
          </Suspense>
        </div>
      )}

      {/* Plan Limit Modal (Displays when user exceeds free plan AI or meeting quotas) */}
      <PlanLimitModal
        isDark={isDark}
        onUpgrade={() => {
          window.history.pushState({}, '', '/payment');
          setCurrentView('payment');
        }}
      />

      {/* Floating Feedback & Recommendations Button (stuck to bottom-right, smoothly floats above playground MiniMap when right sidebar collapses) */}
      <FloatingFeedbackButton
        className={
          isRightCollapsed
            ? 'bottom-5 right-5 sm:bottom-[180px] sm:right-6'
            : 'bottom-5 right-5 sm:bottom-6 sm:right-6'
        }
      />
    </div>
    </Suspense>
  );
};

