import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["not_started", "in_progress", "solved"] as const;
type ProgressStatus = (typeof VALID_STATUSES)[number];

/**
 * GET /api/dsa/progress
 * Fetches the authenticated student's DSA problem progress records and aggregate stats.
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

    // Concurrently fetch user problem progress and summary stats
    const [{ data: progressList, error: progressError }, { data: dsaSummary, error: summaryError }] =
      await Promise.all([
        supabase
          .from("user_dsa_progress")
          .select("id, problem_id, status, solved_at, notes, updated_at")
          .eq("user_id", user.id),
        supabase
          .from("dsa_progress")
          .select("easy_solved, medium_solved, hard_solved, total_solved, updated_at")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

    if (progressError) {
      console.error("[DSA Progress GET] Failed to fetch progress:", progressError.message);
      return NextResponse.json(
        { success: false, error: "Failed to fetch student DSA progress." },
        { status: 500 }
      );
    }

    const stats = {
      easySolved: dsaSummary?.easy_solved ?? 0,
      mediumSolved: dsaSummary?.medium_solved ?? 0,
      hardSolved: dsaSummary?.hard_solved ?? 0,
      totalSolved: dsaSummary?.total_solved ?? 0,
      updatedAt: dsaSummary?.updated_at || null,
    };

    return NextResponse.json({
      success: true,
      stats,
      progress: progressList || [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dsa/progress
 * Updates or inserts a student's progress for a specific DSA problem,
 * and automatically recomputes/syncs the public.dsa_progress aggregate metrics.
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate payload
    const body = await request.json().catch(() => ({}));
    const { problemId, status, notes } = body;

    if (!problemId || typeof problemId !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid 'problemId'." },
        { status: 400 }
      );
    }

    if (!status || !VALID_STATUSES.includes(status as ProgressStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Verify problem exists
    const { data: problem, error: problemError } = await supabase
      .from("dsa_problems")
      .select("id, title, difficulty")
      .eq("id", problemId.trim())
      .maybeSingle();

    if (problemError || !problem) {
      return NextResponse.json(
        { success: false, error: "DSA problem not found." },
        { status: 404 }
      );
    }

    const solvedAt = status === "solved" ? new Date().toISOString() : null;
    const sanitizedNotes = typeof notes === "string" ? notes.slice(0, 2000) : null;

    // 1. Upsert into public.user_dsa_progress
    const { data: progressRecord, error: upsertError } = await supabase
      .from("user_dsa_progress")
      .upsert(
        {
          user_id: user.id,
          problem_id: problem.id,
          status,
          solved_at: solvedAt,
          notes: sanitizedNotes,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,problem_id",
        }
      )
      .select("id, user_id, problem_id, status, solved_at, notes, updated_at")
      .single();

    if (upsertError || !progressRecord) {
      console.error("[DSA Progress POST] Upsert failed:", upsertError?.message);
      return NextResponse.json(
        { success: false, error: "Failed to update problem progress." },
        { status: 500 }
      );
    }

    // 2. Recompute user's aggregate stats across all solved problems
    const { data: solvedItems, error: countError } = await supabase
      .from("user_dsa_progress")
      .select("problem_id, dsa_problems(difficulty)")
      .eq("user_id", user.id)
      .eq("status", "solved");

    let easyCount = 0;
    let mediumCount = 0;
    let hardCount = 0;

    if (!countError && Array.isArray(solvedItems)) {
      for (const item of solvedItems) {
        const diff = (item.dsa_problems as unknown as { difficulty: string })?.difficulty;
        if (diff === "Easy") easyCount++;
        else if (diff === "Medium") mediumCount++;
        else if (diff === "Hard") hardCount++;
      }
    }

    const totalCount = easyCount + mediumCount + hardCount;

    // 3. Upsert into public.dsa_progress summary table
    await supabase.from("dsa_progress").upsert(
      {
        user_id: user.id,
        easy_solved: easyCount,
        medium_solved: mediumCount,
        hard_solved: hardCount,
        total_solved: totalCount,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    return NextResponse.json({
      success: true,
      progress: progressRecord,
      stats: {
        easySolved: easyCount,
        mediumSolved: mediumCount,
        hardSolved: hardCount,
        totalSolved: totalCount,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
