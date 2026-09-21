import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import JobApplicationsClient from "@/components/job-applications/JobApplicationsClient";

export const metadata = {
  title: "Job Application Tracker | PlacementAI",
  description: "Track every campus and off-campus application from submission to offer.",
};

export default async function JobApplicationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?callbackUrl=/job-applications");
  }

  const userEmail = user.email?.trim().toLowerCase() || "";
  const isAdmin = userEmail === "pavanmradder@gmail.com";
  const isStudent = userEmail.endsWith("@mite.ac.in");

  // Admin should not be treated as a normal student on this page
  if (isAdmin) {
    redirect("/admin");
  }

  // Restrict to @mite.ac.in students
  if (!isStudent) {
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
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      <DashboardHeader
        displayName={displayName}
        email={user.email || ""}
        targetRole={targetRole}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <JobApplicationsClient userId={user.id} />
      </main>
    </div>
  );
}
