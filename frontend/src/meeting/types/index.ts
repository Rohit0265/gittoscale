export type MeetingRole = 'host' | 'editor' | 'viewer';
export type MeetingStatus = 'active' | 'ended' | 'expired';

export interface ArchitectureState {
  nodes: any[];
  edges: any[];
}

export interface Meeting {
  id: string;
  project_id?: string | null;
  host_id: string;
  host_name: string;
  title: string;
  status: MeetingStatus;
  is_locked: boolean;
  architecture_state: ArchitectureState;
  created_at: string;
  updated_at: string;
  ended_at?: string | null;
}

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string | null;
  role: MeetingRole;
  joined_at: string;
  last_seen_at: string;
  color?: string;
  is_online?: boolean;
}

export interface ParticipantPresence {
  userId: string;
  userName: string;
  userAvatar?: string | null;
  role: MeetingRole;
  color: string;
  cursor?: { x: number; y: number } | null;
  isEditing?: boolean;
  selectedNodeId?: string | null;
  lastActive: number;
}

export interface RemoteCursor {
  userId: string;
  userName: string;
  color: string;
  x: number;
  y: number;
  role?: MeetingRole;
}

export interface MeetingChatMessage {
  id: string;
  meetingId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  text: string;
  type: 'chat' | 'system' | 'ai';
  timestamp: string;
  // Aliases for backend parity
  meeting_id?: string;
  user_id?: string;
  user_name?: string;
  user_avatar?: string | null;
  content?: string;
  message_type?: 'chat' | 'system' | 'ai';
  created_at?: string;
}

export type YjsSyncStatus = 'connecting' | 'connected' | 'syncing' | 'synced' | 'disconnected' | 'error';
