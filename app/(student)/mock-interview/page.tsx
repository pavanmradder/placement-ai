import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  // Concurrently fetch target role and mock interview records
  const [{ data: profile }, { data: mockInterviews }] = await Promise.all([
    supabase
      .from("profiles")
      .select("target_role")
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

  const targetRole =
    profile?.target_role ||
    user.user_metadata?.target_role ||
    user.user_metadata?.targetRole ||
    "Software Development Engineer (SDE)";

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <MockInterviewClient
        userId={user.id}
        initialRole={targetRole}
        initialInterviews={(mockInterviews as MockInterviewRecord[]) || []}
      />
    </main>
  );
}
