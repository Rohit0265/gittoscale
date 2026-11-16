import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users,
  Copy,
  Check,
  Share2,
  Lock,
  Unlock,
  AlertCircle,
  Loader2,
  LogOut,
  Power,
  RotateCcw,
  Sparkles,
  Download,
  FolderGit2,
  ChevronDown,
  Shield,
  Layers,
  ArrowLeft,
  Sun,
  Moon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { ArchitectureCanvas } from '../Canvas/ArchitectureCanvas';
import { LiveCursorOverlay, RemoteCursor } from './LiveCursorOverlay';
import { CollabLeftPanel } from './CollabLeftPanel';
import {
  CollabMeeting,
  CollabParticipant,
  CollabMessage,
  collabApi,
} from '../../services/collabApi';
import { collabSocket } from '../../services/collabSocket';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import {
  ArchitectureNode,
  ArchitectureEdge,
  SimulationResult,
  ScenarioFixture,
  ComponentType,
} from '../../types';

interface CollabPlaygroundProps {
  meetingId: string;
  onLeaveMeeting: () => void;
  onOpenAuth: () => void;
  onOpenInNormalPlayground?: (nodes: ArchitectureNode[], edges: ArchitectureEdge[]) => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

// Inner canvas wrapper so useReactFlow hooks work seamlessly
const CollabCanvasWrapper: React.FC<{
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  nodeResults: Record<string, any>;
  edgeResults: Record<string, any>;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onNodesChangePosition: (updatedNodes: ArchitectureNode[]) => void;
  onAddEdge: (newEdge: ArchitectureEdge) => void;
  onToggleEdge: (edgeId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
  onUpdateNode?: (updatedNode: ArchitectureNode) => void;
  onDuplicateNode?: (node: ArchitectureNode) => void;
  remoteCursors: RemoteCursor[];
  onMouseMoveInCanvas: (clientX: number, clientY: number) => void;
  isDark?: boolean;
  canEdit?: boolean;
}> = ({
  nodes,
  edges,
  nodeResults,
  edgeResults,
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
  isDark = true,
  canEdit = true,
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
      className="relative flex-1 h-full w-full overflow-hidden select-none"
    >
      <ArchitectureCanvas
        nodes={nodes}
        edges={edges}
        nodeResults={nodeResults}
        edgeResults={edgeResults}
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
        isLeftCollapsed={false}
        isRightCollapsed={true}
        leftSidebarWidth={350}
      />
      <LiveCursorOverlay cursors={remoteCursors} />
    </div>
  );
};

export const CollabPlayground: React.FC<CollabPlaygroundProps> = ({
  meetingId,
  onLeaveMeeting,
  onOpenAuth,
  onOpenInNormalPlayground,
  isDark = true,
  onToggleTheme,
}) => {
  const { user, profile, getAuthToken } = useAuth();

  // Meeting & Participants State
  const [meeting, setMeeting] = useState<CollabMeeting | null>(null);
  const [participants, setParticipants] = useState<CollabParticipant[]>([]);
  const [messages, setMessages] = useState<CollabMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isKicked, setIsKicked] = useState(false);
  const [isMeetingEnded, setIsMeetingEnded] = useState(false);
  const [endedByName, setEndedByName] = useState<string | null>(null);

  // Architecture & Canvas State
  const [nodes, setNodes] = useState<ArchitectureNode[]>([]);
  const [edges, setEdges] = useState<ArchitectureEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [incomingTrafficRate, setIncomingTrafficRate] = useState<number>(1000);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  // Peer cursors
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);

  // UI helpers
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [permissionBanner, setPermissionBanner] = useState<string | null>(null);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const isHost = Boolean(user && meeting && meeting.host_user_id === user.id);
  const currentParticipant = participants.find((p) => p.user_id === user?.id);
  const canEdit = isHost || (Boolean(currentParticipant?.can_edit) && meeting?.permission_mode !== 'host_only');

