-- ==============================================================================
-- PlacementAI: Personalized Placement Roadmap Schema Migration
-- Migration: 20260921010000_placement_roadmap_schema.sql
-- Description:
--   1. Creates public.placement_roadmaps table for weekly structured roadmap plans.
--   2. Enforces duration_weeks (1-52), overall_progress (0-100), and status ('active', 'completed', 'archived').
--   3. Adds performance indexes on user_id, (user_id, status), and (user_id, target_role).
--   4. Configures Row Level Security (RLS) with strict per-student isolation.
--   5. Grants read access to administrator using public.is_admin().
--   6. Attaches automatic updated_at timestamp trigger using public.handle_updated_at().
-- ==============================================================================

-- 1. CREATE PLACEMENT ROADMAPS TABLE
CREATE TABLE IF NOT EXISTS public.placement_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL DEFAULT 4 CHECK (duration_weeks BETWEEN 1 AND 52),
  roadmap_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall_progress INTEGER NOT NULL DEFAULT 0 CHECK (overall_progress BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_placement_roadmaps_user_id ON public.placement_roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_placement_roadmaps_user_status ON public.placement_roadmaps(user_id, status);
CREATE INDEX IF NOT EXISTS idx_placement_roadmaps_user_role ON public.placement_roadmaps(user_id, target_role);

-- 3. ATTACH AUTOMATIC TIMESTAMP UPDATER TRIGGER
DROP TRIGGER IF EXISTS set_placement_roadmaps_updated_at ON public.placement_roadmaps;
CREATE TRIGGER set_placement_roadmaps_updated_at
  BEFORE UPDATE ON public.placement_roadmaps
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.placement_roadmaps ENABLE ROW LEVEL SECURITY;

-- Students can view only their own roadmaps
DROP POLICY IF EXISTS "Users can view their own placement roadmaps" ON public.placement_roadmaps;
CREATE POLICY "Users can view their own placement roadmaps"
  ON public.placement_roadmaps
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Students can insert their own roadmaps
DROP POLICY IF EXISTS "Users can insert their own placement roadmaps" ON public.placement_roadmaps;
CREATE POLICY "Users can insert their own placement roadmaps"
  ON public.placement_roadmaps
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Students can update their own roadmaps
DROP POLICY IF EXISTS "Users can update their own placement roadmaps" ON public.placement_roadmaps;
CREATE POLICY "Users can update their own placement roadmaps"
  ON public.placement_roadmaps
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Students can delete their own roadmaps
DROP POLICY IF EXISTS "Users can delete their own placement roadmaps" ON public.placement_roadmaps;
CREATE POLICY "Users can delete their own placement roadmaps"
  ON public.placement_roadmaps
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Administrator can view all roadmaps
DROP POLICY IF EXISTS "Admin can view all placement roadmaps" ON public.placement_roadmaps;
CREATE POLICY "Admin can view all placement roadmaps"
  ON public.placement_roadmaps
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 5. TABLE PERMISSIONS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.placement_roadmaps TO authenticated;
