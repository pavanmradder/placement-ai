-- ==============================================================================
-- PlacementAI: Initial Supabase PostgreSQL Schema Migration
-- Migration: 20260917000000_initial_schema.sql
-- Description: Creates core schema tables (profiles, skills, dsa_progress, 
--              mock_interviews, resumes) with foreign keys to auth.users,
--              Row Level Security (RLS) enabled on all tables, and strict
--              per-user RLS policies preventing data exposure.
-- ==============================================================================

-- 1. PROFILES TABLE
-- Stores student profile information linked directly to their Supabase auth user
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  college TEXT,
  target_role TEXT,
  graduation_year INTEGER,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. SKILLS TABLE
-- Stores technical and domain skills linked to the student
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. DSA_PROGRESS TABLE
-- Tracks coding problem metrics and DSA readiness statistics
CREATE TABLE IF NOT EXISTS public.dsa_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  easy_solved INTEGER NOT NULL DEFAULT 0,
  medium_solved INTEGER NOT NULL DEFAULT 0,
  hard_solved INTEGER NOT NULL DEFAULT 0,
  total_solved INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. MOCK_INTERVIEWS TABLE
-- Stores interview sessions, performance scores, and AI diagnostic feedback
CREATE TABLE IF NOT EXISTS public.mock_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interview_type TEXT NOT NULL,
  score NUMERIC(5, 2),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. RESUMES TABLE
-- Stores resume file records, ATS compatibility scores, and analysis summaries
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  ats_score NUMERIC(5, 2),
  analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- Optimize user-scoped queries across foreign keys
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON public.skills(user_id);
CREATE INDEX IF NOT EXISTS idx_dsa_progress_user_id ON public.dsa_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_user_id ON public.mock_interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);

-- ==============================================================================
-- AUTOMATIC TIMESTAMP UPDATER FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for dsa_progress
DROP TRIGGER IF EXISTS set_dsa_progress_updated_at ON public.dsa_progress;
CREATE TRIGGER set_dsa_progress_updated_at
  BEFORE UPDATE ON public.dsa_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for resumes
DROP TRIGGER IF EXISTS set_resumes_updated_at ON public.resumes;
CREATE TRIGGER set_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- AUTOMATIC USER PROFILE PROVISIONING TRIGGER
-- Seamlessly creates a public.profiles row upon Supabase Auth user registration
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, target_role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'target_role', NEW.raw_user_meta_data->>'targetRole', 'Software Development Engineer (SDE)')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict user-level isolation: Authenticated users can ONLY SELECT, INSERT, 
-- UPDATE, and DELETE their own records. No cross-user access permitted.
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dsa_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. PROFILES POLICIES (Matches auth.uid() with profiles.id)
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can delete their own profile"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- ------------------------------------------------------------------------------
-- 2. SKILLS POLICIES (Matches auth.uid() with skills.user_id)
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their own skills"
  ON public.skills
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own skills"
  ON public.skills
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own skills"
  ON public.skills
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own skills"
  ON public.skills
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ------------------------------------------------------------------------------
-- 3. DSA_PROGRESS POLICIES (Matches auth.uid() with dsa_progress.user_id)
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their own DSA progress"
  ON public.dsa_progress
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own DSA progress"
  ON public.dsa_progress
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own DSA progress"
  ON public.dsa_progress
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own DSA progress"
  ON public.dsa_progress
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ------------------------------------------------------------------------------
-- 4. MOCK_INTERVIEWS POLICIES (Matches auth.uid() with mock_interviews.user_id)
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their own mock interviews"
  ON public.mock_interviews
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own mock interviews"
  ON public.mock_interviews
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own mock interviews"
  ON public.mock_interviews
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own mock interviews"
  ON public.mock_interviews
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ------------------------------------------------------------------------------
-- 5. RESUMES POLICIES (Matches auth.uid() with resumes.user_id)
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their own resumes"
  ON public.resumes
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own resumes"
  ON public.resumes
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own resumes"
  ON public.resumes
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own resumes"
  ON public.resumes
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
