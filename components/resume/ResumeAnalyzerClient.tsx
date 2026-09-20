"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ResumeUploadCard from "./ResumeUploadCard";
import ResumeHistoryList, { ResumeItem } from "./ResumeHistoryList";
import ResumeAnalysisView from "./ResumeAnalysisView";
import type { ResumeAnalysisOutput } from "@/lib/resume/analyzer";
import { ArrowLeft, Sparkles, Shield } from "lucide-react";

interface ResumeAnalyzerClientProps {
  userId: string;
  initialResumes: ResumeItem[];
}

export default function ResumeAnalyzerClient({
  userId,
  initialResumes,
}: ResumeAnalyzerClientProps) {
  const [resumes, setResumes] = useState<ResumeItem[]>(initialResumes);

  // Automatically load existing saved analysis for the student's resume on page load
  const initialAnalyzedResume = initialResumes.find((r) => r.analysis);

  const [activeAnalysis, setActiveAnalysis] = useState<{
    resumeId: string;
    fileName: string;
    analysis: ResumeAnalysisOutput;
  } | null>(
    initialAnalyzedResume
      ? {
          resumeId: initialAnalyzedResume.id,
          fileName: initialAnalyzedResume.file_name,
          analysis: initialAnalyzedResume.analysis as unknown as ResumeAnalysisOutput,
        }
      : null
  );

  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const supabase = createClient();

  const handleRefresh = async () => {
    const { data } = await supabase
      .from("resumes")
      .select(
        "id, user_id, file_name, storage_path, file_path, file_size, mime_type, ats_score, analysis, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      setResumes(data as ResumeItem[]);
    }
  };

  const handleSelectAnalysis = (resume: ResumeItem) => {
    if (resume.analysis) {
      setActiveAnalysis({
        resumeId: resume.id,
        fileName: resume.file_name,
        analysis: resume.analysis as unknown as ResumeAnalysisOutput,
      });
    }
  };

  const handleReanalyzeFromDashboard = async () => {
    if (!activeAnalysis) return;
    setIsReanalyzing(true);

    try {
      const response = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resumeId: activeAnalysis.resumeId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to analyze resume.");
      }

      await handleRefresh();

      setActiveAnalysis({
        resumeId: activeAnalysis.resumeId,
        fileName: activeAnalysis.fileName,
        analysis: data.analysis,
      });
    } catch (err) {
      console.error("Re-analyze error:", err);
    } finally {
      setIsReanalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Bar with Navigation & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors mb-2 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Student Dashboard</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>AI Resume Analyzer</span>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 border border-cyan-500/30 text-cyan-300">
              Groq Powered
            </span>
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Upload your master PDF resume and run automated ATS keyword scanning,
            skill gap detection, and campus placement evaluations with Groq AI.
          </p>
        </div>

        {/* Status Callout */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#0c1222]/90 border border-white/10 self-start sm:self-auto shrink-0 shadow-lg">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Security Protocol
            </p>
            <p className="text-xs font-semibold text-white">
              Private Storage & RLS Active
            </p>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-[#0e162c] to-[#0a1122] border border-indigo-500/20 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <p className="text-xs sm:text-sm text-slate-300">
          <span className="font-semibold text-white">AI Analyzer Ready:</span>{" "}
          Click &ldquo;Analyze Resume&rdquo; on any uploaded document below to run real-time
          PDF text extraction and Groq ATS scoring.
        </p>
      </div>

      {/* Upload Component */}
      <ResumeUploadCard userId={userId} onUploadSuccess={handleRefresh} />

      {/* Active Analysis View (Shown when an analysis is completed or selected) */}
      {activeAnalysis && (
        <ResumeAnalysisView
          fileName={activeAnalysis.fileName}
          analysis={activeAnalysis.analysis}
          isReanalyzing={isReanalyzing}
          onReanalyze={handleReanalyzeFromDashboard}
          onClose={() => setActiveAnalysis(null)}
        />
      )}

      {/* Previously Uploaded Resumes List */}
      <ResumeHistoryList
        resumes={resumes}
        onRefresh={handleRefresh}
        onSelectAnalysis={handleSelectAnalysis}
      />
    </div>
  );
}
