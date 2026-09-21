import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { isAdminEmail } from "@/lib/auth-constants";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userEmail = user.email?.trim().toLowerCase() || "";
  const isAdmin = isAdminEmail(userEmail);
  const isStudent = userEmail.endsWith("@mite.ac.in");

  // Admin users should be redirected to /admin
  if (isAdmin) {
    redirect("/admin");
  }

  // Restrict to @mite.ac.in students
  if (!isStudent) {
    redirect("/login?error=domain");
  }

  // Fetch student profile once for the shared header
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, target_role")
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
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      <DashboardHeader
        displayName={displayName}
        email={user.email || ""}
        targetRole={targetRole}
      />
      {children}
    </div>
  );
}
