import {
  UserCircle2,
  ScanEye,
  Bot,
  LineChart,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      stepTitle: "Step 1: Build your profile",
      shortTitle: "Build your profile",
      description:
        "Upload your resume, connect your GitHub/LeetCode handles, and pick your target dream companies and target roles.",
      icon: UserCircle2,
      accentGradient: "bg-gradient-to-tr from-blue-500 to-indigo-500",
      detail: "Takes under 2 minutes with auto-import from PDF.",
    },
    {
      number: "02",
      stepTitle: "Step 2: Analyze your skills",
      shortTitle: "Analyze your skills",
      description:
        "Our AI conducts a comprehensive diagnostic across DSA, System Design, Core CS, and Resume ATS compatibility.",
      icon: ScanEye,
      accentGradient: "bg-gradient-to-tr from-indigo-500 to-purple-500",
      detail: "Instant benchmark score against Tier-1 standards.",
    },
    {
      number: "03",
      stepTitle: "Step 3: Practice with AI",
      shortTitle: "Practice with AI",
      description:
        "Sharpen your skills through adaptive coding drills, system design walkthroughs, and realistic AI mock interview sessions.",
      icon: Bot,
      accentGradient: "bg-gradient-to-tr from-purple-500 to-cyan-500",
      detail: "Real-time voice, code execution, and STAR critique.",
    },
    {
      number: "04",
      stepTitle: "Step 4: Track your progress",
      shortTitle: "Track your progress",
      description:
        "Watch your Placement Readiness score climb past 80% and manage recruitment deadlines from application to final offer.",
      icon: LineChart,
      accentGradient: "bg-gradient-to-tr from-cyan-500 to-emerald-500",
      detail: "Daily actionable milestones tailored to drive dates.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 sm:py-32 relative bg-[#090e1b] overflow-hidden">
      {/* Glow decorations */}
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-96 h-96 bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4">
            Proven Placement Blueprint
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            How It Works
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A structured, 4-step journey designed to take you from uncertain student to confident campus recruit.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="mt-16 sm:mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative">
          
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#0c1222]/80 border border-white/[0.08] hover:border-cyan-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-950/40 hover:-translate-y-1"
              >
                {/* Step number badge & icon */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl sm:text-4xl font-black text-slate-700 group-hover:text-cyan-400/80 transition-colors font-mono">
                      {step.number}
                    </span>
                    <div
                      className={`w-12 h-12 rounded-2xl ${step.accentGradient} p-[1px] shadow-lg shadow-black/30`}
                    >
                      <div className="w-full h-full bg-[#0a0f1d] rounded-[15px] flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Step Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-cyan-200 transition-colors">
                    {step.stepTitle}
                  </h3>

                  {/* Description */}
                  <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Sub-detail pill */}
                <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs text-cyan-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{step.detail}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Helper Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-[#0e162c] to-cyan-950/30 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse hidden sm:block" />
            <p className="text-sm text-slate-300">
              Average student improves their placement readiness by <strong className="text-white font-semibold">28% within the first 14 days</strong>.
            </p>
          </div>
          <a
            href="#dashboard-preview"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200"
          >
            Preview the assessment <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </section>
  );
}
