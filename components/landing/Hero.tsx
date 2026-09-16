"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Star } from "lucide-react";
import DashboardPreview from "./DashboardPreview";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden bg-grid-pattern">
      {/* Radial Gradient Glows in Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[400px] bg-gradient-to-br from-indigo-600/25 via-purple-600/20 to-cyan-500/20 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-12 left-1/4 w-72 h-72 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-20 right-1/4 w-72 h-72 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Tagline Pill */}
        <div className="flex justify-center px-2">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-inner text-xs font-medium text-slate-200 hover:border-indigo-500/40 transition-colors text-center">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-300 font-semibold">Placement Season 2025–2026</span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-300 hidden sm:inline">Engineered for Students</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          </div>
        </div>

        {/* Main Headline & Subheading */}
        <div className="mt-6 sm:mt-8 text-center max-w-4xl mx-auto space-y-5 sm:space-y-6 px-2">
          <h1 className="text-[26px] sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.2] sm:leading-[1.12]">
            Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 inline-block">
              AI-Powered
            </span>
            <br className="sm:hidden" />{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-300 inline-block">
              Placement
            </span>{" "}
            Companion
          </h1>



          <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Prepare smarter, build the right skills, and become placement ready with AI-powered career tools.
          </p>


          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-semibold text-white rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-slate-200 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Explore Features</span>
            </a>
          </div>

          {/* Social Proof Highlights */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Tailored for CS, IT & Circuit Branches</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Realistic FAANG & Tier-1 Question Banks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span>100% Free Campus Starter Tier</span>
            </div>
          </div>
        </div>

        {/* Visual Dashboard Preview */}
        <DashboardPreview />
      </div>
    </section>
  );
}
