import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
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

  // Fetch student profile for header and role display
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, target_role, college, graduation_year")
    .eq("id", user.id)
    .maybeSingle();

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
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-purple-500/30 selection:text-purple-200">
      <DashboardHeader
        displayName={displayName}
        email={user.email || ""}
        targetRole={targetRole}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <DsaTrackerClient userId={user.id} targetRole={targetRole} />
      </main>
    </div>
  );
}
