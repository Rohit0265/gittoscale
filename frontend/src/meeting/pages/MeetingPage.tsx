import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import {
  Users,
  MessageSquare,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightOpen,
  Info,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ArchitectureCanvas } from '../../components/Canvas/ArchitectureCanvas';
import { RightSidebar } from '../../components/RightSidebar';
import { FloatingFeedbackButton } from '../../components/FloatingFeedbackButton';
import { ArchitectureNode, ArchitectureEdge, ComponentType } from '../../types';
import { useMeetingYjs } from '../hooks/useMeetingYjs';
import { MeetingHeader } from '../components/MeetingHeader';
import { MeetingParticipantsPanel } from '../components/MeetingParticipantsPanel';
import { MeetingChatPanel } from '../components/MeetingChatPanel';
import { MeetingAIPanel } from '../components/MeetingAIPanel';
import { LiveCursorOverlay } from '../components/LiveCursorOverlay';
import { meetingApi } from '../services/meetingApi';

interface InnerMeetingCanvasProps {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onNodesChangePosition: (changes: any[]) => void;
  onAddEdge: (connection: any) => void;
  onToggleEdge: (id: string) => void;
  onDeleteNode?: (id: string) => void;
  onDeleteEdge?: (id: string) => void;
  onUpdateNode?: (node: ArchitectureNode) => void;
  onDuplicateNode?: (node: ArchitectureNode) => void;
  remoteCursors: any[];
  onMouseMoveInCanvas: (x: number, y: number) => void;
  isDark: boolean;
  canEdit: boolean;
  isLeftCollapsed: boolean;
  isRightCollapsed: boolean;
}

const InnerMeetingCanvas: React.FC<InnerMeetingCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onNodesChangePosition,
  onAddEdge,
  onToggleEdge,
  onDeleteNode,
  onDeleteEdge,
  onUpdateNode,
  onDuplicateNode,
  remoteCursors,
  onMouseMoveInCanvas,
  isDark,
  canEdit,
  isLeftCollapsed,
  isRightCollapsed,
}) => {
  const { screenToFlowPosition } = useReactFlow();

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      try {
        const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        onMouseMoveInCanvas(flowPos.x, flowPos.y);
      } catch {}
    },
    [screenToFlowPosition, onMouseMoveInCanvas]
  );

  return (
    <div
      onPointerMove={handlePointerMove}
      className="relative flex-1 h-full w-full overflow-hidden select-none bg-slate-50 dark:bg-[#050505]"
    >
      <ArchitectureCanvas
        nodes={nodes}
        edges={edges}
        nodeResults={{}}
        edgeResults={{}}
        selectedNodeId={selectedNodeId}
        onSelectNode={onSelectNode}
        onNodesChangePosition={canEdit ? onNodesChangePosition : () => {}}
        onAddEdge={canEdit ? onAddEdge : () => {}}
        onToggleEdge={canEdit ? onToggleEdge : () => {}}
        onDeleteNode={canEdit ? onDeleteNode : undefined}
        onDeleteEdge={canEdit ? onDeleteEdge : undefined}
        onUpdateNode={canEdit ? onUpdateNode : undefined}
        onDuplicateNode={canEdit ? onDuplicateNode : undefined}
        isDark={isDark}
        viewMode="detailed"
        isLeftCollapsed={isLeftCollapsed}
        isRightCollapsed={isRightCollapsed}
        leftSidebarWidth={isLeftCollapsed ? 0 : 320}
      />
      <LiveCursorOverlay cursors={remoteCursors} />
    </div>
  );
};

export interface MeetingPageProps {
  meetingId: string;
  onLeaveMeeting: () => void;
  onOpenAuth: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onGoHome?: () => void;
  onOpenSignUp?: () => void;
  onOpenHistory?: () => void;
  onNavigateToProfile?: (userId: string) => void;
  onViewLikes?: () => void;
  onViewSaved?: () => void;
}

