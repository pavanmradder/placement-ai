-- ==============================================================================
-- PlacementAI: DSA Problem Catalog & Progress Tracker Schema Migration
-- Migration: 20260920030000_dsa_tracker_schema.sql
-- Description:
--   1. Creates public.dsa_problems catalog with topics, difficulties, and URLs.
--   2. Creates public.user_dsa_progress table tracking per-student problem progress.
--   3. Configures Row Level Security (RLS) with strict per-student isolation.
--   4. Grants read access to administrator (pavanmradder@gmail.com).
--   5. Seeds 37 curated problems across 10 placement topics.
-- ==============================================================================

-- 1. DSA PROBLEMS TABLE (Global Problem Catalog)
CREATE TABLE IF NOT EXISTS public.dsa_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  platform TEXT NOT NULL DEFAULT 'LeetCode',
  external_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. STUDENT PROBLEM PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.user_dsa_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.dsa_problems(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'solved')),
  solved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_dsa_problem UNIQUE (user_id, problem_id)
);

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_dsa_problems_topic ON public.dsa_problems(topic);
CREATE INDEX IF NOT EXISTS idx_dsa_problems_difficulty ON public.dsa_problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_user_dsa_progress_user_id ON public.user_dsa_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dsa_progress_problem_id ON public.user_dsa_progress(problem_id);
CREATE INDEX IF NOT EXISTS idx_user_dsa_progress_user_status ON public.user_dsa_progress(user_id, status);

-- 4. ATTACH AUTOMATIC TIMESTAMP UPDATER TRIGGER
DROP TRIGGER IF EXISTS set_user_dsa_progress_updated_at ON public.user_dsa_progress;
CREATE TRIGGER set_user_dsa_progress_updated_at
  BEFORE UPDATE ON public.user_dsa_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. ROW LEVEL SECURITY (RLS) POLICIES

-- dsa_problems: Read-only for all authenticated users; only admin can modify
ALTER TABLE public.dsa_problems ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view dsa_problems" ON public.dsa_problems;
CREATE POLICY "Anyone authenticated can view dsa_problems"
  ON public.dsa_problems
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Only admin can insert dsa_problems" ON public.dsa_problems;
CREATE POLICY "Only admin can insert dsa_problems"
  ON public.dsa_problems
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admin can update dsa_problems" ON public.dsa_problems;
CREATE POLICY "Only admin can update dsa_problems"
  ON public.dsa_problems
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admin can delete dsa_problems" ON public.dsa_problems;
CREATE POLICY "Only admin can delete dsa_problems"
  ON public.dsa_problems
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- user_dsa_progress: Students access only their own records; admin can read all
ALTER TABLE public.user_dsa_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own dsa problem progress" ON public.user_dsa_progress;
CREATE POLICY "Users can view their own dsa problem progress"
  ON public.user_dsa_progress
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own dsa problem progress" ON public.user_dsa_progress;
CREATE POLICY "Users can insert their own dsa problem progress"
  ON public.user_dsa_progress
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own dsa problem progress" ON public.user_dsa_progress;
CREATE POLICY "Users can update their own dsa problem progress"
  ON public.user_dsa_progress
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own dsa problem progress" ON public.user_dsa_progress;
CREATE POLICY "Users can delete their own dsa problem progress"
  ON public.user_dsa_progress
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admin can view all user_dsa_progress" ON public.user_dsa_progress;
CREATE POLICY "Admin can view all user_dsa_progress"
  ON public.user_dsa_progress
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 6. TABLE PERMISSIONS
GRANT SELECT ON public.dsa_problems TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_dsa_progress TO authenticated;

