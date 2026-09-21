import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/roadmap
 * Retrieves the authenticated student's latest placement roadmap
 * from public.placement_roadmaps without making external AI calls.
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
        { success: false, error: "Access restricted to authorized students (@mite.ac.in)." },
        { status: 403 }
      );
    }

    // Fetch student's latest roadmap (RLS guarantees access isolation)
    const { data: latestRoadmap, error } = await supabase
      .from("placement_roadmaps")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[Roadmap GET] Database query failed:", error.message);
      return NextResponse.json(
        { success: false, error: "Failed to fetch placement roadmap." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      roadmap: latestRoadmap || null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
