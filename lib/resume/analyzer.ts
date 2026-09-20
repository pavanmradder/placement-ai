/**
 * ==============================================================================
 * PlacementAI: Server-Side Groq Resume Analysis Engine
 * ==============================================================================
 * Analyzes normalized resume text using Groq with structured JSON output.
 * 
 * SECURITY RULES:
 * - Server-side only: never execute in browser.
 * - Never log raw resume text or candidate PII.
 * - Robust parsing for reasoning models.
 * ==============================================================================
 */

import { getGroqClient, DEFAULT_GROQ_MODEL } from "@/lib/ai/groq";

// Server-side execution guard
if (typeof window !== "undefined") {
  throw new Error(
    "Security Violation: lib/resume/analyzer.ts cannot be executed in the browser environment."
  );
}

export interface ResumeAnalysisOutput {
  atsScore: number;
  summary: string;
  skills: {
    technical: string[];
    soft: string[];
    recommended: string[];
  };
  experienceEvaluation: {
    rating: string;
    feedback: string;
  };
  educationEvaluation: {
    rating: string;
    feedback: string;
  };
  formattingAndStructure: {
    score: number;
    feedback: string;
  };
  strengths: string[];
  improvements: string[];
  analyzedAt: string;
  modelUsed: string;
}

/**
 * Extracts and parses a JSON object from model output, handling
 * potential reasoning tags (<think>...</think>) or markdown blocks (```json ... ```).
 */
function extractJsonFromModelOutput(rawOutput: string): Record<string, unknown> {
  // 1. Remove <think>...</think> reasoning blocks if present
  let cleaned = rawOutput.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // 2. Strip markdown code fences
  if (cleaned.includes("```json")) {
    cleaned = cleaned.replace(/```json\s*([\s\S]*?)\s*```/gi, "$1");
  } else if (cleaned.includes("```")) {
    cleaned = cleaned.replace(/```\s*([\s\S]*?)\s*```/gi, "$1");
  }

  cleaned = cleaned.trim();

  // 3. Find the outermost JSON object bounds
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
    throw new Error(`Failed to parse analysis JSON: ${msg}`);
  }
}

/**
 * Sends normalized resume text to Groq and validates the structured ATS evaluation.
 */
export async function analyzeResumeWithGroq(
  resumeText: string
): Promise<ResumeAnalysisOutput> {
  const client = getGroqClient();
  const model = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;

  const systemPrompt = `You are an expert ATS (Applicant Tracking System) and campus recruitment evaluator for engineering students.
Analyze the provided resume text thoroughly and output your evaluation strictly as a valid JSON object.
Do NOT include markdown fences, preambles, or explanations outside the JSON object.`;

  const userPrompt = `Resume Text:
"""
${resumeText}
"""

Evaluate this resume for campus placements and return a JSON object with this exact schema:
{
  "atsScore": <number between 0 and 100>,
  "summary": "<2-3 sentence executive summary of the candidate's profile>",
  "skills": {
    "technical": ["<extracted technical skill>", ...],
    "soft": ["<extracted soft skill>", ...],
    "recommended": ["<valuable missing skill for placements>", ...]
  },
  "experienceEvaluation": {
    "rating": "<Strong | Moderate | Needs Improvement>",
    "feedback": "<detailed feedback on projects/experience>"
  },
  "educationEvaluation": {
    "rating": "<Strong | Moderate | Needs Improvement>",
    "feedback": "<feedback on education and academic credentials>"
  },
  "formattingAndStructure": {
    "score": <number between 0 and 100>,
    "feedback": "<feedback on ATS structure, section clarity, and readability>"
  },
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "improvements": ["<actionable improvement 1>", "<actionable improvement 2>", ...]
}`;

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.1,
  });

  const messageObj = response.choices?.[0]?.message;
  const rawContent = messageObj?.content || (messageObj as unknown as Record<string, unknown>)?.reasoning_content;

  if (!rawContent || typeof rawContent !== "string") {
    throw new Error("Empty response received from Groq during resume analysis.");
  }

  const parsed = extractJsonFromModelOutput(rawContent);

  // Validate and clamp ATS score
  const rawScore = Number(parsed.atsScore);
  const atsScore = isNaN(rawScore) ? 50 : Math.max(0, Math.min(100, Math.round(rawScore)));

  // Safely construct normalized output
  const output: ResumeAnalysisOutput = {
    atsScore,
    summary: typeof parsed.summary === "string" ? parsed.summary : "Candidate resume analysis completed.",
    skills: {
      technical: Array.isArray((parsed.skills as Record<string, unknown>)?.technical)
        ? ((parsed.skills as Record<string, unknown>).technical as string[]).map(String)
        : [],
      soft: Array.isArray((parsed.skills as Record<string, unknown>)?.soft)
        ? ((parsed.skills as Record<string, unknown>).soft as string[]).map(String)
        : [],
      recommended: Array.isArray((parsed.skills as Record<string, unknown>)?.recommended)
        ? ((parsed.skills as Record<string, unknown>).recommended as string[]).map(String)
        : [],
    },
    experienceEvaluation: {
      rating: typeof (parsed.experienceEvaluation as Record<string, unknown>)?.rating === "string"
        ? String((parsed.experienceEvaluation as Record<string, unknown>).rating)
        : "Moderate",
      feedback: typeof (parsed.experienceEvaluation as Record<string, unknown>)?.feedback === "string"
        ? String((parsed.experienceEvaluation as Record<string, unknown>).feedback)
        : "Experience and projects evaluated.",
    },
    educationEvaluation: {
      rating: typeof (parsed.educationEvaluation as Record<string, unknown>)?.rating === "string"
        ? String((parsed.educationEvaluation as Record<string, unknown>).rating)
        : "Moderate",
      feedback: typeof (parsed.educationEvaluation as Record<string, unknown>)?.feedback === "string"
        ? String((parsed.educationEvaluation as Record<string, unknown>).feedback)
        : "Education background verified.",
    },
    formattingAndStructure: {
      score: typeof (parsed.formattingAndStructure as Record<string, unknown>)?.score === "number"
        ? Math.max(0, Math.min(100, Number((parsed.formattingAndStructure as Record<string, unknown>).score)))
        : 70,
      feedback: typeof (parsed.formattingAndStructure as Record<string, unknown>)?.feedback === "string"
        ? String((parsed.formattingAndStructure as Record<string, unknown>).feedback)
        : "Layout and structure analyzed.",
    },
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(String) : [],
    analyzedAt: new Date().toISOString(),
    modelUsed: response.model || model,
  };

  return output;
}