-- 7. SEED INITIAL PROBLEM CATALOG (37 Curated Problems across 10 Topics)
INSERT INTO public.dsa_problems (title, slug, topic, difficulty, platform, external_url)
VALUES
  -- Arrays
  ('Two Sum', 'two-sum', 'Arrays', 'Easy', 'LeetCode', 'https://leetcode.com/problems/two-sum/'),
  ('Best Time to Buy and Sell Stock', 'best-time-to-buy-and-sell-stock', 'Arrays', 'Easy', 'LeetCode', 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/'),
  ('Maximum Subarray', 'maximum-subarray', 'Arrays', 'Medium', 'LeetCode', 'https://leetcode.com/problems/maximum-subarray/'),
  ('Product of Array Except Self', 'product-of-array-except-self', 'Arrays', 'Medium', 'LeetCode', 'https://leetcode.com/problems/product-of-array-except-self/'),

  -- Strings
  ('Valid Anagram', 'valid-anagram', 'Strings', 'Easy', 'LeetCode', 'https://leetcode.com/problems/valid-anagram/'),
  ('Valid Palindrome', 'valid-palindrome', 'Strings', 'Easy', 'LeetCode', 'https://leetcode.com/problems/valid-palindrome/'),
  ('Longest Substring Without Repeating Characters', 'longest-substring-without-repeating-characters', 'Strings', 'Medium', 'LeetCode', 'https://leetcode.com/problems/longest-substring-without-repeating-characters/'),
  ('Group Anagrams', 'group-anagrams', 'Strings', 'Medium', 'LeetCode', 'https://leetcode.com/problems/group-anagrams/'),

  -- Linked Lists
  ('Reverse Linked List', 'reverse-linked-list', 'Linked Lists', 'Easy', 'LeetCode', 'https://leetcode.com/problems/reverse-linked-list/'),
  ('Merge Two Sorted Lists', 'merge-two-sorted-lists', 'Linked Lists', 'Easy', 'LeetCode', 'https://leetcode.com/problems/merge-two-sorted-lists/'),
  ('Linked List Cycle', 'linked-list-cycle', 'Linked Lists', 'Easy', 'LeetCode', 'https://leetcode.com/problems/linked-list-cycle/'),
  ('Remove Nth Node From End of List', 'remove-nth-node-from-end-of-list', 'Linked Lists', 'Medium', 'LeetCode', 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/'),

  -- Stack & Queue
  ('Valid Parentheses', 'valid-parentheses', 'Stack & Queue', 'Easy', 'LeetCode', 'https://leetcode.com/problems/valid-parentheses/'),
  ('Implement Queue using Stacks', 'implement-queue-using-stacks', 'Stack & Queue', 'Easy', 'LeetCode', 'https://leetcode.com/problems/implement-queue-using-stacks/'),
  ('Min Stack', 'min-stack', 'Stack & Queue', 'Medium', 'LeetCode', 'https://leetcode.com/problems/min-stack/'),
  ('Daily Temperatures', 'daily-temperatures', 'Stack & Queue', 'Medium', 'LeetCode', 'https://leetcode.com/problems/daily-temperatures/'),

  -- Binary Search
  ('Binary Search', 'binary-search', 'Binary Search', 'Easy', 'LeetCode', 'https://leetcode.com/problems/binary-search/'),
  ('Search in Rotated Sorted Array', 'search-in-rotated-sorted-array', 'Binary Search', 'Medium', 'LeetCode', 'https://leetcode.com/problems/search-in-rotated-sorted-array/'),
  ('Find Minimum in Rotated Sorted Array', 'find-minimum-in-rotated-sorted-array', 'Binary Search', 'Medium', 'LeetCode', 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/'),

  -- Trees
  ('Maximum Depth of Binary Tree', 'maximum-depth-of-binary-tree', 'Trees', 'Easy', 'LeetCode', 'https://leetcode.com/problems/maximum-depth-of-binary-tree/'),
  ('Invert Binary Tree', 'invert-binary-tree', 'Trees', 'Easy', 'LeetCode', 'https://leetcode.com/problems/invert-binary-tree/'),
  ('Lowest Common Ancestor of a BST', 'lowest-common-ancestor-of-a-binary-search-tree', 'Trees', 'Medium', 'LeetCode', 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/'),
  ('Binary Tree Level Order Traversal', 'binary-tree-level-order-traversal', 'Trees', 'Medium', 'LeetCode', 'https://leetcode.com/problems/binary-tree-level-order-traversal/'),

  -- Graphs
  ('Number of Islands', 'number-of-islands', 'Graphs', 'Medium', 'LeetCode', 'https://leetcode.com/problems/number-of-islands/'),
  ('Clone Graph', 'clone-graph', 'Graphs', 'Medium', 'LeetCode', 'https://leetcode.com/problems/clone-graph/'),
  ('Course Schedule', 'course-schedule', 'Graphs', 'Medium', 'LeetCode', 'https://leetcode.com/problems/course-schedule/'),
  ('Word Ladder', 'word-ladder', 'Graphs', 'Hard', 'LeetCode', 'https://leetcode.com/problems/word-ladder/'),

  -- Recursion & Backtracking
  ('Subsets', 'subsets', 'Recursion & Backtracking', 'Medium', 'LeetCode', 'https://leetcode.com/problems/subsets/'),
  ('Combination Sum', 'combination-sum', 'Recursion & Backtracking', 'Medium', 'LeetCode', 'https://leetcode.com/problems/combination-sum/'),
  ('Permutations', 'permutations', 'Recursion & Backtracking', 'Medium', 'LeetCode', 'https://leetcode.com/problems/permutations/'),

  -- Dynamic Programming
  ('Climbing Stairs', 'climbing-stairs', 'Dynamic Programming', 'Easy', 'LeetCode', 'https://leetcode.com/problems/climbing-stairs/'),
  ('Coin Change', 'coin-change', 'Dynamic Programming', 'Medium', 'LeetCode', 'https://leetcode.com/problems/coin-change/'),
  ('Longest Increasing Subsequence', 'longest-increasing-subsequence', 'Dynamic Programming', 'Medium', 'LeetCode', 'https://leetcode.com/problems/longest-increasing-subsequence/'),
  ('House Robber', 'house-robber', 'Dynamic Programming', 'Medium', 'LeetCode', 'https://leetcode.com/problems/house-robber/'),

  -- Sorting & Searching
  ('Merge Intervals', 'merge-intervals', 'Sorting & Searching', 'Medium', 'LeetCode', 'https://leetcode.com/problems/merge-intervals/'),
  ('Top K Frequent Elements', 'top-k-frequent-elements', 'Sorting & Searching', 'Medium', 'LeetCode', 'https://leetcode.com/problems/top-k-frequent-elements/'),
  ('Kth Largest Element in an Array', 'kth-largest-element-in-an-array', 'Sorting & Searching', 'Medium', 'LeetCode', 'https://leetcode.com/problems/kth-largest-element-in-an-array/')
ON CONFLICT (slug) DO UPDATE
SET
  title = EXCLUDED.title,
  topic = EXCLUDED.topic,
  difficulty = EXCLUDED.difficulty,
  platform = EXCLUDED.platform,
  external_url = EXCLUDED.external_url;
