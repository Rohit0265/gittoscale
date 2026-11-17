import React, { useState } from 'react';
import { Users, X, ArrowRight, Loader2, Copy, Check, Sparkles } from 'lucide-react';
import { meetingApi } from '../services/meetingApi';
import { Meeting } from '../types';

interface StartMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialNodes: any[];
  initialEdges: any[];
  projectName?: string;
  token?: string | null;
  onMeetingCreated: (meeting: Meeting) => void;
}

export const StartMeetingModal: React.FC<StartMeetingModalProps> = ({
  isOpen,
  onClose,
  initialNodes,
  initialEdges,
  projectName,
  token,
  onMeetingCreated,
}) => {
  const [title, setTitle] = useState(
    projectName ? `${projectName} - Collaborative Design` : 'System Architecture Design Meeting'
  );
  const [includeArchitecture, setIncludeArchitecture] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdMeeting, setCreatedMeeting] = useState<Meeting | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const architectureState = includeArchitecture
        ? { nodes: initialNodes, edges: initialEdges }
        : { nodes: [], edges: [] };

      const meeting = await meetingApi.createMeeting(
        {
          title: title.trim() || 'System Architecture Design Meeting',
          initialArchitecture: architectureState,
        },
        token
      );

      setCreatedMeeting(meeting);
      onMeetingCreated(meeting);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to start meeting.');
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = createdMeeting ? `${window.location.origin}/meeting/${createdMeeting.id}` : '';

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnter = () => {
    if (!createdMeeting) return;
    window.location.href = `/meeting/${createdMeeting.id}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-neutral-800 shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {!createdMeeting ? (
          <form onSubmit={handleStart} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
                  Start Collaborative Meeting
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Invite teammates to design and scale architectures in real time.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                Meeting Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Distributed Cache Design Review"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-xs text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                maxLength={80}
              />
            </div>

            {initialNodes.length > 0 && (
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-900/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeArchitecture}
                  onChange={(e) => setIncludeArchitecture(e.target.checked)}
                  className="mt-0.5 rounded text-neutral-900 focus:ring-neutral-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 dark:text-neutral-200 block">
                    Initialize with current canvas
                  </span>
                  <span className="text-slate-500 dark:text-neutral-400 block mt-0.5">
                    Includes {initialNodes.length} node{initialNodes.length !== 1 ? 's' : ''} and {initialEdges.length} connection{initialEdges.length !== 1 ? 's' : ''}.
                  </span>
                </div>
              </label>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 disabled:opacity-50 shadow-xs transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating Room...</span>
                  </>
                ) : (
                  <>
                    <span>Start Meeting</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
                  Meeting Ready!
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Share this invitation link with your teammates.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 space-y-2">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-neutral-400 block">
                Shareable Link
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#050505] text-xs font-mono text-slate-800 dark:text-neutral-200 select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 transition-colors inline-flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleEnter}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 shadow-md transition-all cursor-pointer"
              >
                <span>Enter Meeting Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
