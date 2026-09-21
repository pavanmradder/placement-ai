import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  // Fetch existing applications for current user (profile query eliminated)
  const { data: applications } = await supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", user.id)
    .order("application_date", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <JobApplicationsClient
        userId={user.id}
        initialApplications={(applications as any) || []}
      />
    </main>
  );
}