export const MeetingPage: React.FC<MeetingPageProps> = ({
  meetingId,
  onLeaveMeeting,
  onOpenAuth,
  isDark = true,
  onToggleTheme,
  onGoHome,
  onOpenSignUp,
  onOpenHistory,
  onNavigateToProfile,
  onViewLikes,
  onViewSaved,
}) => {
  const { user, getAuthToken, signOut } = useAuth();
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeLeftTab, setActiveLeftTab] = useState<'ai' | 'chats' | 'participants'>('ai');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightCollapsed, setIsRightCollapsed] = useState(true);

  // Authenticated user payload for Yjs meeting room
  const userPayload = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
      avatarUrl: user.user_metadata?.avatar_url,
    };
  }, [user]);

  const authToken = getAuthToken();

  // Hook connecting Yjs and Socket.IO
  const {
    meeting,
    role,
    isLocked,
    canEdit,
    syncStatus,
    participants,
    presences,
    remoteCursors,
    chatMessages,
    nodes,
    edges,
    meetingEndedReason,
    errorMessage,
    setErrorMessage,
    updateNodes,
    updateEdges,
    broadcastCursor,
    broadcastAwareness,
    sendChatMessage,
    setParticipantRole,
    toggleLock,
    kickParticipant,
    endMeeting,
  } = useMeetingYjs({
    meetingId,
    user: userPayload,
    token: authToken,
  });

  // Load meeting metadata & verify access
  useEffect(() => {
    let cancelled = false;

    async function checkMeeting() {
      if (!user) {
        setInitialLoading(false);
        return;
      }
      try {
        setInitialLoading(true);
        setLoadError(null);
        const data = await meetingApi.getMeeting(meetingId);
        if (cancelled) return;
        if (data.meeting.status === 'ended') {
          setLoadError('This meeting has already ended.');
        }
      } catch (err: any) {
        if (cancelled) return;
        setLoadError(err?.response?.data?.error || 'Meeting not found or inaccessible.');
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    }

    checkMeeting();

    return () => {
      cancelled = true;
    };
  }, [meetingId, user]);

  // Handle unauthenticated user
  if (!user && !initialLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-[#050505] text-slate-800 dark:text-neutral-100">
        <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-neutral-800 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 mx-auto flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Sign In to Join Meeting</h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
              You must be signed in to participate in real-time collaborative architecture meetings.
            </p>
          </div>
          <button
            onClick={onOpenAuth}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            Sign In with GitToScale
          </button>
        </div>
      </div>
    );
  }

  // Handle meeting ended or kicked
  if (meetingEndedReason) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-[#050505] text-slate-800 dark:text-neutral-100">
        <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-neutral-800 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 mx-auto flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Meeting Concluded</h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
              {meetingEndedReason}
            </p>
          </div>
          <button
            onClick={onLeaveMeeting}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to GitToScale</span>
          </button>
        </div>
      </div>
    );
  }

  // Handle initial loading error
  if (loadError) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-[#050505] text-slate-800 dark:text-neutral-100">
        <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-[#0c0c0c] border border-rose-200 dark:border-rose-900/60 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 mx-auto flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400">Unable to Join Meeting</h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">{loadError}</p>
          </div>
          <button
            onClick={onLeaveMeeting}
            className="w-full py-2.5 rounded-xl bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 text-xs font-semibold transition-all cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Handle initial loading
  if (initialLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#050505] text-slate-700 dark:text-neutral-300 gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="text-xs font-medium">Entering collaborative meeting...</span>
      </div>
    );
  }

  // Architecture manipulation callbacks
  const handleNodesChangePosition = (changes: any[]) => {
    if (!canEdit) return;
    const updated = nodes.map((node) => {
      const change = changes.find((c) => c.id === node.id);
      if (change && change.type === 'position' && change.position) {
        return { ...node, position: change.position };
      }
      return node;
    });
    updateNodes(updated);
  };

  const handleAddNode = (type: ComponentType, name: string) => {
    if (!canEdit) return;
    const newId = `${type}-${Date.now().toString().slice(-4)}`;
    const newNode: ArchitectureNode = {
      id: newId,
      name: name || type,
      type,
      position: {
        x: 350 + (nodes.length % 5) * 40,
        y: 200 + (nodes.length % 5) * 40,
      },
      capacityPerSecond: type === 'database' ? 600 : type === 'cache' ? 2500 : 800,
      workerCount: 2,
      enabled: true,
      config: {
        baselineLatencyMs: type === 'database' ? 30 : type === 'cache' ? 2 : 15,
        maxQueueSize: 2000,
        overflowPolicy: 'reject',
      },
    };
    updateNodes([...nodes, newNode]);
    setSelectedNodeId(newNode.id);
    setIsRightCollapsed(false);
    broadcastAwareness(true, newNode.id);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!canEdit) return;
    const updatedNodes = nodes.filter((n) => n.id !== nodeId);
    const updatedEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    updateNodes(updatedNodes);
    updateEdges(updatedEdges);
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  const handleUpdateNode = (updatedNode: ArchitectureNode) => {
    if (!canEdit) return;
    const updated = nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n));
    updateNodes(updated);
  };

  const handleDuplicateNode = (nodeToDup: ArchitectureNode) => {
    if (!canEdit) return;
    const dup: ArchitectureNode = {
      ...nodeToDup,
      id: `${nodeToDup.type}-${Date.now().toString().slice(-4)}`,
      name: `${nodeToDup.name} (Copy)`,
      position: {
        x: nodeToDup.position.x + 40,
        y: nodeToDup.position.y + 40,
      },
    };
    updateNodes([...nodes, dup]);
    setSelectedNodeId(dup.id);
    setIsRightCollapsed(false);
  };

  const handleAddEdge = (newEdge: any) => {
    if (!canEdit) return;
    if (!newEdge.source || !newEdge.target || newEdge.source === newEdge.target) return;
    const edgeId = newEdge.id || `edge-${newEdge.source}-${newEdge.target}`;
    if (edges.some((e) => e.id === edgeId)) return;

    const edgeWithDefaults: ArchitectureEdge = {
      id: edgeId,
      source: newEdge.source,
      target: newEdge.target,
      requestsPerInput: 1,
      enabled: true,
      isBidirectional: true,
      ...newEdge,
    };
    updateEdges([...edges, edgeWithDefaults]);
  };

  const handleToggleEdge = (edgeId: string) => {
    if (!canEdit) return;
    const updated = edges.map((e) =>
      e.id === edgeId ? { ...e, enabled: !e.enabled } : e
    );
    updateEdges(updated);
  };

  const handleDeleteEdge = (edgeId: string) => {
    if (!canEdit) return;
    updateEdges(edges.filter((e) => e.id !== edgeId));
  };

  const handleUpdateEdgeMultiplier = (edgeId: string, multiplier: number) => {
    if (!canEdit) return;
    const updated = edges.map((e) => {
      if (e.id === edgeId) {
        return {
          ...e,
          requestsPerInput: multiplier,
        };
      }
      return e;
    });
    updateEdges(updated);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-white dark:bg-[#020202] text-slate-900 dark:text-neutral-100">
      {/* Top Meeting Header */}
      <MeetingHeader
        meeting={meeting}
        role={role}
        isLocked={isLocked}
        syncStatus={syncStatus}
        participantCount={participants.length}
        onToggleParticipants={() => {
          setIsSidebarOpen(true);
          setActiveLeftTab('participants');
        }}
        isParticipantsOpen={isSidebarOpen && activeLeftTab === 'participants'}
        onToggleLock={role === 'host' ? toggleLock : undefined}
        onLeaveMeeting={onLeaveMeeting}
        onEndMeeting={
          role === 'host'
            ? async () => {
                if (window.confirm('Are you sure you want to end this meeting for all participants?')) {
                  const token = await getAuthToken();
                  if (token && meeting?.id) {
                    try {
                      await meetingApi.endMeeting(meeting.id, token);
                    } catch {}
                  }
                  endMeeting();
                  onLeaveMeeting();
                }
              }
            : undefined
        }
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        user={user}
        token={authToken}
        onSignOut={signOut}
        onOpenAuth={onOpenAuth}
        onOpenSignUp={onOpenSignUp}
        onOpenHistory={onOpenHistory}
        onNavigateToProfile={onNavigateToProfile}
        onViewLikes={onViewLikes}
        onViewSaved={onViewSaved}
        onGoHome={onGoHome}
      />

      {/* Error Toast if permission denied or error */}
      {errorMessage && (
        <div className="bg-rose-500 text-white text-xs py-1.5 px-4 flex items-center justify-between select-none">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="font-bold underline ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Collaborative Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Re-expand trigger for left sidebar */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute left-3 top-3 z-30 flex items-center gap-1.5 p-2 bg-white/95 dark:bg-[#0A0A0A]/95 hover:bg-slate-50 dark:hover:bg-[#141414] border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl shadow-xs transition-all cursor-pointer group"
            title="Expand Sidebar"
          >
            <PanelLeftOpen className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </button>
        )}

        {/* Re-expand trigger for right sidebar */}
        {isRightCollapsed && (
          <button
            onClick={() => setIsRightCollapsed(false)}
            className="absolute right-3 top-3 z-30 flex items-center gap-1.5 p-2 bg-white/95 dark:bg-[#0A0A0A]/95 hover:bg-slate-50 dark:hover:bg-[#141414] border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl shadow-xs transition-all cursor-pointer group"
            title="Expand Inspector & Components"
          >
            <PanelRightOpen className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </button>
        )}

        {/* Left Sidebar (AI Copilot / Chats / Participants) */}
        {isSidebarOpen && (
          <aside className="w-72 sm:w-80 h-full border-r border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#080808] flex flex-col z-20 shrink-0">
            {/* Sidebar Tabs (Icons Only, No Text) + Sidebar Toggle Button */}
            <div className="h-11 border-b border-slate-200 dark:border-neutral-800 flex items-center px-2 gap-1 bg-slate-50/50 dark:bg-neutral-900/40">
              <button
                onClick={() => setActiveLeftTab('ai')}
                title="AI Copilot"
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                  activeLeftTab === 'ai'
                    ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
                }`}
              >
                <Bot className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveLeftTab('chats')}
                title="Live Chat"
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                  activeLeftTab === 'chats'
                    ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveLeftTab('participants')}
                title={`Participants (${participants.length})`}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer relative ${
                  activeLeftTab === 'participants'
                    ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
                }`}
              >
                <Users className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700 mx-0.5 shrink-0" />

              {/* Sidebar Collapse Toggle Button */}
              <button
                onClick={() => setIsSidebarOpen(false)}
                title="Collapse Sidebar"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeLeftTab === 'ai' && (
                <MeetingAIPanel
                  nodes={nodes}
                  edges={edges}
                  projectDescription={meeting?.title}
                  canEdit={canEdit}
                  token={authToken}
                  onApplyArchitecture={(newNodes, newEdges) => {
                    if (!canEdit) return;
                    updateNodes(newNodes);
                    updateEdges(newEdges);
                    setSelectedNodeId(null);
                  }}
                />
              )}

              {activeLeftTab === 'participants' && (
                <MeetingParticipantsPanel
                  isOpen
                  onClose={() => setIsSidebarOpen(false)}
                  participants={participants}
                  presences={presences}
                  currentUserId={user?.id}
                  isHost={role === 'host'}
                  onSetRole={setParticipantRole}
                  onKickParticipant={kickParticipant}
                />
              )}

              {activeLeftTab === 'chats' && (
                <MeetingChatPanel
                  isOpen
                  onClose={() => setIsSidebarOpen(false)}
                  messages={chatMessages}
                  onSendMessage={(text) => sendChatMessage(text, 'chat')}
                  currentUserId={user?.id}
                  syncStatus={syncStatus}
                />
              )}
            </div>
          </aside>
        )}

        {/* Central Architecture Flow Canvas */}
        <ReactFlowProvider>
          <InnerMeetingCanvas
            nodes={nodes}
            edges={edges}
            selectedNodeId={selectedNodeId}
            onSelectNode={(id) => {
              setSelectedNodeId(id);
              if (id) {
                setIsRightCollapsed(false);
              }
              broadcastAwareness(false, id);
            }}
            onNodesChangePosition={handleNodesChangePosition}
            onAddEdge={handleAddEdge}
            onToggleEdge={handleToggleEdge}
            onDeleteNode={handleDeleteNode}
            onDeleteEdge={handleDeleteEdge}
            onUpdateNode={handleUpdateNode}
            onDuplicateNode={handleDuplicateNode}
            remoteCursors={remoteCursors}
            onMouseMoveInCanvas={(x, y) => {
              broadcastCursor(x, y);
            }}
            isDark={isDark}
            canEdit={canEdit}
            isLeftCollapsed={!isSidebarOpen}
            isRightCollapsed={isRightCollapsed}
          />
        </ReactFlowProvider>

        {/* Right Docked Panel: Unified Full-Height Right Sidebar */}
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
              simulationResult={null}
              onSelectNode={(id) => {
                setSelectedNodeId(id);
                broadcastAwareness(false, id);
              }}
              onAddNode={handleAddNode}
              onDeleteNode={handleDeleteNode}
              onToggleNode={() => {}}
              onUpdateNode={handleUpdateNode}
              onUpdateEdgeMultiplier={handleUpdateEdgeMultiplier}
              onDeleteEdge={handleDeleteEdge}
              viewMode="detailed"
              onToggleCollapse={() => setIsRightCollapsed(true)}
            />
          </aside>
        </div>

        {/* Floating Feedback Button */}
        <FloatingFeedbackButton
          className={
            isRightCollapsed
              ? 'bottom-5 right-5 sm:bottom-6 sm:right-6'
              : 'bottom-5 right-5 sm:bottom-6 sm:right-[380px]'
          }
        />
      </div>
    </div>
  );
};
