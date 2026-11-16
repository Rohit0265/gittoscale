import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Sparkles,
  MessageSquare,
  Crown,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Send,
  UserX,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUp,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { CollabMeeting, CollabParticipant, CollabMessage } from '../../services/collabApi';
import { ArchitectureNode, ArchitectureEdge, SimulationResult } from '../../types';
import { executeArchitectureCommand } from '../../services/aiAgentExecutor';
import { api } from '../../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CollabLeftPanelProps {
  meeting: CollabMeeting;
  participants: CollabParticipant[];
  currentUserId: string;
  isHost: boolean;
  canEdit: boolean;
  messages: CollabMessage[];
  onSendMessage: (text: string, type?: 'chat' | 'system' | 'ai') => void;
  onUpdatePermissionMode: (mode: 'host_only' | 'collaborative' | 'controlled') => void;
  onSetParticipantPermission: (targetUserId: string, canEdit: boolean) => void;
  onRemoveParticipant: (targetUserId: string) => void;
  // Shared Canvas & Simulation State for AI Copilot
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  incomingTrafficRate: number;
  simulationResult: SimulationResult | null;
  onApplyArchitectureChange: (newNodes: ArchitectureNode[], newEdges: ArchitectureEdge[], explanation?: string) => void;
  isDark?: boolean;
}

export type CollabTab = 'participants' | 'ai' | 'chat';

