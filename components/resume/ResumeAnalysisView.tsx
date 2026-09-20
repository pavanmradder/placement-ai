"use client";

import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Briefcase,
  Layers,
  X,
  Cpu,
  RotateCw,
  TrendingUp,
  Award,
  BookOpen,
} from "lucide-react";
import type { ResumeAnalysisOutput } from "@/lib/resume/analyzer";

interface ResumeAnalysisViewProps {
  fileName: string;
  analysis: ResumeAnalysisOutput;
  isReanalyzing?: boolean;
  onReanalyze?: () => void;
  onClose: () => void;
}

export default function ResumeAnalysisView({
  fileName,
  analysis,
  isReanalyzing = false,
  onReanalyze,
  onClose,
}: ResumeAnalysisViewProps) {
  const score = analysis.atsScore;

  const scoreBadgeStyle =
    score >= 75
      ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
      : score >= 50
      ? "text-amber-300 border-amber-500/30 bg-amber-500/10"
      : "text-rose-300 border-rose-500/30 bg-rose-500/10";

  const scoreLabel =
    score >= 75
      ? "Tier-1 Placement Ready"
      : score >= 50
      ? "Moderate Alignment — Revisions Needed"
      : "High Priority Revision Needed";

  const technicalSkillsCount = analysis.skills?.technical?.length || 0;
  const softSkillsCount = analysis.skills?.soft?.length || 0;
  const recommendedSkillsCount = analysis.skills?.recommended?.length || 0;

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#0e162c] via-[#0c1222] to-[#07090e] border border-indigo-500/30 p-6 sm:p-8 shadow-2xl space-y-8 relative overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 border border-cyan-500/30 text-cyan-300 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Resume Analysis Dashboard</span>
            </span>
            <span className="text-xs font-medium text-slate-400">
              Model: {analysis.modelUsed || "openai/gpt-oss-120b"}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Analysis for: <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-300">{fileName}</span>
          </h3>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {onReanalyze && (
            <button
              type="button"
              onClick={onReanalyze}
              disabled={isReanalyzing}
              className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Re-run AI analysis with Groq"
            >
              <RotateCw className={`w-3.5 h-3.5 text-cyan-400 ${isReanalyzing ? "animate-spin" : ""}`} />
              <span>{isReanalyzing ? "Analyzing..." : "Analyze Again"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10"
            title="Close analysis view"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Score & Executive Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
        {/* ATS Score Card */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-[#090d18]/90 border border-white/10 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-xl">
          <div className="w-full flex items-center justify-between text-xs text-slate-400 pb-2">
            <span className="uppercase tracking-wider font-semibold">ATS Compatibility</span>
            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${scoreBadgeStyle}`}>
              {scoreLabel}
            </span>
          </div>

          <div className="my-4 flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              <div className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                {score}
              </div>
              <span className="text-xl font-semibold text-slate-400 ml-1">/100</span>
            </div>
            <div className="mt-3 w-48 bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-teal-400 h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 max-w-xs">
            {score >= 75
              ? "Your resume strongly matches campus drive ATS filters for core tech positions."
              : score >= 50
              ? "Acceptable foundation, but adding recommended placement keywords will increase interview callbacks."
              : "Significant keyword and structural gaps detected. Immediate optimization recommended."}
          </p>
        </div>

        {/* Executive Summary */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-[#090d18]/90 border border-white/10 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                Executive Profile Summary
              </h4>
            </div>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed pt-1">
              {analysis.summary}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/5 mt-4">
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] uppercase text-slate-400 font-medium">Technical Skills</p>
              <p className="text-lg font-bold text-cyan-300 mt-0.5">{technicalSkillsCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] uppercase text-slate-400 font-medium">Soft Skills</p>
              <p className="text-lg font-bold text-indigo-300 mt-0.5">{softSkillsCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] uppercase text-slate-400 font-medium">Missing Skills</p>
              <p className="text-lg font-bold text-rose-300 mt-0.5">{recommendedSkillsCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] uppercase text-slate-400 font-medium">Formatting Score</p>
              <p className="text-lg font-bold text-purple-300 mt-0.5">{analysis.formattingAndStructure?.score ?? 70}/100</p>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 relative z-10">
        {/* Skills Found */}
        <div className="p-6 rounded-2xl bg-[#090d18]/90 border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300 uppercase tracking-wider pb-2 border-b border-white/5">
            <Cpu className="w-4 h-4" />
            <span>Skills Detected in Resume</span>
          </div>

          <div>
            <p className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              <span>Technical & Domain Proficiencies:</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.skills?.technical?.length > 0 ? (
                analysis.skills.technical.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-medium"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">None explicitly identified</span>
              )}
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span>Soft & Behavioral Skills:</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.skills?.soft?.length > 0 ? (
                analysis.skills.soft.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">None explicitly identified</span>
              )}
            </div>
          </div>
        </div>

        {/* Missing / Recommended Skills */}
        <div className="p-6 rounded-2xl bg-[#090d18]/90 border border-rose-500/20 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-300 uppercase tracking-wider pb-2 border-b border-white/5">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Recommended Skills for Campus Drives</span>
          </div>
          <p className="text-xs text-slate-400">
            Top keywords and frameworks commonly required for campus placement roles that were not found in your resume:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {analysis.skills?.recommended?.length > 0 ? (
              analysis.skills.recommended.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 font-medium flex items-center gap-1"
                >
                  <span className="font-bold">+</span>
                  <span>{skill}</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-emerald-400 font-medium">
                Outstanding! No major placement skill gaps detected.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Experience, Education, and Formatting Evaluations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
        {/* Experience & Projects */}
        <div className="p-5 rounded-2xl bg-[#090d18]/90 border border-white/10 space-y-2.5 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <span>Experience & Projects</span>
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-300">
              {analysis.experienceEvaluation?.rating || "Evaluated"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
            {analysis.experienceEvaluation?.feedback}
          </p>
        </div>

        {/* Education */}
        <div className="p-5 rounded-2xl bg-[#090d18]/90 border border-white/10 space-y-2.5 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>Education Alignment</span>
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-indigo-300">
              {analysis.educationEvaluation?.rating || "Evaluated"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
            {analysis.educationEvaluation?.feedback}
          </p>
        </div>

        {/* Formatting & Structure */}
        <div className="p-5 rounded-2xl bg-[#090d18]/90 border border-white/10 space-y-2.5 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>ATS Format & Layout</span>
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-purple-300">
              {analysis.formattingAndStructure?.score ?? 70}/100
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
            {analysis.formattingAndStructure?.feedback}
          </p>
        </div>
      </div>

      {/* Strengths & Actionable Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
        {/* Strengths */}
        <div className="p-5 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/20 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 uppercase tracking-wider pb-2 border-b border-emerald-500/10">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Key Competitive Strengths</span>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
            {analysis.strengths?.map((strength, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses & Actionable Improvements */}
        <div className="p-5 rounded-2xl bg-amber-500/[0.03] border border-amber-500/20 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider pb-2 border-b border-amber-500/10">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Actionable Placement Recommendations</span>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
            {analysis.improvements?.map((improvement, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-amber-400 font-bold mt-0.5">→</span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
