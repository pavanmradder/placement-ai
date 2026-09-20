import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MockInterviewClient from "@/components/interview/MockInterviewClient";
import type { MockInterviewRecord } from "@/components/interview/MockInterviewClient";

export const metadata = {
  title: "AI Mock Interview | PlacementAI",
  description:
    "Practice realistic technical and HR recruitment rounds with instant AI scoring, adaptive questioning, and comprehensive feedback.",
};

export default async function MockInterviewPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?callbackUrl=/mock-interview");
  }

  const userEmail = user.email?.trim().toLowerCase() || "";
  const isAdmin = userEmail === "pavanmradder@gmail.com";
  const isStudent = userEmail.endsWith("@mite.ac.in");

  // Admin redirect to admin dashboard
  if (isAdmin) {
    redirect("/admin");
  }

  // Restrict to authorized students
  if (!isStudent) {
    redirect("/login?error=domain");
  }

  // Concurrently fetch profile and mock interview records
  const [{ data: profile }, { data: mockInterviews }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, target_role, college, graduation_year")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("mock_interviews")
      .select(
        "id, user_id, interview_type, target_role, difficulty, status, questions, current_question_index, score, feedback, created_at, updated_at"
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
        <MockInterviewClient
          userId={user.id}
          initialRole={targetRole}
          initialInterviews={(mockInterviews as MockInterviewRecord[]) || []}
        />
      </main>
    </div>
  );
}
