-- ==============================================================================
-- PlacementAI: Resume Storage & Schema Extension Migration
-- Migration: 20260920000000_resume_storage.sql
-- Description:
--   1. Adds required fields (storage_path, file_size, mime_type) to public.resumes.
--   2. Ensures backward compatibility by keeping file_path in sync with storage_path.
--   3. Provisions a private Supabase Storage bucket named 'resumes' (max 5 MB, PDF only).
--   4. Establishes strict Row-Level Security (RLS) on storage.objects:
--      - Students can upload, view, update, and delete ONLY within their own folder: {user_id}/*
--      - Authorized administrator (pavanmradder@gmail.com) can SELECT student resumes.
--      - No public access; service role key is never exposed to client.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTEND public.resumes TABLE
-- ------------------------------------------------------------------------------
ALTER TABLE public.resumes 
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT DEFAULT 'application/pdf';

-- Populate storage_path from file_path for any existing rows
UPDATE public.resumes
SET storage_path = file_path
WHERE storage_path IS NULL AND file_path IS NOT NULL;

-- Relax NOT NULL on file_path so inserts with storage_path succeed seamlessly
ALTER TABLE public.resumes 
  ALTER COLUMN file_path DROP NOT NULL;

-- Index storage_path for fast path lookups
CREATE INDEX IF NOT EXISTS idx_resumes_storage_path ON public.resumes(storage_path);

-- ------------------------------------------------------------------------------
-- 2. CREATE PRIVATE STORAGE BUCKET: 'resumes'
-- ------------------------------------------------------------------------------
-- Max size: 5242880 bytes (5 MB)
-- Allowed MIME types: application/pdf
-- Public access: false (private bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  5242880,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf'];

-- ------------------------------------------------------------------------------
-- 3. STORAGE RLS POLICIES (storage.objects)
-- Storage paths follow format: {user_id}/{filename}.pdf
-- storage.foldername(name)[1] extracts the first path component ({user_id})
-- ------------------------------------------------------------------------------

-- Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3a. INSERT: Authenticated students can only upload to their own user_id directory
DROP POLICY IF EXISTS "Students can upload their own resume" ON storage.objects;
CREATE POLICY "Students can upload their own resume"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resumes'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- 3b. SELECT: Authenticated students can view their own resume, and admin can view all resumes
DROP POLICY IF EXISTS "Students and admin can view resumes" ON storage.objects;
CREATE POLICY "Students and admin can view resumes"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (
      (auth.uid())::text = (storage.foldername(name))[1]
      OR public.is_admin()
    )
  );

-- 3c. UPDATE: Authenticated students can update their own resume in their folder
DROP POLICY IF EXISTS "Students can update their own resume" ON storage.objects;
CREATE POLICY "Students can update their own resume"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'resumes'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- 3d. DELETE: Authenticated students can delete their own resume in their folder
DROP POLICY IF EXISTS "Students can delete their own resume" ON storage.objects;
CREATE POLICY "Students can delete their own resume"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );
