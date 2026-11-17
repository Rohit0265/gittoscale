import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';
import {
  Meeting,
  MeetingParticipant,
  MeetingRole,
  ParticipantPresence,
  MeetingChatMessage,
  RemoteCursor,
  YjsSyncStatus,
} from '../types';

export interface YjsMeetingCallbacks {
  onArchitectureChange?: (nodes: any[], edges: any[]) => void;
  onSyncStatusChange?: (status: YjsSyncStatus) => void;
  onMeetingStateLoaded?: (meeting: Meeting, role: MeetingRole, isLocked: boolean) => void;
  onParticipantsChange?: (participants: MeetingParticipant[]) => void;
  onPresencesChange?: (presences: ParticipantPresence[]) => void;
  onRemoteCursorsChange?: (cursors: RemoteCursor[]) => void;
  onChatHistoryInitial?: (messages: MeetingChatMessage[]) => void;
  onChatMessage?: (msg: MeetingChatMessage) => void;
  onRoleChanged?: (newRole: MeetingRole) => void;
  onLockChanged?: (isLocked: boolean) => void;
  onMeetingEnded?: (reason?: string) => void;
  onError?: (error: string) => void;
}

function normalizeChatMessage(raw: any): MeetingChatMessage {
  if (!raw) {
    return {
      id: String(Date.now()),
      meetingId: '',
      senderId: '',
      senderName: 'Participant',
      senderAvatar: null,
      text: '',
      type: 'chat',
      timestamp: new Date().toISOString(),
    };
  }
  return {
    id: String(raw.id || Date.now() + Math.random()),
    meetingId: String(raw.meetingId || raw.meeting_id || ''),
    senderId: String(raw.senderId || raw.user_id || ''),
    senderName: String(raw.senderName || raw.user_name || 'Participant'),
    senderAvatar: raw.senderAvatar || raw.user_avatar || null,
    text: String(raw.text ?? raw.content ?? ''),
    type: (raw.type || raw.message_type || 'chat') as 'chat' | 'system' | 'ai',
    timestamp: String(raw.timestamp || raw.created_at || new Date().toISOString()),
    meeting_id: String(raw.meetingId || raw.meeting_id || ''),
    user_id: String(raw.senderId || raw.user_id || ''),
    user_name: String(raw.senderName || raw.user_name || 'Participant'),
    user_avatar: raw.senderAvatar || raw.user_avatar || null,
    content: String(raw.text ?? raw.content ?? ''),
    message_type: (raw.type || raw.message_type || 'chat') as 'chat' | 'system' | 'ai',
    created_at: String(raw.timestamp || raw.created_at || new Date().toISOString()),
  };
}

export class YjsMeetingManager {
  private socket: Socket | null = null;
  private doc: Y.Doc;
  private nodesMap: Y.Map<any>;
  private edgesMap: Y.Map<any>;
  private meetingId: string | null = null;
  private currentRole: MeetingRole = 'viewer';
  private isLocked: boolean = false;
  private user: { id: string; fullName: string; avatarUrl?: string } | null = null;
  private callbacks: YjsMeetingCallbacks = {};
  private activeCursors = new Map<string, RemoteCursor>();
  private cursorThrottleTimer: any = null;
  private isDestroyed = false;

  constructor(callbacks: YjsMeetingCallbacks = {}) {
    this.callbacks = callbacks;
    this.doc = new Y.Doc();
    this.nodesMap = this.doc.getMap('nodes');
    this.edgesMap = this.doc.getMap('edges');

    // Subscribe to Yjs document updates
    this.setupDocObservers();
  }

