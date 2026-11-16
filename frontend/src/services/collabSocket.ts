import { io, Socket } from 'socket.io-client';

const RAW_BACKEND_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '').trim();
const SOCKET_BASE = RAW_BACKEND_URL.replace(/\/+$/, '') || window.location.origin;

class CollabSocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_BASE, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('[CollabSocket] Connected to server with ID:', this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[CollabSocket] Connection warning:', err.message);
    });

    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  joinMeeting(
    meetingId: string,
    user: { id: string; fullName: string; avatarUrl?: string }
  ) {
    const s = this.connect();
    s.emit('join-meeting', { meetingId, user });
  }

  sendCursor(x: number, y: number) {
    if (!this.socket?.connected) return;
    this.socket.emit('cursor-move', { x, y });
  }

  sendCanvasOperation(
    type: 'node-change' | 'edge-change' | 'add-node' | 'delete-node' | 'add-edge' | 'delete-edge' | 'update-node' | 'update-edge' | 'batch-sync',
    architecture: { nodes: any[]; edges: any[] },
    meta?: any
  ) {
    if (!this.socket?.connected) return;
    this.socket.emit('canvas-operation', { type, architecture, meta });
  }

  sendMessage(message: string, messageType: 'chat' | 'system' | 'ai' = 'chat') {
    if (!this.socket?.connected) return;
    this.socket.emit('send-message', { message, messageType });
  }

  updatePermissionMode(permissionMode: 'host_only' | 'collaborative' | 'controlled') {
    if (!this.socket?.connected) return;
    this.socket.emit('update-permission-mode', { permissionMode });
  }

  setParticipantPermission(targetUserId: string, canEdit: boolean) {
    if (!this.socket?.connected) return;
    this.socket.emit('set-participant-permission', { targetUserId, canEdit });
  }

  removeParticipant(targetUserId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('remove-participant', { targetUserId });
  }

  endMeeting() {
    if (!this.socket?.connected) return;
    this.socket.emit('end-meeting');
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const collabSocket = new CollabSocketService();
