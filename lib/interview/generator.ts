/**
 * ==============================================================================
 * PlacementAI: AI Mock Interview Question Generator
 * ==============================================================================
 * Generates tailored, structured interview questions for campus recruitment
 * drives using Groq (openai/gpt-oss-120b).
 * 
 * SECURITY RULES:
 * - Server-side only: never execute in browser.
 * - Never log raw candidate answers or credentials.
 * ==============================================================================
 */

import { getGroqClient, DEFAULT_GROQ_MODEL } from "@/lib/ai/groq";

// Server-side execution guard
if (typeof window !== "undefined") {
  throw new Error(
    "Security Violation: lib/interview/generator.ts cannot be executed in the browser environment."
  );
}

export type InterviewType = "Technical" | "HR / Behavioral" | "Mixed";
export type InterviewDifficulty = "Easy" | "Medium" | "Hard";

export interface InterviewQuestion {
  id: number;
  question: string;
  category: string;
  expectedKeyPoints: string[];
  studentAnswer?: string;
  feedback?: string;
  score?: number;
}

export interface CandidateContext {
  college?: string;
  graduationYear?: number;
  skills?: string[];
}

/**
 * Extracts and parses a JSON object from model output, handling
 * potential reasoning tags (<think>...</think>) or markdown blocks (```json ... ```).
 */
function extractJsonFromModelOutput(rawOutput: string): Record<string, unknown> {
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
    throw new Error(`Failed to parse interview questions JSON: ${msg}`);
  }
}

/**
 * Generates an initial set of 5 structured interview questions tailored to
 * the student's target role, interview type, difficulty, and background skills.
 */
export async function generateInterviewQuestions(params: {
  targetRole: string;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
  candidateContext?: CandidateContext;
}): Promise<InterviewQuestion[]> {
  const client = getGroqClient();
  const model = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;

  const { targetRole, interviewType, difficulty, candidateContext } = params;

  const skillsText = candidateContext?.skills?.length
    ? `Student known skills: ${candidateContext.skills.slice(0, 10).join(", ")}`
    : "";

  const systemPrompt = `You are a Principal Engineering Hiring Manager conducting campus placement interviews for tier-1 tech firms.
Generate exactly 5 realistic, high-impact interview questions tailored to the candidate's target role, difficulty, and interview type.
Respond strictly with a valid JSON object. Do NOT include markdown fences, reasoning blocks, or explanations outside the JSON object.`;

  const userPrompt = `Role: ${targetRole}
Interview Type: ${interviewType}
Difficulty: ${difficulty}
${skillsText}

Generate 5 interview questions. Return a JSON object with this exact schema:
{
  "questions": [
    {
      "id": 1,
      "question": "<Interview question string>",
      "category": "<e.g. Technical, Behavioral, System Design, Problem Solving, Core CS>",
      "expectedKeyPoints": [
        "<Key concept or point 1 the candidate should cover>",
        "<Key concept or point 2 the candidate should cover>"
      ]
    }
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
    throw new Error("Empty response received from Groq during question generation.");
  }

  const parsed = extractJsonFromModelOutput(rawContent);

  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error("Invalid response format: 'questions' array is missing or empty.");
  }

  const questions: InterviewQuestion[] = parsed.questions.map(
    (q: unknown, index: number) => {
      const qObj = q as Record<string, unknown>;
      return {
        id: typeof qObj.id === "number" ? qObj.id : index + 1,
        question:
          typeof qObj.question === "string"
            ? qObj.question.trim()
            : `Interview question ${index + 1}`,
        category:
          typeof qObj.category === "string" ? qObj.category.trim() : interviewType,
        expectedKeyPoints: Array.isArray(qObj.expectedKeyPoints)
          ? qObj.expectedKeyPoints.map(String)
          : [],
      };
    }
  );

  return questions;
}
