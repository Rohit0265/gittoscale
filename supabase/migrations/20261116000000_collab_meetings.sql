-- ==============================================================================
-- GitToScale Collab — Database Migration
-- Tables: collab_meetings, collab_participants, collab_messages
-- ==============================================================================

-- 1. Collab Meetings Table
CREATE TABLE IF NOT EXISTS public.collab_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id TEXT NOT NULL,
  host_user_name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'System Architecture Design Session',
  join_code VARCHAR(12) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active' | 'ended' | 'expired'
  permission_mode VARCHAR(20) NOT NULL DEFAULT 'collaborative', -- 'host_only' | 'collaborative' | 'controlled'
  architecture_state JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  ended_at TIMESTAMPTZ
);

-- 2. Collab Participants Table
CREATE TABLE IF NOT EXISTS public.collab_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.collab_meetings(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'participant', -- 'host' | 'participant'
  can_edit BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(meeting_id, user_id)
);

-- 3. Collab Messages Table
CREATE TABLE IF NOT EXISTS public.collab_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.collab_meetings(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  message TEXT NOT NULL,
  message_type VARCHAR(20) NOT NULL DEFAULT 'chat', -- 'chat' | 'system' | 'ai'
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_collab_meetings_join_code ON public.collab_meetings (join_code);
CREATE INDEX IF NOT EXISTS idx_collab_meetings_status ON public.collab_meetings (status);
CREATE INDEX IF NOT EXISTS idx_collab_participants_meeting ON public.collab_participants (meeting_id);
CREATE INDEX IF NOT EXISTS idx_collab_messages_meeting ON public.collab_messages (meeting_id, created_at ASC);
