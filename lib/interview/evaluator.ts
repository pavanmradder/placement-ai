/**
 * ==============================================================================
 * PlacementAI: AI Mock Interview Evaluator & Adaptive Progression Engine
 * ==============================================================================
 * Evaluates candidate responses to interview questions using Groq (openai/gpt-oss-120b),
 * generates constructive feedback, adaptively calibrates subsequent questions,
 * and synthesizes final interview reports.
 * 
 * SECURITY RULES:
 * - Server-side only: never execute in browser.
 * - Never log raw candidate answers or credentials.
 * - Never leak expectedKeyPoints to client-side API callers.
 * ==============================================================================
 */

import { getGroqClient, DEFAULT_GROQ_MODEL } from "@/lib/ai/groq";
import type { InterviewQuestion } from "@/lib/interview/generator";

// Server-side execution guard
if (typeof window !== "undefined") {
  throw new Error(
    "Security Violation: lib/interview/evaluator.ts cannot be executed in the browser environment."
  );
}

export interface EvaluateAnswerParams {
  question: string;
  category: string;
  expectedKeyPoints: string[];
  studentAnswer: string;
  targetRole: string;
  difficulty: string;
}

export interface AnswerEvaluation {
  score: number; // 0.0 to 10.0 scale
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface AdaptiveQuestionParams {
  targetRole: string;
  interviewType: string;
  difficulty: string;
  nextQuestionNumber: number;
  totalQuestions: number;
  previousQuestions: {
    question: string;
    category: string;
    studentAnswer?: string;
    score?: number;
    feedback?: string;
  }[];
}

export interface OverallFeedbackParams {
  targetRole: string;
  difficulty: string;
  interviewType: string;
  questions: InterviewQuestion[];
}

/**
 * Extracts and parses a JSON object from model output, stripping
 * open-weight reasoning tags (<think>...</think>) or markdown blocks (```json ... ```).
 */
export function extractJsonFromModelOutput(rawOutput: string): Record<string, unknown> {
  let cleaned = rawOutput.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  if (cleaned.includes("```json")) {
    cleaned = cleaned.replace(/```json\s*([\s\S]*?)\s*```/gi, "$1");
  } else if (cleaned.includes("```")) {
    cleaned = cleaned.replace(/```\s*([\s\S]*?)\s*```/gi, "$1");
  }

  cleaned = cleaned.trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Failed to find valid JSON structure in model response.");
  }

  const jsonSubstring = cleaned.substring(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonSubstring);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid JSON";
    throw new Error(`Failed to parse model JSON: ${msg}`);
  }
}

/**
 * Evaluates a candidate's answer against the question's expected key points,
 * target role, and difficulty level.
 */
export async function evaluateAnswer(
  params: EvaluateAnswerParams
): Promise<AnswerEvaluation> {
  const client = getGroqClient();
  const model = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;

  const {
    question,
    category,
    expectedKeyPoints,
    studentAnswer,
    targetRole,
    difficulty,
  } = params;

  const systemPrompt = `You are an expert technical and HR hiring manager conducting campus recruitment interviews for tier-1 tech firms.
Evaluate the candidate's answer objectively based on the question, category, expected key points, and difficulty level.
Scoring guide (0.0 to 10.0 scale):
- 9.0 - 10.0: Outstanding answer covering all key points with depth, edge cases, and clarity.
- 7.0 - 8.9: Strong answer covering most key points accurately with minor omissions.
- 5.0 - 6.9: Average answer with basic understanding but missing critical concepts or lacking depth.
- 3.0 - 4.9: Weak answer with significant misconceptions or superficial explanation.
- 0.0 - 2.9: Incorrect, completely off-topic, or empty answer.

Respond strictly with a valid JSON object. Do NOT include markdown fences, reasoning blocks, or commentary outside the JSON.`;

  const keyPointsFormatted =
    expectedKeyPoints && expectedKeyPoints.length > 0
      ? expectedKeyPoints.map((pt, idx) => `${idx + 1}. ${pt}`).join("\n")
      : "Relevant domain knowledge and problem-solving clarity.";

  const userPrompt = `Target Role: ${targetRole}
Difficulty: ${difficulty}
Category: ${category}
Question: ${question}

Expected Key Points:
${keyPointsFormatted}

Candidate's Answer:
"""
${studentAnswer.trim()}
"""

Evaluate the candidate's response. Return a JSON object with this exact schema:
{
  "score": <number between 0.0 and 10.0 rounded to 1 decimal place>,
  "feedback": "<Constructive 2-3 sentence evaluation highlighting strengths and gaps>",
  "strengths": ["<Key strength 1>", "<Key strength 2>"],
  "improvements": ["<Area for improvement 1>", "<Area for improvement 2>"]
}`;

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
  });

  const messageObj = response.choices?.[0]?.message;
  const rawContent =
    messageObj?.content ||
    (messageObj as unknown as Record<string, unknown>)?.reasoning_content;

  if (!rawContent || typeof rawContent !== "string") {
    throw new Error("Empty response received from Groq during answer evaluation.");
  }

  const parsed = extractJsonFromModelOutput(rawContent);

  // Validate and clamp score between 0.0 and 10.0
  let score = typeof parsed.score === "number" ? parsed.score : 5.0;
  score = Math.max(0.0, Math.min(10.0, Math.round(score * 10) / 10));

  const feedback =
    typeof parsed.feedback === "string" && parsed.feedback.trim().length > 0
      ? parsed.feedback.trim()
      : "Answer evaluated based on key points.";

  const strengths = Array.isArray(parsed.strengths)
    ? parsed.strengths.map(String).filter((s) => s.trim().length > 0)
    : [];

  const improvements = Array.isArray(parsed.improvements)
    ? parsed.improvements.map(String).filter((s) => s.trim().length > 0)
    : [];

  return {
    score,
    feedback,
    strengths,
    improvements,
  };
}

