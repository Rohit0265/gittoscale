import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  X,
  PhoneOff,
  LogOut,
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
import { toVerticalTree } from '../../utils/treeLayout';

interface InnerMeetingCanvasProps {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  selectedNodeId: string | null;
  selectedEdgeId?: string | null;
  onSelectNode: (id: string | null) => void;
  onSelectEdge?: (id: string | null) => void;
  onNodesChangePosition: (changes: any[]) => void;
  onAddEdge: (connection: any) => void;
  onToggleEdge: (id: string) => void;
  onDeleteNode?: (id: string) => void;
  onDeleteEdge?: (id: string) => void;
  onUpdateNode?: (node: ArchitectureNode) => void;
  onUpdateEdge?: (edgeId: string, updates: Partial<ArchitectureEdge>) => void;
  onDuplicateNode?: (node: ArchitectureNode) => void;
  onAutoLayout?: () => void;
  remoteCursors: any[];
  onMouseMoveInCanvas: (x: number, y: number) => void;
  isDark: boolean;
  canEdit: boolean;
  isRightCollapsed: boolean;
  rightSidebarWidth?: number;
}

const InnerMeetingCanvas: React.FC<InnerMeetingCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  onSelectNode,
  onSelectEdge,
  onNodesChangePosition,
  onAddEdge,
  onToggleEdge,
  onDeleteNode,
  onDeleteEdge,
  onUpdateNode,
  onUpdateEdge,
  onDuplicateNode,
  onAutoLayout,
  remoteCursors,
  onMouseMoveInCanvas,
  isDark,
  canEdit,
  isRightCollapsed,
  rightSidebarWidth = 360,
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
        selectedEdgeId={selectedEdgeId}
        onSelectNode={onSelectNode}
        onSelectEdge={onSelectEdge}
        onNodesChangePosition={canEdit ? onNodesChangePosition : () => {}}
        onAddEdge={canEdit ? onAddEdge : () => {}}
        onToggleEdge={canEdit ? onToggleEdge : () => {}}
        onDeleteNode={canEdit ? onDeleteNode : undefined}
        onDeleteEdge={canEdit ? onDeleteEdge : undefined}
        onUpdateNode={canEdit ? onUpdateNode : undefined}
        onUpdateEdge={canEdit ? onUpdateEdge : undefined}
        onDuplicateNode={canEdit ? onDuplicateNode : undefined}
        onAutoLayout={canEdit ? onAutoLayout : undefined}
        isDark={isDark}
        viewMode="detailed"
        isLeftCollapsed={true}
        isRightCollapsed={isRightCollapsed}
        leftSidebarWidth={0}
        rightSidebarWidth={rightSidebarWidth}
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

