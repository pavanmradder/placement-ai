-- ==============================================================================
-- PlacementAI: Job Application Tracker Schema Migration
-- Migration: 20260921000000_job_applications_schema.sql
-- Description:
--   1. Creates public.job_applications table for tracking student applications.
--   2. Enforces status values via CHECK constraint ('applied', 'oa', 'interview', 'offer', 'rejected').
--   3. Adds performance indexes on user_id and (user_id, status).
--   4. Configures Row Level Security (RLS) with strict per-student isolation.
--   5. Grants read access to administrator using public.is_admin().
--   6. Attaches automatic updated_at timestamp trigger using public.handle_updated_at().
-- ==============================================================================

-- 1. CREATE JOB APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  application_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'oa', 'interview', 'offer', 'rejected')),
  job_url TEXT,
  location TEXT,
  package_ctc TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON public.job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_status ON public.job_applications(user_id, status);

-- 3. ATTACH AUTOMATIC TIMESTAMP UPDATER TRIGGER
DROP TRIGGER IF EXISTS set_job_applications_updated_at ON public.job_applications;
CREATE TRIGGER set_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Students can view only their own applications
DROP POLICY IF EXISTS "Users can view their own job applications" ON public.job_applications;
CREATE POLICY "Users can view their own job applications"
  ON public.job_applications
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Students can insert their own applications
DROP POLICY IF EXISTS "Users can insert their own job applications" ON public.job_applications;
CREATE POLICY "Users can insert their own job applications"
  ON public.job_applications
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Students can update their own applications
DROP POLICY IF EXISTS "Users can update their own job applications" ON public.job_applications;
CREATE POLICY "Users can update their own job applications"
  ON public.job_applications
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Students can delete their own applications
DROP POLICY IF EXISTS "Users can delete their own job applications" ON public.job_applications;
CREATE POLICY "Users can delete their own job applications"
  ON public.job_applications
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Administrator can view all applications
DROP POLICY IF EXISTS "Admin can view all job applications" ON public.job_applications;
CREATE POLICY "Admin can view all job applications"
  ON public.job_applications
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 5. TABLE PERMISSIONS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
