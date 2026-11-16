import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Video,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  MessageSquare,
  Lock,
  Layers,
  AlertCircle,
  Loader2,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { collabApi } from '../../services/collabApi';

interface CollabLandingPageProps {
  onNavigateToMeeting: (meetingId: string) => void;
  onGoHome: () => void;
  onOpenAuth: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const CollabLandingPage: React.FC<CollabLandingPageProps> = ({
  onNavigateToMeeting,
  onGoHome,
  onOpenAuth,
  isDark = true,
  onToggleTheme,
}) => {
  const { user, getAuthToken } = useAuth();
  const [meetingTitle, setMeetingTitle] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Handle meeting creation
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!user) {
      onOpenAuth();
      return;
    }

    setIsCreating(true);
    try {
      const token = getAuthToken();
      const meeting = await collabApi.createMeeting(
        meetingTitle.trim() || `${user.user_metadata?.full_name || user.email?.split('@')[0] || 'Team'}'s Architecture Session`,
        undefined,
        token
      );
      onNavigateToMeeting(meeting.id);
    } catch (err: any) {
      console.error('Failed to create meeting:', err);
      setCreateError(err?.response?.data?.error || err?.message || 'Failed to create meeting session.');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle joining by code or link
  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);

    const input = joinCodeInput.trim();
    if (!input) {
      setJoinError('Please enter a meeting code or meeting URL.');
      return;
    }

    // Check if user pasted a full URL
    let targetCode = input;
    const urlMatch = input.match(/\/collab\/meeting\/([a-zA-Z0-9_-]+)/);
    if (urlMatch && urlMatch[1]) {
      // It's a direct meeting ID URL
      onNavigateToMeeting(urlMatch[1]);
      return;
    }

    setIsValidating(true);
    try {
      const result = await collabApi.validateMeetingCode(targetCode);
      if (result.status === 'ended') {
        setJoinError('This collaborative meeting has already ended.');
        return;
      }
      onNavigateToMeeting(result.meetingId);
    } catch (err: any) {
      console.error('Failed to validate meeting code:', err);
      setJoinError(err?.response?.data?.error || 'Invalid meeting code. Please check and try again.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020202] text-slate-900 dark:text-neutral-100 flex flex-col font-sans transition-colors">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-200 dark:border-neutral-800 bg-white/80 dark:bg-[#020202]/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer"
            title="Return to GitToScale"
          >
            <img
              src={isDark ? '/logo.png' : '/logo-light.png'}
              alt="GitToScale Logo"
              className="h-7 w-auto object-contain"
            />
          </button>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80">
            <Users className="w-3.5 h-3.5" />
            Collab
          </span>
        </div>

        <div className="flex items-center gap-3">
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Toggle dark/light theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-xs font-medium">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                {(user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
              </div>
              <span className="truncate max-w-[120px] font-semibold text-slate-800 dark:text-neutral-200">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-neutral-950 hover:bg-slate-800 dark:hover:bg-neutral-100 transition-all cursor-pointer shadow-xs"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100/70 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80 mb-4">
            <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Real-Time Multi-User Collaboration
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Design distributed systems <br className="hidden sm:inline" />
            <span className="text-indigo-600 dark:text-indigo-400">together in real time</span>.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
            Host live architecture reviews, simulate traffic spikes with your team, and let everyone edit the same interactive canvas with synchronized presence.
          </p>
        </motion.div>

        {/* Action Cards: Create vs Join */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {/* Card A: Create a Meeting */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex flex-col justify-between bg-white dark:bg-[#0c0d14] border border-slate-200/90 dark:border-neutral-800/90 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
          >
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Video className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create a Collab Session</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
                  Start an instant collaborative room. You become the host with complete control over editing permissions.
                </p>
              </div>

              {createError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <form onSubmit={handleCreateMeeting} className="flex flex-col gap-3 mt-2">
                <div>
                  <label htmlFor="session-title" className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1.5">
                    Session Title (Optional)
                  </label>
                  <input
                    id="session-title"
                    type="text"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    placeholder="e.g. Video Streaming Fleet RFC"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-neutral-600 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full mt-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Session...</span>
                    </>
                  ) : (
                    <>
                      <span>Start Meeting</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-neutral-900 flex items-center gap-2 text-[11px] text-slate-500 dark:text-neutral-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Full host permission controls: Host-Only, Collaborative, or Controlled</span>
            </div>
          </motion.div>

          {/* Card B: Join a Meeting */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="flex flex-col justify-between bg-white dark:bg-[#0c0d14] border border-slate-200/90 dark:border-neutral-800/90 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
          >
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Join Existing Meeting</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
                  Enter the 6-character meeting code or paste the shared invite URL to join an active session.
                </p>
              </div>

              {joinError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{joinError}</span>
                </div>
              )}

              <form onSubmit={handleJoinMeeting} className="flex flex-col gap-3 mt-2">
                <div>
                  <label htmlFor="meeting-code" className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1.5">
                    Meeting Code or Link
                  </label>
                  <input
                    id="meeting-code"
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value)}
                    placeholder="e.g. GTS-7X9 or meeting URL"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-neutral-600 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors uppercase font-mono tracking-wider"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isValidating}
                  className="w-full mt-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 dark:bg-neutral-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-neutral-950 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validating Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Join Session</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-neutral-900 flex items-center gap-2 text-[11px] text-slate-500 dark:text-neutral-500">
              <Lock className="w-4 h-4 text-indigo-500" />
              <span>Secure peer sync with instant participant presence</span>
            </div>
          </motion.div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl mt-12 sm:mt-16">
          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800/80 bg-white/50 dark:bg-neutral-900/30 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs">
              <Layers className="w-4 h-4" />
              <span>Full Canvas Sync</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              Drag nodes, wire dynamic connections, and adjust capacities. Every action updates for all participants in milliseconds.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800/80 bg-white/50 dark:bg-neutral-900/30 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>Shared AI Copilot</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              Ask AI about bottlenecks and capacity limits. AI optimizations are synchronized and visible to everyone in the room.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800/80 bg-white/50 dark:bg-neutral-900/30 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs">
              <MessageSquare className="w-4 h-4" />
              <span>In-Session Chat</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              Communicate in real time right beside the architecture diagram without switching windows or interrupting simulation flows.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
