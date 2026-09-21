"use client";

import { CheckCircle2, Calendar, Sparkles } from "lucide-react";
import type { RoadmapWeek } from "@/lib/roadmap/generator";
import RoadmapTaskItem from "./RoadmapTaskItem";

interface RoadmapWeekSectionProps {
  week: RoadmapWeek;
  updatingTaskIds: Set<string>;
  onToggleTask: (taskId: string, currentCompleted: boolean) => void;
}

export default function RoadmapWeekSection({
  week,
  updatingTaskIds,
  onToggleTask,
}: RoadmapWeekSectionProps) {
  const tasks = Array.isArray(week.tasks) ? week.tasks : [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const weekProgressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const isWeekComplete = totalTasks > 0 && completedTasks === totalTasks;

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-300 ${
        isWeekComplete
          ? "bg-gradient-to-b from-[#0a151b]/80 to-[#070e14]/90 border-emerald-500/30 shadow-lg shadow-emerald-950/20"
          : "bg-[#0b101c]/90 border-white/10 hover:border-indigo-500/30"
      } p-5 sm:p-6`}
    >
      {/* Week Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div className="flex items-start gap-3">
          {/* Week Badge */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-md font-bold text-sm ${
              isWeekComplete
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-emerald-500/10"
                : "bg-indigo-500/10 border-indigo-500/20 text-indigo-300 shadow-indigo-500/10"
            }`}
          >
            {isWeekComplete ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <span>W{week.week}</span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Week {week.week} Focus
              </span>
              {isWeekComplete && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20">
                  <Sparkles className="w-3 h-3" />
                  Completed
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
              {week.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {week.description}
            </p>
          </div>
        </div>

        {/* Week Progress Tracker */}
        <div className="self-start sm:self-auto sm:text-right shrink-0">
          <div className="flex items-baseline sm:justify-end gap-2">
            <span className="text-xs font-semibold text-slate-300">
              {completedTasks}/{totalTasks}
            </span>
            <span className="text-[11px] text-slate-400">tasks</span>
            <span
              className={`text-xs font-bold ${
                isWeekComplete ? "text-emerald-400" : "text-cyan-400"
              }`}
            >
              ({weekProgressPercent}%)
            </span>
          </div>

          {/* Mini progress bar */}
          <div className="w-28 sm:w-32 bg-slate-800/80 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isWeekComplete
                  ? "bg-emerald-400"
                  : "bg-gradient-to-r from-indigo-500 to-cyan-400"
              }`}
              style={{ width: `${weekProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="mt-4 space-y-2.5">
        {tasks.map((task) => (
          <RoadmapTaskItem
            key={task.id}
            task={task}
            isUpdating={updatingTaskIds.has(task.id)}
            onToggle={onToggleTask}
          />
        ))}
      </div>
    </div>
  );
}
