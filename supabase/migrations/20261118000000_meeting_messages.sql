-- ==============================================================================
-- GitToScale Collaborative Meetings — Persistent Chat Messages
-- Table: meeting_messages (+ RLS policies)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.meeting_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  content TEXT NOT NULL,
  message_type VARCHAR(20) NOT NULL DEFAULT 'chat', -- 'chat' | 'system' | 'ai'
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_meeting_messages_meeting
  ON public.meeting_messages (meeting_id, created_at ASC);

-- RLS: only authenticated participants of a meeting may read its messages.
ALTER TABLE public.meeting_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS meeting_messages_select ON public.meeting_messages;
CREATE POLICY meeting_messages_select
  ON public.meeting_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.meeting_participants mp
      WHERE mp.meeting_id = meeting_messages.meeting_id
        AND mp.user_id = auth.uid()
    )
  );

-- RLS: authenticated meeting participants may insert messages.
DROP POLICY IF EXISTS meeting_messages_insert ON public.meeting_messages;
CREATE POLICY meeting_messages_insert
  ON public.meeting_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meeting_participants mp
      WHERE mp.meeting_id = meeting_messages.meeting_id
        AND mp.user_id = auth.uid()
    )
  );