function findCleanNodePosition(existingNodes: ArchitectureNode[]): { x: number; y: number } {
  if (existingNodes.length === 0) {
    return { x: 350, y: 150 };
  }

  const NODE_W = 280;
  const NODE_H = 160;

  // Search a clean grid with 3 columns, spacing nodes comfortably without collision
  const cols = 3;
  for (let index = 0; index < 60; index++) {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const testX = 320 + col * (NODE_W + 50);
    const testY = 140 + row * (NODE_H + 50);

    const collides = existingNodes.some((n) => {
      const nx = n.position?.x ?? 0;
      const ny = n.position?.y ?? 0;
      return Math.abs(nx - testX) < NODE_W && Math.abs(ny - testY) < NODE_H;
    });

    if (!collides) {
      return { x: testX, y: testY };
    }
  }

  // Fallback: place below lowest node with generous gap
  const maxY = Math.max(...existingNodes.map((n) => n.position?.y ?? 150));
  return { x: 350, y: maxY + NODE_H + 40 };
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
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [activeLeftTab, setActiveLeftTab] = useState<'ai' | 'chats' | 'participants'>('ai');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightCollapsed, setIsRightCollapsed] = useState(true);
  const [isExitPromptOpen, setIsExitPromptOpen] = useState(false);

  // Resizable sidebar widths (up to 50% max of screen width)
  const [leftWidth, setLeftWidth] = useState(320);
  const [rightWidth, setRightWidth] = useState(360);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  useEffect(() => {
    if (!isResizingLeft && !isResizingRight) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const maxWidth = Math.floor(window.innerWidth * 0.5);
        const newWidth = Math.max(260, Math.min(maxWidth, e.clientX));
        setLeftWidth(newWidth);
      }
      if (isResizingRight) {
        const maxWidth = Math.floor(window.innerWidth * 0.5);
        const newWidth = Math.max(280, Math.min(maxWidth, window.innerWidth - e.clientX));
        setRightWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingLeft, isResizingRight]);

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
    leaveMeeting,
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
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 mx-auto flex items-center justify-center text-neutral-900 dark:text-white">
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
            className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-xs font-semibold shadow-md transition-all cursor-pointer"
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
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 mx-auto flex items-center justify-center text-neutral-900 dark:text-white">
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
            className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-xs font-semibold shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-2"
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
        <Loader2 className="w-8 h-8 text-neutral-400 dark:text-neutral-200 animate-spin" />
        <span className="text-xs font-medium">Entering collaborative meeting...</span>
      </div>
    );
  }

  // Architecture manipulation callbacks
  const handleNodesChangePosition = (changesOrNodes: any) => {
    if (!canEdit || !changesOrNodes) return;
    if (Array.isArray(changesOrNodes)) {
      // Check if passed updated ArchitectureNode[] directly
      if (
        changesOrNodes.length > 0 &&
        typeof changesOrNodes[0] === 'object' &&
        'id' in changesOrNodes[0] &&
        'position' in changesOrNodes[0] &&
        'type' in changesOrNodes[0] &&
        changesOrNodes[0].type !== 'position'
      ) {
        updateNodes(changesOrNodes);
        return;
      }
      // If passed React Flow NodeChange[]
      const updated = nodes.map((node) => {
        const change = changesOrNodes.find((c: any) => c.id === node.id);
        if (change && change.type === 'position' && change.position) {
          return { ...node, position: change.position };
        }
        return node;
      });
      updateNodes(updated);
    }
  };

  const handleAddNode = (type: ComponentType, name: string) => {
    if (!canEdit) return;
    const newId = `${type}-${Date.now().toString().slice(-4)}`;
    const position = findCleanNodePosition(nodes);
    const newNode: ArchitectureNode = {
      id: newId,
      name: name || type,
      type,
      position,
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
    const newId = `${nodeToDup.type}-${Date.now().toString().slice(-4)}`;
    const candidateX = (nodeToDup.position?.x ?? 300) + 320;
    const candidateY = nodeToDup.position?.y ?? 150;
    const collides = nodes.some(
      (n) =>
        Math.abs((n.position?.x ?? 0) - candidateX) < 260 &&
        Math.abs((n.position?.y ?? 0) - candidateY) < 140
    );
    const position = collides ? findCleanNodePosition(nodes) : { x: candidateX, y: candidateY };

    const dup: ArchitectureNode = {
      ...nodeToDup,
      id: newId,
      name: `${nodeToDup.name} (Copy)`,
      position,
    };
    updateNodes([...nodes, dup]);
    setSelectedNodeId(dup.id);
    setIsRightCollapsed(false);
  };

  const handleAddEdge = (newEdge: any) => {
    if (!canEdit) return;
    if (!newEdge.source || !newEdge.target || newEdge.source === newEdge.target) return;
    // Prevent duplicate edges between the same two nodes
    const isDuplicate = edges.some(
      (e) =>
        (e.source === newEdge.source && e.target === newEdge.target) ||
        (e.source === newEdge.target && e.target === newEdge.source)
    );
    if (isDuplicate) return;

    const edgeId = newEdge.id || `edge-${newEdge.source}-${newEdge.target}-${Date.now().toString().slice(-4)}`;
    const edgeWithDefaults: ArchitectureEdge = {
      id: edgeId,
      source: newEdge.source,
      target: newEdge.target,
      sourceHandle: newEdge.sourceHandle,
      targetHandle: newEdge.targetHandle,
      requestsPerInput: 1,
      enabled: true,
      isBidirectional: true,
      communicationType: newEdge.communicationType || 'http',
      label: newEdge.label || 'http',
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
    if (selectedEdgeId === edgeId) {
      setSelectedEdgeId(null);
    }
  };

  const handleUpdateEdge = (edgeId: string, updates: Partial<ArchitectureEdge>) => {
    if (!canEdit) return;
    const updated = edges.map((e) => (e.id === edgeId ? { ...e, ...updates } : e));
    updateEdges(updated);
  };

  const handleSelectEdge = (edgeId: string | null) => {
    setSelectedEdgeId(edgeId);
    if (edgeId) {
      setSelectedNodeId(null);
    }
  };

  const handleAutoLayout = () => {
    if (!canEdit || nodes.length === 0) return;
    const laidOut = toVerticalTree(nodes, edges);
    updateNodes(laidOut);
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
        onTapLogo={() => setIsExitPromptOpen(true)}
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
            <PanelLeftOpen className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
          </button>
        )}

        {/* Re-expand trigger for right sidebar */}
        {isRightCollapsed && (
          <button
            onClick={() => setIsRightCollapsed(false)}
            className="absolute right-3 top-3 z-30 flex items-center gap-1.5 p-2 bg-white/95 dark:bg-[#0A0A0A]/95 hover:bg-slate-50 dark:hover:bg-[#141414] border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl shadow-xs transition-all cursor-pointer group"
            title="Expand Inspector & Components"
          >
            <PanelRightOpen className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
          </button>
        )}

        {/* Left Sidebar (AI Copilot / Chats / Participants) */}
        {isSidebarOpen && (
          <aside
            style={{ width: `${leftWidth}px` }}
            className="relative h-full border-r border-slate-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#080808] flex flex-col z-20 shrink-0 select-none"
          >
            {/* Right-edge Resizer Drag Handle */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizingLeft(true);
              }}
              className="absolute top-0 -right-1.5 w-3 h-full cursor-col-resize z-40 group flex items-center justify-center hover:bg-neutral-500/20 active:bg-neutral-500/40 transition-colors"
              title="Drag to resize sidebar (max 50% screen)"
            >
              <div className="w-0.5 h-8 rounded-full bg-neutral-300 dark:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Swiggy-inspired Elevated Tab Switcher + Integrated Collapse Toggle */}
            <div className="h-12 border-b border-slate-200/80 dark:border-neutral-800/80 flex items-center px-2.5 gap-2 bg-slate-50/70 dark:bg-[#0c0c0c] shrink-0">
              <div className="flex-1 flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-[#141414] border border-slate-200/80 dark:border-neutral-800 text-xs relative gap-1">
                {/* Tab 1: AI */}
                <button
                  type="button"
                  onClick={() => setActiveLeftTab('ai')}
                  title="AI Copilot"
                  className="relative flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-medium transition-colors cursor-pointer group"
                >
                  {activeLeftTab === 'ai' && (
                    <motion.div
                      layoutId="left-tab-card"
                      className="absolute inset-0 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200/80 dark:border-neutral-700/80 shadow-xs"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                    />
                  )}
                  <span className={`relative z-10 flex items-center gap-1.5 transition-colors ${
                    activeLeftTab === 'ai'
                      ? 'text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
                  }`}>
                    <Bot className="w-3.5 h-3.5" />
                    <span>Copilot</span>
                  </span>

                  {activeLeftTab === 'ai' && (
                    <motion.div
                      layoutId="left-tab-line"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[2.5px] w-6 rounded-full bg-slate-900 dark:bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)] z-20"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                    />
                  )}
                </button>

                {/* Tab 2: Chat */}
                <button
                  type="button"
                  onClick={() => setActiveLeftTab('chats')}
                  title="Live Meeting Chat"
                  className="relative flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-medium transition-colors cursor-pointer group"
                >
                  {activeLeftTab === 'chats' && (
                    <motion.div
                      layoutId="left-tab-card"
                      className="absolute inset-0 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200/80 dark:border-neutral-700/80 shadow-xs"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                    />
                  )}
                  <span className={`relative z-10 flex items-center gap-1.5 transition-colors ${
                    activeLeftTab === 'chats'
                      ? 'text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
                  }`}>
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </span>

                  {activeLeftTab === 'chats' && (
                    <motion.div
                      layoutId="left-tab-line"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[2.5px] w-6 rounded-full bg-slate-900 dark:bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)] z-20"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                    />
                  )}
                </button>

                {/* Tab 3: Participants */}
                <button
                  type="button"
                  onClick={() => setActiveLeftTab('participants')}
                  title={`Participants (${participants.length})`}
                  className="relative flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-medium transition-colors cursor-pointer group"
                >
                  {activeLeftTab === 'participants' && (
                    <motion.div
                      layoutId="left-tab-card"
                      className="absolute inset-0 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200/80 dark:border-neutral-700/80 shadow-xs"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                    />
                  )}
                  <span className={`relative z-10 flex items-center gap-1.5 transition-colors ${
                    activeLeftTab === 'participants'
                      ? 'text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
                  }`}>
                    <Users className="w-3.5 h-3.5" />
                    <span>Peers</span>
                    {participants.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 font-mono font-medium">
                        {participants.length}
                      </span>
                    )}
                  </span>

                  {activeLeftTab === 'participants' && (
                    <motion.div
                      layoutId="left-tab-line"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[2.5px] w-6 rounded-full bg-slate-900 dark:bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)] z-20"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                    />
                  )}
                </button>
              </div>

              {/* Sidebar Collapse Toggle Button */}
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                title="Collapse Sidebar"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
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
            selectedEdgeId={selectedEdgeId}
            onSelectNode={(id) => {
              setSelectedNodeId(id);
              if (id) {
                setSelectedEdgeId(null);
                setIsRightCollapsed(false);
              }
              broadcastAwareness(false, id);
            }}
            onSelectEdge={handleSelectEdge}
            onNodesChangePosition={handleNodesChangePosition}
            onAddEdge={handleAddEdge}
            onToggleEdge={handleToggleEdge}
            onDeleteNode={handleDeleteNode}
            onDeleteEdge={handleDeleteEdge}
            onUpdateNode={handleUpdateNode}
            onUpdateEdge={handleUpdateEdge}
            onDuplicateNode={handleDuplicateNode}
            onAutoLayout={handleAutoLayout}
            remoteCursors={remoteCursors}
            onMouseMoveInCanvas={(x, y) => {
              if (role !== 'viewer' && canEdit) {
                broadcastCursor(x, y);
              }
            }}
            isDark={isDark}
            canEdit={canEdit}
            isRightCollapsed={isRightCollapsed}
            rightSidebarWidth={rightWidth}
          />
        </ReactFlowProvider>

        {/* Right Docked Panel: Unified Full-Height Resizable Right Sidebar */}
        <div
          className={`absolute right-0 top-0 bottom-0 z-20 pointer-events-none transition-transform duration-300 ease-in-out ${
            isRightCollapsed ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
          }`}
          style={{ width: `${rightWidth}px` }}
        >
          <aside
            style={{ width: `${rightWidth}px` }}
            className="w-full h-full flex flex-col shrink-0 overflow-hidden select-none pointer-events-auto bg-white dark:bg-[#0A0A0A] border-l border-slate-200 dark:border-neutral-800 shadow-xl md:shadow-none relative"
          >
            {/* Left-edge Resizer Drag Handle */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizingRight(true);
              }}
              className="absolute top-0 -left-1.5 w-3 h-full cursor-col-resize z-40 group flex items-center justify-center hover:bg-neutral-500/20 active:bg-neutral-500/40 transition-colors"
              title="Drag to resize inspector (max 50% screen)"
            >
              <div className="w-0.5 h-8 rounded-full bg-neutral-300 dark:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

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

        {/* Floating Feedback Button (floats smoothly on top of MiniMap playground) */}
        <FloatingFeedbackButton
          className={
            isRightCollapsed
              ? 'bottom-5 right-5 sm:bottom-[180px] sm:right-6'
              : 'bottom-5 right-5 sm:bottom-[180px]'
          }
          style={!isRightCollapsed ? { right: `${rightWidth + 24}px` } : undefined}
        />
      </div>

      {/* Exit Meeting Confirmation Dialog when tapping GitToScale logo */}
      <AnimatePresence>
        {isExitPromptOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExitPromptOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0e] p-6 shadow-2xl shadow-black/40 text-slate-900 dark:text-neutral-100 z-10"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsExitPromptOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon & Title */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    role === 'host'
                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}
                >
                  {role === 'host' ? <PhoneOff className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {role === 'host' ? 'End or Leave Meeting?' : 'Leave Meeting?'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    {role === 'host' ? 'Choose how you want to exit' : 'Confirm your exit'}
                  </p>
                </div>
              </div>

              {/* Main Question Body */}
              <p className="text-sm text-slate-600 dark:text-neutral-300 leading-relaxed mb-6">
                {role === 'host'
                  ? 'Do you really want to end this meeting for everyone, or leave the meeting? If you leave, the first member who joined will automatically become the new host.'
                  : 'Do you really want to leave this collaborative meeting? You can rejoin anytime using the meeting code.'}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row-reverse gap-2 sm:gap-2.5">
                {role === 'host' ? (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        setIsExitPromptOpen(false);
                        const token = await getAuthToken();
                        if (token && meeting?.id) {
                          try {
                            await meetingApi.endMeeting(meeting.id, token);
                          } catch {}
                        }
                        endMeeting();
                        if (onGoHome) onGoHome();
                        else onLeaveMeeting();
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <PhoneOff className="w-3.5 h-3.5" />
                      <span>End for Everyone</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExitPromptOpen(false);
                        leaveMeeting();
                        if (onGoHome) onGoHome();
                        else onLeaveMeeting();
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-neutral-700 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-800 dark:text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Leave Room</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsExitPromptOpen(false)}
                      className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExitPromptOpen(false);
                        leaveMeeting();
                        if (onGoHome) onGoHome();
                        else onLeaveMeeting();
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Leave Meeting</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsExitPromptOpen(false)}
                      className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
