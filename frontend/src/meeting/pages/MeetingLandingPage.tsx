import React, { useState } from 'react';
import {
  Users,
  Plus,
  ArrowRight,
  Loader2,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { meetingApi } from '../services/meetingApi';

interface MeetingLandingPageProps {
  onJoinMeeting: (meetingId: string) => void;
  onOpenAuth: () => void;
  onGoHome: () => void;
  isDark?: boolean;
}

export const MeetingLandingPage: React.FC<MeetingLandingPageProps> = ({
  onJoinMeeting,
  onOpenAuth,
  onGoHome,
  isDark = true,
}) => {
  const { user, getAuthToken } = useAuth();
  const [meetingInput, setMeetingInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleCreateMeeting = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const token = await getAuthToken();
      const meeting = await meetingApi.createMeeting(
        {
          title: `${user.user_metadata?.full_name || 'Host'}'s Architecture Meeting`,
          initialArchitecture: { nodes: [], edges: [] },
        },
        token
      );

      onJoinMeeting(meeting.id);
    } catch (err: any) {
      setCreateError(err?.response?.data?.error || err?.message || 'Failed to create meeting.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = meetingInput.trim();
    if (!raw) return;

    if (!user) {
      onOpenAuth();
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    // Parse meetingId if user pasted full URL
    let targetId = raw;
    const urlMatch = raw.match(/\/meeting\/([a-zA-Z0-9_-]+)/) || raw.match(/\/collab\/meeting\/([a-zA-Z0-9_-]+)/);
    if (urlMatch && urlMatch[1]) {
      targetId = urlMatch[1];
    }

    try {
      const data = await meetingApi.getMeeting(targetId);
      if (data.meeting.status === 'ended') {
        setJoinError('This meeting has already ended.');
        return;
      }
      onJoinMeeting(targetId);
    } catch (err: any) {
      setJoinError(err?.response?.data?.error || 'Meeting not found or invalid.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#040404] text-slate-900 dark:text-neutral-100 flex flex-col justify-between selection:bg-neutral-800 selection:text-white">
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-200 dark:border-neutral-900 px-6 sm:px-12 flex items-center justify-between">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer"
        >
          <img
            src={isDark ? '/logo.png' : '/logo-light.png'}
            alt="GitToScale"
            className="h-7 w-auto object-contain"
          />
        </button>

        <button
          onClick={onGoHome}
          className="text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          Back to Playground
        </button>
      </header>

      {/* Hero Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 md:py-20 flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold mb-6 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-Time Collaborative Architecture (Yjs Powered)</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white max-w-2xl leading-tight">
          Design and scale architectures together in real time.
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-neutral-400 max-w-xl">
          Bring your engineering team into a live synchronized canvas. Connect nodes, analyze bottlenecks, and brainstorm architectures with zero latency.
        </p>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mt-12 text-left">
          {/* Card A: Create Meeting */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 shadow-xl flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-800/80 transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Plus className="w-6 h-6" />
              </div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Create a Collab Meeting
              </h2>

              <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                Host an instant architecture session. You become the host with complete control over participant roles, editing rights, and canvas locks.
              </p>

              {createError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400">
                  {createError}
                </div>
              )}
            </div>

            <div className="pt-6">
              <button
                onClick={handleCreateMeeting}
                disabled={isCreating}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Room...</span>
                  </>
                ) : (
                  <>
                    <span>Create Meeting</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card B: Join Meeting */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 shadow-xl flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-800/80 transition-all">
            <form onSubmit={handleJoinMeeting} className="space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Users className="w-6 h-6" />
                </div>

                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Join a Meeting
                </h2>

                <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                  Enter a Meeting ID or paste an invitation link to jump straight into your team's live design room.
                </p>

                {joinError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400">
                    {joinError}
                  </div>
                )}

                <div className="pt-1">
                  <input
                    type="text"
                    value={meetingInput}
                    onChange={(e) => setMeetingInput(e.target.value)}
                    placeholder="Paste Meeting ID or Link..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isJoining || !meetingInput.trim()}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 disabled:opacity-40 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Joining...</span>
                    </>
                  ) : (
                    <>
                      <span>Join Meeting</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full mt-16 text-center sm:text-left">
          <div className="space-y-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start text-xs font-semibold text-slate-900 dark:text-white">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Real-Time Yjs Sync</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
              Conflict-free replicated data types guarantee instant synchronization without canvas jitter.
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start text-xs font-semibold text-slate-900 dark:text-white">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Host Permissions</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
              Assign Editor or Viewer roles. Restrict canvas modifications or freeze edits during design presentations.
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start text-xs font-semibold text-slate-900 dark:text-white">
              <Users className="w-4 h-4 text-blue-500" />
              <span>Live Presence</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
              See collaborator cursors, names, and live interaction badges across your architecture canvas.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-slate-200 dark:border-neutral-900 px-6 flex items-center justify-center text-xs text-slate-400 dark:text-neutral-500">
        <span>© {new Date().getFullYear()} GitToScale. Real-Time Collaborative Architecture Meetings.</span>
      </footer>
    </div>
  );
};
