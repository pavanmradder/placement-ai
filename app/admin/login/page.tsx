"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAdminAction } from "@/app/actions/auth";
import {
  ADMIN_UNAUTHORIZED_ERROR,
  isAdminEmail,
  AUTHORIZED_ADMIN_EMAIL,
} from "@/lib/auth-constants";
import {
  Bot,
  ArrowLeft,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (urlError === "unauthorized") {
      setError(ADMIN_UNAUTHORIZED_ERROR);
    }
  }, [urlError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Client-side restriction: only the single authorized admin email
    if (!isAdminEmail(normalizedEmail)) {
      setError(ADMIN_UNAUTHORIZED_ERROR);
      return;
    }

    setLoading(true);

    try {
      // 2. Server-side admin login action (strictly validates pavanmradder@gmail.com)
      const res = await loginAdminAction({
        email: normalizedEmail,
        password,
      });

      if (!res.success) {
        setError(res.error || ADMIN_UNAUTHORIZED_ERROR);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(callbackUrl);
        router.refresh();
      }, 800);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred during sign in.";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <>
      {/* Admin Authorization Security Badge */}
      <div className="mt-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-300">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-200">Restricted Administrator Area</p>
          <p className="text-[11px] text-amber-300/80 mt-0.5">
            Only the authorized system administrator account (<strong className="text-white">{AUTHORIZED_ADMIN_EMAIL}</strong>) is permitted to access this portal. All access attempts are verified server-side.
          </p>
        </div>
      </div>

      {/* Login Card */}
      <div className="mt-4 rounded-2xl sm:rounded-3xl bg-[#0c1222]/95 border border-amber-500/20 p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl">
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Admin authenticated successfully! Opening console...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Authorized Admin Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pavanmradder@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Admin Password
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
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
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

          <button
            type="submit"
            disabled={loading || success}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-amber-600/20 hover:shadow-amber-600/35 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Authenticate as Administrator</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer inside card */}
        <div className="mt-6 pt-5 border-t border-white/[0.08] text-center text-xs text-slate-400">
          <span>Are you a student? </span>
          <Link
            href="/login"
            className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors ml-1"
          >
            Go to MITE Student Portal
          </Link>
        </div>
      </div>
    </>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-grid-pattern">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-amber-600/15 via-purple-600/20 to-cyan-500/15 blur-[130px] rounded-full pointer-events-none -z-10" />

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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-cyan-400 p-[1px] flex items-center justify-center shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-[#090d16] rounded-[15px] flex items-center justify-center">
                <Bot className="w-6 h-6 text-amber-400 group-hover:text-amber-300 transition-colors" />
              </div>
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            PlacementAI{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
              Admin Portal
            </span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Authorized administrator console for student placement tracking.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="mt-6 p-8 rounded-2xl bg-[#0c1222]/60 border border-white/10 text-center text-slate-400 text-sm">
              Loading administrator login...
            </div>
          }
        >
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
