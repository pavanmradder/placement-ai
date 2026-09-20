import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromPdfBuffer } from "@/lib/resume/pdf-extractor";
import { analyzeResumeWithGroq } from "@/lib/resume/analyzer";
import type { Json } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * POST /api/resume/analyze
 * Server-side AI Resume Analysis Pipeline
 * 
 * Pipeline:
 * 1. Authenticate user session.
 * 2. Verify resume record belongs to auth.uid().
 * 3. Download private PDF securely from Supabase Storage.
 * 4. Extract and normalize text (rejecting empty/scanned PDFs).
 * 5. Send to Groq for structured ATS analysis.
 * 6. Persist ats_score and analysis JSON to public.resumes.
 * 7. Return analysis to caller.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate session
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in to analyze your resume." },
        { status: 401 }
      );
    }

    // Enforce student (@mite.ac.in) or authorized admin
    const userEmail = user.email?.trim().toLowerCase() || "";
    const isStudent = userEmail.endsWith("@mite.ac.in");
    const isAdmin = userEmail === "pavanmradder@gmail.com";

    if (!isStudent && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Only authorized students (@mite.ac.in) can analyze resumes." },
        { status: 403 }
      );
    }

    // 2. Parse request payload
    const body = await request.json().catch(() => ({}));
    const { resumeId } = body;

    if (!resumeId || typeof resumeId !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing required parameter: resumeId" },
        { status: 400 }
      );
    }

    // 3. Query resume record belonging strictly to auth.uid()
    const { data: resume, error: fetchError } = await supabase
      .from("resumes")
      .select("id, user_id, file_name, storage_path, file_path, file_size, mime_type")
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError || !resume) {
      return NextResponse.json(
        { success: false, error: "Resume not found or you do not have permission to access it." },
        { status: 404 }
      );
    }

    // 4. File validation
    const targetStoragePath = resume.storage_path || resume.file_path;
    if (!targetStoragePath) {
      return NextResponse.json(
        { success: false, error: "Resume file location not found in storage record." },
        { status: 404 }
      );
    }

    if (resume.mime_type && resume.mime_type !== "application/pdf") {
      return NextResponse.json(
        { success: false, error: "Invalid document type. Only PDF resumes are supported." },
        { status: 400 }
      );
    }

    if (resume.file_size && resume.file_size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "Resume file size exceeds the 5 MB limit." },
        { status: 400 }
      );
    }

    // 5. Download private PDF securely on server
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("resumes")
      .download(targetStoragePath);

    if (downloadError || !fileBlob) {
      return NextResponse.json(
        { success: false, error: "Failed to retrieve resume from private storage." },
        { status: 500 }
      );
    }

    // 6. Extract and validate text from PDF
    const arrayBuffer = await fileBlob.arrayBuffer();
    const extractionResult = await extractTextFromPdfBuffer(arrayBuffer);

    // 7. Analyze with Groq
    const analysis = await analyzeResumeWithGroq(extractionResult.text);

    // 8. Persist ATS score and analysis JSON to public.resumes
    const { error: updateError } = await supabase
      .from("resumes")
      .update({
        ats_score: analysis.atsScore,
        analysis: analysis as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resume.id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error(
        "[Resume Analyze] Database update failed:",
        updateError.message
      );
    }

    // 9. Return structured analysis (no PDF data or private paths exposed)
    return NextResponse.json(
      {
        success: true,
        resumeId: resume.id,
        fileName: resume.file_name,
        atsScore: analysis.atsScore,
        analysis,
        metadata: {
          pageCount: extractionResult.pageCount,
          charCount: extractionResult.charCount,
          isTruncated: extractionResult.isTruncated,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : "Internal error";

    // Provide clean, safe user-facing errors
    let userFacingError = "An unexpected error occurred during resume analysis.";
    let statusCode = 500;

    if (rawMessage.includes("No readable text found")) {
      userFacingError = rawMessage;
      statusCode = 422;
    } else if (rawMessage.includes("Failed to parse PDF document")) {
      userFacingError = "The uploaded file could not be read as a valid PDF.";
      statusCode = 400;
    } else if (rawMessage.includes("GROQ_API_KEY")) {
      userFacingError = "AI service configuration error. Please contact the administrator.";
      statusCode = 503;
    }

    return NextResponse.json(
      {
        success: false,
        error: userFacingError,
      },
      { status: statusCode }
    );
  }
}
