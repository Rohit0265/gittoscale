import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Meeting,
  MeetingParticipant,
  MeetingRole,
  ParticipantPresence,
  MeetingChatMessage,
  RemoteCursor,
  YjsSyncStatus,
} from '../types';
import { YjsMeetingManager } from '../services/yjsMeetingManager';

interface UseMeetingYjsProps {
  meetingId: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  } | null;
}

export function useMeetingYjs({ meetingId, user }: UseMeetingYjsProps) {
  const managerRef = useRef<YjsMeetingManager | null>(null);

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [role, setRole] = useState<MeetingRole>('viewer');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<YjsSyncStatus>('connecting');
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [presences, setPresences] = useState<ParticipantPresence[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const [chatMessages, setChatMessages] = useState<MeetingChatMessage[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [meetingEndedReason, setMeetingEndedReason] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!meetingId || !user?.id) return;

    const manager = new YjsMeetingManager({
      onArchitectureChange: (newNodes, newEdges) => {
        setNodes(newNodes);
        setEdges(newEdges);
      },
      onSyncStatusChange: (status) => {
        setSyncStatus(status);
      },
      onMeetingStateLoaded: (loadedMeeting, loadedRole, loadedIsLocked) => {
        setMeeting(loadedMeeting);
        setRole(loadedRole);
        setIsLocked(loadedIsLocked);
      },
      onParticipantsChange: (updatedParticipants) => {
        setParticipants(updatedParticipants);
      },
      onPresencesChange: (updatedPresences) => {
        setPresences(updatedPresences);
      },
      onRemoteCursorsChange: (cursors) => {
        setRemoteCursors(cursors);
      },
      onChatMessage: (msg) => {
        setChatMessages((prev) => [...prev, msg]);
      },
      onRoleChanged: (newRole) => {
        setRole(newRole);
      },
      onLockChanged: (locked) => {
        setIsLocked(locked);
      },
      onMeetingEnded: (reason) => {
        setMeetingEndedReason(reason || 'Meeting ended');
      },
      onError: (err) => {
        setErrorMessage(err);
      },
    });

    managerRef.current = manager;
    manager.connect(meetingId, user);

    return () => {
      manager.disconnect();
      managerRef.current = null;
    };
  }, [meetingId, user?.id, user?.fullName, user?.avatarUrl]);

  // Methods to interact with the shared meeting
  const updateNodes = useCallback((newNodes: any[]) => {
    managerRef.current?.updateNodes(newNodes);
  }, []);

  const updateEdges = useCallback((newEdges: any[]) => {
    managerRef.current?.updateEdges(newEdges);
  }, []);

  const broadcastCursor = useCallback((x: number, y: number) => {
    managerRef.current?.broadcastCursor(x, y);
  }, []);

  const broadcastAwareness = useCallback((isEditing: boolean, selectedNodeId?: string | null) => {
    managerRef.current?.broadcastAwareness(isEditing, selectedNodeId);
  }, []);

  const sendChatMessage = useCallback((text: string, type: 'chat' | 'system' | 'ai' = 'chat') => {
    managerRef.current?.sendChatMessage(text, type);
  }, []);

  const setParticipantRole = useCallback((targetUserId: string, targetRole: MeetingRole) => {
    managerRef.current?.setParticipantRole(targetUserId, targetRole);
  }, []);

  const toggleLock = useCallback((locked: boolean) => {
    managerRef.current?.toggleLock(locked);
  }, []);

  const kickParticipant = useCallback((targetUserId: string) => {
    managerRef.current?.kickParticipant(targetUserId);
  }, []);

  const endMeeting = useCallback(() => {
    managerRef.current?.endMeeting();
  }, []);

  const canEdit = managerRef.current ? managerRef.current.canEdit() : role === 'host' || (role === 'editor' && !isLocked);

  return {
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
  };
}
