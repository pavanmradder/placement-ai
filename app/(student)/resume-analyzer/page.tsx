import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  // Fetch user's resumes (profile query eliminated)
  const { data: resumes } = await supabase
    .from("resumes")
    .select(
      "id, user_id, file_name, storage_path, file_path, file_size, mime_type, ats_score, analysis, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <ResumeAnalyzerClient
        userId={user.id}
        initialResumes={(resumes as ResumeItem[]) || []}
      />
    </main>
  );
}
