/**
 * ==============================================================================
 * PlacementAI: Personalized Placement Roadmap Engine
 * ==============================================================================
 * Gathers authenticated student's profile, verified skills, latest skill gap,
 * DSA progress, and resume analysis to generate a personalized multi-week
 * preparation roadmap using Groq AI.
 * 
 * SECURITY RULES:
 * - Server-side only: never execute in browser.
 * - Never log raw API keys, resume text, or student PII.
 * - Do NOT download or send PDF files to Groq; use existing extracted analysis.
 * - If student data is missing, clearly indicate it as unavailable.
 * ==============================================================================
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { getGroqClient, DEFAULT_GROQ_MODEL, getGroqModel } from "@/lib/ai/groq";
import type { Database } from "@/lib/supabase/database.types";
import type { ResumeAnalysisOutput } from "@/lib/resume/analyzer";

// Server-side execution guard
if (typeof window !== "undefined") {
  throw new Error(
    "Security Violation: lib/roadmap/generator.ts cannot be executed in the browser environment."
  );
}

export const ALLOWED_ROADMAP_CATEGORIES = [
  "DSA",
  "Programming",
  "Web Development",
  "Database",
  "CS Fundamentals",
  "Resume",
  "Interview",
  "Projects",
  "Aptitude",
  "Other",
] as const;

export type RoadmapCategory = (typeof ALLOWED_ROADMAP_CATEGORIES)[number];

export const ALLOWED_ROADMAP_PRIORITIES = ["high", "medium", "low"] as const;
export type RoadmapPriority = (typeof ALLOWED_ROADMAP_PRIORITIES)[number];

export interface RoadmapTask {
  id: string;
  title: string;
  category: RoadmapCategory;
  priority: RoadmapPriority;
  estimated_hours: number;
  completed: boolean;
}

export interface RoadmapWeek {
  week: number;
  title: string;
  description: string;
  tasks: RoadmapTask[];
}

export interface GeneratedRoadmapOutput {
  title: string;
  description: string;
  duration_weeks: number;
  weeks: RoadmapWeek[];
}

export interface StudentRoadmapContext {
  targetRole: string;
  profile: {
    college?: string | null;
    graduationYear?: number | null;
  } | null;
  skills: Array<{ name: string; level: string }>;
  skillGap: {
    targetRole?: string;
    currentSkills?: string[];
    requiredSkills?: string[];
    missingSkills?: string[];
    recommendations?: Array<{ skill: string; priority: string; action: string }>;
    skillMatchPercentage?: number;
  } | null;
  dsaProgress: {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    solvedTopics: Record<string, number>;
    inProgressTopics: string[];
    remainingTopics: string[];
  };
  resumeAnalysis: {
    atsScore?: number | null;
    strengths?: string[];
    improvements?: string[];
    recommendedSkills?: string[];
  } | null;
}

/**
 * Validates the generated AI roadmap against strict schema and business rules.
 */
