import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  gatherStudentRoadmapContext,
  generatePlacementRoadmap,
} from "@/lib/roadmap/generator";
import type { Json } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

/**
 * POST /api/roadmap/generate
 * Generates a personalized placement roadmap for the authenticated student
 * using their profile, verified skills, skill gap analysis, DSA progress,
 * and resume analysis.
 *
 * Persists the result in public.placement_roadmaps and returns the record.
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
        { success: false, error: "Unauthorized. Please log in to generate a roadmap." },
        { status: 401 }
      );
    }

    // 2. Validate student domain or admin authorization
    const userEmail = user.email?.trim().toLowerCase() || "";
    const isStudent = userEmail.endsWith("@mite.ac.in");
    const isAdmin = userEmail === "pavanmradder@gmail.com";

    if (!isStudent && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Access restricted to authorized students (@mite.ac.in)." },
        { status: 403 }
      );
    }

    // 3. Parse optional targetRole from request body if supplied
    const body = await request.json().catch(() => ({}));
    let requestedTargetRole: string | undefined = undefined;
    if (typeof body.targetRole === "string" && body.targetRole.trim().length >= 2) {
      requestedTargetRole = body.targetRole.trim().slice(0, 100);
    }

    // 4. Gather comprehensive student context
    const studentContext = await gatherStudentRoadmapContext(
      supabase,
      user.id,
      requestedTargetRole
    );

    const finalTargetRole = studentContext.targetRole;

    // 5. Generate roadmap via Groq AI
    const generatedRoadmap = await generatePlacementRoadmap({
      targetRole: finalTargetRole,
      studentContext,
      durationWeeks: 4,
    });

    // 6. Persist roadmap into public.placement_roadmaps using student's session (RLS enforced)
    const { data: savedRecord, error: insertError } = await supabase
      .from("placement_roadmaps")
      .insert({
        user_id: user.id,
        target_role: finalTargetRole,
        title: generatedRoadmap.title,
        description: generatedRoadmap.description,
        duration_weeks: generatedRoadmap.duration_weeks,
        roadmap_data: generatedRoadmap.weeks as unknown as Json,
        overall_progress: 0,
        status: "active",
      })
      .select("*")
      .single();

    if (insertError || !savedRecord) {
      console.error("[Roadmap Generate POST] Database insert failed:", insertError?.message);
      return NextResponse.json(
        { success: false, error: "Failed to save generated roadmap." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        roadmap: savedRecord,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : "Internal error";

    let userFacingError = "Failed to generate placement roadmap. Please try again.";
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
