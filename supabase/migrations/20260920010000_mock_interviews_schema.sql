-- ==============================================================================
-- PlacementAI: Mock Interviews Schema Extension Migration
-- Migration: 20260920010000_mock_interviews_schema.sql
-- Description:
--   1. Extends the existing public.mock_interviews table with:
--      - target_role: role the student is interviewing for (e.g. SDE)
--      - difficulty: Easy, Medium, or Hard
--      - status: in_progress, completed, or abandoned
--      - questions: JSONB array holding generated questions, student answers, and evaluations
--      - current_question_index: integer pointer to current question
--      - updated_at: timestamp with automatic trigger updater
--   2. Attaches the handle_updated_at trigger.
--   3. Adds performance indexes on status and user_id + status.
--   4. RLS policies from 20260917000000_initial_schema.sql and
--      20260917020000_admin_read_access.sql remain 100% active and intact.
-- ==============================================================================

-- 1. EXTEND public.mock_interviews TABLE
ALTER TABLE public.mock_interviews
  ADD COLUMN IF NOT EXISTS target_role TEXT DEFAULT 'Software Developer',
  ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'Medium',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'in_progress',
  ADD COLUMN IF NOT EXISTS questions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS current_question_index INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2. ATTACH AUTOMATIC TIMESTAMP UPDATER TRIGGER
DROP TRIGGER IF EXISTS set_mock_interviews_updated_at ON public.mock_interviews;
CREATE TRIGGER set_mock_interviews_updated_at
  BEFORE UPDATE ON public.mock_interviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. INDEXES FOR SESSION QUERIES
CREATE INDEX IF NOT EXISTS idx_mock_interviews_status ON public.mock_interviews(status);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_user_status ON public.mock_interviews(user_id, status);