/**
 * Dynamically generates an adaptive next question based on the candidate's
 * previous answers and performance history.
 */
export async function generateAdaptiveNextQuestion(
  params: AdaptiveQuestionParams
): Promise<InterviewQuestion> {
  const client = getGroqClient();
  const model = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;

  const {
    targetRole,
    interviewType,
    difficulty,
    nextQuestionNumber,
    totalQuestions,
    previousQuestions,
  } = params;

  const systemPrompt = `You are a Principal Engineering Hiring Manager conducting an adaptive campus placement interview for tier-1 tech firms.
Based on the candidate's performance on previous questions, generate the next interview question.
Adaptive guidelines:
- If the candidate performed poorly (score < 6.0), calibrate the question to test core fundamental concepts or guide them through a foundational scenario.
- If the candidate performed well (score >= 8.0), increase depth, challenging them on edge cases, system scalability, trade-offs, or real-world constraints.
- Maintain variety across interview categories (e.g. Technical, Behavioral, System Design, Problem Solving, Core CS).
Respond strictly with a valid JSON object. Do NOT include markdown fences, reasoning blocks, or commentary outside the JSON.`;

  const progressionHistory = previousQuestions
    .map(
      (q, idx) => `Question ${idx + 1} [${q.category}]: "${q.question}"
Candidate Answer: "${q.studentAnswer?.slice(0, 300) || "No answer"}"
Score: ${q.score != null ? q.score : "N/A"}/10
Feedback: ${q.feedback || "N/A"}`
    )
    .join("\n\n");

  const userPrompt = `Role: ${targetRole}
Interview Type: ${interviewType}
Difficulty: ${difficulty}
Next Question: ${nextQuestionNumber} of ${totalQuestions}

Previous Interview Progression:
${progressionHistory}

Generate Question ${nextQuestionNumber}. Return a JSON object with this exact schema:
{
  "id": ${nextQuestionNumber},
  "question": "<Adaptive interview question string>",
  "category": "<e.g. Technical, Behavioral, System Design, Problem Solving, Core CS>",
  "expectedKeyPoints": [
    "<Key concept or point 1 the candidate should cover>",
    "<Key concept or point 2 the candidate should cover>"
  ]
}`;

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
  });

  const messageObj = response.choices?.[0]?.message;
  const rawContent =
    messageObj?.content ||
    (messageObj as unknown as Record<string, unknown>)?.reasoning_content;

  if (!rawContent || typeof rawContent !== "string") {
    throw new Error("Empty response received from Groq during adaptive question generation.");
  }

  const parsed = extractJsonFromModelOutput(rawContent);

  return {
    id: nextQuestionNumber,
    question:
      typeof parsed.question === "string" && parsed.question.trim().length > 0
        ? parsed.question.trim()
        : `Interview question ${nextQuestionNumber}`,
    category:
      typeof parsed.category === "string" && parsed.category.trim().length > 0
        ? parsed.category.trim()
        : interviewType,
    expectedKeyPoints: Array.isArray(parsed.expectedKeyPoints)
      ? parsed.expectedKeyPoints.map(String)
      : [],
  };
}

/**
 * Synthesizes performance across all 5 interview questions into a comprehensive
 * final feedback summary for campus recruitment readiness.
 */
export async function generateOverallFeedback(
  params: OverallFeedbackParams
): Promise<string> {
  const client = getGroqClient();
  const model = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;

  const { targetRole, difficulty, interviewType, questions } = params;

  const systemPrompt = `You are a Senior Placement Director at an elite engineering institute.
Synthesize the candidate's performance across the 5 mock interview questions into actionable, professional final feedback for upcoming campus placement drives.
Provide a concise, encouraging, yet rigorous assessment covering overall readiness, top strengths, and specific areas for development.`;

  const questionSummaries = questions
    .map(
      (q, idx) => `Question ${idx + 1} [${q.category}]: "${q.question}"
Candidate Answer: "${q.studentAnswer?.slice(0, 300) || "No answer"}"
Score: ${q.score != null ? q.score : 0}/10
Feedback: ${q.feedback || "N/A"}`
    )
    .join("\n\n");

  const userPrompt = `Role: ${targetRole}
Difficulty: ${difficulty}
Interview Type: ${interviewType}

Questions & Candidate Performance:
${questionSummaries}

Provide comprehensive final feedback in 2 to 3 concise, well-structured paragraphs. Highlight overall readiness for campus placement drives, key technical or communication strengths demonstrated, and specific areas to refine before real company rounds.`;

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
  });

  const messageObj = response.choices?.[0]?.message;
  let content = messageObj?.content;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    const fallbackReasoning = (messageObj as unknown as Record<string, unknown>)
      ?.reasoning_content;
    if (typeof fallbackReasoning === "string" && fallbackReasoning.trim().length > 0) {
      content = fallbackReasoning;
    }
  }

  if (!content || typeof content !== "string") {
    return "Interview completed successfully. Overall performance demonstrates foundational readiness for campus recruitment drives.";
  }

  // Clean reasoning tags if present
  return content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}
