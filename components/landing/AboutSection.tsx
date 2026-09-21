import {
  Sparkles,
  ShieldCheck,
  Building2,
  Briefcase,
  Bot,
  Compass,
  Lock,
} from "lucide-react";

export default function AboutSection() {
  const capabilities = [
    { label: "Placement Modules", value: "6", sublabel: "Integrated Tools", icon: Briefcase },
    { label: "AI Guidance", value: "Groq", sublabel: "Fast LLM Analysis", icon: Bot },
    { label: "Tailored Roadmaps", value: "Custom", sublabel: "Role-Specific Plans", icon: Compass },
    { label: "Data Security", value: "RLS", sublabel: "Row-Level Security", icon: ShieldCheck },
  ];

  return (
    <section id="about" className="py-24 sm:py-32 relative bg-[#070a13] border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Our Mission
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Democratizing Placement Preparation for Every Student
            </h2>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Campus placements can be overwhelming and unequal. While some students have direct senior guidance and company insider tips, many engineering students are left wondering what technical recruiters look for.
            </p>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              <strong>PlacementAI</strong> bridges this gap by providing an intelligent, personalized preparation ecosystem. From ATS-scoring your resume to conducting adaptive mock technical rounds, we provide the tools you need to build competence and confidence for campus recruitment.
            </p>

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Equal Opportunity</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Equal access to curated problem sets, interview drills, and diagnostic feedback.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <Building2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Role-Focused</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Targeted preparation for technical and HR campus recruitment rounds.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Capabilities Grid */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4 sm:gap-6">
            {capabilities.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl sm:rounded-3xl bg-[#0c1222]/80 border border-white/10 hover:border-indigo-500/30 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-cyan-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="mt-6">
                    <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {item.value}
                    </div>
                    <div className="text-sm font-semibold text-slate-200 mt-1">
                      {item.label}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {item.sublabel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
