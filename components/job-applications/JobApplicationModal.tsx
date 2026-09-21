"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Building2, Briefcase, Calendar, Link2, MapPin, DollarSign, FileText } from "lucide-react";
import {
  VALID_JOB_APPLICATION_STATUSES,
  JobApplicationStatus,
} from "@/lib/job-applications/validation";

export interface JobApplicationFormData {
  company_name: string;
  job_title: string;
  application_date: string;
  status: JobApplicationStatus;
  job_url: string;
  location: string;
  package_ctc: string;
  notes: string;
}

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (message: string) => void;
  initialData?: {
    id: string;
    company_name: string;
    job_title: string;
    application_date: string;
    status: JobApplicationStatus;
    job_url: string | null;
    location: string | null;
    package_ctc: string | null;
    notes: string | null;
  } | null;
}

const STATUS_LABELS: Record<JobApplicationStatus, string> = {
  applied: "Applied",
  oa: "Online Assessment (OA)",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export default function JobApplicationModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  initialData,
}: JobApplicationModalProps) {
  const isEditing = Boolean(initialData);

  const getInitialFormState = (): JobApplicationFormData => ({
    company_name: initialData?.company_name || "",
    job_title: initialData?.job_title || "",
    application_date:
      initialData?.application_date || new Date().toISOString().slice(0, 10),
    status: initialData?.status || "applied",
    job_url: initialData?.job_url || "",
    location: initialData?.location || "",
    package_ctc: initialData?.package_ctc || "",
    notes: initialData?.notes || "",
  });

  const [formData, setFormData] = useState<JobApplicationFormData>(getInitialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state whenever modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormState());
      setError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side quick check
    if (!formData.company_name.trim()) {
      setError("Company Name is required.");
      return;
    }
    if (!formData.job_title.trim()) {
      setError("Job Title is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `/api/job-applications/${initialData!.id}`
        : "/api/job-applications";

      const method = isEditing ? "PATCH" : "POST";

      const payload = {
        company_name: formData.company_name.trim(),
        job_title: formData.job_title.trim(),
        application_date: formData.application_date,
        status: formData.status,
        job_url: formData.job_url.trim() || null,
        location: formData.location.trim() || null,
        package_ctc: formData.package_ctc.trim() || null,
        notes: formData.notes.trim() || null,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Failed to ${isEditing ? "update" : "create"} application.`);
      }

      onSubmitSuccess(
        isEditing
          ? `Updated application for ${formData.company_name}.`
          : `Added application for ${formData.company_name}.`
      );
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0d1322] border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-7 my-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEditing ? "Edit Job Application" : "Add Job Application"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEditing
                  ? "Update status, notes, or compensation details."
                  : "Track a new campus or off-campus application."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
            <span className="font-semibold">Error:</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Company Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Company Name *</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Google, Amazon, TCS"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                maxLength={100}
                className="w-full bg-[#07090e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all"
              />
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                <span>Job Title *</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SDE-1, Graduate Engineer Trainee"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                maxLength={100}
                className="w-full bg-[#07090e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Application Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Application Date</span>
              </label>
              <input
                type="date"
                required
                value={formData.application_date}
                onChange={(e) => setFormData({ ...formData, application_date: e.target.value })}
                className="w-full bg-[#07090e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Application Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as JobApplicationStatus })
                }
                className="w-full bg-[#07090e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all cursor-pointer"
              >
                {VALID_JOB_APPLICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Location (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Bengaluru, Remote, Hyderabad"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                maxLength={100}
                className="w-full bg-[#07090e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all"
              />
            </div>

            {/* Package / CTC */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span>Package / CTC (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 14 LPA, ₹6.5 Lakhs, $120k"
                value={formData.package_ctc}
                onChange={(e) => setFormData({ ...formData, package_ctc: e.target.value })}
                maxLength={50}
                className="w-full bg-[#07090e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all"
              />
            </div>
          </div>

          {/* Job URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Job Posting URL (Optional)</span>
            </label>
            <input
              type="url"
              placeholder="https://careers.company.com/job/123"
              value={formData.job_url}
              onChange={(e) => setFormData({ ...formData, job_url: e.target.value })}
              maxLength={1000}
              className="w-full bg-[#07090e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Notes & Interview Updates (Optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Referred by alum; OA link scheduled for next Monday; Round 1 DSA focus on binary trees."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              maxLength={2000}
              className="w-full bg-[#07090e] border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? "Update Application" : "Save Application"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
