"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Code2,
  CheckCircle2,
  Clock,
  Circle,
  ExternalLink,
  Search,
  Filter,
  Check,
  AlertCircle,
  Loader2,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ArrowUpDown,
  BookOpen,
  Layers,
  X,
  FileEdit,
  Save,
} from "lucide-react";

export type ProblemDifficulty = "Easy" | "Medium" | "Hard";
export type ProblemStatus = "not_started" | "in_progress" | "solved";

export interface DsaProblem {
  id: string;
  title: string;
  slug: string;
  topic: string;
  difficulty: ProblemDifficulty;
  platform: string;
  external_url: string;
  created_at: string;
}

export interface UserProgressRecord {
  id: string;
  problem_id: string;
  status: ProblemStatus;
  solved_at: string | null;
  notes: string | null;
  updated_at: string;
}

export interface DsaSummaryStats {
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalSolved: number;
  updatedAt: string | null;
}

interface DsaTrackerClientProps {
  userId: string;
  targetRole?: string;
}

export default function DsaTrackerClient({
  userId,
  targetRole = "Software Development Engineer (SDE)",
}: DsaTrackerClientProps) {
  const [problems, setProblems] = useState<DsaProblem[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, UserProgressRecord>>({});
  const [stats, setStats] = useState<DsaSummaryStats | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"All" | ProblemDifficulty>("All");
  const [selectedTopic, setSelectedTopic] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<"All" | ProblemStatus>("All");

  // Status updating state per problem
  const [updatingProblemId, setUpdatingProblemId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Active notes editor
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<string>("");

  // Fetch problems and progress concurrently
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [problemsRes, progressRes] = await Promise.all([
        fetch("/api/dsa/problems"),
        fetch("/api/dsa/progress"),
      ]);

      const [problemsData, progressData] = await Promise.all([
        problemsRes.json(),
        progressRes.json(),
      ]);

      if (!problemsRes.ok || !problemsData.success) {
        throw new Error(problemsData.error || "Failed to load DSA problems.");
      }

      if (!progressRes.ok || !progressData.success) {
        throw new Error(progressData.error || "Failed to load DSA progress.");
      }

      const fetchedProblems: DsaProblem[] = problemsData.problems || [];
      setProblems(fetchedProblems);

      // Build problem_id -> progress record map
      const map: Record<string, UserProgressRecord> = {};
      if (Array.isArray(progressData.progress)) {
        for (const item of progressData.progress) {
          map[item.problem_id] = item;
        }
      }
      setProgressMap(map);
      setStats(progressData.stats || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred while loading data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Dismiss toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Handle problem status change with optimistic UI update
  const handleStatusChange = async (problem: DsaProblem, newStatus: ProblemStatus) => {
    const previousRecord = progressMap[problem.id];
    if (previousRecord?.status === newStatus) return;

    setUpdatingProblemId(problem.id);

    // Optimistic progress update
    const optimisticRecord: UserProgressRecord = {
      id: previousRecord?.id || `temp-${Date.now()}`,
      problem_id: problem.id,
      status: newStatus,
      solved_at: newStatus === "solved" ? new Date().toISOString() : null,
      notes: previousRecord?.notes || null,
      updated_at: new Date().toISOString(),
    };

    setProgressMap((prev) => ({
      ...prev,
      [problem.id]: optimisticRecord,
    }));

    try {
      const response = await fetch("/api/dsa/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.id,
          status: newStatus,
          notes: previousRecord?.notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update problem progress.");
      }

      // Reconcile server response
      if (data.progress) {
        setProgressMap((prev) => ({
          ...prev,
          [problem.id]: data.progress,
        }));
      }

      if (data.stats) {
        setStats(data.stats);
      }

      const statusLabels: Record<ProblemStatus, string> = {
        solved: "Solved",
        in_progress: "In Progress",
        not_started: "Not Started",
      };

      setToastMessage({
        text: `"${problem.title}" marked as ${statusLabels[newStatus]}.`,
        type: "success",
      });
    } catch (err: unknown) {
      // Revert optimistic update
      setProgressMap((prev) => {
        const next = { ...prev };
        if (previousRecord) {
          next[problem.id] = previousRecord;
        } else {
          delete next[problem.id];
        }
        return next;
      });

      setToastMessage({
        text: err instanceof Error ? err.message : "Failed to update status. Please try again.",
        type: "error",
      });
    } finally {
      setUpdatingProblemId(null);
    }
  };

  // Handle note saving
  const handleSaveNotes = async (problemId: string) => {
    const existing = progressMap[problemId];
    const currentStatus = existing?.status || "not_started";

    setUpdatingProblemId(problemId);

    try {
      const response = await fetch("/api/dsa/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId,
          status: currentStatus,
          notes: noteDraft.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save notes.");
      }

      if (data.progress) {
        setProgressMap((prev) => ({
          ...prev,
          [problemId]: data.progress,
        }));
      }

      setEditingNotesId(null);
      setToastMessage({
        text: "Problem notes saved successfully.",
        type: "success",
      });
    } catch (err: unknown) {
      setToastMessage({
        text: err instanceof Error ? err.message : "Failed to save notes.",
        type: "error",
      });
    } finally {
      setUpdatingProblemId(null);
    }
  };

  // Computed Metrics & Stats
  const totalProblemsCount = problems.length;

  const solvedCount = useMemo(() => {
    return problems.filter((p) => progressMap[p.id]?.status === "solved").length;
  }, [problems, progressMap]);

  const inProgressCount = useMemo(() => {
    return problems.filter((p) => progressMap[p.id]?.status === "in_progress").length;
  }, [problems, progressMap]);

  const notStartedCount = Math.max(0, totalProblemsCount - solvedCount - inProgressCount);

  const overallPercentage = totalProblemsCount > 0
    ? Math.round((solvedCount / totalProblemsCount) * 100)
    : 0;

  // Difficulty counts
  const difficultyStats = useMemo(() => {
    const counts = {
      Easy: { total: 0, solved: 0 },
      Medium: { total: 0, solved: 0 },
      Hard: { total: 0, solved: 0 },
    };

    for (const p of problems) {
      if (counts[p.difficulty]) {
        counts[p.difficulty].total++;
        if (progressMap[p.id]?.status === "solved") {
          counts[p.difficulty].solved++;
        }
      }
    }

    return counts;
  }, [problems, progressMap]);

  // Topic list & Topic-wise progress
  const topicStats = useMemo(() => {
    const map = new Map<string, { total: number; solved: number; inProgress: number }>();

    for (const p of problems) {
      const existing = map.get(p.topic) || { total: 0, solved: 0, inProgress: 0 };
      existing.total++;

      const status = progressMap[p.id]?.status;
      if (status === "solved") existing.solved++;
      else if (status === "in_progress") existing.inProgress++;

      map.set(p.topic, existing);
    }

    return Array.from(map.entries()).map(([topic, data]) => ({
      topic,
      total: data.total,
      solved: data.solved,
      inProgress: data.inProgress,
      percentage: data.total > 0 ? Math.round((data.solved / data.total) * 100) : 0,
    }));
  }, [problems, progressMap]);

  const uniqueTopics = useMemo(() => {
    return Array.from(new Set(problems.map((p) => p.topic))).sort();
  }, [problems]);

  // Filtered problems
  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      // Difficulty filter
      if (selectedDifficulty !== "All" && problem.difficulty !== selectedDifficulty) {
        return false;
      }

      // Topic filter
      if (selectedTopic !== "All" && problem.topic !== selectedTopic) {
        return false;
      }

      // Status filter
      const status = progressMap[problem.id]?.status || "not_started";
      if (selectedStatus !== "All" && status !== selectedStatus) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = problem.title.toLowerCase().includes(q);
        const matchesTopic = problem.topic.toLowerCase().includes(q);
        const matchesPlatform = problem.platform.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTopic && !matchesPlatform) {
          return false;
        }
      }

      return true;
    });
  }, [problems, progressMap, selectedDifficulty, selectedTopic, selectedStatus, searchQuery]);

  const hasActiveFilters =
    selectedDifficulty !== "All" ||
    selectedTopic !== "All" ||
    selectedStatus !== "All" ||
    searchQuery.trim().length > 0;

  const resetFilters = () => {
    setSelectedDifficulty("All");
    setSelectedTopic("All");
    setSelectedStatus("All");
    setSearchQuery("");
  };

  // Helper formatting for date
  const formatSolvedDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium border transition-all animate-in fade-in slide-in-from-bottom-5 ${
            toastMessage.type === "success"
              ? "bg-[#0b1b17] text-emerald-300 border-emerald-500/30"
              : "bg-[#200d11] text-rose-300 border-rose-500/30"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-950/70 via-[#120f26] to-[#0a0d1d] border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Code2 className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                DSA Progress{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400">
                  Tracker
                </span>
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Placement Drill Catalog
              </span>
            </div>

            <p className="text-sm text-slate-300 max-w-2xl">
              Master the essential Data Structures & Algorithms curated for Tier-1 campus recruitment drives.
              Track your solved problems, view topic-wise readiness, and build technical interview confidence.
            </p>

            <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
              <span>Target Role: <strong className="text-slate-200">{targetRole}</strong></span>
              <span>•</span>
              <span>Platform: <strong className="text-slate-200">LeetCode Curated</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-12 rounded-2xl bg-[#0c1222]/80 border border-white/10 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-300 font-medium">Loading DSA problem catalog & student progress...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <div className="space-y-2 flex-1">
            <h3 className="text-sm font-semibold text-white">Failed to load DSA Tracker data</h3>
            <p className="text-xs text-rose-200/90">{error}</p>
            <button
              type="button"
              onClick={loadData}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-xs font-medium text-white border border-rose-500/30 transition-all cursor-pointer"
            >
              Retry Loading
            </button>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* SECTION 1: TOP PROGRESS OVERVIEW METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Metric 1: Total Problems */}
            <div className="p-5 rounded-2xl bg-[#0c1222]/90 border border-white/10 hover:border-purple-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Problems
                </span>
                <div className="p-2 rounded-xl bg-white/[0.05] text-slate-300 border border-white/10">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {totalProblemsCount}
                </span>
                <span className="text-xs text-slate-400">Curated</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Across 10 core placement topics</p>
            </div>

            {/* Metric 2: Solved */}
            <div className="p-5 rounded-2xl bg-[#0c1222]/90 border border-emerald-500/30 hover:border-emerald-500/50 transition-all shadow-lg shadow-emerald-950/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  Solved
                </span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {solvedCount}
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {overallPercentage}% Done
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Problems completed & verified</p>
            </div>

            {/* Metric 3: In Progress */}
            <div className="p-5 rounded-2xl bg-[#0c1222]/90 border border-amber-500/30 hover:border-amber-500/50 transition-all shadow-lg shadow-amber-950/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                  In Progress
                </span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {inProgressCount}
                </span>
                <span className="text-xs text-amber-300/80">Active Drills</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Currently being attempted</p>
            </div>

            {/* Metric 4: Not Started */}
            <div className="p-5 rounded-2xl bg-[#0c1222]/90 border border-white/10 hover:border-slate-600 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Not Started
                </span>
                <div className="p-2 rounded-xl bg-white/[0.05] text-slate-400 border border-white/10">
                  <Circle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {notStartedCount}
                </span>
                <span className="text-xs text-slate-400">Remaining</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Pending in problem bank</p>
            </div>

            {/* Metric 5: Difficulty Breakdown */}
            <div className="p-5 rounded-2xl bg-[#0c1222]/90 border border-indigo-500/30 hover:border-indigo-500/50 transition-all">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 block mb-2">
                Difficulty Breakdown
              </span>
              <div className="space-y-1.5">
                {/* Easy */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-medium">Easy</span>
                  <span className="text-slate-300">
                    {difficultyStats.Easy.solved}/{difficultyStats.Easy.total}
                  </span>
                </div>
                <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        difficultyStats.Easy.total > 0
                          ? (difficultyStats.Easy.solved / difficultyStats.Easy.total) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>

                {/* Medium */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <span className="text-amber-400 font-medium">Medium</span>
                  <span className="text-slate-300">
                    {difficultyStats.Medium.solved}/{difficultyStats.Medium.total}
                  </span>
                </div>
                <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-400 h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        difficultyStats.Medium.total > 0
                          ? (difficultyStats.Medium.solved / difficultyStats.Medium.total) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>

                {/* Hard */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <span className="text-rose-400 font-medium">Hard</span>
                  <span className="text-slate-300">
                    {difficultyStats.Hard.solved}/{difficultyStats.Hard.total}
                  </span>
                </div>
                <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-rose-400 h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        difficultyStats.Hard.total > 0
                          ? (difficultyStats.Hard.solved / difficultyStats.Hard.total) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: TOPIC-WISE PROGRESS VISUALIZATION */}
          <div className="p-6 rounded-2xl bg-[#0c1222]/80 border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Topic-Wise Progress Breakdown</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any topic card to filter the catalog below.
                </p>
              </div>

              {selectedTopic !== "All" && (
                <button
                  type="button"
                  onClick={() => setSelectedTopic("All")}
                  className="self-start sm:self-auto text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <span>Show All Topics</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {topicStats.map((item) => {
                const isSelected = selectedTopic === item.topic;
                return (
                  <button
                    key={item.topic}
                    type="button"
                    onClick={() =>
                      setSelectedTopic((curr) => (curr === item.topic ? "All" : item.topic))
                    }
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-purple-500/15 border-purple-500/50 shadow-md shadow-purple-950/40 ring-1 ring-purple-500/30"
                        : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/15"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-white truncate max-w-[120px]" title={item.topic}>
                        {item.topic}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          item.percentage === 100
                            ? "text-emerald-300 bg-emerald-500/15"
                            : item.percentage > 0
                            ? "text-purple-300 bg-purple-500/15"
                            : "text-slate-400 bg-slate-800"
                        }`}
                      >
                        {item.percentage}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                      <span>Solved</span>
                      <span className="text-slate-200 font-medium">
                        {item.solved} / {item.total}
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          item.percentage === 100
                            ? "bg-emerald-400"
                            : "bg-gradient-to-r from-purple-500 to-indigo-400"
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: PROBLEM CATALOG & FILTERS */}
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0c1222]/80 border border-white/10">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search problem title, topic, or platform..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#07090e] border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Difficulty Filter */}
                <div className="flex items-center rounded-xl bg-[#07090e] border border-white/10 p-0.5 text-xs">
                  {(["All", "Easy", "Medium", "Hard"] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                        selectedDifficulty === diff
                          ? diff === "Easy"
                            ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                            : diff === "Medium"
                            ? "bg-amber-500/20 text-amber-300 font-semibold"
                            : diff === "Hard"
                            ? "bg-rose-500/20 text-rose-300 font-semibold"
                            : "bg-purple-500/20 text-purple-300 font-semibold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center rounded-xl bg-[#07090e] border border-white/10 p-0.5 text-xs">
                  {(
                    [
                      { key: "All", label: "All Status" },
                      { key: "solved", label: "Solved" },
                      { key: "in_progress", label: "In Progress" },
                      { key: "not_started", label: "Not Started" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setSelectedStatus(item.key)}
                      className={`px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                        selectedStatus === item.key
                          ? "bg-white/10 text-white font-semibold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Topic Select Dropdown */}
                <div className="relative">
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="bg-[#07090e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/60 transition-all cursor-pointer"
                  >
                    <option value="All">All Topics ({problems.length})</option>
                    {uniqueTopics.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear All Filters Button */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                    title="Reset all filters"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Results count indicator */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                Showing <strong className="text-white">{filteredProblems.length}</strong> of {problems.length} problems
                {hasActiveFilters ? " (filtered)" : ""}
              </span>

              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Click external link icon to open problem directly on LeetCode
              </span>
            </div>

            {/* Problem Catalog List */}
            {filteredProblems.length === 0 ? (
              <div className="p-12 rounded-2xl bg-[#0c1222]/60 border border-white/10 text-center space-y-3">
                <Search className="w-8 h-8 text-slate-500 mx-auto" />
                <h3 className="text-sm font-semibold text-white">No problems found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No problems match your current filter combination. Try clearing filters or searching for another term.
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all cursor-pointer mt-2"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredProblems.map((problem, index) => {
                  const progress = progressMap[problem.id];
                  const currentStatus: ProblemStatus = progress?.status || "not_started";
                  const isUpdating = updatingProblemId === problem.id;
                  const isNotesOpen = editingNotesId === problem.id;
                  const solvedDateStr = formatSolvedDate(progress?.solved_at || null);

                  return (
                    <div
                      key={problem.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        currentStatus === "solved"
                          ? "bg-[#0b161c]/60 border-emerald-500/20 hover:border-emerald-500/40"
                          : currentStatus === "in_progress"
                          ? "bg-[#141221]/60 border-purple-500/25 hover:border-purple-500/40"
                          : "bg-[#0c1222]/80 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Problem Information */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-400 w-6 shrink-0">
                              #{index + 1}
                            </span>

                            <a
                              href={problem.external_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-bold text-white hover:text-cyan-300 transition-colors flex items-center gap-1.5 group truncate"
                            >
                              <span className="truncate">{problem.title}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 shrink-0 transition-colors" />
                            </a>

                            {/* Difficulty Badge */}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                                problem.difficulty === "Easy"
                                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                                  : problem.difficulty === "Medium"
                                  ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                                  : "text-rose-400 bg-rose-500/10 border-rose-500/30"
                              }`}
                            >
                              {problem.difficulty}
                            </span>

                            {/* Topic Badge */}
                            <button
                              type="button"
                              onClick={() => setSelectedTopic(problem.topic)}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.05] hover:bg-white/10 border border-white/10 text-slate-300 transition-colors shrink-0 cursor-pointer"
                              title={`Filter by ${problem.topic}`}
                            >
                              {problem.topic}
                            </button>

                            {/* Platform Badge */}
                            <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded shrink-0">
                              {problem.platform}
                            </span>
                          </div>

                          {/* Extra info: Solved date & Notes preview */}
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 pl-8 flex-wrap">
                            {solvedDateStr && currentStatus === "solved" && (
                              <span className="text-emerald-400/90 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Solved on {solvedDateStr}
                              </span>
                            )}

                            {progress?.notes && (
                              <span className="text-slate-300 italic truncate max-w-md">
                                Note: &ldquo;{progress.notes}&rdquo;
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                if (isNotesOpen) {
                                  setEditingNotesId(null);
                                } else {
                                  setEditingNotesId(problem.id);
                                  setNoteDraft(progress?.notes || "");
                                }
                              }}
                              className="text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1 underline underline-offset-2 hover:no-underline cursor-pointer"
                            >
                              <FileEdit className="w-3 h-3" />
                              <span>{progress?.notes ? "Edit Note" : "Add Note"}</span>
                            </button>
                          </div>
                        </div>

                        {/* Status Interactive Control */}
                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto pl-8 sm:pl-0">
                          {isUpdating ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] text-xs text-slate-300">
                              <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                              <span>Updating...</span>
                            </div>
                          ) : (
                            <div className="flex items-center rounded-xl bg-[#07090e] border border-white/10 p-0.5 text-xs">
                              {/* Not Started */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(problem, "not_started")}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                  currentStatus === "not_started"
                                    ? "bg-white/10 text-white font-semibold"
                                    : "text-slate-400 hover:text-slate-200"
                                }`}
                                title="Mark as Not Started"
                              >
                                Not Started
                              </button>

                              {/* In Progress */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(problem, "in_progress")}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                                  currentStatus === "in_progress"
                                    ? "bg-amber-500/20 text-amber-300 font-semibold"
                                    : "text-slate-400 hover:text-amber-200"
                                }`}
                                title="Mark as In Progress"
                              >
                                <Clock className="w-3 h-3" />
                                <span>In Progress</span>
                              </button>

                              {/* Solved */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(problem, "solved")}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                                  currentStatus === "solved"
                                    ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                                    : "text-slate-400 hover:text-emerald-200"
                                }`}
                                title="Mark as Solved"
                              >
                                <Check className="w-3 h-3" />
                                <span>Solved</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expandable Notes Editor */}
                      {isNotesOpen && (
                        <div className="mt-3 pt-3 border-t border-white/5 pl-8 space-y-2">
                          <label className="text-[11px] font-semibold text-slate-300 block">
                            Interview Notes & Approach Summary for {problem.title}:
                          </label>
                          <textarea
                            rows={2}
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                            placeholder="e.g. Used two-pointer approach in O(n) time, O(1) space. Watch out for edge cases with negative numbers..."
                            className="w-full bg-[#07090e] border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40"
                            maxLength={2000}
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-500">
                              {noteDraft.length}/2000 characters
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingNotesId(null)}
                                className="px-2.5 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveNotes(problem.id)}
                                disabled={isUpdating}
                                className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                              >
                                <Save className="w-3 h-3" />
                                <span>Save Note</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
