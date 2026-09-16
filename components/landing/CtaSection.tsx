import { ArrowRight, Sparkles, CheckCircle2, Shield } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="py-24 sm:py-32 relative bg-[#07090e] overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-80 bg-gradient-to-r from-indigo-600/20 via-purple-600/25 to-cyan-500/20 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl sm:rounded-[36px] bg-gradient-to-b from-[#0e162c] via-[#0b1122] to-[#070c18] border border-white/10 p-8 sm:p-14 lg:p-16 text-center shadow-2xl shadow-indigo-950/60 overflow-hidden">
          
          {/* Subtle decorative grid */}
          <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

          {/* Badge */}
          <div className="relative z-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Start Preparing Today
          </div>

          {/* Main required headline */}
          <h2 className="relative z-10 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Ready to become{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400">
              placement ready?
            </span>
          </h2>

          <p className="relative z-10 mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Join thousands of engineering students who are practicing with AI, closing skill gaps, and walking into campus recruitment drives with total confidence.
          </p>

          {/* Action buttons */}
          <div className="relative z-10 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#dashboard-preview"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </a>

            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-slate-300 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all duration-200"
            >
              <span>Explore Features</span>
            </a>
          </div>

          {/* Feature checklist */}
          <div className="relative z-10 mt-10 pt-8 border-t border-white/[0.08] flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs sm:text-sm text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Instant AI Diagnostic</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span>Free Campus Starter Plan</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