export function validateRoadmapOutput(data: unknown): {
  isValid: boolean;
  error?: string;
  validatedRoadmap?: GeneratedRoadmapOutput;
} {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { isValid: false, error: "Roadmap output must be a valid JSON object." };
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.title !== "string" || obj.title.trim().length === 0) {
    return { isValid: false, error: "Roadmap title is required and must be a non-empty string." };
  }

  if (typeof obj.description !== "string" || obj.description.trim().length === 0) {
    return { isValid: false, error: "Roadmap description is required and must be a non-empty string." };
  }

  const duration = typeof obj.duration_weeks === "number" ? obj.duration_weeks : Number(obj.duration_weeks);
  if (!Number.isInteger(duration) || duration < 1 || duration > 52) {
    return { isValid: false, error: "Roadmap duration_weeks must be an integer between 1 and 52." };
  }

  if (!Array.isArray(obj.weeks) || obj.weeks.length === 0) {
    return { isValid: false, error: "Roadmap must contain a non-empty array of weeks." };
  }

  const validatedWeeks: RoadmapWeek[] = [];

  for (let i = 0; i < obj.weeks.length; i++) {
    const w = obj.weeks[i];
    if (!w || typeof w !== "object") {
      return { isValid: false, error: `Week at index ${i} is invalid.` };
    }

    const weekNum = typeof w.week === "number" ? w.week : Number(w.week);
    if (!Number.isInteger(weekNum) || weekNum < 1) {
      return { isValid: false, error: `Week at index ${i} has an invalid week number.` };
    }

    if (typeof w.title !== "string" || w.title.trim().length === 0) {
      return { isValid: false, error: `Week ${weekNum} title is missing or empty.` };
    }

    if (typeof w.description !== "string" || w.description.trim().length === 0) {
      return { isValid: false, error: `Week ${weekNum} description is missing or empty.` };
    }

    if (!Array.isArray(w.tasks) || w.tasks.length === 0) {
      return { isValid: false, error: `Week ${weekNum} must contain at least one task.` };
    }

    const validatedTasks: RoadmapTask[] = [];

    for (let j = 0; j < w.tasks.length; j++) {
      const t = w.tasks[j];
      if (!t || typeof t !== "object") {
        return { isValid: false, error: `Task ${j + 1} in Week ${weekNum} is invalid.` };
      }

      const rawId = typeof t.id === "string" && t.id.trim().length > 0 ? t.id.trim() : `week${weekNum}-task${j + 1}`;

      if (typeof t.title !== "string" || t.title.trim().length === 0) {
        return { isValid: false, error: `Task ${j + 1} in Week ${weekNum} is missing a title.` };
      }

      // Validate category
      const rawCategory = typeof t.category === "string" ? t.category.trim() : "";
      const matchedCategory = ALLOWED_ROADMAP_CATEGORIES.find(
        (c) => c.toLowerCase() === rawCategory.toLowerCase()
      );
      if (!matchedCategory) {
        return {
          isValid: false,
          error: `Task "${t.title}" has invalid category "${rawCategory}". Allowed: ${ALLOWED_ROADMAP_CATEGORIES.join(", ")}.`,
        };
      }

      // Validate priority
      const rawPriority = typeof t.priority === "string" ? t.priority.trim().toLowerCase() : "";
      const matchedPriority = ALLOWED_ROADMAP_PRIORITIES.find((p) => p === rawPriority);
      if (!matchedPriority) {
        return {
          isValid: false,
          error: `Task "${t.title}" has invalid priority "${rawPriority}". Allowed: high, medium, low.`,
        };
      }

      // Validate estimated_hours
      const hours = typeof t.estimated_hours === "number" ? t.estimated_hours : Number(t.estimated_hours);
      if (isNaN(hours) || hours <= 0 || hours > 40) {
        return {
          isValid: false,
          error: `Task "${t.title}" estimated_hours must be a positive number between 1 and 40.`,
        };
      }

      validatedTasks.push({
        id: rawId,
        title: t.title.trim(),
        category: matchedCategory,
        priority: matchedPriority,
        estimated_hours: Math.round(hours * 10) / 10,
        completed: Boolean(t.completed ?? false),
      });
    }

    validatedWeeks.push({
      week: weekNum,
      title: w.title.trim(),
      description: w.description.trim(),
      tasks: validatedTasks,
    });
  }

  return {
    isValid: true,
    validatedRoadmap: {
      title: obj.title.trim(),
      description: obj.description.trim(),
      duration_weeks: duration,
      weeks: validatedWeeks,
    },
  };
}

/**
 * Extracts and parses JSON from Groq's model completion.
 */
function extractJsonFromModelOutput(rawOutput: string): Record<string, unknown> {
  // Strip reasoning blocks (<think>...</think>)
  let cleaned = rawOutput.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Strip markdown code fences
  if (cleaned.includes("```json")) {
    cleaned = cleaned.replace(/```json\s*([\s\S]*?)\s*```/gi, "$1");
  } else if (cleaned.includes("```")) {
    cleaned = cleaned.replace(/```\s*([\s\S]*?)\s*```/gi, "$1");
  }

  cleaned = cleaned.trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Failed to find valid JSON structure in AI response.");
  }

  const jsonSubstring = cleaned.substring(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonSubstring);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid JSON syntax";
    throw new Error(`Failed to parse AI roadmap JSON: ${msg}`);
  }
}

