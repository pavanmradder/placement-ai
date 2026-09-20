"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ShieldCheck,
  FileType,
} from "lucide-react";

interface ResumeUploadCardProps {
  userId: string;
  onUploadSuccess: () => void;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ResumeUploadCard({
  userId,
  onUploadSuccess,
}: ResumeUploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const validateFile = (selectedFile: File): string | null => {
    // 1. Validate PDF format (check MIME type & file extension)
    const isPdfMime = selectedFile.type === "application/pdf";
    const hasPdfExtension = selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdfMime && !hasPdfExtension) {
      return "Invalid file type. Only PDF documents (.pdf) are supported. DOC, DOCX, images, and ZIP files are strictly rejected.";
    }

    // 2. Validate file size (<= 5 MB)
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      return `File size (${formatFileSize(
        selectedFile.size
      )}) exceeds the maximum allowed limit of 5 MB. Please compress or select a smaller PDF.`;
    }

    // 3. Reject zero-byte files
    if (selectedFile.size === 0) {
      return "The selected PDF file is empty (0 bytes). Please select a valid document.";
    }

    return null;
  };

  const handleFileSelect = (selectedFile: File | null) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setErrorMessage(validationError);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(selectedFile);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    handleFileSelect(selected);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0] || null;
    handleFileSelect(droppedFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Sanitize file name for storage path (keep only alphanumeric, dash, underscore, dot)
    const rawName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const timestamp = Date.now();
    const uniqueFileName = `resume-${timestamp}-${rawName}`;
    // Recommended format: {user_id}/{unique-file-name}.pdf
    const storagePath = `${userId}/${uniqueFileName}`;

    try {
      setUploadProgress(35);

      // Step 1: Upload to Supabase Storage private bucket 'resumes'
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: "application/pdf",
        });

      if (uploadError) {
        throw new Error(
          uploadError.message || "Failed to upload resume to secure storage."
        );
      }

      setUploadProgress(75);

      // Step 2: Store metadata in public.resumes database table
      const { error: dbError } = await supabase.from("resumes").insert({
        user_id: userId,
        file_name: file.name,
        storage_path: storagePath,
        file_path: storagePath,
        file_size: file.size,
        mime_type: "application/pdf",
        ats_score: null,
        analysis: null,
      });

      if (dbError) {
        // Rollback: delete the uploaded storage object to prevent orphan files
        await supabase.storage.from("resumes").remove([storagePath]);
        throw new Error(
          dbError.message || "Failed to save resume metadata to database."
        );
      }

      setUploadProgress(100);
      setSuccessMessage(
        `"${file.name}" uploaded successfully! File stored securely in private storage.`
      );
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Notify parent to refresh list
      onUploadSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during upload.";
      setErrorMessage(message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-[#0c1222]/90 border border-white/10 p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <FileType className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Upload Your Resume
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Securely store your PDF resume in PlacementAI private storage.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted & Private</span>
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-10 transition-all text-center flex flex-col items-center justify-center group ${
            isDragging
              ? "border-cyan-400 bg-cyan-500/10 scale-[0.99]"
              : "border-white/15 bg-white/[0.02] hover:border-indigo-500/40 hover:bg-white/[0.04]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleInputChange}
            className="hidden"
            disabled={isUploading}
          />

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600/30 to-cyan-500/30 border border-white/15 flex items-center justify-center text-cyan-300 mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-950/50">
            <UploadCloud className="w-7 h-7" />
          </div>

          <p className="text-base font-semibold text-white">
            Drag and drop your PDF resume here, or{" "}
            <span className="text-cyan-400 underline underline-offset-4 decoration-cyan-400/50 group-hover:decoration-cyan-400">
              browse files
            </span>
          </p>

          <p className="text-xs text-slate-400 mt-2">
            Strictly PDF only • Maximum file size 5 MB
          </p>

          <div className="mt-4 flex items-center gap-3 text-[11px] text-slate-400">
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
              PDF Only
            </span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
              Max 5 MB
            </span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
              Single Document
            </span>
          </div>
        </div>

        {/* Selected File Card */}
        {file && (
          <div className="rounded-xl bg-white/[0.04] border border-white/10 p-4 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {file.name}
                </p>
                <p className="text-xs text-slate-400">
                  {formatFileSize(file.size)} • Ready to upload
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
              disabled={isUploading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Uploading and securing resume in storage...</span>
              </span>
              <span className="font-semibold text-cyan-400">
                {uploadProgress}%
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 flex items-start gap-3 text-rose-300 text-xs sm:text-sm animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-200">Upload Rejected</p>
              <p className="mt-0.5 text-rose-300/90">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 flex items-start gap-3 text-emerald-300 text-xs sm:text-sm animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-emerald-200">Upload Complete</p>
              <p className="mt-0.5 text-emerald-300/90">{successMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-emerald-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {file && (
            <button
              type="button"
              onClick={handleRemoveFile}
              disabled={isUploading}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading Resume...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload Resume</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
