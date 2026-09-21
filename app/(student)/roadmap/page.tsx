import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RoadmapClient from "@/components/roadmap/RoadmapClient";

export const metadata = {
  title: "Personalized Placement Roadmap | PlacementAI",
  description:
    "Your AI-tailored 4-week preparation plan for campus recruitment drives.",
};

export default async function RoadmapPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?callbackUrl=/roadmap");
  }

  const userEmail = user.email?.trim().toLowerCase() || "";
  const isAdmin = userEmail === "pavanmradder@gmail.com";
  const isStudent = userEmail.endsWith("@mite.ac.in");

  // Admin should be redirected to /admin
  if (isAdmin) {
    redirect("/admin");
  }

  // Restrict to @mite.ac.in students
  if (!isStudent) {
    redirect("/login?error=domain");
  }

  // Concurrently fetch target role and latest roadmap
  const [{ data: profile }, { data: latestRoadmap }] = await Promise.all([
    supabase
      .from("profiles")
      .select("target_role")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("placement_roadmaps")
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
    <div className="flex-1">
      <RoadmapClient
        initialTargetRole={targetRole}
        initialRoadmap={latestRoadmap as any}
      />
    </div>
  );
}
