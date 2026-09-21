"use client";

import {
  TrendingUp,
  FileCheck2,
  Code2,
  Video,
  Sparkles,
  CheckCircle2,
  Building2,
  Calendar,
  ChevronRight,
  Zap,
} from "lucide-react";

export default function DashboardPreview() {
  return (
    <div id="dashboard-preview" className="relative w-full max-w-5xl mx-auto mt-12 sm:mt-16 lg:mt-20">
      {/* Background glow effects */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 blur-3xl -z-10 rounded-full pointer-events-none" />

      {/* Main SaaS Dashboard Mockup Container */}
      <div className="relative rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0c1222]/90 backdrop-blur-xl shadow-2xl shadow-indigo-950/50 overflow-hidden transition-all duration-300 hover:border-white/20">
        
        {/* Top Window Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/[0.08] bg-[#090e1c]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-400/40" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-400/40" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-400/40" />
            <span className="ml-3 hidden sm:inline-block text-xs font-mono text-slate-400">
              placement-ai.app/student/dashboard
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Interactive Product Preview
            </span>
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                SP
              </div>
              <span className="text-xs font-medium text-slate-300">Sample Student View</span>
            </div>
          </div>
        </div>

        {/* Dashboard Content Interior */}
        <div className="p-5 sm:p-7 lg:p-8 space-y-6">

          {/* User Welcome & Target Milestone */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Student Readiness Overview</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Target: Software Engineer
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                A unified overview of your active readiness metrics, practice tracks, and upcoming goals.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto bg-white/[0.04] border border-white/[0.08] px-3.5 py-2 rounded-xl text-xs text-slate-300">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>Target Track: <strong className="text-white">Campus Technical Drives</strong></span>
              <span className="text-slate-500">•</span>
              <span className="text-cyan-400 font-medium">SDE Role</span>
            </div>
          </div>

          {/* The 4 Core Module Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Metric 1: Overall Readiness */}
            <div className="relative group p-5 rounded-2xl bg-gradient-to-b from-indigo-950/40 via-[#10172d] to-[#0d1326] border border-indigo-500/30 hover:border-indigo-500/60 transition-all duration-300 shadow-lg shadow-indigo-950/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  Overall Readiness
                </span>
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Readiness Score
                </span>
                <span className="text-xs font-medium text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  Dynamic
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400 mt-1">Placement Probability</p>

              {/* Visual Progress Bar */}
              <div className="mt-3.5 w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: "70%" }}
                />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>DSA • Resume • Mocks</span>
                <span className="text-indigo-300 font-semibold">Real-Time Data</span>
              </div>
            </div>

            {/* Metric 2: Resume Score */}
            <div className="relative group p-5 rounded-2xl bg-gradient-to-b from-slate-900/70 via-[#10172d] to-[#0d1326] border border-white/10 hover:border-cyan-500/40 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  ATS Alignment
                </span>
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <FileCheck2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Resume Score
                </span>
                <span className="text-xs font-medium text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  ATS Scanner
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400 mt-1">Keyword & Format Match</p>

              {/* Visual Progress Bar */}
              <div className="mt-3.5 w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-teal-400 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: "80%" }}
                />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>PDF Analysis</span>
                <span className="text-cyan-300 font-medium">Actionable Insights</span>
              </div>
            </div>

            {/* Metric 3: DSA Progress */}
            <div className="relative group p-5 rounded-2xl bg-gradient-to-b from-slate-900/70 via-[#10172d] to-[#0d1326] border border-white/10 hover:border-purple-500/40 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                  Coding Mastery
                </span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Code2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  DSA Tracker
                </span>
                <span className="text-xs font-medium text-purple-300 flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                  Curated Sets
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400 mt-1">Topic-Wise Mastery</p>

              {/* Visual Progress Bar */}
              <div className="mt-3.5 w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: "65%" }}
                />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Easy • Medium • Hard</span>
                <span className="text-purple-300 font-medium">Blind 75 & More</span>
              </div>
            </div>

            {/* Metric 4: Interview Progress */}
            <div className="relative group p-5 rounded-2xl bg-gradient-to-b from-slate-900/70 via-[#10172d] to-[#0d1326] border border-white/10 hover:border-emerald-500/40 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  Mock Rounds
                </span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Video className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  AI Mock Drills
                </span>
                <span className="text-xs font-medium text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Interactive
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400 mt-1">Technical & HR Drills</p>

              {/* Visual Progress Bar */}
              <div className="mt-3.5 w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: "75%" }}
                />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Adaptive Questions</span>
                <span className="text-emerald-300 font-medium">Instant Feedback</span>
              </div>
            </div>

          </div>

          {/* Lower Dashboard Bar: Real-time AI Insight & Active Roadmap */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
            
            {/* AI Actionable Suggestion */}
            <div className="lg:col-span-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-start sm:items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shrink-0 shadow-md shadow-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wide">
                    AI Assistant Recommendation
                  </span>
                  <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                    Actionable
                  </span>
                </div>
                <p className="text-sm text-slate-200">
                  Practice curated DSA problem sets, complete live AI mock interview rounds, and optimize your resume to build comprehensive campus readiness.
                </p>
              </div>
            </div>

            {/* Quick Action Simulation Button */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                <div>
                  <p className="text-xs text-slate-400">Recommended Next Step</p>
                  <p className="text-sm font-semibold text-white">AI Mock Interview Drill</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-indigo-300 hover:text-indigo-200 flex items-center gap-1 cursor-pointer">
                Start <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
