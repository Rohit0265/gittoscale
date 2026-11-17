-- ==============================================================================
-- GitToScale Collaborative Meetings — Database Migration
-- Tables: meetings, meeting_participants
-- ==============================================================================

-- 1. Meetings Table
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT,
  host_id TEXT NOT NULL,
  host_name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'System Architecture Design Session',
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active' | 'ended' | 'expired'
  is_locked BOOLEAN NOT NULL DEFAULT false,
  architecture_state JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  ended_at TIMESTAMPTZ
);

-- 2. Meeting Participants Table
CREATE TABLE IF NOT EXISTS public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'editor', -- 'host' | 'editor' | 'viewer'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(meeting_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings (status);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON public.meeting_participants (meeting_id);
