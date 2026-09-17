-- ==============================================================================
-- PlacementAI: Email Domain & Role Authorization Migration
-- Migration: 20260917010000_enforce_email_domains.sql
-- Description:
--   1. Enforces that all student registrations must use an official MITE college
--      email address ending in @mite.ac.in (case-insensitive).
--   2. Permits ONLY the single designated admin account (pavanmradder@gmail.com).
--   3. Rejects any other domain or unauthorized Gmail address at the database level.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.check_user_email_domain()
RETURNS TRIGGER AS $$
DECLARE
  normalized_email TEXT;
BEGIN
  -- Normalize email to lowercase and trim whitespace
  normalized_email := lower(trim(NEW.email));

  -- 1. Check if user is the single authorized administrator
  IF normalized_email = 'pavanmradder@gmail.com' THEN
    RETURN NEW;
  END IF;

  -- 2. Check if student email ends with @mite.ac.in
  IF normalized_email LIKE '%@mite.ac.in' THEN
    RETURN NEW;
  END IF;

  -- 3. Reject all other domains and unauthorized Gmail addresses
  RAISE EXCEPTION 'Please use your official MITE college email (@mite.ac.in).';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users BEFORE INSERT
DROP TRIGGER IF EXISTS enforce_email_domain ON auth.users;
CREATE TRIGGER enforce_email_domain
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_user_email_domain();
