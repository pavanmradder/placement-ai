import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isValidUuid,
  validateUpdateJobApplication,
} from "@/lib/job-applications/validation";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/job-applications/[id]
 * Fetches a single job application owned strictly by the authenticated student.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!isValidUuid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid application ID format. Must be a valid UUID." },
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

    const { data: application, error: queryError } = await supabase
      .from("job_applications")
      .select("*")
      .eq("id", id.trim())
      .eq("user_id", user.id)
      .maybeSingle();

    if (queryError) {
      console.error("[Job Application GET by ID] Query error:", queryError.message);
      return NextResponse.json(
        { success: false, error: "Failed to retrieve job application." },
        { status: 500 }
      );
    }

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Job application not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      application,
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
 * PATCH /api/job-applications/[id]
 * Updates fields of a job application owned strictly by the authenticated student.
 * Never allows client to modify user_id or id.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!isValidUuid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid application ID format. Must be a valid UUID." },
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

    // Parse and validate update fields
    const body = await request.json().catch(() => null);
    const validation = validateUpdateJobApplication(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Update with strict user_id scoping to guarantee tenant isolation
    const { data: updated, error: updateError } = await supabase
      .from("job_applications")
      .update({
        ...validation.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id.trim())
      .eq("user_id", user.id)
      .select("*")
      .maybeSingle();

    if (updateError) {
      console.error("[Job Application PATCH] Update failed:", updateError.message);
      return NextResponse.json(
        { success: false, error: "Failed to update job application." },
        { status: 500 }
      );
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Job application not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      application: updated,
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
 * DELETE /api/job-applications/[id]
 * Deletes a job application owned strictly by the authenticated student.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!isValidUuid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid application ID format. Must be a valid UUID." },
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

    // Delete with strict user_id scoping to guarantee tenant isolation
    const { data: deleted, error: deleteError } = await supabase
      .from("job_applications")
      .delete()
      .eq("id", id.trim())
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (deleteError) {
      console.error("[Job Application DELETE] Delete failed:", deleteError.message);
      return NextResponse.json(
        { success: false, error: "Failed to delete job application." },
        { status: 500 }
      );
    }

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Job application not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Job application deleted successfully.",
      id: deleted.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
