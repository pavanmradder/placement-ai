import {
  FileCheck2,
  Bot,
  Target,
  Code2,
  Briefcase,
  Compass,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function Features() {
  const features = [
    {
      id: "resume-analyzer",
      title: "AI Resume Analyzer",
      description:
        "Score your resume against ATS algorithms used by top tech companies. Get instant feedback on keywords, impact metrics, and project descriptions.",
      icon: FileCheck2,
      accentGradient: "bg-gradient-to-tr from-blue-500 to-cyan-400",
      badge: "98% ATS Accuracy",
      tag: "ATS Optimization",
      perks: [
        "Keyword gap identification",
        "Action verb suggestions",
        "One-click bullet point rewrites",
      ],
    },
    {
      id: "mock-interview",
      title: "AI Mock Interview",
      description:
        "Simulate live technical and HR interviews with an AI interviewer. Receive thorough feedback on conceptual clarity, problem-solving, and communication.",
      icon: Bot,
      accentGradient: "bg-gradient-to-tr from-indigo-500 to-purple-400",
      badge: "Real-time Voice & Text",
      tag: "Interactive Practice",
      perks: [
        "Coding & System Design rounds",
        "Behavioral STAR format analysis",
        "Company-specific question sets",
      ],
    },
    {
      id: "skill-gap",
      title: "Skill Gap Analysis",
      description:
        "Benchmark your profile against target roles at Google, Microsoft, Amazon, and top startups. Pinpoint exactly what concepts you need to learn next.",
      icon: Target,
      accentGradient: "bg-gradient-to-tr from-rose-500 to-amber-400",
      badge: "Targeted Benchmarks",
      tag: "Role Matching",
      perks: [
        "Company tech stack mapping",
        "Missing core CS concept alerts",
        "Readiness percentage score",
      ],
    },
    {
      id: "dsa-tracker",
      title: "DSA Progress Tracker",
      description:
        "Organize your problem-solving journey across curated sheets (Striver, NeetCode, Blind 75). Track topic mastery, patterns, and daily streaks.",
      icon: Code2,
      accentGradient: "bg-gradient-to-tr from-emerald-500 to-teal-400",
      badge: "350+ Curated Problems",
      tag: "Coding Mastery",
      perks: [
        "Topic-level progress charts",
        "Spaced repetition reminders",
        "Pattern-based categorization",
      ],
    },
    {
      id: "job-tracker",
      title: "Job Application Tracker",
      description:
        "Manage all your on-campus and off-campus recruitment drives in a clean Kanban board. Track status from application to offer letter seamlessly.",
      icon: Briefcase,
      accentGradient: "bg-gradient-to-tr from-amber-500 to-orange-400",
      badge: "Kanban Pipeline",
      tag: "Application Management",
      perks: [
        "OA countdown & calendar sync",
        "Drive rounds & interview notes",
        "Offer comparison dashboard",
      ],
    },
    {
      id: "learning-roadmap",
      title: "Personalized Learning Roadmap",
      description:
        "Receive a dynamic day-by-day study schedule adapted to your branch, graduation year, and available preparation hours before placement drives.",
      icon: Compass,
      accentGradient: "bg-gradient-to-tr from-violet-500 to-fuchsia-400",
      badge: "Custom Timeline",
      tag: "Guided Prep",
      perks: [
        "Core CS subjects (OS, DBMS, CN)",
        "High-impact portfolio projects",
        "Weekly revision milestones",
      ],
    },
  ];

  return (
    <section id="features" className="py-24 sm:py-32 relative bg-[#070a13]">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-[600px] bg-indigo-900/10 blur-[150px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Comprehensive Placement Suite
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Engineered to Turn Students into{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              Top Tier Candidates
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Eliminate the confusion and scatter. Six specialized modules working together to guarantee you excel in every round of campus placement.
          </p>
        </div>

        {/* 6 Feature Cards Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="group relative p-7 rounded-2xl sm:rounded-3xl bg-[#0c1222]/70 border border-white/[0.08] hover:border-indigo-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-950/40 hover:-translate-y-1 flex flex-col justify-between"
              >
                {/* Hover gradient tint */}
                <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div>
                  {/* Card Header: Icon & Badge */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl ${feature.accentGradient} p-[1px] shadow-lg shadow-black/40`}
                    >
                      <div className="w-full h-full bg-[#0a0f1d] rounded-[15px] flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 bg-white/[0.04] border border-white/10 px-2.5 py-1 rounded-full">
                      {feature.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="mt-6">
                    <span className="text-xs font-semibold tracking-wider uppercase text-cyan-400">
                      {feature.tag}
                    </span>
                    <h3 className="text-xl font-bold text-white mt-1 group-hover:text-cyan-200 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>

                {/* Feature bullet highlights */}
                <div className="mt-6 pt-5 border-t border-white/[0.06] space-y-2">
                  {feature.perks.map((perk, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
