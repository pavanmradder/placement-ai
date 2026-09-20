import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/dsa/problems
 * Fetches the global DSA problem catalog, with optional topic and difficulty filters.
 * 
 * SECURITY RULES:
 * - Authenticated @mite.ac.in students and admin only.
 * - Read-only operation.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in to view DSA problems." },
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

    // Optional query parameters
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic");
    const difficulty = searchParams.get("difficulty");

    let query = supabase
      .from("dsa_problems")
      .select("id, title, slug, topic, difficulty, platform, external_url, created_at")
      .order("topic", { ascending: true })
      .order("difficulty", { ascending: true })
      .order("title", { ascending: true });

    if (topic && topic.trim().length > 0) {
      query = query.eq("topic", topic.trim());
    }

    if (difficulty && difficulty.trim().length > 0) {
      query = query.eq("difficulty", difficulty.trim());
    }

    const { data: problems, error: queryError } = await query;

    if (queryError) {
      console.error("[DSA Problems GET] Query failed:", queryError.message);
      return NextResponse.json(
        { success: false, error: "Failed to fetch DSA problem catalog." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      total: problems?.length || 0,
      problems: problems || [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
