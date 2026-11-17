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
