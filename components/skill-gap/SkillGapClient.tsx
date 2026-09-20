"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Target,
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  RotateCcw,
  Loader2,
  AlertCircle,
  Briefcase,
  Layers,
  BookOpen,
  Check,
  TrendingUp,
  Zap,
  ChevronRight,
  Compass,
} from "lucide-react";

export interface SkillGapRecommendation {
  skill: string;
  priority: "High" | "Medium" | "Low";
  action: string;
  estimatedWeeks: number;
}

export interface SkillGapRecord {
  id: string;
  user_id: string;
  target_role: string;
  current_skills: string[];
  required_skills: string[];
  missing_skills: string[];
  skill_match_percentage: number;
  recommendations: SkillGapRecommendation[];
  created_at: string;
  updated_at: string;
}

interface SkillGapClientProps {
  userId: string;
  initialRole: string;
  initialAnalysis: SkillGapRecord | null;
}

export default function SkillGapClient({
  userId,
  initialRole,
  initialAnalysis,
}: SkillGapClientProps) {
  const [analysis, setAnalysis] = useState<SkillGapRecord | null>(initialAnalysis);
  const [targetRole, setTargetRole] = useState(initialAnalysis?.target_role || initialRole || "Software Development Engineer (SDE)");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "missing" | "current" | "required">("all");

  const handleRunAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/skill-gap/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetRole: targetRole.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to analyze skill gap.");
      }

      setAnalysis(data.analysis);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const matchPercentage = analysis?.skill_match_percentage != null
    ? Math.round(Number(analysis.skill_match_percentage))
    : 0;

  const currentSkills: string[] = Array.isArray(analysis?.current_skills) ? analysis.current_skills : [];
  const requiredSkills: string[] = Array.isArray(analysis?.required_skills) ? analysis.required_skills : [];
  const missingSkills: string[] = Array.isArray(analysis?.missing_skills) ? analysis.missing_skills : [];
  const recommendations: SkillGapRecommendation[] = Array.isArray(analysis?.recommendations)
    ? analysis.recommendations
    : [];

  // Match tier calculation
  const getMatchTier = (pct: number) => {
    if (pct >= 75) return { label: "High Alignment", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    if (pct >= 50) return { label: "Moderate Alignment", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" };
    return { label: "Skill Gap Detected", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
  };

  const tier = getMatchTier(matchPercentage);

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
            <Link
              href="/dashboard"
              className="hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span>/</span>
            <span className="text-cyan-400 font-medium">Skill Gap Analysis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Skill Gap Analysis</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
              Step 4 Live
            </span>
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Compare your verified profile skills and resume competencies against Tier-1 campus drive expectations to identify high-impact learning priorities.
          </p>
        </div>

        {analysis && (
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={() => handleRunAnalysis()}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer shrink-0"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Re-analyzing with AI...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5 text-white" />
                <span>Analyze Again</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. EMPTY STATE: No Analysis Yet                                      */}
      {/* ==================================================================== */}
      {!analysis && !isAnalyzing && (
        <div className="max-w-2xl mx-auto p-8 sm:p-12 rounded-3xl bg-[#0c1222]/90 border border-white/10 shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[1px] mx-auto shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#080d1a] rounded-[15px] flex items-center justify-center text-cyan-400">
              <Target className="w-8 h-8" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">No Skill Gap Analysis Yet</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Benchmark your skills against the recruitment standards of top technology companies for your target role.
            </p>
          </div>

          <form onSubmit={handleRunAnalysis} className="space-y-4 max-w-md mx-auto text-left">
            <div className="space-y-1.5">
              <label htmlFor="targetRoleInput" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Target Placement Role
              </label>
              <div className="relative">
                <input
                  id="targetRoleInput"
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Software Development Engineer (SDE), Frontend Engineer"
                  className="w-full bg-[#080d1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
                />
                <Briefcase className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAnalyzing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-white" />
              <span>Analyze Skill Gap with AI</span>
            </button>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. LOADING STATE                                                     */}
      {/* ==================================================================== */}
      {isAnalyzing && (
        <div className="max-w-2xl mx-auto p-12 rounded-3xl bg-[#0c1222]/90 border border-white/10 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-cyan-400">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-white">Analyzing Skill Alignment</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Groq AI is comparing your verified profile skills and resume competencies against Tier-1 campus hiring benchmarks for <span className="text-cyan-300 font-semibold">{targetRole}</span>...
          </p>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. ACTIVE ANALYSIS VIEW                                              */}
      {/* ==================================================================== */}
      {analysis && !isAnalyzing && (
        <div className="space-y-8">
          {/* Top Hero Banner & Match Gauge */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-[#0c1428] to-[#0a1020] border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Target Role Benchmark
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${tier.color}`}>
                    ● {tier.label}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {analysis.target_role}
                </h2>

                <p className="text-xs text-slate-400">
                  Last evaluated on{" "}
                  {new Date(analysis.updated_at || analysis.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  using Groq AI.
                </p>
              </div>

              {/* Match Gauge */}
              <div className="flex items-center gap-5 bg-white/[0.04] border border-white/10 p-5 rounded-2xl shrink-0">
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    Skill Match
                  </p>
                  <p className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
                    {matchPercentage}%
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {currentSkills.length} of {requiredSkills.length} Core Skills
                  </p>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 p-[1px] flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <div className="w-full h-full bg-[#080d1a] rounded-[15px] flex items-center justify-center text-cyan-400">
                    <Award className="w-7 h-7" />
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6 w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(5, matchPercentage))}%` }}
              />
            </div>
          </div>

          {/* 3 Skills Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Missing Skills (Highest Priority) */}
            <div className="p-6 rounded-3xl bg-[#0c1222]/90 border border-rose-500/25 hover:border-rose-500/40 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">Missing Skills</h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                    {missingSkills.length} Gap(s)
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Critical competencies expected by campus recruiters that are missing from your profile.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  {missingSkills.length === 0 ? (
                    <p className="text-xs text-emerald-400">🎉 No missing skills detected! Profile is fully aligned.</p>
                  ) : (
                    missingSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-1"
                      >
                        <span className="text-rose-400">•</span> {skill}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 2. Current Skills */}
            <div className="p-6 rounded-3xl bg-[#0c1222]/90 border border-emerald-500/25 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">Current Skills</h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {currentSkills.length} Verified
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Competencies detected from your profile skills and uploaded resume.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  {currentSkills.length === 0 ? (
                    <p className="text-xs text-slate-400">No skills logged yet. Add skills in profile or upload resume.</p>
                  ) : (
                    currentSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-emerald-400" /> {skill}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 3. Required Industry Benchmark */}
            <div className="p-6 rounded-3xl bg-[#0c1222]/90 border border-indigo-500/25 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Briefcase className="w-4 h-4" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">Required Skills</h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {requiredSkills.length} Required
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Industry standard requirements for {analysis.target_role} in campus recruitment.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  {requiredSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/[0.04] border border-white/10 text-slate-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Prioritized Recommendations & Study Roadmap */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <span>Prioritized Learning Roadmap</span>
              </h3>
              <span className="text-xs text-slate-400">
                {recommendations.length} Action Items
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-[#0c1222]/90 border border-white/10 hover:border-cyan-500/30 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="text-cyan-400">#{idx + 1}</span> {rec.skill}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          rec.priority === "High"
                            ? "text-rose-300 bg-rose-500/10 border-rose-500/25"
                            : rec.priority === "Medium"
                            ? "text-amber-300 bg-amber-500/10 border-amber-500/25"
                            : "text-slate-300 bg-slate-500/10 border-slate-500/25"
                        }`}
                      >
                        {rec.priority} Priority
                      </span>

                      {rec.estimatedWeeks && (
                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/10">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span>{rec.estimatedWeeks}w</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {rec.action}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
