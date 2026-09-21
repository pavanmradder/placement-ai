import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SkillGapClient, { SkillGapRecord } from "@/components/skill-gap/SkillGapClient";

export const metadata = {
  title: "Skill Gap Analysis | PlacementAI",
  description:
    "Benchmark your technical skills against Tier-1 campus drive requirements and receive a prioritized study roadmap.",
};

export default async function SkillGapPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?callbackUrl=/skill-gap");
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

  // Concurrently fetch target role and existing latest skill gap analysis
  const [{ data: profile }, { data: latestAnalysis }] = await Promise.all([
    supabase
      .from("profiles")
      .select("target_role")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("skill_gap_analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const targetRole =
    profile?.target_role ||
    user.user_metadata?.target_role ||
    user.user_metadata?.targetRole ||
    "Software Development Engineer (SDE)";

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <SkillGapClient
        userId={user.id}
        initialRole={targetRole}
        initialAnalysis={(latestAnalysis as unknown as SkillGapRecord) || null}
      />
    </main>
  );
}
