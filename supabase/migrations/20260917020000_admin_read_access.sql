-- ==============================================================================
-- PlacementAI: Admin Read Access Migration
-- Migration: 20260917020000_admin_read_access.sql
-- Description:
--   1. Defines a secure helper function public.is_admin() that checks if the
--      authenticated session belongs to the single authorized administrator
--      (pavanmradder@gmail.com) via auth.jwt() and auth.users verification.
--   2. Grants SELECT permissions ONLY to pavanmradder@gmail.com across profiles,
--      skills, dsa_progress, mock_interviews, and resumes tables.
--   3. Keeps student RLS policies 100% intact: @mite.ac.in students can still
--      ONLY read and write their own records.
-- ==============================================================================

-- 1. Helper function to verify that the requesting user is strictly pavanmradder@gmail.com
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'pavanmradder@gmail.com'
    OR EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = (SELECT auth.uid()) 
      AND lower(email) = 'pavanmradder@gmail.com'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, auth;

-- Grant execution to authenticated users for RLS evaluation
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 2. Profiles: Allow admin to SELECT student profiles
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
CREATE POLICY "Admin can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 3. Skills: Allow admin to SELECT student skills
DROP POLICY IF EXISTS "Admin can view all skills" ON public.skills;
CREATE POLICY "Admin can view all skills"
  ON public.skills
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 4. DSA Progress: Allow admin to SELECT dsa progress metrics
DROP POLICY IF EXISTS "Admin can view all dsa_progress" ON public.dsa_progress;
CREATE POLICY "Admin can view all dsa_progress"
  ON public.dsa_progress
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 5. Mock Interviews: Allow admin to SELECT mock interview records
DROP POLICY IF EXISTS "Admin can view all mock_interviews" ON public.mock_interviews;
CREATE POLICY "Admin can view all mock_interviews"
  ON public.mock_interviews
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 6. Resumes: Allow admin to SELECT resume records
DROP POLICY IF EXISTS "Admin can view all resumes" ON public.resumes;
CREATE POLICY "Admin can view all resumes"
  ON public.resumes
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 7. Table-level permissions for authenticated role
-- In PostgreSQL, table privileges must be granted to the role before RLS policies can run.
-- With RLS enabled, these grants do NOT bypass security: each query is strictly filtered
-- by the RLS policies defined above and in 20260917000000_initial_schema.sql.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE 
  public.profiles,
  public.skills,
  public.dsa_progress,
  public.mock_interviews,
  public.resumes
TO authenticated;
