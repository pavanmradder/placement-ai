import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  evaluateAnswer,
  generateAdaptiveNextQuestion,
  generateOverallFeedback,
} from "@/lib/interview/evaluator";
import type { InterviewQuestion } from "@/lib/interview/generator";
import type { Json } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

/**
 * POST /api/interview/answer
 * Evaluates candidate's answer to the current question, updates interview state,
 * adaptively generates the next question (or completes the interview), and persists
 * progress into public.mock_interviews.
 * 
 * SECURITY RULES:
 * - Authenticated students (@mite.ac.in) and admin (pavanmradder@gmail.com) only.
 * - Strict user isolation: user can only answer their own active interview.
 * - expectedKeyPoints are NEVER returned to the client.
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
        { success: false, error: "Unauthorized. Please log in to submit your answer." },
        { status: 401 }
      );
    }

    const userEmail = user.email?.trim().toLowerCase() || "";
    const isStudent = userEmail.endsWith("@mite.ac.in");
    const isAdmin = userEmail === "pavanmradder@gmail.com";

    if (!isStudent && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Only authorized students (@mite.ac.in) can participate in mock interviews." },
        { status: 403 }
      );
    }

    // 2. Parse and validate request parameters
    const body = await request.json().catch(() => ({}));
    const { interviewId, answer } = body;

    if (!interviewId || typeof interviewId !== "string" || interviewId.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid 'interviewId'." },
        { status: 400 }
      );
    }

    if (typeof answer !== "string" || answer.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid answer (minimum 2 characters)." },
        { status: 400 }
      );
    }

    const trimmedAnswer = answer.trim().slice(0, 5000);

    // 3. Fetch interview session from database
    const { data: interview, error: fetchError } = await supabase
      .from("mock_interviews")
      .select("*")
      .eq("id", interviewId.trim())
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError || !interview) {
      return NextResponse.json(
        { success: false, error: "Interview session not found or access denied." },
        { status: 404 }
      );
    }

    // 4. Validate interview status
    if (interview.status === "completed") {
      return NextResponse.json(
        { success: false, error: "This interview session has already been completed." },
        { status: 400 }
      );
    }

    if (interview.status === "abandoned") {
      return NextResponse.json(
        { success: false, error: "This interview session has been marked as abandoned." },
        { status: 400 }
      );
    }

    // 5. Parse and validate questions array
    const rawQuestions = interview.questions;
    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Interview session contains no questions." },
        { status: 500 }
      );
    }

    const questions = rawQuestions as unknown as InterviewQuestion[];
    const currentIndex = interview.current_question_index ?? 0;

    if (currentIndex >= questions.length) {
      return NextResponse.json(
        { success: false, error: "All questions in this interview have already been answered." },
        { status: 400 }
      );
    }

    const currentQuestion = questions[currentIndex];

    // 6. Evaluate candidate's answer via Groq
    const evaluation = await evaluateAnswer({
      question: currentQuestion.question,
      category: currentQuestion.category,
      expectedKeyPoints: currentQuestion.expectedKeyPoints || [],
      studentAnswer: trimmedAnswer,
      targetRole: interview.target_role || "Software Developer",
      difficulty: interview.difficulty || "Medium",
    });

    // Update current question in session memory
    questions[currentIndex] = {
      ...currentQuestion,
      studentAnswer: trimmedAnswer,
      score: evaluation.score,
      feedback: evaluation.feedback,
    };

    const isFinalQuestion = currentIndex + 1 >= questions.length;

    // 7A. Final Question Flow: Complete interview session
    if (isFinalQuestion) {
      const totalScore = questions.reduce(
        (acc, q) => acc + (typeof q.score === "number" ? q.score : 0),
        0
      );
      const overallScore = Math.round((totalScore / questions.length) * 10) / 10;

      // Generate overall synthesis feedback
      let overallFeedback = "";
      try {
        overallFeedback = await generateOverallFeedback({
          targetRole: interview.target_role || "Software Developer",
          difficulty: interview.difficulty || "Medium",
          interviewType: interview.interview_type || "Mixed",
          questions,
        });
      } catch (fbErr) {
        console.warn("[Interview Answer] Overall feedback generation fallback:", fbErr);
        overallFeedback = `Interview round completed. Overall average score: ${overallScore}/10 across ${questions.length} questions.`;
      }

      // Persist completed state to database
      const { error: updateError } = await supabase
        .from("mock_interviews")
        .update({
          status: "completed",
          score: overallScore,
          feedback: overallFeedback,
          current_question_index: currentIndex + 1,
          questions: questions as unknown as Json,
        })
        .eq("id", interview.id);

      if (updateError) {
        console.error("[Interview Answer] Failed to update completed interview:", updateError.message);
        return NextResponse.json(
          { success: false, error: "Failed to persist interview results." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        completed: true,
        interviewId: interview.id,
        currentQuestionIndex: currentIndex,
        totalQuestions: questions.length,
        evaluation: {
          score: evaluation.score,
          feedback: evaluation.feedback,
          strengths: evaluation.strengths,
          improvements: evaluation.improvements,
        },
        overallScore,
        overallFeedback,
      });
    }

    // 7B. Intermediate Question Flow: Generate adaptive next question
    const nextIndex = currentIndex + 1;

    try {
      const adaptiveQuestion = await generateAdaptiveNextQuestion({
        targetRole: interview.target_role || "Software Developer",
        interviewType: interview.interview_type || "Mixed",
        difficulty: interview.difficulty || "Medium",
        nextQuestionNumber: nextIndex + 1,
        totalQuestions: questions.length,
        previousQuestions: questions.slice(0, nextIndex).map((q) => ({
          question: q.question,
          category: q.category,
          studentAnswer: q.studentAnswer,
          score: q.score,
          feedback: q.feedback,
        })),
      });

      // Adaptively replace the pre-generated question
      questions[nextIndex] = adaptiveQuestion;
    } catch (adaptErr) {
      // Gracefully fallback to the pre-generated question in questions[nextIndex]
      console.warn("[Interview Answer] Adaptive question generation fallback:", adaptErr);
    }

    // Persist progress to database
    const { error: updateError } = await supabase
      .from("mock_interviews")
      .update({
        current_question_index: nextIndex,
        questions: questions as unknown as Json,
      })
      .eq("id", interview.id);

    if (updateError) {
      console.error("[Interview Answer] Failed to update interview progression:", updateError.message);
      return NextResponse.json(
        { success: false, error: "Failed to update interview progression in database." },
        { status: 500 }
      );
    }

    const nextQ = questions[nextIndex];

    // Return sanitized response (NEVER expose expectedKeyPoints)
    return NextResponse.json({
      success: true,
      completed: false,
      interviewId: interview.id,
      currentQuestionIndex: nextIndex,
      totalQuestions: questions.length,
      evaluation: {
        score: evaluation.score,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
      },
      nextQuestion: {
        id: nextQ.id,
        question: nextQ.question,
        category: nextQ.category,
      },
    });
  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : "Internal error";

    let userFacingError = "Failed to evaluate answer. Please try again.";
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
