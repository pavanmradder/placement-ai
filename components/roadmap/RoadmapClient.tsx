"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Compass,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Target,
  Code2,
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
  Search,
  X,
  TrendingUp,
  Award,
  Zap,
} from "lucide-react";
import type { RoadmapWeek, RoadmapCategory } from "@/lib/roadmap/generator";
import RoadmapWeekSection from "./RoadmapWeekSection";
import RegenerateConfirmModal from "./RegenerateConfirmModal";

export interface PlacementRoadmap {
  id: string;
  user_id: string;
  target_role: string;
  title: string;
  description: string | null;
  duration_weeks: number;
  roadmap_data: RoadmapWeek[];
  overall_progress: number;
  status: "active" | "completed" | "archived" | string;
  created_at: string;
  updated_at: string;
}

interface RoadmapClientProps {
  initialTargetRole: string;
}

export default function RoadmapClient({
  initialTargetRole,
}: RoadmapClientProps) {
  const [roadmap, setRoadmap] = useState<PlacementRoadmap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Fetch current roadmap on mount
  const fetchRoadmap = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/roadmap");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load placement roadmap.");
      }

      setRoadmap(data.roadmap || null);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  // Generate new roadmap (initial or regenerate)
  const handleGenerateRoadmap = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole: initialTargetRole }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate placement roadmap.");
      }

      setRoadmap(data.roadmap);
      setIsRegenerateModalOpen(false);
      setToast({
        message: "Your personalized placement roadmap has been generated!",
        type: "success",
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to generate roadmap. Please try again.";
      setError(msg);
      setToast({ message: msg, type: "error" });
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle task completion with optimistic update and rollback
  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    if (!roadmap) return;

    const previousRoadmap = roadmap;
    const newCompleted = !currentCompleted;

    // 1. Optimistically update local roadmap_data
    const updatedWeeks = (roadmap.roadmap_data || []).map((week) => ({
      ...week,
      tasks: (week.tasks || []).map((t) =>
        t.id === taskId ? { ...t, completed: newCompleted } : t
      ),
    }));

    // Calculate optimistic progress
    let totalTasks = 0;
    let completedTasks = 0;
    for (const w of updatedWeeks) {
      for (const t of w.tasks || []) {
        totalTasks++;
        if (t.completed) completedTasks++;
      }
    }
    const optimisticProgress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const optimisticStatus =
      optimisticProgress === 100 ? "completed" : "active";

    setRoadmap({
      ...roadmap,
      roadmap_data: updatedWeeks,
      overall_progress: optimisticProgress,
      status: optimisticStatus,
    });

    // Mark task as updating
    setUpdatingTaskIds((prev) => new Set(prev).add(taskId));

    try {
      const response = await fetch(`/api/roadmap/${roadmap.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          completed: newCompleted,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update task status.");
      }

      // Sync with server response
      setRoadmap(data.roadmap);
      setToast({
        message: newCompleted
          ? "Task marked as completed!"
          : "Task marked as pending.",
        type: "success",
      });
    } catch (err: unknown) {
      // Revert optimistic update
      setRoadmap(previousRoadmap);
      const msg =
        err instanceof Error ? err.message : "Failed to update task.";
      setToast({ message: msg, type: "error" });
    } finally {
      setUpdatingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  // Computed overall metrics from active roadmap
  const { totalTasksCount, completedTasksCount, allCategories } = useMemo(() => {
    if (!roadmap || !Array.isArray(roadmap.roadmap_data)) {
      return { totalTasksCount: 0, completedTasksCount: 0, allCategories: [] };
    }

    let total = 0;
    let completed = 0;
    const categoriesSet = new Set<string>();

    for (const week of roadmap.roadmap_data) {
      for (const task of week.tasks || []) {
        total++;
        if (task.completed) completed++;
        if (task.category) categoriesSet.add(task.category);
      }
    }

    return {
      totalTasksCount: total,
      completedTasksCount: completed,
      allCategories: Array.from(categoriesSet),
    };
  }, [roadmap]);

  // Filtered weeks based on category and search query
  const filteredWeeks = useMemo(() => {
    if (!roadmap || !Array.isArray(roadmap.roadmap_data)) return [];

    const query = searchQuery.trim().toLowerCase();

    return roadmap.roadmap_data.map((week) => {
      const filteredTasks = (week.tasks || []).filter((task) => {
        const matchesCategory =
          selectedCategory === "All" || task.category === selectedCategory;
        const matchesSearch =
          query.length === 0 ||
          task.title.toLowerCase().includes(query) ||
          task.category.toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
      });

      return {
        ...week,
        tasks: filteredTasks,
      };
    });
  }, [roadmap, selectedCategory, searchQuery]);

  // Format created date
  const formattedCreatedDate = useMemo(() => {
    if (!roadmap?.created_at) return "";
    try {
      return new Date(roadmap.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  }, [roadmap?.created_at]);

  // 1. SKELETON LOADING STATE
  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header Skeleton */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0c1222]/90 border border-white/10 animate-pulse mb-8">
          <div className="h-4 w-32 bg-slate-800 rounded mb-3" />
          <div className="h-8 w-80 bg-slate-800 rounded mb-4" />
          <div className="h-4 w-full max-w-xl bg-slate-800/60 rounded mb-6" />
          <div className="h-3 w-full bg-slate-800 rounded-full" />
        </div>

        {/* Weeks Skeleton */}
        <div className="space-y-6">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="p-6 rounded-2xl bg-[#0c1222]/80 border border-white/10 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800" />
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-slate-800 rounded" />
                  <div className="h-3 w-72 bg-slate-800/60 rounded" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-12 w-full bg-slate-900/60 rounded-xl" />
                <div className="h-12 w-full bg-slate-900/60 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  // 2. GENERATION LOADING OVERLAY
  if (isGenerating) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative p-8 sm:p-12 rounded-3xl bg-[#0c1222]/95 border border-indigo-500/30 max-w-lg w-full text-center shadow-2xl shadow-indigo-950/50">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] mx-auto mb-6 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <div className="w-full h-full bg-[#090d16] rounded-[15px] flex items-center justify-center">
              <Compass className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Synthesizing Your Roadmap
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            PlacementAI is analyzing your profile, verified skills, skill gaps, DSA progression, and resume evaluation...
          </p>

          <div className="mt-6 space-y-2.5 text-left text-xs text-slate-400 bg-[#070b14] p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 text-cyan-300">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Target Role: {initialTargetRole}</span>
            </div>
            <div className="flex items-center gap-2 text-indigo-300">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Prioritizing identified missing skills</span>
            </div>
            <div className="flex items-center gap-2 text-purple-300">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Skipping already solved DSA problem areas</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Structuring 4-week actionable milestones</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 3. EMPTY STATE: NO ROADMAP GENERATED YET
  if (!roadmap) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-xs sm:text-sm font-medium transition-all animate-in fade-in slide-in-from-bottom-5 ${
              toast.type === "success"
                ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/30"
                : "bg-rose-950/90 text-rose-200 border-rose-500/30"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0c1222] via-[#090e1a] to-[#07090e] border border-white/10 p-8 sm:p-12 text-center shadow-2xl">
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Compass Icon */}
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] mx-auto mb-6 flex items-center justify-center shadow-xl shadow-indigo-500/25">
            <div className="w-full h-full bg-[#090d16] rounded-[15px] flex items-center justify-center">
              <Compass className="w-8 h-8 text-cyan-400" />
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Step 7 • Personalized Preparation Plan
          </span>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Build Your Placement Roadmap
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
            PlacementAI generates a tailored 4-week preparation plan designed specifically for your target role of{" "}
            <span className="font-semibold text-white">{initialTargetRole}</span>.
          </p>

          {/* Intelligence Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8 text-left">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 w-fit mb-2.5">
                <Target className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Target Role
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Customized for {initialTargetRole} campus drive expectations.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 w-fit mb-2.5">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Skill Gap Intel
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Prioritizes your missing skills from your latest gap analysis.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 w-fit mb-2.5">
                <Code2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                DSA Aware
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Skips solved topics and focuses on unattempted problem areas.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit mb-2.5">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Resume & Mocks
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Addresses ATS weaknesses and schedules interview rehearsals.
              </p>
            </div>
          </div>

          {/* Call to Action Button */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleGenerateRoadmap}
              disabled={isGenerating}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate My Roadmap</span>
            </button>
          </div>

          {error && (
            <p className="text-xs text-rose-400 mt-4 max-w-md mx-auto">
              {error}
            </p>
          )}
        </div>
      </main>
    );
  }

  // 4. ACTIVE ROADMAP VIEW
  const isAllComplete =
    roadmap.overall_progress === 100 ||
    (totalTasksCount > 0 && completedTasksCount === totalTasksCount);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Toast Feedback */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-xs sm:text-sm font-medium transition-all animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/30"
              : "bg-rose-950/90 text-rose-200 border-rose-500/30"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      <RegenerateConfirmModal
        isOpen={isRegenerateModalOpen}
        isRegenerating={isGenerating}
        onConfirm={handleGenerateRoadmap}
        onClose={() => setIsRegenerateModalOpen(false)}
      />

      {/* ROADMAP HEADER CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0c1222]/95 border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Target Role Badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20">
                <Target className="w-3.5 h-3.5" />
                {roadmap.target_role}
              </span>

              {/* Duration Badge */}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20">
                <Calendar className="w-3.5 h-3.5" />
                {roadmap.duration_weeks} Weeks Plan
              </span>

              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  isAllComplete
                    ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
                    : "text-amber-300 bg-amber-500/10 border-amber-500/30"
                }`}
              >
                {isAllComplete ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Completed
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3 text-amber-400" />
                    Active Track
                  </>
                )}
              </span>

              {formattedCreatedDate && (
                <span className="text-xs text-slate-400">
                  Created {formattedCreatedDate}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              {roadmap.title}
            </h1>

            {roadmap.description && (
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                {roadmap.description}
              </p>
            )}
          </div>

          {/* Action: Regenerate */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsRegenerateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Regenerate Roadmap</span>
            </button>
          </div>
        </div>

        {/* OVERALL PROGRESS SECTION */}
        <div className="mt-8 pt-6 border-t border-white/[0.08]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-xs sm:text-sm font-semibold text-white">
                Overall Roadmap Progress
              </span>
              <span className="text-xs text-slate-400">
                ({completedTasksCount} of {totalTasksCount} tasks completed)
              </span>
            </div>
            <span className="text-lg sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-emerald-400">
              {roadmap.overall_progress}%
            </span>
          </div>

          {/* Large Progress Bar */}
          <div className="w-full bg-slate-900/90 rounded-full h-3 overflow-hidden border border-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-700 ease-out shadow-sm shadow-cyan-500/20"
              style={{ width: `${roadmap.overall_progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* SEARCH & CATEGORY FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0b101c]/80 border border-white/10">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory("All")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === "All"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]"
            }`}
          >
            All Categories
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-[#070b14] border border-white/10 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
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
      </div>

      {/* WEEKLY TIMELINE / SECTIONS */}
      <div className="space-y-6">
        {filteredWeeks.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-[#0c1222]/50 border border-white/5">
            <p className="text-sm text-slate-400">
              No tasks matched your filter criteria.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="mt-3 text-xs text-cyan-400 hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        ) : (
          filteredWeeks.map((week) => (
            <RoadmapWeekSection
              key={week.week}
              week={week}
              updatingTaskIds={updatingTaskIds}
              onToggleTask={handleToggleTask}
            />
          ))
        )}
      </div>
    </main>
  );
}
