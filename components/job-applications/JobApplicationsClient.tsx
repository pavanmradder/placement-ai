"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  Search,
  Building2,
  Calendar,
  MapPin,
  DollarSign,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileText,
  Clock,
  Layers,
  Sparkles,
  Trophy,
  Filter,
} from "lucide-react";
import { JobApplicationStatus } from "@/lib/job-applications/validation";
import JobApplicationModal from "./JobApplicationModal";
import DeleteConfirmModal from "./DeleteConfirmModal";

export interface JobApplication {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  application_date: string;
  status: JobApplicationStatus;
  job_url: string | null;
  location: string | null;
  package_ctc: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface JobApplicationsClientProps {
  userId: string;
}

const STATUS_CONFIG: Record<
  JobApplicationStatus,
  { label: string; badgeClass: string; cardBorder: string }
> = {
  applied: {
    label: "Applied",
    badgeClass: "text-sky-300 bg-sky-500/10 border-sky-500/30",
    cardBorder: "hover:border-sky-500/40",
  },
  oa: {
    label: "OA",
    badgeClass: "text-purple-300 bg-purple-500/10 border-purple-500/30",
    cardBorder: "hover:border-purple-500/40",
  },
  interview: {
    label: "Interview",
    badgeClass: "text-amber-300 bg-amber-500/10 border-amber-500/30",
    cardBorder: "hover:border-amber-500/40",
  },
  offer: {
    label: "Offer",
    badgeClass: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
    cardBorder: "hover:border-emerald-500/40",
  },
  rejected: {
    label: "Rejected",
    badgeClass: "text-rose-300 bg-rose-500/10 border-rose-500/30",
    cardBorder: "hover:border-rose-500/40",
  },
};

export default function JobApplicationsClient({ userId }: JobApplicationsClientProps) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [selectedStatus, setSelectedStatus] = useState<"All" | JobApplicationStatus>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);

  // Delete Confirmation State
  const [deletingApplication, setDeletingApplication] = useState<JobApplication | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/job-applications");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load job applications.");
      }

      setApplications(data.applications || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
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

  // Derived Summary Counts (100% computed from real applications data)
  const summaryCounts = useMemo(() => {
    const counts = {
      total: applications.length,
      applied: 0,
      oa: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };

    for (const app of applications) {
      if (counts[app.status] !== undefined) {
        counts[app.status]++;
      }
    }

    return counts;
  }, [applications]);

  // Filtered Applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (selectedStatus !== "All" && app.status !== selectedStatus) {
        return false;
      }

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCompany = app.company_name.toLowerCase().includes(q);
        const matchesTitle = app.job_title.toLowerCase().includes(q);
        const matchesLocation = (app.location || "").toLowerCase().includes(q);

        if (!matchesCompany && !matchesTitle && !matchesLocation) {
          return false;
        }
      }

      return true;
    });
  }, [applications, selectedStatus, searchQuery]);

  const hasActiveFilters = selectedStatus !== "All" || searchQuery.trim().length > 0;

  const resetFilters = () => {
    setSelectedStatus("All");
    setSearchQuery("");
  };

  // Delete Action Handler
  const handleDeleteConfirm = async () => {
    if (!deletingApplication) return;

    const response = await fetch(`/api/job-applications/${deletingApplication.id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to delete job application.");
    }

    setApplications((prev) => prev.filter((a) => a.id !== deletingApplication.id));
    setToastMessage({
      text: `Deleted application for ${deletingApplication.company_name}.`,
      type: "success",
    });
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
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
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-950/70 via-[#181124] to-[#0a0f1d] border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Briefcase className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Job Application{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400">
                  Tracker
                </span>
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Step 6 Live
              </span>
            </div>

            <p className="text-sm text-slate-300 max-w-2xl">
              Track every application from submission to offer. Keep your interview rounds, OA schedules,
              compensation packages, and referral notes organized in one place.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setEditingApplication(null);
                setIsModalOpen(true);
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Application</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS (Actual database data) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total */}
        <div className="p-4 rounded-2xl bg-[#0c1222]/90 border border-white/10 hover:border-white/20 transition-all">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
            Total
          </span>
          <p className="text-2xl font-extrabold text-white mt-1 tracking-tight">
            {summaryCounts.total}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Applications</span>
        </div>

        {/* Applied */}
        <div className="p-4 rounded-2xl bg-[#0c1222]/90 border border-sky-500/20 hover:border-sky-500/40 transition-all">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-400 block">
            Applied
          </span>
          <p className="text-2xl font-extrabold text-sky-300 mt-1 tracking-tight">
            {summaryCounts.applied}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Submitted</span>
        </div>

        {/* OA */}
        <div className="p-4 rounded-2xl bg-[#0c1222]/90 border border-purple-500/20 hover:border-purple-500/40 transition-all">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400 block">
            OA
          </span>
          <p className="text-2xl font-extrabold text-purple-300 mt-1 tracking-tight">
            {summaryCounts.oa}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Assessments</span>
        </div>

        {/* Interviews */}
        <div className="p-4 rounded-2xl bg-[#0c1222]/90 border border-amber-500/20 hover:border-amber-500/40 transition-all">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 block">
            Interviews
          </span>
          <p className="text-2xl font-extrabold text-amber-300 mt-1 tracking-tight">
            {summaryCounts.interview}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">In Progress</span>
        </div>

        {/* Offers */}
        <div className="p-4 rounded-2xl bg-[#0c1222]/90 border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 block">
            Offers
          </span>
          <p className="text-2xl font-extrabold text-emerald-300 mt-1 tracking-tight">
            {summaryCounts.offer}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Received</span>
        </div>

        {/* Rejected */}
        <div className="p-4 rounded-2xl bg-[#0c1222]/90 border border-rose-500/20 hover:border-rose-500/40 transition-all">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400 block">
            Rejected
          </span>
          <p className="text-2xl font-extrabold text-rose-300 mt-1 tracking-tight">
            {summaryCounts.rejected}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Archived</span>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0c1222]/80 border border-white/10">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search company, job title, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#07090e] border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all"
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

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { key: "All", label: "All", count: summaryCounts.total },
              { key: "applied", label: "Applied", count: summaryCounts.applied },
              { key: "oa", label: "OA", count: summaryCounts.oa },
              { key: "interview", label: "Interview", count: summaryCounts.interview },
              { key: "offer", label: "Offer", count: summaryCounts.offer },
              { key: "rejected", label: "Rejected", count: summaryCounts.rejected },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSelectedStatus(item.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedStatus === item.key
                  ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30"
                  : "bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-transparent"
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedStatus === item.key
                    ? "bg-amber-500/30 text-amber-200 font-bold"
                    : "bg-white/10 text-slate-400"
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ml-1"
              title="Clear all filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* LOADING STATE */}
      {isLoading && (
        <div className="p-12 rounded-2xl bg-[#0c1222]/80 border border-white/10 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-300 font-medium">Loading your job applications...</p>
        </div>
      )}

      {/* ERROR STATE */}
      {error && !isLoading && (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <div className="space-y-2 flex-1">
            <h3 className="text-sm font-semibold text-white">Failed to load applications</h3>
            <p className="text-xs text-rose-200/90">{error}</p>
            <button
              type="button"
              onClick={fetchApplications}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-xs font-medium text-white border border-rose-500/30 transition-all cursor-pointer"
            >
              Retry Loading
            </button>
          </div>
        </div>
      )}

      {/* MAIN APPLICATION LIST */}
      {!isLoading && !error && (
        <>
          {filteredApplications.length === 0 ? (
            <div className="p-12 sm:p-16 rounded-2xl bg-[#0c1222]/60 border border-white/10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                <Briefcase className="w-7 h-7" />
              </div>

              {hasActiveFilters ? (
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-white">No applications match your filter</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Try clearing your search query or selecting a different status filter.
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer mt-2"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-white">No applications tracked yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Start tracking your campus placement drives and off-campus applications.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingApplication(null);
                      setIsModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 mx-auto transition-all cursor-pointer mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Your First Application</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApplications.map((app) => {
                const config = STATUS_CONFIG[app.status];

                return (
                  <div
                    key={app.id}
                    className={`p-5 rounded-2xl bg-[#0c1222]/80 border border-white/10 ${config.cardBorder} transition-all space-y-3`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Company & Title */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-base font-bold text-white tracking-tight">
                            {app.company_name}
                          </h3>

                          {/* Status Badge */}
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${config.badgeClass}`}
                          >
                            {config.label}
                          </span>

                          {/* Job Posting Link */}
                          {app.job_url && (
                            <a
                              href={app.job_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1 font-medium"
                              title="Open original job posting"
                            >
                              <span>View Posting</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 font-medium">{app.job_title}</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingApplication(app);
                            setIsModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium border border-white/5 flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Edit application"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingApplication(app)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Delete application"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Metadata Pill Row */}
                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-1 border-t border-white/5">
                      {/* Application Date */}
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Applied: {formatDate(app.application_date)}</span>
                      </span>

                      {/* Location */}
                      {app.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{app.location}</span>
                        </span>
                      )}

                      {/* Package / CTC */}
                      {app.package_ctc && (
                        <span className="flex items-center gap-1.5 text-emerald-400/90 font-medium">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{app.package_ctc}</span>
                        </span>
                      )}
                    </div>

                    {/* Notes Preview */}
                    {app.notes && (
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-300 flex items-start gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span className="italic leading-relaxed">{app.notes}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add / Edit Modal */}
      <JobApplicationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingApplication(null);
        }}
        onSubmitSuccess={(msg) => {
          fetchApplications();
          setToastMessage({ text: msg, type: "success" });
        }}
        initialData={editingApplication}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingApplication)}
        onClose={() => setDeletingApplication(null)}
        onConfirm={handleDeleteConfirm}
        companyName={deletingApplication?.company_name || ""}
        jobTitle={deletingApplication?.job_title || ""}
      />
    </div>
  );
}
