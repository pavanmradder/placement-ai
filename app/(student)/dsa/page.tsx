import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DsaTrackerClient from "@/components/dsa/DsaTrackerClient";

export const metadata = {
  title: "DSA Progress Tracker | PlacementAI",
  description:
    "Track your progress across curated Data Structures & Algorithms problems for campus recruitment coding rounds.",
};

export default async function DsaTrackerPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?callbackUrl=/dsa");
  }

  const userEmail = user.email?.trim().toLowerCase() || "";
  const isAdmin = userEmail === "pavanmradder@gmail.com";
  const isStudent = userEmail.endsWith("@mite.ac.in");

  // Restrict to authorized students (@mite.ac.in) and admin
  if (!isStudent && !isAdmin) {
    redirect("/login?error=domain");
  }

  // Concurrently fetch target role, problem catalog, student progress, and summary
  const [
    { data: profile },
    { data: problems },
    { data: progressList },
    { data: dsaSummary },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("target_role")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("dsa_problems")
      .select("id, title, slug, topic, difficulty, platform, external_url, created_at")
      .order("topic", { ascending: true })
      .order("difficulty", { ascending: true })
      .order("title", { ascending: true }),
    supabase
      .from("user_dsa_progress")
      .select("id, problem_id, status, solved_at, notes, updated_at")
      .eq("user_id", user.id),
    supabase
      .from("dsa_progress")
      .select("easy_solved, medium_solved, hard_solved, total_solved, updated_at")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const targetRole =
    profile?.target_role ||
    user.user_metadata?.target_role ||
    user.user_metadata?.targetRole ||
    "Software Development Engineer (SDE)";

  const stats = {
    easySolved: dsaSummary?.easy_solved ?? 0,
    mediumSolved: dsaSummary?.medium_solved ?? 0,
    hardSolved: dsaSummary?.hard_solved ?? 0,
    totalSolved: dsaSummary?.total_solved ?? 0,
    updatedAt: dsaSummary?.updated_at || null,
  };

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <DsaTrackerClient
        userId={user.id}
        targetRole={targetRole}
        initialProblems={(problems as any) || []}
        initialProgress={(progressList as any) || []}
        initialStats={stats}
      />
    </main>
  );
}
