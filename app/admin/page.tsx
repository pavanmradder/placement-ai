import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import {
  AUTHORIZED_ADMIN_EMAIL,
  isAdminEmail,
} from "@/lib/auth-constants";
import {
  Users,
  FileCheck2,
  Video,
  Code2,
  ShieldCheck,
  Building2,
  GraduationCap,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Console | PlacementAI",
  description: "Administrator console for MITE placement management.",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // SERVER-SIDE CHECK: User must be authenticated AND email must strictly equal pavanmradder@gmail.com
  if (!user || !isAdminEmail(user.email)) {
    redirect("/admin/login?error=unauthorized");
  }

  // Fetch placement overview metrics strictly for @mite.ac.in candidates
  const [
    { count: studentCount, data: recentStudents, error: profileError },
    { count: resumeCount, error: resumeError },
    { count: mockCount, error: mockError },
    { count: dsaCount, error: dsaError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .ilike("email", "%@mite.ac.in")
      .neq("email", AUTHORIZED_ADMIN_EMAIL)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("resumes").select("*", { count: "exact", head: true }),
    supabase.from("mock_interviews").select("*", { count: "exact", head: true }),
    supabase.from("dsa_progress").select("*", { count: "exact", head: true }),
  ]);

  // Safe server-side diagnostic logging (no passwords, tokens, or sensitive secrets)
  console.log("[ADMIN_DIAGNOSTIC]", {
    adminSessionDetected: !!user,
    userEmail: user?.email,
    isAdminEmailMatch: user?.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase(),
    profileQueryError: profileError ? { code: profileError.code, message: profileError.message } : null,
    resumeQueryError: resumeError ? { code: resumeError.code, message: resumeError.message } : null,
    mockQueryError: mockError ? { code: mockError.code, message: mockError.message } : null,
    dsaQueryError: dsaError ? { code: dsaError.code, message: dsaError.message } : null,
    profileDataIsNull: recentStudents === null,
    rawProfileRowCount: recentStudents ? recentStudents.length : 0,
    exactStudentCount: studentCount,
  });

  // Defensive client filter to guarantee strict domain isolation and exclude admin
  const students = (recentStudents ?? []).filter(
    (st) =>
      st.email &&
      st.email.toLowerCase().endsWith("@mite.ac.in") &&
      st.email.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()
  );

  const totalMiteStudents = studentCount ?? students.length;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Sticky Admin Header */}
      <AdminHeader adminEmail={user.email || AUTHORIZED_ADMIN_EMAIL} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Admin Overview Hero */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#101424] to-[#0a0f1d] border border-amber-500/20 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Authorized System Admin
                </span>
                <span className="text-xs text-slate-400">
                  Logged in as <strong className="text-white">{user.email}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                MITE Placement Administrator Dashboard
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl">
                Managing placement preparation, skills acquisition, ATS resumes, and mock interview drills for students of Mangalore Institute of Technology and Engineering.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto shrink-0 bg-white/[0.04] border border-white/10 px-4 py-3 rounded-2xl">
              <Building2 className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Target Institution
                </p>
                <p className="text-xs font-semibold text-white">MITE • Moodabidre</p>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core Admin Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Registered Students */}
          <div className="p-6 rounded-2xl bg-[#0c1222]/90 border border-amber-500/30 shadow-lg shadow-indigo-950/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                Registered Students
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {totalMiteStudents}
              </span>
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                @mite.ac.in
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Active student candidate profiles</p>
          </div>

          {/* Resumes Analyzed */}
          <div className="p-6 rounded-2xl bg-[#0c1222]/90 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                Resumes Scanned
              </span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {resumeCount ?? 0}
              </span>
              <span className="text-xs font-medium text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                ATS Records
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Uploaded resume evaluations</p>
          </div>

          {/* Mock Interviews Completed */}
          <div className="p-6 rounded-2xl bg-[#0c1222]/90 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                Mock Interviews
              </span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {mockCount ?? 0}
              </span>
              <span className="text-xs font-medium text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                Completed
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">AI technical & HR mock drills</p>
          </div>

          {/* DSA Practice Trackers */}
          <div className="p-6 rounded-2xl bg-[#0c1222]/90 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                DSA Progress Logs
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Code2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {dsaCount ?? 0}
              </span>
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Active Trackers
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Coding mastery datasets</p>
          </div>
        </div>

        {/* Student Profiles Table */}
        <div className="rounded-2xl sm:rounded-3xl bg-[#0c1222]/90 border border-white/10 p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-amber-400" />
                <span>Enrolled MITE Students (@mite.ac.in)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Authorized students registered with official MITE college emails
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-white/[0.04] px-3 py-1.5 rounded-xl border border-white/10">
              Showing {students.length} profile(s)
            </span>
          </div>

          {students.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No students have registered with an @mite.ac.in email yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-white/[0.03] text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 rounded-l-lg">Student Name</th>
                    <th className="py-3 px-4">MITE Email</th>
                    <th className="py-3 px-4">Target Role</th>
                    <th className="py-3 px-4">College</th>
                    <th className="py-3 px-4">Graduation Year</th>
                    <th className="py-3 px-4 rounded-r-lg">Registration Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">
                        <div>
                          <div>{st.full_name || "MITE Candidate"}</div>
                          {st.bio && (
                            <p className="text-[11px] text-slate-400 font-normal line-clamp-1 max-w-xs mt-0.5">
                              {st.bio}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-cyan-300 font-mono">
                        {st.email || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {st.target_role || "Software Development Engineer (SDE)"}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {st.college || "MITE Moodabidre"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                          {st.graduation_year ? `Batch of ${st.graduation_year}` : "Class of 2026"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {st.created_at
                          ? new Date(st.created_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "Recent"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
