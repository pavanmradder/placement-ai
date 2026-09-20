"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  Calendar,
  HardDrive,
  Download,
  Trash2,
  Loader2,
  Sparkles,
  CheckCircle2,
  Clock,
  Eye,
} from "lucide-react";

export interface ResumeItem {
  id: string;
  user_id: string;
  file_name: string;
  storage_path: string | null;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  ats_score: number | null;
  analysis: Record<string, unknown> | null;
  created_at: string;
}

interface ResumeHistoryListProps {
  resumes: ResumeItem[];
  onRefresh: () => void;
  onSelectAnalysis?: (resume: ResumeItem) => void;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  } catch {
    return dateStr;
  }
}

export default function ResumeHistoryList({
  resumes,
  onRefresh,
  onSelectAnalysis,
}: ResumeHistoryListProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const supabase = createClient();

  const handleDownload = async (resume: ResumeItem) => {
    const targetPath = resume.storage_path || resume.file_path;
    if (!targetPath) {
      setActionError("Storage path not found for this resume.");
      return;
    }

    setDownloadingId(resume.id);
    setActionError(null);

    try {
      const { data, error } = await supabase.storage
        .from("resumes")
        .createSignedUrl(targetPath, 60, {
          download: resume.file_name,
        });

      if (error || !data?.signedUrl) {
        throw new Error(error?.message || "Failed to generate download URL.");
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to download resume.";
      setActionError(msg);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (resume: ResumeItem) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${resume.file_name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(resume.id);
    setActionError(null);

    try {
      const targetPath = resume.storage_path || resume.file_path;
      if (targetPath) {
        await supabase.storage.from("resumes").remove([targetPath]);
      }

      const { error: dbError } = await supabase
        .from("resumes")
        .delete()
        .eq("id", resume.id);

      if (dbError) {
        throw new Error(dbError.message || "Failed to delete resume record.");
      }

      onRefresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete resume.";
      setActionError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAnalyze = async (resume: ResumeItem) => {
    setAnalyzingId(resume.id);
    setActionError(null);

    try {
      const response = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resumeId: resume.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to analyze resume.");
      }

      // Refresh list to update database state in UI
      onRefresh();

      // Display the returned analysis
      if (onSelectAnalysis) {
        onSelectAnalysis({
          ...resume,
          ats_score: data.atsScore,
          analysis: data.analysis,
        });
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Analysis request failed.";
      setActionError(msg);
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-[#0c1222]/90 border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Previously Uploaded Resumes</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            History of resumes securely stored in your private storage account.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 self-start sm:self-auto">
          {resumes.length} {resumes.length === 1 ? "Resume" : "Resumes"} Stored
        </span>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm animate-in fade-in duration-200">
          <p className="font-semibold text-rose-200">Action Failed</p>
          <p className="mt-0.5">{actionError}</p>
        </div>
      )}

      {resumes.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl bg-white/[0.02] border border-dashed border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-white">
            No Resumes Uploaded Yet
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Upload your first PDF resume above. It will be securely stored in
            your private storage bucket ready for AI analysis.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.06] space-y-4">
          {resumes.map((resume) => {
            const hasAnalysis = !!resume.analysis;
            const isAnalyzing = analyzingId === resume.id;

            return (
              <div
                key={resume.id}
                className="pt-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 transition-all"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-bold text-white truncate max-w-md">
                      {resume.file_name}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{formatDate(resume.created_at)}</span>
                      </span>

                      <span>•</span>

                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{formatFileSize(resume.file_size)}</span>
                      </span>

                      <span>•</span>

                      <span className="text-[11px] font-mono text-slate-400 truncate max-w-[200px]">
                        {resume.storage_path || resume.file_path}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="pt-1 flex items-center gap-2 flex-wrap">
                      {hasAnalysis ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 shadow-sm">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Analysis Available</span>
                          {resume.ats_score != null && (
                            <span className="text-emerald-200/90 font-bold">• {Math.round(Number(resume.ats_score))}% Score</span>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-sm">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <span>Uploaded — Ready to Analyze</span>
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{hasAnalysis ? "Analyzed" : "Pending Analysis"}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
                  {/* Primary AI Analyze / View Actions */}
                  {hasAnalysis ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onSelectAnalysis?.(resume)}
                        className="px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-xs font-semibold text-indigo-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="View Saved Analysis"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>View Analysis</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAnalyze(resume)}
                        disabled={isAnalyzing}
                        className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        title="Analyze Again with Groq"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                            <span>Analyze Again</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAnalyze(resume)}
                      disabled={isAnalyzing}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Analyze Resume with Groq AI"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                          <span>Analyze Resume</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Download Action */}
                  <button
                    type="button"
                    onClick={() => handleDownload(resume)}
                    disabled={downloadingId === resume.id}
                    className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    title="Download / View Resume"
                  >
                    {downloadingId === resume.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Download</span>
                      </>
                    )}
                  </button>

                  {/* Delete Action */}
                  <button
                    type="button"
                    onClick={() => handleDelete(resume)}
                    disabled={deletingId === resume.id}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer disabled:opacity-50"
                    title="Delete Resume"
                  >
                    {deletingId === resume.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