/**
 * Gathers the authenticated student's existing data across:
 * - Profiles (target role, college, graduation year)
 * - Skills (verified skills & levels)
 * - Skill Gap Analysis (latest analysis, missing skills, recommendations)
 * - DSA Progress (solved topics, in-progress topics, remaining problem topics)
 * - Resume Analysis (ATS score, strengths, improvement areas)
 */
export async function gatherStudentRoadmapContext(
  supabase: SupabaseClient<Database>,
  userId: string,
  requestedTargetRole?: string
): Promise<StudentRoadmapContext> {
  // Concurrently fetch all student data points
  const [
    { data: profile },
    { data: skillsList },
    { data: latestSkillGap },
    { data: dsaSummary },
    { data: userDsaProgress },
    { data: dsaCatalog },
    { data: latestResumes },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("target_role, college, graduation_year")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("skills")
      .select("skill_name, skill_level")
      .eq("user_id", userId),
    supabase
      .from("skill_gap_analyses")
      .select("target_role, current_skills, required_skills, missing_skills, recommendations, skill_match_percentage")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("dsa_progress")
      .select("easy_solved, medium_solved, hard_solved, total_solved")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("user_dsa_progress")
      .select("problem_id, status")
      .eq("user_id", userId),
    supabase
      .from("dsa_problems")
      .select("id, topic, difficulty"),
    supabase
      .from("resumes")
      .select("ats_score, analysis, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // 1. Target Role Resolution (prefer saved profile role, then requested role, fallback to SDE)
  const targetRole =
    profile?.target_role?.trim() ||
    (requestedTargetRole && requestedTargetRole.trim().length >= 2 ? requestedTargetRole.trim() : null) ||
    "Software Development Engineer (SDE)";

  // 2. Skills
  const studentSkills = (skillsList || []).map((s) => ({
    name: s.skill_name,
    level: s.skill_level || "intermediate",
  }));

  // 3. Skill Gap
  let skillGapData: StudentRoadmapContext["skillGap"] = null;
  if (latestSkillGap) {
    skillGapData = {
      targetRole: latestSkillGap.target_role,
      currentSkills: Array.isArray(latestSkillGap.current_skills)
        ? (latestSkillGap.current_skills as string[])
        : [],
      requiredSkills: Array.isArray(latestSkillGap.required_skills)
        ? (latestSkillGap.required_skills as string[])
        : [],
      missingSkills: Array.isArray(latestSkillGap.missing_skills)
        ? (latestSkillGap.missing_skills as string[])
        : [],
      recommendations: Array.isArray(latestSkillGap.recommendations)
        ? (latestSkillGap.recommendations as Array<{ skill: string; priority: string; action: string }>)
        : [],
      skillMatchPercentage: latestSkillGap.skill_match_percentage ?? undefined,
    };
  }

  // 4. DSA Progress
  const problemCatalogMap = new Map<string, { topic: string; difficulty: string }>();
  const catalogTopics = new Set<string>();
  if (dsaCatalog) {
    for (const p of dsaCatalog) {
      problemCatalogMap.set(p.id, { topic: p.topic, difficulty: p.difficulty });
      catalogTopics.add(p.topic);
    }
  }

  const solvedTopics: Record<string, number> = {};
  const inProgressTopicsSet = new Set<string>();

  if (userDsaProgress) {
    for (const prog of userDsaProgress) {
      const prob = problemCatalogMap.get(prog.problem_id);
      if (!prob) continue;

      if (prog.status === "solved") {
        solvedTopics[prob.topic] = (solvedTopics[prob.topic] || 0) + 1;
      } else if (prog.status === "in_progress") {
        inProgressTopicsSet.add(prob.topic);
      }
    }
  }

  // Determine remaining topics (topics in catalog with 0 solved problems)
  const remainingTopics: string[] = [];
  for (const topic of Array.from(catalogTopics)) {
    if (!solvedTopics[topic]) {
      remainingTopics.push(topic);
    }
  }

  const dsaProgressData = {
    totalSolved: dsaSummary?.total_solved ?? 0,
    easySolved: dsaSummary?.easy_solved ?? 0,
    mediumSolved: dsaSummary?.medium_solved ?? 0,
    hardSolved: dsaSummary?.hard_solved ?? 0,
    solvedTopics,
    inProgressTopics: Array.from(inProgressTopicsSet),
    remainingTopics,
  };

  // 5. Resume Analysis (Extract safe evaluation metrics without PII or raw text)
  let resumeAnalysisData: StudentRoadmapContext["resumeAnalysis"] = null;
  if (latestResumes && latestResumes.analysis) {
    const analysis = latestResumes.analysis as unknown as ResumeAnalysisOutput;
    resumeAnalysisData = {
      atsScore: latestResumes.ats_score ?? analysis.atsScore ?? null,
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths.slice(0, 5) : [],
      improvements: Array.isArray(analysis.improvements) ? analysis.improvements.slice(0, 5) : [],
      recommendedSkills: Array.isArray(analysis.skills?.recommended)
        ? analysis.skills.recommended.slice(0, 8)
        : [],
    };
  }

  return {
    targetRole,
    profile: profile
      ? {
          college: profile.college,
          graduationYear: profile.graduation_year,
        }
      : null,
    skills: studentSkills,
    skillGap: skillGapData,
    dsaProgress: dsaProgressData,
    resumeAnalysis: resumeAnalysisData,
  };
}

/**
 * Generates a structured 4-week personalized placement roadmap using Groq AI.
 */
export async function generatePlacementRoadmap(params: {
  targetRole: string;
  studentContext: StudentRoadmapContext;
  durationWeeks?: number;
}): Promise<GeneratedRoadmapOutput> {
  const client = getGroqClient();
  const model = getGroqModel() || DEFAULT_GROQ_MODEL;

  const durationWeeks = params.durationWeeks && params.durationWeeks >= 1 && params.durationWeeks <= 52
    ? params.durationWeeks
    : 4;

  const { targetRole, studentContext } = params;

  // Build transparent prompt representation
  const verifiedSkillsStr =
    studentContext.skills.length > 0
      ? studentContext.skills.map((s) => `${s.name} (${s.level})`).join(", ")
      : "None logged yet";

  const skillGapStr = studentContext.skillGap
    ? `Calculated Match: ${studentContext.skillGap.skillMatchPercentage ?? "N/A"}%
Required Skills: ${studentContext.skillGap.requiredSkills?.join(", ") || "None"}
Missing Skills (Gaps to prioritize): ${studentContext.skillGap.missingSkills?.join(", ") || "None identified"}
Recommendations: ${studentContext.skillGap.recommendations?.map((r) => `${r.skill} [${r.priority}]: ${r.action}`).join("; ") || "None"}`
    : "No skill gap analysis logged yet.";

  const solvedTopicsStr =
    Object.keys(studentContext.dsaProgress.solvedTopics).length > 0
      ? Object.entries(studentContext.dsaProgress.solvedTopics)
          .map(([topic, count]) => `${topic}: ${count} solved`)
          .join(", ")
      : "None";

  const inProgressTopicsStr =
    studentContext.dsaProgress.inProgressTopics.length > 0
      ? studentContext.dsaProgress.inProgressTopics.join(", ")
      : "None";

  const remainingTopicsStr =
    studentContext.dsaProgress.remainingTopics.length > 0
      ? studentContext.dsaProgress.remainingTopics.join(", ")
      : "All core catalog topics attempted";

  const dsaProgressStr = `Total Solved: ${studentContext.dsaProgress.totalSolved} (Easy: ${studentContext.dsaProgress.easySolved}, Medium: ${studentContext.dsaProgress.mediumSolved}, Hard: ${studentContext.dsaProgress.hardSolved})
Solved Topics (Do NOT needlessly repeat): ${solvedTopicsStr}
In-Progress Topics: ${inProgressTopicsStr}
Unattempted/Remaining Topics (Prioritize these): ${remainingTopicsStr}`;

  const resumeAnalysisStr = studentContext.resumeAnalysis
    ? `ATS Score: ${studentContext.resumeAnalysis.atsScore ?? "Not scored"}/100
Strengths: ${studentContext.resumeAnalysis.strengths?.join(", ") || "None noted"}
Areas for Improvement: ${studentContext.resumeAnalysis.improvements?.join(", ") || "None noted"}
Recommended Skill Enhancements: ${studentContext.resumeAnalysis.recommendedSkills?.join(", ") || "None"}`
    : "No resume analysis logged yet.";

  const systemPrompt = `You are a Principal Placement Director and Campus Recruitment Curriculum Architect for engineering students.
Your goal is to construct a rigorous, highly actionable, personalized ${durationWeeks}-week placement preparation roadmap for an engineering student targeting the role of "${targetRole}".

CRITICAL DESIGN RULES:
1. Generate exactly ${durationWeeks} weeks.
2. Each week MUST contain 3 to 6 distinct, concrete, actionable tasks.
3. Every task must have:
   - "id": a unique string (e.g. "week1-task1", "week1-task2")
   - "title": a specific, actionable title (NEVER use generic tasks like "study coding", "read books", or "practice questions")
   - "category": exactly one of: "DSA", "Programming", "Web Development", "Database", "CS Fundamentals", "Resume", "Interview", "Projects", "Aptitude", "Other"
   - "priority": exactly one of: "high", "medium", "low"
   - "estimated_hours": realistic number of hours (between 1 and 20) suitable for a college student balancing classes
   - "completed": false
4. Prioritize the student's MISSING skills from their skill gap analysis.
5. Consider their DSA progress: DO NOT waste time reteaching solved topics; focus DSA tasks on their remaining/unattempted topics and increasing difficulty.
6. Address resume weaknesses and improvements identified in their resume analysis.
7. Schedule mock interviews, behavioral prep, and technical interview questions toward the later weeks (e.g. Weeks 3-4).
8. Include practical project/portfolio enhancement where relevant.
9. Do NOT claim guaranteed placement outcomes.
10. Respond strictly with a valid JSON object matching the required schema. Do NOT include markdown fences, preambles, or thoughts outside the JSON.`;

  const userPrompt = `STUDENT PLACEMENT PROFILE:
Target Role: ${targetRole}
Graduation Year: ${studentContext.profile?.graduationYear || "Upcoming Batch"}
College: ${studentContext.profile?.college || "MITE"}

1. VERIFIED SKILLS:
${verifiedSkillsStr}

2. SKILL GAP ANALYSIS:
${skillGapStr}

3. DSA PROGRESS:
${dsaProgressStr}

4. RESUME EVALUATION:
${resumeAnalysisStr}

OUTPUT SCHEMA:
{
  "title": "<Concise, inspiring title for the roadmap, e.g. '4-Week SDE Placement Acceleration Plan'>",
  "description": "<2-3 sentence overview explaining how this roadmap targets the student's specific gaps, DSA goals, and interview readiness>",
  "duration_weeks": ${durationWeeks},
  "weeks": [
    {
      "week": 1,
      "title": "<Week 1 Theme/Focus>",
      "description": "<Weekly objective and rationale>",
      "tasks": [
        {
          "id": "week1-task1",
          "title": "<Specific, actionable task>",
          "category": "<Category>",
          "priority": "<high|medium|low>",
          "estimated_hours": 4,
          "completed": false
        }
      ]
    }
  ]
}

Generate the personalized ${durationWeeks}-week roadmap now as a valid JSON object.`;

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
    throw new Error("Empty response received from Groq AI.");
  }

  const parsedJson = extractJsonFromModelOutput(rawContent);
  const validation = validateRoadmapOutput(parsedJson);

  if (!validation.isValid || !validation.validatedRoadmap) {
    throw new Error(`AI generated invalid roadmap structure: ${validation.error}`);
  }

  return validation.validatedRoadmap;
}
