-- ==============================================================================
-- PlacementAI: Skill Gap Analysis Schema Migration
-- Migration: 20260920020000_skill_gap_schema.sql
-- Description:
--   1. Creates public.skill_gap_analyses table to persist student skill gap evaluations.
--   2. Includes user_id, target_role, current_skills, required_skills, missing_skills,
--      skill_match_percentage, recommendations, and timestamps.
--   3. Enables Row Level Security (RLS) with strict per-student isolation.
--   4. Grants read access to the designated administrator (pavanmradder@gmail.com).
--   5. Attaches automatic updated_at timestamp trigger.
-- ==============================================================================

-- 1. CREATE TABLE public.skill_gap_analyses
CREATE TABLE IF NOT EXISTS public.skill_gap_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  current_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  skill_match_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_skill_gap_analyses_user_id ON public.skill_gap_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_gap_analyses_created_at ON public.skill_gap_analyses(created_at DESC);

-- 3. ATTACH AUTOMATIC TIMESTAMP UPDATER TRIGGER
DROP TRIGGER IF EXISTS set_skill_gap_analyses_updated_at ON public.skill_gap_analyses;
CREATE TRIGGER set_skill_gap_analyses_updated_at
  BEFORE UPDATE ON public.skill_gap_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.skill_gap_analyses ENABLE ROW LEVEL SECURITY;

-- Students can only view their own skill gap analyses
DROP POLICY IF EXISTS "Users can view their own skill gap analyses" ON public.skill_gap_analyses;
CREATE POLICY "Users can view their own skill gap analyses"
  ON public.skill_gap_analyses
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Students can only insert their own skill gap analyses
DROP POLICY IF EXISTS "Users can insert their own skill gap analyses" ON public.skill_gap_analyses;
CREATE POLICY "Users can insert their own skill gap analyses"
  ON public.skill_gap_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Students can only update their own skill gap analyses
DROP POLICY IF EXISTS "Users can update their own skill gap analyses" ON public.skill_gap_analyses;
CREATE POLICY "Users can update their own skill gap analyses"
  ON public.skill_gap_analyses
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Students can only delete their own skill gap analyses
DROP POLICY IF EXISTS "Users can delete their own skill gap analyses" ON public.skill_gap_analyses;
CREATE POLICY "Users can delete their own skill gap analyses"
  ON public.skill_gap_analyses
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Admin read access policy
DROP POLICY IF EXISTS "Admin can view all skill gap analyses" ON public.skill_gap_analyses;
CREATE POLICY "Admin can view all skill gap analyses"
  ON public.skill_gap_analyses
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 5. TABLE PERMISSIONS
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.skill_gap_analyses TO authenticated;
