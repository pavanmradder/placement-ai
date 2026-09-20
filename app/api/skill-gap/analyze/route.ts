import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeSkillGap } from "@/lib/skill-gap/analyzer";
import type { Json } from "@/lib/supabase/database.types";
import type { ResumeAnalysisOutput } from "@/lib/resume/analyzer";

export const dynamic = "force-dynamic";

/**
 * GET /api/skill-gap/analyze
 * Fetches the student's latest persisted skill gap analysis from public.skill_gap_analyses
 * without making external AI API calls.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const userEmail = user.email?.trim().toLowerCase() || "";
    const isStudent = userEmail.endsWith("@mite.ac.in");
    const isAdmin = userEmail === "pavanmradder@gmail.com";

    if (!isStudent && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Access restricted to authorized students." },
        { status: 403 }
      );
    }

    const { data: latestAnalysis, error } = await supabase
      .from("skill_gap_analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[Skill Gap GET] Database query failed:", error.message);
      return NextResponse.json(
        { success: false, error: "Failed to fetch skill gap analysis." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: latestAnalysis || null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

/**
 * POST /api/skill-gap/analyze
 * Generates a new AI skill gap analysis using Groq, based on the student's
 * profile target role, verified skills, and latest resume analysis.
 * Persists the result in public.skill_gap_analyses.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user session
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in to run skill gap analysis." },
        { status: 401 }
      );
    }

    const userEmail = user.email?.trim().toLowerCase() || "";
    const isStudent = userEmail.endsWith("@mite.ac.in");
    const isAdmin = userEmail === "pavanmradder@gmail.com";

    if (!isStudent && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Access restricted to authorized students (@mite.ac.in)." },
        { status: 403 }
      );
    }

    // 2. Parse optional request parameters
    const body = await request.json().catch(() => ({}));
    let { targetRole } = body;

    // 3. Concurrently fetch profile, skills, and latest resume
    const [{ data: profile }, { data: skillsList }, { data: latestResumes }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("target_role, college, graduation_year")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("skills")
          .select("skill_name, skill_level")
          .eq("user_id", user.id),
        supabase
          .from("resumes")
          .select("ats_score, analysis, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

    // Resolve target role
    if (typeof targetRole !== "string" || targetRole.trim().length < 2) {
      targetRole = profile?.target_role || "Software Development Engineer (SDE)";
    } else {
      targetRole = targetRole.trim().slice(0, 100);
    }

    // Aggregate skills from skills table and resume analysis
    const verifiedSkills = skillsList?.map((s) => s.skill_name) || [];
    const latestResume = latestResumes?.[0];
    const resumeAnalysis = latestResume?.analysis as unknown as ResumeAnalysisOutput | null;
    const resumeSkills = resumeAnalysis?.skills?.technical || [];

    // Deduplicate skills (case-insensitive deduplication)
    const skillsMap = new Map<string, string>();
    for (const s of [...verifiedSkills, ...resumeSkills]) {
      const trimmed = s.trim();
      if (trimmed) {
        skillsMap.set(trimmed.toLowerCase(), trimmed);
      }
    }
    const currentSkills = Array.from(skillsMap.values());

    const resumeSummary = resumeAnalysis?.summary || undefined;

    // 4. Run Groq AI skill gap analysis
    const analysis = await analyzeSkillGap({
      targetRole,
      currentSkills,
      resumeContext: resumeSummary,
    });

    // 5. Persist into public.skill_gap_analyses
    const { data: savedRecord, error: insertError } = await supabase
      .from("skill_gap_analyses")
      .insert({
        user_id: user.id,
        target_role: analysis.targetRole,
        current_skills: analysis.currentSkills as unknown as Json,
        required_skills: analysis.requiredSkills as unknown as Json,
        missing_skills: analysis.missingSkills as unknown as Json,
        skill_match_percentage: analysis.skillMatchPercentage,
        recommendations: analysis.recommendations as unknown as Json,
      })
      .select("*")
      .single();

    if (insertError || !savedRecord) {
      console.error("[Skill Gap POST] Database insert failed:", insertError?.message);
      return NextResponse.json(
        { success: false, error: "Failed to persist skill gap analysis." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        analysis: savedRecord,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : "Internal error";

    let userFacingError = "Failed to complete skill gap analysis. Please try again.";
    let statusCode = 500;

    if (rawMessage.includes("GROQ_API_KEY")) {
      userFacingError = "AI service configuration error. Please contact administrator.";
      statusCode = 503;
    }

    return NextResponse.json(
      { success: false, error: userFacingError },
      { status: statusCode }
    );
  }
}