  public setCallbacks(callbacks: YjsMeetingCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  private setupDocObservers() {
    // When the maps change (either locally or remotely), emit the new nodes & edges
    const triggerChange = () => {
      if (this.isDestroyed) return;
      const nodes = Array.from(this.nodesMap.values());
      const edges = Array.from(this.edgesMap.values());
      this.callbacks.onArchitectureChange?.(nodes, edges);
    };

    this.nodesMap.observe(() => triggerChange());
    this.edgesMap.observe(() => triggerChange());

    // When the doc is updated locally, send update to the socket server
    this.doc.on('update', (update: Uint8Array, origin: any) => {
      if (origin === 'remote') return; // Do not loop remote updates back!
      if (!this.socket || !this.socket.connected) return;

      const base64Update = this.uint8ArrayToBase64(update);
      this.socket.emit('yjs-update', { update: base64Update });
      this.callbacks.onSyncStatusChange?.('syncing');
      setTimeout(() => {
        if (!this.isDestroyed) this.callbacks.onSyncStatusChange?.('synced');
      }, 300);
    });
  }

  public connect(
    meetingId: string,
    user: { id: string; fullName: string; avatarUrl?: string },
    opts?: { token?: string | null }
  ) {
    this.meetingId = meetingId;
    this.user = user;
    this.isDestroyed = false;

    this.callbacks.onSyncStatusChange?.('connecting');

    const backendUrl = (
      import.meta.env.VITE_BACKEND_URL ||
      import.meta.env.VITE_API_URL ||
      window.location.origin
    ).replace(/\/+$/, '');

    const targetUrl = backendUrl.replace(/\/api$/, '');

    this.socket = io(targetUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
      auth: {
        token: opts?.token || undefined,
      },
    });

    this.socket.on('connect', () => {
      this.callbacks.onSyncStatusChange?.('connected');
      // Join meeting
      this.socket?.emit('join-meeting', {
        meetingId,
        user: {
          id: user.id,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
        },
      });
    });

    this.socket.on('disconnect', () => {
      this.callbacks.onSyncStatusChange?.('disconnected');
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[YjsMeetingManager] Socket connection error:', err);
      this.callbacks.onSyncStatusChange?.('error');
    });

    // 1. Initial State from backend Y.Doc
    this.socket.on(
      'init-meeting-state',
      (payload: {
        meeting: Meeting;
        role: MeetingRole;
        color: string;
        isLocked: boolean;
        participants: MeetingParticipant[];
        presences: ParticipantPresence[];
        messages: MeetingChatMessage[];
        yjsUpdate: string;
      }) => {
        this.currentRole = payload.role;
        this.isLocked = payload.isLocked;

        // Apply initial base64 Yjs update
        if (payload.yjsUpdate) {
          try {
            const updateBytes = this.base64ToUint8Array(payload.yjsUpdate);
            Y.applyUpdate(this.doc, updateBytes, 'remote');
          } catch (e) {
            console.error('[YjsMeetingManager] Error applying initial Yjs update:', e);
          }
        }

        this.callbacks.onMeetingStateLoaded?.(payload.meeting, payload.role, payload.isLocked);
        this.callbacks.onParticipantsChange?.(payload.participants);
        this.callbacks.onPresencesChange?.(payload.presences);
        if (Array.isArray(payload.messages)) {
          this.callbacks.onChatHistoryInitial?.(payload.messages.map(normalizeChatMessage));
        }
        this.callbacks.onSyncStatusChange?.('synced');
      }
    );

    // 2. Remote Yjs Document Update from another editor/host
    this.socket.on('yjs-update', (payload: { update: string }) => {
      if (!payload?.update) return;
      try {
        const updateBytes = this.base64ToUint8Array(payload.update);
        Y.applyUpdate(this.doc, updateBytes, 'remote');
        this.callbacks.onSyncStatusChange?.('synced');
      } catch (err) {
        console.error('[YjsMeetingManager] Failed to apply remote Yjs update:', err);
      }
    });

    // 3. Awareness / presence updates (cursors, editing indicators)
    this.socket.on('presence-updated', (payload: { presences: ParticipantPresence[] }) => {
      const presences = payload?.presences || [];
      this.callbacks.onPresencesChange?.(presences);

      // Derive live cursors from presence (only entries with a cursor position)
      const nextCursors: RemoteCursor[] = [];
      for (const p of presences) {
        if (p.userId !== this.user?.id && p.cursor) {
          nextCursors.push({
            userId: p.userId,
            userName: p.userName,
            color: p.color,
            x: p.cursor.x,
            y: p.cursor.y,
          });
        }
      }
      this.activeCursors = new Map(nextCursors.map((c) => [c.userId, c]));
      this.callbacks.onRemoteCursorsChange?.(nextCursors);
    });

    // Legacy remote-cursor coalescing (kept for backward compatibility / no-op)
    this.socket.on(
      'remote-cursor',
      (data: { userId: string; userName: string; color: string; x: number; y: number }) => {
        if (!data || data.userId === this.user?.id) return;
        this.activeCursors.set(data.userId, {
          userId: data.userId,
          userName: data.userName,
          color: data.color,
          x: data.x,
          y: data.y,
        });
        this.callbacks.onRemoteCursorsChange?.(Array.from(this.activeCursors.values()));
      }
    );

    // 4. Participant joined / left
    this.socket.on(
      'participant-joined',
      (payload: { participant: MeetingParticipant; participants: MeetingParticipant[]; presences: ParticipantPresence[] }) => {
        this.callbacks.onParticipantsChange?.(payload.participants);
        this.callbacks.onPresencesChange?.(payload.presences);
      }
    );

    this.socket.on(
      'participant-left',
      (payload: { userId: string; participants?: MeetingParticipant[]; presences?: ParticipantPresence[] }) => {
        this.activeCursors.delete(payload.userId);
        this.callbacks.onRemoteCursorsChange?.(Array.from(this.activeCursors.values()));
        if (Array.isArray(payload.participants)) {
          this.callbacks.onParticipantsChange?.(payload.participants);
        }
        if (Array.isArray(payload.presences)) {
          this.callbacks.onPresencesChange?.(payload.presences);
        }
      }
    );

    // 5. Role updated (host changed someone's role)
    this.socket.on('role-updated', (payload: { userId: string; role: MeetingRole; participants: MeetingParticipant[] }) => {
      if (payload.userId === this.user?.id) {
        this.currentRole = payload.role;
        this.callbacks.onRoleChanged?.(payload.role);
      }
      if (Array.isArray(payload.participants)) {
        this.callbacks.onParticipantsChange?.(payload.participants);
      }
    });

    // 6. Lock state updated
    this.socket.on('lock-updated', (payload: { isLocked: boolean }) => {
      this.isLocked = payload.isLocked;
      this.callbacks.onLockChanged?.(payload.isLocked);
    });

    // 7. Meeting ended
    this.socket.on('meeting-ended', (payload: { message?: string }) => {
      this.callbacks.onMeetingEnded?.(payload.message || 'The meeting was concluded by the host.');
    });

    // 8. Kicked from meeting
    this.socket.on('kicked', (payload: { reason?: string }) => {
      this.callbacks.onMeetingEnded?.(payload.reason || 'You were removed from this meeting by the host.');
    });

    // 9. Chat Message
    this.socket.on('chat-message', (raw: any) => {
      this.callbacks.onChatMessage?.(normalizeChatMessage(raw));
    });

    // 10. Permission Denied / Error
    this.socket.on('permission-denied', (payload: { reason: string }) => {
      this.callbacks.onError?.(payload.reason);
    });

    this.socket.on('meeting-error', (payload: { message: string }) => {
      this.callbacks.onError?.(payload.message);
    });
  }

