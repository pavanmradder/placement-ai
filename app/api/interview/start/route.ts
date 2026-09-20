import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateInterviewQuestions,
  InterviewType,
  InterviewDifficulty,
} from "@/lib/interview/generator";
import type { Json } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

const VALID_INTERVIEW_TYPES: InterviewType[] = [
  "Technical",
  "HR / Behavioral",
  "Mixed",
];

const VALID_DIFFICULTIES: InterviewDifficulty[] = [
  "Easy",
  "Medium",
  "Hard",
];

/**
 * POST /api/interview/start
 * Starts a new AI Mock Interview session.
 * 
 * Pipeline:
 * 1. Authenticate user session.
 * 2. Validate targetRole, interviewType, and difficulty.
 * 3. Fetch candidate profile and verified skills for personalization.
 * 4. Generate 5 structured interview questions via Groq (openai/gpt-oss-120b).
 * 5. Persist the interview session into public.mock_interviews with status = 'in_progress'.
 * 6. Return sanitized interview session with the first question.
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
        { success: false, error: "Unauthorized. Please log in to start an interview session." },
        { status: 401 }
      );
    }

    const userEmail = user.email?.trim().toLowerCase() || "";
    const isStudent = userEmail.endsWith("@mite.ac.in");
    const isAdmin = userEmail === "pavanmradder@gmail.com";

    if (!isStudent && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Only authorized students (@mite.ac.in) can access mock interviews." },
        { status: 403 }
      );
    }

    // 2. Parse and validate request parameters
    const body = await request.json().catch(() => ({}));
    let { targetRole, interviewType, difficulty } = body;

    // Fetch student profile for fallback and question personalization
    const [{ data: profile }, { data: skills }] = await Promise.all([
      supabase
        .from("profiles")
        .select("target_role, college, graduation_year")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("skills")
        .select("skill_name")
        .eq("user_id", user.id)
        .limit(10),
    ]);

    // Validate or fallback targetRole
    if (typeof targetRole !== "string" || targetRole.trim().length < 2) {
      targetRole = profile?.target_role || "Software Developer";
    } else {
      targetRole = targetRole.trim().slice(0, 100);
    }

    // Validate or fallback interviewType
    if (
      !interviewType ||
      !VALID_INTERVIEW_TYPES.includes(interviewType as InterviewType)
    ) {
      interviewType = "Mixed";
    }

    // Validate or fallback difficulty
    if (
      !difficulty ||
      !VALID_DIFFICULTIES.includes(difficulty as InterviewDifficulty)
    ) {
      difficulty = "Medium";
    }

    // 3. Generate tailored interview questions via Groq
    const candidateSkills = skills?.map((s) => s.skill_name) || [];

    const questions = await generateInterviewQuestions({
      targetRole,
      interviewType: interviewType as InterviewType,
      difficulty: difficulty as InterviewDifficulty,
      candidateContext: {
        college: profile?.college || undefined,
        graduationYear: profile?.graduation_year || undefined,
        skills: candidateSkills,
      },
    });

    // 4. Persist interview session into public.mock_interviews
    const { data: session, error: insertError } = await supabase
      .from("mock_interviews")
      .insert({
        user_id: user.id,
        target_role: targetRole,
        interview_type: interviewType,
        difficulty: difficulty,
        status: "in_progress",
        questions: questions as unknown as Json,
        current_question_index: 0,
        score: null,
        feedback: null,
      })
      .select("id, target_role, interview_type, difficulty, status, current_question_index, created_at")
      .single();

    if (insertError || !session) {
      console.error("[Mock Interview Start] Database insert failed:", insertError?.message);
      return NextResponse.json(
        { success: false, error: "Failed to initialize interview session in database." },
        { status: 500 }
      );
    }

    // 5. Return sanitized response (do not expose expectedKeyPoints)
    const firstQuestion = questions[0];

    return NextResponse.json(
      {
        success: true,
        interviewId: session.id,
        targetRole: session.target_role,
        interviewType: session.interview_type,
        difficulty: session.difficulty,
        status: session.status,
        totalQuestions: questions.length,
        currentQuestionIndex: 0,
        currentQuestion: {
          id: firstQuestion.id,
          question: firstQuestion.question,
          category: firstQuestion.category,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : "Internal error";

    let userFacingError = "Failed to start interview session. Please try again.";
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
