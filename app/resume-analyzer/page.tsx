import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ResumeAnalyzerClient from "@/components/resume/ResumeAnalyzerClient";
import type { ResumeItem } from "@/components/resume/ResumeHistoryList";

export const metadata = {
  title: "AI Resume Analyzer | PlacementAI",
  description:
    "Securely upload and manage your PDF resumes with private Supabase Storage and RLS encryption.",
};

export default async function ResumeAnalyzerPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?callbackUrl=/resume-analyzer");
  }

  const userEmail = user.email?.trim().toLowerCase() || "";
  const isAdmin = userEmail === "pavanmradder@gmail.com";
  const isStudent = userEmail.endsWith("@mite.ac.in");

  // Admin access redirect to admin portal
  if (isAdmin) {
    redirect("/admin");
  }

  // Restrict to @mite.ac.in students
  if (!isStudent) {
    redirect("/login?error=domain");
  }

  // Concurrently fetch profile and user's resumes
  const [{ data: profile }, { data: resumes }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, target_role")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("resumes")
      .select(
        "id, user_id, file_name, storage_path, file_path, file_size, mime_type, ats_score, analysis, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const displayName =
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

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      <DashboardHeader
        displayName={displayName}
        email={user.email || ""}
        targetRole={targetRole}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <ResumeAnalyzerClient
          userId={user.id}
          initialResumes={(resumes as ResumeItem[]) || []}
        />
      </main>
    </div>
  );
}