  // --- Editing Permissions Check ---
  public canEdit(): boolean {
    if (this.currentRole === 'host') return true;
    if (this.isLocked) return false;
    return this.currentRole === 'editor';
  }

  public getRole(): MeetingRole {
    return this.currentRole;
  }

  public getMeetingId(): string | null {
    return this.meetingId;
  }

  public getIsLocked(): boolean {
    return this.isLocked;
  }

  // --- Local Node and Edge Synchronization into Y.Doc ---
  public updateNodes(nodes: any[]) {
    if (!this.canEdit()) return;
    this.doc.transact(() => {
      const incomingIds = new Set(nodes.map((n) => n.id));
      // Delete nodes no longer present
      for (const id of Array.from(this.nodesMap.keys())) {
        if (!incomingIds.has(id)) {
          this.nodesMap.delete(id);
        }
      }
      // Insert or update nodes
      for (const node of nodes) {
        const existing = this.nodesMap.get(node.id);
        if (JSON.stringify(existing) !== JSON.stringify(node)) {
          this.nodesMap.set(node.id, node);
        }
      }
    }, 'local');
  }

  public updateEdges(edges: any[]) {
    if (!this.canEdit()) return;
    this.doc.transact(() => {
      const incomingIds = new Set(edges.map((e) => e.id));
      // Delete edges no longer present
      for (const id of Array.from(this.edgesMap.keys())) {
        if (!incomingIds.has(id)) {
          this.edgesMap.delete(id);
        }
      }
      // Insert or update edges
      for (const edge of edges) {
        const existing = this.edgesMap.get(edge.id);
        if (JSON.stringify(existing) !== JSON.stringify(edge)) {
          this.edgesMap.set(edge.id, edge);
        }
      }
    }, 'local');
  }

  public setNodePosition(nodeId: string, position: { x: number; y: number }) {
    if (!this.canEdit()) return;
    const existing = this.nodesMap.get(nodeId);
    if (!existing) return;
    this.doc.transact(() => {
      this.nodesMap.set(nodeId, {
        ...existing,
        position,
      });
    }, 'local');
  }

  // --- Live Awareness Broadcasting ---
  public broadcastCursor(x: number, y: number) {
    if (!this.socket || !this.socket.connected) return;
    if (this.cursorThrottleTimer) return;

    this.cursorThrottleTimer = setTimeout(() => {
      this.cursorThrottleTimer = null;
    }, 40);

    this.socket.emit('cursor-move', { x, y });
  }

  public broadcastAwareness(isEditing: boolean, selectedNodeId?: string | null) {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('awareness-update', { isEditing, selectedNodeId });
  }

  // --- Chat Messaging ---
  public sendChatMessage(text: string, type: 'chat' | 'system' | 'ai' = 'chat') {
    if (!this.socket || !this.socket.connected) return;
    this.socket.emit('chat-message', { text, type });
  }

  // --- Host Actions ---
  public setParticipantRole(targetUserId: string, role: MeetingRole) {
    if (this.currentRole !== 'host' || !this.socket) return;
    this.socket.emit('update-participant-role', { targetUserId, role });
  }

  public toggleLock(isLocked: boolean) {
    if (this.currentRole !== 'host' || !this.socket) return;
    this.socket.emit('toggle-lock', { isLocked });
  }

  public kickParticipant(targetUserId: string) {
    if (this.currentRole !== 'host' || !this.socket) return;
    this.socket.emit('kick-participant', { targetUserId });
  }

  public endMeeting() {
    if (this.currentRole !== 'host' || !this.socket) return;
    this.socket.emit('end-meeting');
  }

  // --- Clean Up ---
  public disconnect() {
    this.isDestroyed = true;
    if (this.cursorThrottleTimer) {
      clearTimeout(this.cursorThrottleTimer);
      this.cursorThrottleTimer = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.doc.destroy();
    this.activeCursors.clear();
  }

  // --- Base64 Helpers ---
  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
