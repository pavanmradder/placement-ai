import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import {
  TrendingUp,
  FileCheck2,
  Code2,
  Video,
  Sparkles,
  Building2,
  ChevronRight,
  Zap,
  Target,
  GraduationCap,
  Award,
  Briefcase,
  Compass,
} from "lucide-react";

export const metadata = {
  title: "Dashboard | PlacementAI",
  description: "Your data-driven placement readiness hub and interview drills.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  // 1. Fetch user's data concurrently across all tables with RLS enforcement
  const [
    { data: profile },
    { data: dsaProgress },
    { data: mockInterviews },
    { data: resumes },
    { data: skills },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("dsa_progress")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("mock_interviews")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("skills")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  // 2. Profile attributes with fallbacks to auth metadata
  const name =
    profile?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Student";

  const targetRole =
    profile?.target_role ||
    user.user_metadata?.target_role ||
    user.user_metadata?.targetRole ||
    "Software Development Engineer (SDE)";

  const college = profile?.college;
  const graduationYear = profile?.graduation_year;
  const userSkills = skills ?? [];

  // 3. DSA Metrics
  const hasDsaData = !!dsaProgress;
  const easySolved = dsaProgress?.easy_solved ?? 0;
  const mediumSolved = dsaProgress?.medium_solved ?? 0;
  const hardSolved = dsaProgress?.hard_solved ?? 0;
  const totalDsaSolved =
    dsaProgress?.total_solved || (easySolved + mediumSolved + hardSolved);
  const dsaTarget = 150;
  const dsaProgressPercent = Math.min(
    100,
    Math.round((totalDsaSolved / dsaTarget) * 100)
  );

  // 4. Resume Metrics
  const userResumes = resumes ?? [];
  const latestResume = userResumes[0];
  const hasResume = !!latestResume;
  const atsScore = latestResume?.ats_score != null ? Number(latestResume.ats_score) : null;

  // 5. Mock Interview Metrics
  const userMocks = mockInterviews ?? [];
  const mockCount = userMocks.length;
  const hasMocks = mockCount > 0;
  const avgMockScore = hasMocks
    ? (
        userMocks.reduce((acc, m) => acc + (Number(m.score) || 0), 0) / mockCount
      ).toFixed(1)
    : null;
  const mockTarget = 10;
  const mockProgressPercent = Math.min(
    100,
    Math.round((mockCount / mockTarget) * 100)
  );

  // 6. Overall Readiness Calculation
  // Derived strictly from real data points: DSA (40%), Resume (30%), Mocks (30%)
  const hasAnyData = hasDsaData || hasResume || hasMocks;
  let overallReadiness = 0;
  if (hasAnyData) {
    const dsaPoints = Math.min(40, (totalDsaSolved / 150) * 40);
    const resumePoints = atsScore != null ? (Math.min(100, atsScore) / 100) * 30 : 0;
    const mockPoints =
      avgMockScore != null
        ? (Math.min(10, Number(avgMockScore)) / 10) * 30
        : 0;
    overallReadiness = Math.min(100, Math.round(dsaPoints + resumePoints + mockPoints));
  }

  // 7. Dynamic Coach Recommendation
  let recommendationMessage =
    "Welcome to PlacementAI! Start by uploading your resume in the ATS Scanner, tracking your DSA problem sets, or taking a mock interview drill to generate your readiness score.";
  let recommendationPriority = "Getting Started";

  if (hasAnyData) {
    if (!hasResume) {
      recommendationMessage =
        "Upload your resume to the ATS Scanner to benchmark your profile against Tier-1 campus hiring filters.";
      recommendationPriority = "High Priority";
    } else if (totalDsaSolved < 50) {
      recommendationMessage =
        "Practice Trees and Dynamic Programming problem sets in the DSA Tracker to build technical interview confidence.";
      recommendationPriority = "High Priority";
    } else if (mockCount < 2) {
      recommendationMessage =
        "Complete your first AI Mock Interview round to practice live verbal problem-solving and receive feedback.";
      recommendationPriority = "Recommended";
    } else {
      recommendationMessage =
        "Great progress! Continue refining your mock performance and optimizing resume keywords for upcoming campus drives.";
      recommendationPriority = "On Track";
    }
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Dashboard Sticky Header */}
      <DashboardHeader
        displayName={name}
        email={user.email || ""}
        targetRole={targetRole}
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-indigo-950/70 via-[#0d1428] to-[#0a1020] border border-white/10 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Welcome back,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                    {name}
                  </span>
                  !
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Target: {targetRole}
                </span>
              </div>

              {/* College and graduation info if provided */}
              <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap pt-0.5">
                {college ? (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{college}</span>
                  </span>
                ) : null}
                {graduationYear ? (
                  <span className="text-slate-400">
                    • Batch of {graduationYear}
                  </span>
                ) : null}
              </div>

              <p className="text-sm text-slate-300 max-w-2xl">
                {hasAnyData
                  ? "Here is your real-time placement readiness calculation backed by your active database records."
                  : "Your placement metrics hub is active. Begin taking drills and tracking achievements to build your readiness score."}
              </p>

              {/* Verified Skills tags */}
              {userSkills.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                    <Award className="w-3 h-3 text-cyan-400" /> Skills:
                  </span>
                  {userSkills.map((skill) => (
                    <span
                      key={skill.id}
                      className="px-2 py-0.5 text-[11px] rounded-lg bg-white/[0.05] border border-white/10 text-cyan-300"
                    >
                      {skill.skill_name}
                      {skill.skill_level ? ` • ${skill.skill_level}` : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto shrink-0 bg-white/[0.04] border border-white/10 px-4 py-2.5 rounded-2xl">
              <Building2 className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Campus Drive Season
                </p>
                <p className="text-xs font-semibold text-white">
                  Preparation Phase • Active
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Metric 1: Overall Readiness */}
          <div className="p-6 rounded-2xl bg-[#0c1222]/90 border border-indigo-500/30 hover:border-indigo-500/50 transition-all shadow-lg shadow-indigo-950/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Overall Readiness
              </span>
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {overallReadiness}%
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                  overallReadiness >= 65
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : overallReadiness > 0
                    ? "text-cyan-300 bg-cyan-500/10 border-cyan-500/20"
                    : "text-slate-400 bg-slate-500/10 border-slate-500/20"
                }`}
              >
                {overallReadiness >= 65
                  ? "Safe Zone"
                  : overallReadiness > 0
                  ? "In Progress"
                  : "No Data"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Placement Probability</p>
            <div className="mt-3.5 w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${overallReadiness}%` }}
              />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
              <span>Benchmark: 65%</span>
              <span className="text-indigo-300 font-medium">
                {hasAnyData ? "Calculated" : "Awaiting Drills"}
              </span>
            </div>
          </div>

          {/* Metric 2: Resume ATS Score */}
          <div className="p-6 rounded-2xl bg-[#0c1222]/90 border border-white/10 hover:border-cyan-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                ATS Alignment
              </span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {atsScore != null ? `${Math.round(atsScore)}%` : "0%"}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                  atsScore != null && atsScore >= 75
                    ? "text-cyan-300 bg-cyan-500/10 border-cyan-500/20"
                    : atsScore != null
                    ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                    : "text-slate-400 bg-slate-500/10 border-slate-500/20"
                }`}
              >
                {atsScore != null && atsScore >= 75
                  ? "High Match"
                  : atsScore != null
                  ? "Moderate"
                  : "Not Uploaded"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Resume Score</p>
            <div className="mt-3.5 w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-teal-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${atsScore != null ? Math.min(100, Math.round(atsScore)) : 0}%` }}
              />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 truncate">
              <span className="truncate">
                {latestResume?.file_name || "No resume uploaded"}
              </span>
              <Link
                href="/resume-analyzer"
                className="text-cyan-400 hover:text-cyan-300 font-medium shrink-0 ml-1 underline underline-offset-2 hover:no-underline"
              >
                {userResumes.length > 0 ? `${userResumes.length} File(s)` : "Upload"}
              </Link>
            </div>
          </div>

          {/* Metric 3: DSA Progress */}
          <Link
            href="/dsa"
            className="block p-6 rounded-2xl bg-[#0c1222]/90 border border-white/10 hover:border-purple-500/40 hover:bg-[#0e162c] transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 group-hover:text-purple-200 transition-colors">
                Coding Mastery
              </span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-105 transition-transform">
                <Code2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {totalDsaSolved}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                  totalDsaSolved > 0
                    ? "text-purple-300 bg-purple-500/10 border-purple-500/20"
                    : "text-slate-400 bg-slate-500/10 border-slate-500/20"
                }`}
              >
                {totalDsaSolved > 0 ? `${totalDsaSolved} Solved` : "0 Solved"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">DSA Track Progress</p>
            <div className="mt-3.5 w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${dsaProgressPercent}%` }}
              />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
              <span>
                {hasDsaData
                  ? `E: ${easySolved} • M: ${mediumSolved} • H: ${hardSolved}`
                  : "Target: 150 Problems"}
              </span>
              <span className="text-purple-400 group-hover:text-purple-300 font-medium flex items-center gap-1 underline underline-offset-2 group-hover:no-underline">
                <span>{hasDsaData ? "Track DSA" : "Start DSA"}</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>

          {/* Metric 4: Mock Interview Progress */}
          <div className="p-6 rounded-2xl bg-[#0c1222]/90 border border-white/10 hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                Mock Rounds
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {mockCount}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                  mockCount > 0
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : "text-slate-400 bg-slate-500/10 border-slate-500/20"
                }`}
              >
                {mockCount > 0 ? `${mockCount} Completed` : "0 Completed"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Interview Performance</p>
            <div className="mt-3.5 w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${mockProgressPercent}%` }}
              />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
              <span>
                {avgMockScore ? `Avg: ${avgMockScore}/10` : "No mocks taken"}
              </span>
              <Link
                href="/mock-interview"
                className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-2 hover:no-underline"
              >
                {hasMocks ? `${userMocks[0]?.interview_type || "Technical"}` : "Start Mock"}
              </Link>
            </div>
          </div>
        </div>

        {/* AI Actionable Assistant Suggestion */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900/30 via-[#0e162c] to-[#0a1122] border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shrink-0 shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wide">
                  AI Placement Coach Recommendation
                </span>
                <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                  {recommendationPriority}
                </span>
              </div>
              <p className="text-sm text-slate-200 mt-0.5">
                {recommendationMessage}
              </p>
            </div>
          </div>

          <Link
            href="/mock-interview"
            className="self-start sm:self-auto shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer transition-all hover:-translate-y-0.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Start Practice Drill</span>
          </Link>
        </div>

        {/* Action Modules */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <span>Placement Preparation Modules</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/mock-interview"
              className="p-5 rounded-2xl bg-[#0c1222]/80 border border-white/10 hover:border-cyan-500/40 hover:bg-[#0e162c] transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition-transform">
                  <Video className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  AI Mock Interview
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Practice realistic technical and behavioral rounds with instant scoring and vocal feedback.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-cyan-400 font-medium">
                <span>Start Mock Round</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              href="/resume-analyzer"
              className="p-5 rounded-2xl bg-[#0c1222]/80 border border-white/10 hover:border-indigo-500/40 hover:bg-[#0e162c] transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                  <span>ATS Resume Scanner</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                    Step 1 Active
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Upload your master PDF resume into secure private storage with RLS encryption.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-indigo-300 font-medium">
                <span>Upload & Manage Resume</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              href="/skill-gap"
              className="p-5 rounded-2xl bg-[#0c1222]/80 border border-white/10 hover:border-indigo-500/40 hover:bg-[#0e162c] transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                  <span>Skill Gap Analysis</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                    Step 4 Live
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Benchmark your skills against Tier-1 campus drive requirements and get prioritized study plans.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-indigo-300 font-medium">
                <span>View Skill Match</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              href="/dsa"
              className="p-5 rounded-2xl bg-[#0c1222]/80 border border-white/10 hover:border-purple-500/40 hover:bg-[#0e162c] transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-105 transition-transform">
                  <Code2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors flex items-center justify-between">
                  <span>DSA Tracker & Blind 75</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
                    Step 5 Live
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Step-by-step problem sets curated specifically for campus recruitment coding rounds.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-purple-300 font-medium">
                <span>View Problems</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              href="/job-applications"
              className="p-5 rounded-2xl bg-[#0c1222]/80 border border-white/10 hover:border-amber-500/40 hover:bg-[#0e162c] transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-105 transition-transform">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors flex items-center justify-between">
                  <span>Job Application Tracker</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    Step 6 Live
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Track every campus and off-campus application from submission to offer stage.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-amber-300 font-medium">
                <span>Manage Applications</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              href="/roadmap"
              className="p-5 rounded-2xl bg-[#0c1222]/80 border border-white/10 hover:border-indigo-500/40 hover:bg-[#0e162c] transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                  <span>Personalized Roadmap</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                    Step 7 Live
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  AI-generated multi-week preparation roadmap tailored to your target role, skill gaps, and DSA progress.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-indigo-300 font-medium">
                <span>View Roadmap</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <div className="p-5 rounded-2xl bg-[#0c1222]/80 border border-white/10 hover:border-emerald-500/30 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  Company Drive Packs
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tailored question banks for Google, Amazon, Microsoft, TCS Digital, and tier-1 product firms.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-emerald-300 font-medium">
                <span>Explore Packs</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
