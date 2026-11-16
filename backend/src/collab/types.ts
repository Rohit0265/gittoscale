export type CollabPermissionMode = 'host_only' | 'collaborative' | 'controlled';
export type CollabMeetingStatus = 'active' | 'ended' | 'expired';
export type CollabParticipantRole = 'host' | 'participant';
export type CollabMessageType = 'chat' | 'system' | 'ai';

export interface CollabArchitectureState {
  nodes: any[];
  edges: any[];
}

export interface CollabMeeting {
  id: string;
  host_user_id: string;
  host_user_name: string;
  title: string;
  join_code: string;
  status: CollabMeetingStatus;
  permission_mode: CollabPermissionMode;
  architecture_state: CollabArchitectureState;
  created_at: string;
  updated_at: string;
  ended_at?: string | null;
}

export interface CollabParticipant {
  id: string;
  meeting_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string | null;
  role: CollabParticipantRole;
  can_edit: boolean;
  joined_at: string;
  last_seen_at: string;
  color?: string;
  is_online?: boolean;
}

export interface CollabMessage {
  id: string;
  meeting_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string | null;
  message: string;
  message_type: CollabMessageType;
  created_at: string;
}

export interface CollabCursorPosition {
  userId: string;
  userName: string;
  color: string;
  x: number;
  y: number;
  lastActive: number;
}
