-- GitToScale: Social Feed Schema Migration
-- Migration: 20261105000000_social_feed.sql
-- Description: Creates feed_posts, feed_likes, feed_comments, feed_follows and adds bio/username to profiles.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique ON public.profiles (LOWER(username)) WHERE username IS NOT NULL;

-- Feed Posts
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_feed_posts_user_id ON public.feed_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created_at ON public.feed_posts(created_at DESC);

-- Feed Likes
CREATE TABLE IF NOT EXISTS public.feed_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(post_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_feed_likes_post_id ON public.feed_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_likes_user_id ON public.feed_likes(user_id);

-- Feed Comments
CREATE TABLE IF NOT EXISTS public.feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_feed_comments_post_id ON public.feed_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_created_at ON public.feed_comments(created_at ASC);

-- Feed Follows
CREATE TABLE IF NOT EXISTS public.feed_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(follower_id, following_id)
);
CREATE INDEX IF NOT EXISTS idx_feed_follows_follower ON public.feed_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_feed_follows_following ON public.feed_follows(following_id);

-- Feed Dislikes
CREATE TABLE IF NOT EXISTS public.feed_dislikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(post_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_feed_dislikes_post_id ON public.feed_dislikes(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_dislikes_user_id ON public.feed_dislikes(user_id);

-- Feed Bookmarks / Saved Posts
CREATE TABLE IF NOT EXISTS public.feed_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(post_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_feed_bookmarks_post_id ON public.feed_bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_bookmarks_user_id ON public.feed_bookmarks(user_id);

-- Enable Row Level Security (RLS) on all feed tables
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_dislikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: feed_posts
DROP POLICY IF EXISTS "feed_posts_select_policy" ON public.feed_posts;
CREATE POLICY "feed_posts_select_policy" ON public.feed_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "feed_posts_insert_policy" ON public.feed_posts;
CREATE POLICY "feed_posts_insert_policy" ON public.feed_posts FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "feed_posts_update_policy" ON public.feed_posts;
CREATE POLICY "feed_posts_update_policy" ON public.feed_posts FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "feed_posts_delete_policy" ON public.feed_posts;
CREATE POLICY "feed_posts_delete_policy" ON public.feed_posts FOR DELETE USING (auth.uid()::text = user_id);

-- RLS Policies: feed_likes
DROP POLICY IF EXISTS "feed_likes_select_policy" ON public.feed_likes;
CREATE POLICY "feed_likes_select_policy" ON public.feed_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "feed_likes_insert_policy" ON public.feed_likes;
CREATE POLICY "feed_likes_insert_policy" ON public.feed_likes FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "feed_likes_delete_policy" ON public.feed_likes;
CREATE POLICY "feed_likes_delete_policy" ON public.feed_likes FOR DELETE USING (auth.uid()::text = user_id);

-- RLS Policies: feed_dislikes
DROP POLICY IF EXISTS "feed_dislikes_select_policy" ON public.feed_dislikes;
CREATE POLICY "feed_dislikes_select_policy" ON public.feed_dislikes FOR SELECT USING (true);

DROP POLICY IF EXISTS "feed_dislikes_insert_policy" ON public.feed_dislikes;
CREATE POLICY "feed_dislikes_insert_policy" ON public.feed_dislikes FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "feed_dislikes_delete_policy" ON public.feed_dislikes;
CREATE POLICY "feed_dislikes_delete_policy" ON public.feed_dislikes FOR DELETE USING (auth.uid()::text = user_id);

-- RLS Policies: feed_comments
DROP POLICY IF EXISTS "feed_comments_select_policy" ON public.feed_comments;
CREATE POLICY "feed_comments_select_policy" ON public.feed_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "feed_comments_insert_policy" ON public.feed_comments;
CREATE POLICY "feed_comments_insert_policy" ON public.feed_comments FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "feed_comments_update_policy" ON public.feed_comments;
CREATE POLICY "feed_comments_update_policy" ON public.feed_comments FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "feed_comments_delete_policy" ON public.feed_comments;
CREATE POLICY "feed_comments_delete_policy" ON public.feed_comments FOR DELETE USING (auth.uid()::text = user_id);

-- RLS Policies: feed_follows
DROP POLICY IF EXISTS "feed_follows_select_policy" ON public.feed_follows;
CREATE POLICY "feed_follows_select_policy" ON public.feed_follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "feed_follows_insert_policy" ON public.feed_follows;
CREATE POLICY "feed_follows_insert_policy" ON public.feed_follows FOR INSERT WITH CHECK (auth.uid()::text = follower_id);

DROP POLICY IF EXISTS "feed_follows_delete_policy" ON public.feed_follows;
CREATE POLICY "feed_follows_delete_policy" ON public.feed_follows FOR DELETE USING (auth.uid()::text = follower_id);

-- RLS Policies: feed_bookmarks
DROP POLICY IF EXISTS "feed_bookmarks_select_policy" ON public.feed_bookmarks;
CREATE POLICY "feed_bookmarks_select_policy" ON public.feed_bookmarks FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "feed_bookmarks_insert_policy" ON public.feed_bookmarks;
CREATE POLICY "feed_bookmarks_insert_policy" ON public.feed_bookmarks FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "feed_bookmarks_delete_policy" ON public.feed_bookmarks;
CREATE POLICY "feed_bookmarks_delete_policy" ON public.feed_bookmarks FOR DELETE USING (auth.uid()::text = user_id);

