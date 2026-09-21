import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validateCreateJobApplication,
  VALID_JOB_APPLICATION_STATUSES,
  JobApplicationStatus,
} from "@/lib/job-applications/validation";

export const dynamic = "force-dynamic";

/**
 * GET /api/job-applications
 * Returns all job applications belonging to the authenticated student,
 * ordered by application_date descending, then created_at descending.
 * 
 * SECURITY RULES:
 * - Authenticated students (@mite.ac.in) and admin only.
 * - Enforces strict tenant isolation (user_id = auth.uid()).
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
        { success: false, error: "Unauthorized. Please log in to view job applications." },
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

    // Optional status filter from search params
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    let query = supabase
      .from("job_applications")
      .select("*")
      .eq("user_id", user.id)
      .order("application_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (
      statusParam &&
      VALID_JOB_APPLICATION_STATUSES.includes(statusParam as JobApplicationStatus)
    ) {
      query = query.eq("status", statusParam);
    }

    const { data: applications, error: queryError } = await query;

    if (queryError) {
      console.error("[Job Applications GET] Query failed:", queryError.message);
      return NextResponse.json(
        { success: false, error: "Failed to fetch job applications." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: applications?.length || 0,
      applications: applications || [],
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
 * POST /api/job-applications
 * Creates a new job application for the authenticated student.
 * 
 * SECURITY RULES:
 * - Authenticated students (@mite.ac.in) and admin only.
 * - Never allows client to provide or override user_id.
 * - Validates all fields against domain constraints.
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
        { success: false, error: "Unauthorized. Please log in to create job applications." },
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
    const body = await request.json().catch(() => null);
    const validation = validateCreateJobApplication(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Insert into database with strictly server-enforced user_id
    const { data: application, error: insertError } = await supabase
      .from("job_applications")
      .insert({
        user_id: user.id,
        company_name: validation.data.company_name,
        job_title: validation.data.job_title,
        application_date: validation.data.application_date,
        status: validation.data.status,
        job_url: validation.data.job_url,
        location: validation.data.location,
        package_ctc: validation.data.package_ctc,
        notes: validation.data.notes,
      })
      .select("*")
      .single();

    if (insertError || !application) {
      console.error("[Job Applications POST] Insert failed:", insertError?.message);
      return NextResponse.json(
        { success: false, error: "Failed to create job application." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        application,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
