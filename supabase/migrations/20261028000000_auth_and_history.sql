-- GitToScale: Supabase PostgreSQL Schema Migration
-- Migration: 20261028000000_auth_and_history.sql
-- Description: Creates profiles, architecture_history, and repository_history tables with RLS and triggers.

-- Ensure UUID generation extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. PROFILES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index on email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies:
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- =============================================================================
-- 2. ARCHITECTURE HISTORY TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.architecture_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    generation_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    architecture_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for architecture_history
CREATE INDEX IF NOT EXISTS idx_arch_history_user_id ON public.architecture_history(user_id);
CREATE INDEX IF NOT EXISTS idx_arch_history_created_at ON public.architecture_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_arch_history_status ON public.architecture_history(status);

-- Enable RLS on architecture_history
ALTER TABLE public.architecture_history ENABLE ROW LEVEL SECURITY;

-- Architecture History RLS Policies:
CREATE POLICY "Users can select own architecture history"
    ON public.architecture_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own architecture history"
    ON public.architecture_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own architecture history"
    ON public.architecture_history FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own architecture history"
    ON public.architecture_history FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================================================
-- 3. REPOSITORY HISTORY TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.repository_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    repository_url TEXT NOT NULL,
    repository_owner TEXT,
    repository_name TEXT,
    repository_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    scan_result JSONB NOT NULL DEFAULT '{}'::jsonb,
    architecture_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for repository_history
CREATE INDEX IF NOT EXISTS idx_repo_history_user_id ON public.repository_history(user_id);
CREATE INDEX IF NOT EXISTS idx_repo_history_created_at ON public.repository_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_repo_history_status ON public.repository_history(status);

-- Enable RLS on repository_history
ALTER TABLE public.repository_history ENABLE ROW LEVEL SECURITY;

-- Repository History RLS Policies:
CREATE POLICY "Users can select own repository history"
    ON public.repository_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own repository history"
    ON public.repository_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own repository history"
    ON public.repository_history FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own repository history"
    ON public.repository_history FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================================================
-- 4. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach updated_at triggers
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_arch_history_updated_at ON public.architecture_history;
CREATE TRIGGER set_arch_history_updated_at
    BEFORE UPDATE ON public.architecture_history
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_repo_history_updated_at ON public.repository_history;
CREATE TRIGGER set_repo_history_updated_at
    BEFORE UPDATE ON public.repository_history
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 5. AUTOMATIC PROFILE CREATION TRIGGER ON AUTH.USERS REGISTRATION
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
        updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing on every new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

