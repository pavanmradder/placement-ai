"use client";

import { Check, Clock, Loader2 } from "lucide-react";
import type { RoadmapTask, RoadmapCategory, RoadmapPriority } from "@/lib/roadmap/generator";

interface RoadmapTaskItemProps {
  task: RoadmapTask;
  isUpdating: boolean;
  onToggle: (taskId: string, currentCompleted: boolean) => void;
}

const CATEGORY_STYLES: Record<RoadmapCategory, { badge: string; dot: string }> = {
  DSA: {
    badge: "text-purple-300 bg-purple-500/10 border-purple-500/20",
    dot: "bg-purple-400",
  },
  Programming: {
    badge: "text-blue-300 bg-blue-500/10 border-blue-500/20",
    dot: "bg-blue-400",
  },
  "Web Development": {
    badge: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
    dot: "bg-cyan-400",
  },
  Database: {
    badge: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    dot: "bg-amber-400",
  },
  "CS Fundamentals": {
    badge: "text-indigo-300 bg-indigo-500/10 border-indigo-500/20",
    dot: "bg-indigo-400",
  },
  Resume: {
    badge: "text-pink-300 bg-pink-500/10 border-pink-500/20",
    dot: "bg-pink-400",
  },
  Interview: {
    badge: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  Projects: {
    badge: "text-teal-300 bg-teal-500/10 border-teal-500/20",
    dot: "bg-teal-400",
  },
  Aptitude: {
    badge: "text-orange-300 bg-orange-500/10 border-orange-500/20",
    dot: "bg-orange-400",
  },
  Other: {
    badge: "text-slate-300 bg-slate-500/10 border-slate-500/20",
    dot: "bg-slate-400",
  },
};

const PRIORITY_STYLES: Record<RoadmapPriority, { label: string; badge: string }> = {
  high: {
    label: "High Priority",
    badge: "text-rose-300 bg-rose-500/10 border-rose-500/20",
  },
  medium: {
    label: "Medium Priority",
    badge: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  },
  low: {
    label: "Low Priority",
    badge: "text-slate-300 bg-slate-500/10 border-slate-500/20",
  },
};

export default function RoadmapTaskItem({
  task,
  isUpdating,
  onToggle,
}: RoadmapTaskItemProps) {
  const categoryStyle =
    CATEGORY_STYLES[task.category] || CATEGORY_STYLES.Other;
  const priorityStyle =
    PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;

  return (
    <div
      onClick={() => {
        if (!isUpdating) {
          onToggle(task.id, task.completed);
        }
      }}
      className={`group relative flex items-start gap-3.5 p-3.5 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
        task.completed
          ? "bg-emerald-950/10 border-emerald-500/20 hover:border-emerald-500/30"
          : "bg-[#090d16]/70 border-white/[0.07] hover:border-indigo-500/30 hover:bg-[#0c1220]"
      } ${isUpdating ? "opacity-75 pointer-events-none" : ""}`}
    >
      {/* Checkbox */}
      <div className="pt-0.5 shrink-0">
        <button
          type="button"
          disabled={isUpdating}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task.id, task.completed);
          }}
          aria-label={`Mark task "${task.title}" as ${task.completed ? "incomplete" : "complete"}`}
          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
            task.completed
              ? "bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-sm shadow-emerald-500/30 border border-emerald-400"
              : "border border-slate-600 bg-slate-900/60 hover:border-indigo-400 group-hover:scale-105"
          }`}
        >
          {isUpdating ? (
            <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
          ) : task.completed ? (
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : null}
        </button>
      </div>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          {/* Category Badge */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${categoryStyle.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${categoryStyle.dot}`} />
            {task.category}
          </span>

          {/* Priority Badge */}
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${priorityStyle.badge}`}
          >
            {priorityStyle.label}
          </span>

          {/* Estimated Hours */}
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{task.estimated_hours} hrs</span>
          </span>
        </div>

        {/* Title */}
        <p
          className={`text-xs sm:text-sm font-medium leading-snug transition-colors ${
            task.completed
              ? "text-slate-400 line-through decoration-slate-500"
              : "text-slate-200 group-hover:text-white"
          }`}
        >
          {task.title}
        </p>
      </div>
    </div>
  );
}
