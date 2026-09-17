"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Bot, LogOut, Home, Shield, Users } from "lucide-react";

export default function AdminHeader({ adminEmail }: { adminEmail: string }) {
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#07090e]/90 backdrop-blur-md border-b border-amber-500/20 px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 group transition-transform duration-200 hover:scale-[1.02]"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-indigo-600 p-[1px] flex items-center justify-center shadow-md shadow-amber-500/20">
              <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
                <Bot className="w-4 h-4 text-amber-400 group-hover:text-amber-300 transition-colors" />
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-lg font-bold tracking-tight text-white">
                Placement<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">AI</span>
              </span>
              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-md">
                Admin Console
              </span>
            </div>
          </Link>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-full">
            <Shield className="w-3 h-3 text-amber-400" />
            <span>MITE Campus Administration</span>
          </span>
        </div>

        {/* Admin profile & Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Landing Page</span>
          </Link>

          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-[10px] font-bold text-white shadow-inner">
              P
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="font-semibold text-white leading-tight">
                Pavan M R
              </span>
              <span className="text-[10px] text-amber-300/80 truncate max-w-[160px]">
                {adminEmail}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signOut("/admin/login")}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-rose-300 px-3 py-2 rounded-lg hover:bg-white/[0.05] border border-white/5 transition-all cursor-pointer"
            title="Log out of Admin Portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
