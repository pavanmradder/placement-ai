"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Bot, LogOut, Home, LayoutDashboard, FileText, Video, Target, Code2 } from "lucide-react";

interface DashboardHeaderProps {
  displayName: string;
  email: string;
  targetRole: string;
}

export default function DashboardHeader({
  displayName,
  email,
  targetRole,
}: DashboardHeaderProps) {
  const { signOut } = useAuth();
  const avatarInitial = (displayName || email || "U").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-[#07090e]/85 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 group transition-transform duration-200 hover:scale-[1.02]"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] flex items-center justify-center shadow-md shadow-indigo-500/25">
              <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
                <Bot className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
              </div>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Placement<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">AI</span>
            </span>
          </Link>

          <span className="hidden sm:inline-block px-2.5 py-0.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            ● Student Portal
          </span>
        </div>

        {/* User profile & Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/skill-gap"
            className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 px-3 py-2 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span>Skill Gap</span>
          </Link>

          <Link
            href="/mock-interview"
            className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 px-3 py-2 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <Video className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mock Interview</span>
          </Link>

          <Link
            href="/resume-analyzer"
            className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 px-3 py-2 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Resume Analyzer</span>
          </Link>

          <Link
            href="/dsa"
            className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 px-3 py-2 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <Code2 className="w-3.5 h-3.5 text-purple-400" />
            <span>DSA Tracker</span>
          </Link>

          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-[10px] font-bold text-white shadow-inner">
              {avatarInitial}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="font-semibold text-white leading-tight max-w-[140px] truncate">
                {displayName}
              </span>
              <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                {targetRole}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signOut("/login")}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-rose-300 px-3 py-2 rounded-lg hover:bg-white/[0.05] border border-white/5 transition-all cursor-pointer"
            title="Log out of PlacementAI"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