export const CollabLeftPanel: React.FC<CollabLeftPanelProps> = ({
  meeting,
  participants,
  currentUserId,
  isHost,
  canEdit,
  messages,
  onSendMessage,
  onUpdatePermissionMode,
  onSetParticipantPermission,
  onRemoveParticipant,
  nodes,
  edges,
  incomingTrafficRate,
  simulationResult,
  onApplyArchitectureChange,
  isDark = true,
}) => {
  const [activeTab, setActiveTab] = useState<CollabTab>('participants');
  const [chatInput, setChatInput] = useState('');
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // AI Copilot State
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiHistory, setAiHistory] = useState<
    Array<{ id: string; sender: 'ai' | 'user'; text: string; timestamp: string }>
  >([
    {
      id: 'ai-welcome',
      sender: 'ai',
      text: 'Hello! I am your GitToScale Collaborative Architect Copilot. I inspect your shared architecture and simulate live traffic. Ask me for scaling advice, bottleneck analysis, or to modify components.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);

  // Track unread chat messages when on another tab
  const prevMessagesLength = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      if (activeTab !== 'chat') {
        const diff = messages.length - prevMessagesLength.current;
        setUnreadChatCount((prev) => prev + diff);
      }
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
    prevMessagesLength.current = messages.length;
  }, [messages, activeTab]);

  const handleSelectTab = (tab: CollabTab) => {
    setActiveTab(tab);
    if (tab === 'chat') {
      setUnreadChatCount(0);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    onSendMessage(text, 'chat');
    setChatInput('');
  };

  // AI Copilot Execution inside Collab
  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = aiInput.trim();
    if (!prompt || isAiLoading) return;

    setAiError(null);
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user' as const,
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAiHistory((prev) => [...prev, userMsg]);
    setAiInput('');
    setIsAiLoading(true);

    try {
      // 1. Analyze command via local rule engine first
      const execResult = executeArchitectureCommand(
        prompt,
        nodes,
        edges,
        incomingTrafficRate,
        simulationResult,
        aiHistory
      );

      // If the command would mutate the canvas, check permissions!
      if (execResult.executed && execResult.updatedNodes) {
        if (!canEdit) {
          setAiError('Permission Denied: You are in View-Only mode. Ask the host for editing permissions.');
          const aiDeniedMsg = {
            id: `ai-denied-${Date.now()}`,
            sender: 'ai' as const,
            text: '⚠️ **Permission Denied**: You currently have read-only access. The host must grant you editing permissions to modify the shared canvas.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setAiHistory((prev) => [...prev, aiDeniedMsg]);
          setIsAiLoading(false);
          return;
        }

        // Apply mutation and broadcast to room
        onApplyArchitectureChange(
          execResult.updatedNodes,
          execResult.updatedEdges || edges,
          execResult.explanation
        );

        const aiSuccessMsg = {
          id: `ai-${Date.now()}`,
          sender: 'ai' as const,
          text: execResult.explanation || 'Canvas updated successfully with your requested architectural modification.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setAiHistory((prev) => [...prev, aiSuccessMsg]);
        setIsAiLoading(false);
        return;
      }

      // 2. Query backend AI Copilot with live shared context
      const reply = await api.chatWithCopilot({
        message: prompt,
        architectureContext: {
          nodes,
          edges,
          trafficRate: incomingTrafficRate,
          bottlenecks: simulationResult?.rankedBottlenecks || [],
          projectDescription: meeting.title,
        },
      });

      const aiReplyMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai' as const,
        text: reply.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setAiHistory((prev) => [...prev, aiReplyMsg]);
    } catch (err: any) {
      console.error('[Collab AI] Error:', err);
      setAiError(err?.message || 'AI service could not process request.');
      const errReply = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai' as const,
        text: 'Sorry, I encountered an issue inspecting the architecture. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setAiHistory((prev) => [...prev, errReply]);
    } finally {
      setIsAiLoading(false);
      setTimeout(() => {
        aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  return (
    <aside className="w-80 sm:w-88 md:w-96 h-full flex flex-col border-r border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#070709] shrink-0 z-30 select-none transition-colors">
      {/* Top 3 Navigation Tabs */}
      <div className="flex items-center border-b border-slate-200 dark:border-neutral-800/80 bg-slate-50/70 dark:bg-[#0A0A0C] p-1.5 gap-1 shrink-0">
        <button
          type="button"
          onClick={() => handleSelectTab('participants')}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'participants'
              ? 'bg-white dark:bg-[#141418] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-neutral-700/80'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/50'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>People</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold">
            {participants.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('ai')}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'ai'
              ? 'bg-white dark:bg-[#141418] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-neutral-700/80'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>AI Copilot</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('chat')}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
            activeTab === 'chat'
              ? 'bg-white dark:bg-[#141418] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-neutral-700/80'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/50'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Chat</span>
          {unreadChatCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-bold animate-pulse">
              {unreadChatCount}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PARTICIPANTS & PERMISSION CONTROLS */}
      {/* ========================================================================= */}
      {activeTab === 'participants' && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Permission Mode Banner / Host Selector */}
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/60 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Collaboration Mode
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  meeting.permission_mode === 'host_only'
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                    : meeting.permission_mode === 'controlled'
                    ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800'
                    : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                }`}
              >
                {meeting.permission_mode.replace('_', ' ')}
              </span>
            </div>

            {isHost ? (
              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-[11px] text-slate-600 dark:text-neutral-400">
                  Select editing access for participants:
                </label>
                <div className="grid grid-cols-3 gap-1 bg-white dark:bg-[#070709] p-1 rounded-xl border border-slate-200 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => onUpdatePermissionMode('collaborative')}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                      meeting.permission_mode === 'collaborative'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    All Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdatePermissionMode('controlled')}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                      meeting.permission_mode === 'controlled'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Controlled
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdatePermissionMode('host_only')}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                      meeting.permission_mode === 'host_only'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Host Only
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                {meeting.permission_mode === 'host_only'
                  ? 'Only the host has permission to edit the architecture.'
                  : meeting.permission_mode === 'controlled'
                  ? 'The host manually approves individual editing access.'
                  : 'All participants can edit and add components.'}
              </p>
            )}
          </div>

          {/* Participants List */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              Active Members ({participants.length})
            </span>

            <div className="flex flex-col gap-1.5">
              {participants.map((p) => {
                const isItemHost = p.role === 'host' || p.user_id === meeting.host_user_id;
                const isSelf = p.user_id === currentUserId;

                return (
                  <div
                    key={p.user_id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/70 dark:border-neutral-800/70 bg-white dark:bg-[#0c0d12] hover:border-slate-300 dark:hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Avatar with live status dot */}
                      <div className="relative shrink-0">
                        <div
                          style={{ borderColor: p.color || '#4F46E5' }}
                          className="w-8 h-8 rounded-full border-2 bg-slate-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-xs text-slate-800 dark:text-white"
                        >
                          {(p.user_name?.[0] || 'U').toUpperCase()}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0c0d12]" />
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {p.user_name}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium">(You)</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-neutral-400">
                          {isItemHost ? (
                            <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-bold">
                              <Crown className="w-3 h-3" />
                              Host
                            </span>
                          ) : p.can_edit ? (
                            <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                              <Unlock className="w-2.5 h-2.5" />
                              Can Edit
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-slate-400 dark:text-neutral-500 font-medium">
                              <Lock className="w-2.5 h-2.5" />
                              View Only
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Host action controls for other participants */}
                    {isHost && !isItemHost && (
                      <div className="flex items-center gap-1 shrink-0">
                        {meeting.permission_mode === 'controlled' && (
                          <button
                            type="button"
                            onClick={() => onSetParticipantPermission(p.user_id, !p.can_edit)}
                            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                              p.can_edit
                                ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                : 'text-slate-400 dark:text-neutral-500 hover:bg-slate-100 dark:hover:bg-neutral-800'
                            }`}
                            title={p.can_edit ? 'Revoke edit permission' : 'Grant edit permission'}
                          >
                            {p.can_edit ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onRemoveParticipant(p.user_id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          title="Remove participant from session"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SHARED AI COPILOT */}
      {/* ========================================================================= */}
      {activeTab === 'ai' && (
        <div className="flex-1 flex flex-col h-full min-h-0">
          {/* AI Notice bar */}
          <div className="p-3 border-b border-slate-200 dark:border-neutral-800 bg-indigo-50/50 dark:bg-indigo-950/20 text-[11px] text-indigo-700 dark:text-indigo-400 flex items-center justify-between shrink-0">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Shared Architect Copilot
            </span>
            <span className="text-[10px] text-slate-500 dark:text-neutral-400">
              {nodes.length} nodes · {incomingTrafficRate} req/s
            </span>
          </div>

          {/* AI Chat History */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
            {aiHistory.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1 max-w-[92%] ${isAi ? 'self-start' : 'self-end'}`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-neutral-500">
                    <span className="font-semibold">{isAi ? 'GitToScale AI' : 'You'}</span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      isAi
                        ? 'bg-slate-100 dark:bg-[#111218] border border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-neutral-200'
                        : 'bg-indigo-600 text-white shadow-xs'
                    }`}
                  >
                    {isAi ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
                          code: ({ children }) => (
                            <code className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px]">
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    ) : (
                      <span>{msg.text}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {isAiLoading && (
              <div className="self-start flex items-center gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-[#111218] border border-slate-200 dark:border-neutral-800 text-xs text-slate-500 dark:text-neutral-400">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                <span>Analyzing shared architecture & capacity...</span>
              </div>
            )}
            <div ref={aiMessagesEndRef} />
          </div>

          {/* AI Input Form */}
          <form onSubmit={handleSendAiMessage} className="p-3 border-t border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0D] shrink-0">
            {aiError && (
              <div className="mb-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/40 text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ask AI or command: e.g. Add Redis cache..."
                disabled={isAiLoading}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isAiLoading || !aiInput.trim()}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors cursor-pointer shrink-0"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REAL-TIME IN-SESSION CHAT */}
      {/* ========================================================================= */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col h-full min-h-0">
          {/* Chat Messages List */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-neutral-500 gap-2">
                <MessageSquare className="w-8 h-8 opacity-40" />
                <p className="text-xs">No messages yet. Say hello to your team!</p>
              </div>
            ) : (
              messages.map((m) => {
                const isSelf = m.sender_id === currentUserId;
                const isSystem = m.message_type === 'system';

                if (isSystem) {
                  return (
                    <div key={m.id} className="text-center my-1">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-neutral-800/80 text-slate-500 dark:text-neutral-400 border border-slate-200/60 dark:border-neutral-700/60">
                        {m.message}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col gap-1 max-w-[85%] ${isSelf ? 'self-end' : 'self-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-neutral-500">
                      <span className="font-semibold text-slate-700 dark:text-neutral-300">
                        {isSelf ? 'You' : m.sender_name}
                      </span>
                      <span>·</span>
                      <span>
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div
                      className={`p-2.5 rounded-2xl text-xs leading-relaxed ${
                        isSelf
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : 'bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 rounded-bl-xs'
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Field */}
          <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0D] shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message to participants..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
};
