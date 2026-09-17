"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerStudentAction } from "@/app/actions/auth";
import {
  STUDENT_DOMAIN_ERROR,
  isStudentEmail,
} from "@/lib/auth-constants";
import {
  Bot,
  ArrowLeft,
  ArrowRight,
  Lock,
  Mail,
  User,
  Briefcase,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [targetRole, setTargetRole] = useState("Software Development Engineer (SDE)");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const targetRoleOptions = [
    "Software Development Engineer (SDE)",
    "Frontend Engineer",
    "Backend & Distributed Systems",
    "Full Stack Engineer",
    "AI / Machine Learning Engineer",
    "Data Engineer & Analytics",
    "DevOps & Cloud Engineer",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Client-side domain check (instant UX feedback)
    if (!isStudentEmail(normalizedEmail)) {
      setError(STUDENT_DOMAIN_ERROR);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify your entries.");
      return;
    }

    setLoading(true);

    try {
      // 2. Server-side registration action (enforces @mite.ac.in domain on the server)
      const res = await registerStudentAction({
        name: name.trim(),
        email: normalizedEmail,
        password,
        targetRole,
      });

      if (!res.success) {
        setError(res.error || "Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);

      if (res.hasSession) {
        setSuccessMessage("Account created successfully! Redirecting to your dashboard...");
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1000);
      } else {
        setSuccessMessage(
          "Account created! Please check your MITE college email inbox to verify your account, then sign in."
        );
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected registration error occurred.";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-grid-pattern">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-cyan-500/20 via-indigo-600/20 to-purple-600/20 blur-[130px] rounded-full pointer-events-none -z-10" />

      {/* Top back navigation */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-2.5 group mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <div className="w-full h-full bg-[#090d16] rounded-[15px] flex items-center justify-center">
                <Bot className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
              </div>
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Create your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              PlacementAI
            </span>{" "}
            account
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Start building your placement readiness score today.
          </p>

          {/* Explicit MITE College Restriction Notice */}
          <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-xs text-cyan-300">
            <GraduationCap className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-medium">
              Use your official MITE college email (@mite.ac.in)
            </span>
          </div>
        </div>

        {/* Signup Card */}
        <div className="mt-6 rounded-2xl sm:rounded-3xl bg-[#0c1222]/90 border border-white/10 p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                />
              </div>
            </div>

            {/* Email Address (MITE domain only) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  MITE College Email
                </label>
                <span className="text-[11px] text-cyan-400 font-medium">@mite.ac.in only</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student.id@mite.ac.in"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Use your official MITE college email (@mite.ac.in)
              </p>
            </div>

            {/* Target Role Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Dream Role Target
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Briefcase className="w-4 h-4" />
                </div>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#090e1c] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors cursor-pointer"
                >
                  {targetRoleOptions.map((role) => (
                    <option key={role} value={role} className="bg-[#090e1c] text-white">
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating your account...</span>
                </>
              ) : (
                <>
                  <span>Get Started Now</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer inside card */}
          <div className="mt-6 pt-5 border-t border-white/[0.08] text-center text-xs text-slate-400 flex flex-col gap-2">
            <div>
              <span>Already have an account? </span>
              <Link
                href="/login"
                className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors ml-1"
              >
                Sign in here
              </Link>
            </div>
            <div>
              <Link
                href="/admin/login"
                className="text-slate-500 hover:text-slate-300 transition-colors text-[11px]"
              >
                Placement Administrator Portal →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
