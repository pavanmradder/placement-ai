import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import type { RoadmapWeek, RoadmapTask } from "@/lib/roadmap/generator";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value: unknown): boolean {
  return typeof value === "string" && UUID_REGEX.test(value.trim());
}

/**
 * GET /api/roadmap/[id]
 * Retrieves a specific placement roadmap owned strictly by the authenticated student.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!isValidUuid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid roadmap ID format. Must be a valid UUID." },
        { status: 400 }
      );
    }

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

    const { data: roadmap, error: queryError } = await supabase
      .from("placement_roadmaps")
      .select("*")
      .eq("id", id.trim())
      .eq("user_id", user.id)
      .maybeSingle();

    if (queryError) {
      console.error("[Roadmap GET by ID] Query error:", queryError.message);
      return NextResponse.json(
        { success: false, error: "Failed to retrieve roadmap." },
        { status: 500 }
      );
    }

    if (!roadmap) {
      return NextResponse.json(
        { success: false, error: "Roadmap not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      roadmap,
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
 * PATCH /api/roadmap/[id]
 * Updates task completion or status of a placement roadmap.
 * Strictly verifies student ownership.
 *
 * Supported body payloads:
 * 1. Single task toggle:
 *    { taskId: "week1-task1", completed: true }
 * 2. Full weeks update:
 *    { weeks: [...] }
 * 3. Status update:
 *    { status: "active" | "completed" | "archived" }
 *
 * Automatically recalculates overall_progress = (completed tasks / total tasks) * 100.
 * Automatically marks status as 'completed' when all tasks are finished.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!isValidUuid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid roadmap ID format. Must be a valid UUID." },
        { status: 400 }
      );
    }

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

    // 1. Fetch current roadmap record to verify ownership and read current structure
    const { data: existingRoadmap, error: fetchError } = await supabase
      .from("placement_roadmaps")
      .select("*")
      .eq("id", id.trim())
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("[Roadmap PATCH] Fetch error:", fetchError.message);
      return NextResponse.json(
        { success: false, error: "Failed to verify existing roadmap." },
        { status: 500 }
      );
    }

    if (!existingRoadmap) {
      return NextResponse.json(
        { success: false, error: "Roadmap not found or access denied." },
        { status: 404 }
      );
    }

    // 2. Parse update request body
    const body = await request.json().catch(() => ({}));
    const { taskId, completed, weeks: rawWeeks, status: requestedStatus } = body;

    let weeks: RoadmapWeek[] = [];
    if (Array.isArray(rawWeeks)) {
      weeks = rawWeeks as RoadmapWeek[];
    } else if (Array.isArray(existingRoadmap.roadmap_data)) {
      weeks = JSON.parse(JSON.stringify(existingRoadmap.roadmap_data)) as RoadmapWeek[];
    } else {
      weeks = [];
    }

    // 3. Handle single task update if taskId is provided
    if (typeof taskId === "string" && taskId.trim().length > 0) {
      const targetTaskId = taskId.trim();
      const isCompleted = typeof completed === "boolean" ? completed : Boolean(completed);

      let taskFound = false;
      for (const week of weeks) {
        if (Array.isArray(week.tasks)) {
          for (const task of week.tasks) {
            if (task.id === targetTaskId) {
              task.completed = isCompleted;
              taskFound = true;
              break;
            }
          }
        }
        if (taskFound) break;
      }

      if (!taskFound) {
        return NextResponse.json(
          { success: false, error: `Task "${targetTaskId}" not found in roadmap.` },
          { status: 400 }
        );
      }
    }

    // 4. Recalculate overall progress across all tasks
    let totalTasks = 0;
    let completedTasks = 0;

    for (const week of weeks) {
      if (Array.isArray(week.tasks)) {
        for (const task of week.tasks) {
          totalTasks++;
          if (task.completed) {
            completedTasks++;
          }
        }
      }
    }

    const overallProgress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 5. Determine updated status
    let finalStatus: "active" | "completed" | "archived" = "active";
    if (requestedStatus === "archived") {
      finalStatus = "archived";
    } else if (overallProgress === 100 && totalTasks > 0) {
      finalStatus = "completed";
    } else if (requestedStatus === "completed") {
      finalStatus = "completed";
    } else {
      finalStatus = "active";
    }

    // 6. Update database record with strict user_id check
    const { data: updatedRoadmap, error: updateError } = await supabase
      .from("placement_roadmaps")
      .update({
        roadmap_data: weeks as unknown as Json,
        overall_progress: overallProgress,
        status: finalStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id.trim())
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (updateError || !updatedRoadmap) {
      console.error("[Roadmap PATCH] Update error:", updateError?.message);
      return NextResponse.json(
        { success: false, error: "Failed to update roadmap." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      roadmap: updatedRoadmap,
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
 * DELETE /api/roadmap/[id]
 * Deletes a roadmap owned strictly by the authenticated student.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!isValidUuid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid roadmap ID format. Must be a valid UUID." },
        { status: 400 }
      );
    }

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

    // Delete with strict ownership verification
    const { error: deleteError, count } = await supabase
      .from("placement_roadmaps")
      .delete({ count: "exact" })
      .eq("id", id.trim())
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("[Roadmap DELETE] Delete error:", deleteError.message);
      return NextResponse.json(
        { success: false, error: "Failed to delete roadmap." },
        { status: 500 }
      );
    }

    if (count === 0) {
      return NextResponse.json(
        { success: false, error: "Roadmap not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Placement roadmap deleted successfully.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