  // Trigger analytical traffic simulation
  const runSimulation = useCallback(
    async (curNodes: ArchitectureNode[], curEdges: ArchitectureEdge[], rate: number) => {
      if (curNodes.length === 0) return;
      try {
        const res = await api.simulateArchitecture({
          nodes: curNodes,
          edges: curEdges,
          incomingTrafficRate: rate,
          durationSeconds: 30,
        });
        setSimulationResult(res);
      } catch (err) {
        console.warn('[Collab] Simulation calculation warning:', err);
      }
    },
    []
  );

  // 1. Initial Meeting Join & State Load
  useEffect(() => {
    let isMounted = true;

    async function initCollab() {
      setIsLoading(true);
      setLoadError(null);

      if (!user) {
        onOpenAuth();
        setIsLoading(false);
        return;
      }

      try {
        const token = getAuthToken();
        const joinRes = await collabApi.joinMeeting(meetingId, token);
        if (!isMounted) return;

        setMeeting(joinRes.meeting);
        setParticipants(joinRes.participants);

        // Hydrate initial nodes and edges
        let initialNodes = joinRes.meeting.architecture_state?.nodes || [];
        let initialEdges = joinRes.meeting.architecture_state?.edges || [];

        // If newly created meeting has empty canvas, hydrate default e-commerce fixture
        if (initialNodes.length === 0) {
          try {
            const archFixture = await api.getArchitecture();
            initialNodes = archFixture.nodes;
            initialEdges = archFixture.edges;
          } catch {}
        }

        setNodes(initialNodes);
        setEdges(initialEdges);
        runSimulation(initialNodes, initialEdges, 1000);

        // Fetch past chat messages
        const initialMessages = await collabApi.getMessages(meetingId);
        if (isMounted) setMessages(initialMessages);

        // Connect Socket.IO
        collabSocket.joinMeeting(meetingId, {
          id: user.id,
          fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Member',
          avatarUrl: user.user_metadata?.avatar_url,
        });
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Failed to initialize collab meeting:', err);
        setLoadError(err?.response?.data?.error || err?.message || 'Could not load meeting session.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initCollab();

    return () => {
      isMounted = false;
      collabSocket.disconnect();
    };
  }, [meetingId, user, getAuthToken, onOpenAuth, runSimulation]);

  // 2. Real-time Socket Event Listeners
  useEffect(() => {
    const socket = collabSocket.getSocket();
    if (!socket) return;

    // Participant joined
    const handleParticipantJoined = (data: { participant: CollabParticipant; participants: CollabParticipant[] }) => {
      setParticipants(data.participants);
    };

    // Participant left
    const handleParticipantLeft = (data: { userId: string; userName: string }) => {
      setParticipants((prev) => prev.filter((p) => p.user_id !== data.userId));
      setRemoteCursors((prev) => prev.filter((c) => c.userId !== data.userId));
    };

    // Cursor movement from peer
    const handleCursorMoved = (cursor: RemoteCursor) => {
      if (cursor.userId === user?.id) return;
      setRemoteCursors((prev) => {
        const filtered = prev.filter((c) => c.userId !== cursor.userId);
        return [...filtered, cursor];
      });
    };

    // Cursor removed on disconnect
    const handleCursorRemoved = (data: { userId: string }) => {
      setRemoteCursors((prev) => prev.filter((c) => c.userId !== data.userId));
    };

    // Canvas operation applied by another participant
    const handleCanvasOperationApplied = (data: {
      type: string;
      architecture: { nodes: any[]; edges: any[] };
      senderId: string;
      senderName: string;
    }) => {
      if (data.senderId === user?.id) return;
      if (data.architecture?.nodes && data.architecture?.edges) {
        setNodes(data.architecture.nodes);
        setEdges(data.architecture.edges);
        runSimulation(data.architecture.nodes, data.architecture.edges, incomingTrafficRate);
      }
    };

    // Operation rejected due to permissions
    const handleOperationRejected = (data: { reason: string }) => {
      setPermissionBanner(data.reason);
      setTimeout(() => setPermissionBanner(null), 4000);
    };

    // Real-time chat messages
    const handleNewMessage = (msg: CollabMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    // Permission mode updated by host
    const handlePermissionModeChanged = (data: {
      permissionMode: 'host_only' | 'collaborative' | 'controlled';
      participants: CollabParticipant[];
    }) => {
      setMeeting((prev) => (prev ? { ...prev, permission_mode: data.permissionMode } : null));
      setParticipants(data.participants);
    };

    // Participant edit permission toggled
    const handleParticipantPermissionUpdated = (data: {
      targetUserId: string;
      canEdit: boolean;
      participants: CollabParticipant[];
    }) => {
      setParticipants(data.participants);
    };

    // Removed / kicked from meeting
    const handleKicked = (data: { reason: string }) => {
      setIsKicked(true);
      setLoadError(data.reason);
    };

    // Participant removed broadcast
    const handleParticipantRemoved = (data: { targetUserId: string; participants: CollabParticipant[] }) => {
      setParticipants(data.participants);
      setRemoteCursors((prev) => prev.filter((c) => c.userId !== data.targetUserId));
    };

    // Meeting ended by host
    const handleMeetingEnded = (data: { endedBy?: string }) => {
      setIsMeetingEnded(true);
      setEndedByName(data.endedBy || 'The Host');
    };

    socket.on('participant-joined', handleParticipantJoined);
    socket.on('participant-left', handleParticipantLeft);
    socket.on('cursor-moved', handleCursorMoved);
    socket.on('cursor-removed', handleCursorRemoved);
    socket.on('canvas-operation-applied', handleCanvasOperationApplied);
    socket.on('operation-rejected', handleOperationRejected);
    socket.on('new-message', handleNewMessage);
    socket.on('permission-mode-changed', handlePermissionModeChanged);
    socket.on('participant-permission-updated', handleParticipantPermissionUpdated);
    socket.on('participant-removed', handleParticipantRemoved);
    socket.on('kicked-from-meeting', handleKicked);
    socket.on('meeting-ended', handleMeetingEnded);

    return () => {
      socket.off('participant-joined', handleParticipantJoined);
      socket.off('participant-left', handleParticipantLeft);
      socket.off('cursor-moved', handleCursorMoved);
      socket.off('cursor-removed', handleCursorRemoved);
      socket.off('canvas-operation-applied', handleCanvasOperationApplied);
      socket.off('operation-rejected', handleOperationRejected);
      socket.off('new-message', handleNewMessage);
      socket.off('permission-mode-changed', handlePermissionModeChanged);
      socket.off('participant-permission-updated', handleParticipantPermissionUpdated);
      socket.off('participant-removed', handleParticipantRemoved);
      socket.off('kicked-from-meeting', handleKicked);
      socket.off('meeting-ended', handleMeetingEnded);
    };
  }, [user?.id, incomingTrafficRate, runSimulation]);

  // Throttled mouse tracking broadcast
  const lastCursorEmitRef = useRef(0);
  const handleMouseMoveInCanvas = useCallback((flowX: number, flowY: number) => {
    const now = Date.now();
    if (now - lastCursorEmitRef.current > 40) {
      lastCursorEmitRef.current = now;
      collabSocket.sendCursor(Math.round(flowX), Math.round(flowY));
    }
  }, []);

  // Sync canvas mutations to peers
  const syncCanvasChange = useCallback(
    (type: any, updatedNodes: ArchitectureNode[], updatedEdges: ArchitectureEdge[]) => {
      if (!canEdit) {
        setPermissionBanner('You do not have permission to modify the architecture.');
        setTimeout(() => setPermissionBanner(null), 3000);
        return;
      }
      setNodes(updatedNodes);
      setEdges(updatedEdges);
      collabSocket.sendCanvasOperation(type, { nodes: updatedNodes, edges: updatedEdges });
      runSimulation(updatedNodes, updatedEdges, incomingTrafficRate);
    },
    [canEdit, incomingTrafficRate, runSimulation]
  );

  const handleNodesChangePosition = useCallback(
    (updatedNodes: ArchitectureNode[]) => {
      syncCanvasChange('node-change', updatedNodes, edges);
    },
    [edges, syncCanvasChange]
  );

  const handleAddEdge = useCallback(
    (newEdge: ArchitectureEdge) => {
      const updated = [...edges, newEdge];
      syncCanvasChange('add-edge', nodes, updated);
    },
    [edges, nodes, syncCanvasChange]
  );

  const handleToggleEdge = useCallback(
    (edgeId: string) => {
      const updated = edges.map((e) => (e.id === edgeId ? { ...e, enabled: !e.enabled } : e));
      syncCanvasChange('edge-change', nodes, updated);
    },
    [edges, nodes, syncCanvasChange]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      const updatedNodes = nodes.filter((n) => n.id !== nodeId);
      const updatedEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
      syncCanvasChange('delete-node', updatedNodes, updatedEdges);
    },
    [nodes, edges, syncCanvasChange]
  );

  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      const updated = edges.filter((e) => e.id !== edgeId);
      syncCanvasChange('delete-edge', nodes, updated);
    },
    [edges, nodes, syncCanvasChange]
  );

  const handleUpdateNode = useCallback(
    (updatedNode: ArchitectureNode) => {
      const updated = nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n));
      syncCanvasChange('update-node', updated, edges);
    },
    [nodes, edges, syncCanvasChange]
  );

  // Host ending the meeting
  const handleEndMeeting = async () => {
    if (!meeting || !isHost) return;
    setIsEnding(true);
    try {
      const token = getAuthToken();
      await collabApi.endMeeting(meeting.id, token);
      collabSocket.endMeeting();
      setIsMeetingEnded(true);
      setIsEndModalOpen(false);
    } catch (err: any) {
      console.error('Failed to end meeting:', err);
    } finally {
      setIsEnding(false);
    }
  };

  // Copy Meeting Code
  const handleCopyCode = async () => {
    if (!meeting?.join_code) return;
    await navigator.clipboard.writeText(meeting.join_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Copy Meeting URL
  const handleCopyLink = async () => {
    const url = `${window.location.origin}/collab/meeting/${meetingId}`;
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // 3. Loading & Error States
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020202] text-slate-800 dark:text-neutral-200 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <div className="text-center">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Connecting to Collab Session...</h3>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Setting up real-time canvas synchronization and participant channels.
          </p>
        </div>
      </div>
    );
  }

  if (loadError || isKicked || isMeetingEnded) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020202] p-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-[#0c0d14] border border-slate-200 dark:border-neutral-800 rounded-3xl p-8 shadow-xl flex flex-col items-center gap-4"
        >
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              isMeetingEnded
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400'
            }`}
          >
            {isMeetingEnded ? <Power className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isMeetingEnded
                ? 'Collaborative Session Ended'
                : isKicked
                ? 'Removed From Session'
                : 'Could Not Enter Meeting'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-2 leading-relaxed">
              {isMeetingEnded
                ? `${endedByName || 'The host'} has concluded this collaborative design session.`
                : loadError || 'The meeting may have expired, or you may lack credentials.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full mt-3">
            {nodes.length > 0 && onOpenInNormalPlayground && (
              <button
                type="button"
                onClick={() => onOpenInNormalPlayground(nodes, edges)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
              >
                Open Design in Playground
              </button>
            )}
            <button
              type="button"
              onClick={onLeaveMeeting}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200 transition-colors cursor-pointer"
            >
              Back to Collab Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 dark:bg-[#020202] text-slate-900 dark:text-neutral-100 overflow-hidden select-none transition-colors">
      {/* Collab Header */}
      <header className="h-14 border-b border-slate-200 dark:border-neutral-800 bg-white/90 dark:bg-[#040406]/90 backdrop-blur-md px-3 sm:px-5 flex items-center justify-between z-40 shrink-0">
        {/* Left: Brand Logo & Session Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onLeaveMeeting}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            title="Leave Collaborative Session"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-semibold hidden md:inline">Exit</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:border-neutral-800 shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>

            <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-xs md:max-w-md">
              {meeting?.title || 'System Architecture Session'}
            </h1>
          </div>
        </div>

        {/* Center: Share & Join Code Controls */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Join Code Badge with Copy */}
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-100/70 dark:bg-neutral-900/60 hover:bg-slate-200/60 dark:hover:bg-neutral-800 text-xs font-mono font-bold text-slate-800 dark:text-neutral-200 transition-colors cursor-pointer"
            title="Click to copy meeting join code"
          >
            <span className="text-[10px] text-slate-500 dark:text-neutral-500 font-sans font-medium">Code:</span>
            <span>{meeting?.join_code}</span>
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 opacity-60" />}
          </button>

          {/* Copy Meeting Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0c0d12] hover:bg-slate-50 dark:hover:bg-neutral-900 text-xs font-semibold text-slate-700 dark:text-neutral-200 transition-colors cursor-pointer"
            title="Copy shareable meeting URL"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden md:inline">Share</span>
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : null}
          </button>
        </div>

        {/* Right: Actions, Theme, and End Session */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Permission Mode Pill */}
          <span
            className={`hidden lg:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
              canEdit
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
            }`}
          >
            {canEdit ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            <span>{canEdit ? 'Can Edit' : 'View Only'}</span>
          </span>

          {/* Theme switcher */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-1.5 rounded-xl text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          {/* Host End Meeting button / Participant Leave button */}
          {isHost ? (
            <button
              type="button"
              onClick={() => setIsEndModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer shadow-xs"
              title="End session for all participants"
            >
              <Power className="w-3.5 h-3.5" />
              <span>End Meeting</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onLeaveMeeting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0c0d12] hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave</span>
            </button>
          )}
        </div>
      </header>

      {/* Permission Notification Toast */}
      <AnimatePresence>
        {permissionBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-amber-500 text-white font-semibold text-xs shadow-lg flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{permissionBanner}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Collaborative Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Collaboration Panel (Participants, AI Copilot, Chat) */}
        {meeting && (
          <CollabLeftPanel
            meeting={meeting}
            participants={participants}
            currentUserId={user?.id || ''}
            isHost={isHost}
            canEdit={canEdit}
            messages={messages}
            onSendMessage={(text, type) => collabSocket.sendMessage(text, type)}
            onUpdatePermissionMode={(mode) => collabSocket.updatePermissionMode(mode)}
            onSetParticipantPermission={(targetId, edit) => collabSocket.setParticipantPermission(targetId, edit)}
            onRemoveParticipant={(targetId) => collabSocket.removeParticipant(targetId)}
            nodes={nodes}
            edges={edges}
            incomingTrafficRate={incomingTrafficRate}
            simulationResult={simulationResult}
            onApplyArchitectureChange={(newNodes, newEdges) => syncCanvasChange('batch-sync', newNodes, newEdges)}
            isDark={isDark}
          />
        )}

        {/* Center: Interactive Shared React Flow Architecture Canvas */}
        <ReactFlowProvider>
          <CollabCanvasWrapper
            nodes={nodes}
            edges={edges}
            nodeResults={simulationResult?.nodeResults || {}}
            edgeResults={simulationResult?.edgeResults || {}}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onNodesChangePosition={handleNodesChangePosition}
            onAddEdge={handleAddEdge}
            onToggleEdge={handleToggleEdge}
            onDeleteNode={handleDeleteNode}
            onDeleteEdge={handleDeleteEdge}
            onUpdateNode={handleUpdateNode}
            remoteCursors={remoteCursors}
            onMouseMoveInCanvas={handleMouseMoveInCanvas}
            isDark={isDark}
            canEdit={canEdit}
          />
        </ReactFlowProvider>
      </div>

      {/* Host Confirmation Modal to End Meeting */}
      <AnimatePresence>
        {isEndModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-sm w-full bg-white dark:bg-[#0c0d14] border border-slate-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                <Power className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">End Collaborative Meeting?</h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  This will conclude the session for all {participants.length} connected participants. The final architecture snapshot will be preserved.
                </p>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEndModalOpen(false)}
                  disabled={isEnding}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEndMeeting}
                  disabled={isEnding}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5"
                >
                  {isEnding ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Confirm End</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
