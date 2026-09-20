/**
 * ==============================================================================
 * PlacementAI: AI Skill Gap Analysis Engine (Deterministic Scoring)
 * ==============================================================================
 * Evaluates student skills against stable, industry-standard role benchmarks
 * for campus recruitment drives.
 * 
 * DETERMINISTIC SCORING RULES:
 * 1. Required-skill benchmarks are fixed and stable per target role.
 * 2. Current skills and required skills are normalized with alias handling.
 * 3. skillMatchPercentage is calculated in application code:
 *    (matched required skills / total required skills) * 100.
 * 4. Groq is used strictly for qualitative insights:
 *    - Executive alignment summary
 *    - Prioritized study roadmap and actionable recommendations
 *    - Estimated study duration in weeks
 * ==============================================================================
 */

import { getGroqClient, DEFAULT_GROQ_MODEL } from "@/lib/ai/groq";

// Server-side execution guard
if (typeof window !== "undefined") {
  throw new Error(
    "Security Violation: lib/skill-gap/analyzer.ts cannot be executed in the browser environment."
  );
}

export interface SkillGapRecommendation {
  skill: string;
  priority: "High" | "Medium" | "Low";
  action: string;
  estimatedWeeks: number;
}

export interface SkillGapAnalysisOutput {
  targetRole: string;
  currentSkills: string[];
  requiredSkills: string[];
  missingSkills: string[];
  skillMatchPercentage: number;
  summary: string;
  recommendations: SkillGapRecommendation[];
}

export interface AnalyzeSkillGapParams {
  targetRole: string;
  currentSkills: string[];
  resumeContext?: string;
}

export interface BenchmarkSkill {
  name: string;
  keywords: string[];
}

export interface RoleBenchmark {
  roleCategory: string;
  skills: BenchmarkSkill[];
}

/**
 * Stable, industry-standard benchmarks for campus placement roles.
 */
export const ROLE_BENCHMARKS: Record<string, RoleBenchmark> = {
  sde: {
    roleCategory: "Software Development Engineer (SDE)",
    skills: [
      {
        name: "Data Structures & Algorithms",
        keywords: ["dsa", "data structures", "algorithms", "leetcode", "trees", "graphs", "dynamic programming", "sorting"],
      },
      {
        name: "Object-Oriented Programming (OOP)",
        keywords: ["oop", "oops", "object oriented", "java", "c++", "cpp", "python", "c#"],
      },
      {
        name: "Database Management & SQL",
        keywords: ["sql", "mysql", "postgresql", "postgres", "mongodb", "database", "dbms", "nosql", "sqlite"],
      },
      {
        name: "Web Technologies & REST APIs",
        keywords: ["rest", "api", "apis", "http", "react", "node", "nodejs", "express", "javascript", "typescript", "web", "html", "css"],
      },
      {
        name: "Version Control (Git)",
        keywords: ["git", "github", "gitlab", "version control"],
      },
      {
        name: "Operating Systems & Linux Basics",
        keywords: ["linux", "unix", "operating system", "operating systems", "os", "bash", "shell"],
      },
      {
        name: "Computer Networks",
        keywords: ["computer networks", "networking", "tcp", "udp", "dns", "socket", "http/https", "network"],
      },
      {
        name: "System Design & Architecture",
        keywords: ["system design", "distributed systems", "microservices", "scalability", "architecture", "load balancer", "caching"],
      },
      {
        name: "Software Testing & Debugging",
        keywords: ["testing", "unit test", "jest", "mocha", "cypress", "junit", "debugging", "qa"],
      },
      {
        name: "Cloud & Deployment Fundamentals",
        keywords: ["cloud", "aws", "azure", "gcp", "docker", "kubernetes", "ci/cd", "devops", "deployment"],
      },
    ],
  },
  frontend: {
    roleCategory: "Frontend Engineer",
    skills: [
      {
        name: "HTML5, CSS3 & Responsive Design",
        keywords: ["html", "css", "html5", "css3", "responsive", "tailwind", "sass", "bootstrap", "flexbox", "grid"],
      },
      {
        name: "Modern JavaScript (ES6+) & TypeScript",
        keywords: ["javascript", "typescript", "js", "ts", "es6", "vanilla js"],
      },
      {
        name: "Frontend Framework (React / Next.js / Vue)",
        keywords: ["react", "reactjs", "react.js", "nextjs", "next.js", "vue", "vuejs", "angular"],
      },
      {
        name: "State Management & Component Architecture",
        keywords: ["redux", "zustand", "context api", "state management", "mobx", "recoil"],
      },
      {
        name: "RESTful APIs & Asynchronous Data Fetching",
        keywords: ["rest", "api", "fetch", "axios", "graphql", "async", "promises"],
      },
      {
        name: "Version Control (Git)",
        keywords: ["git", "github", "gitlab", "version control"],
      },
      {
        name: "Web Performance & Core Web Vitals",
        keywords: ["performance", "lighthouse", "lazy loading", "core web vitals", "optimization", "caching"],
      },
      {
        name: "Frontend Testing & Debugging",
        keywords: ["jest", "cypress", "react testing library", "playwright", "vitest", "testing"],
      },
      {
        name: "Build Tools & Modern Tooling",
        keywords: ["vite", "webpack", "npm", "yarn", "turbopack", "babel", "package manager"],
      },
      {
        name: "UI/UX Principles & Accessibility (a11y)",
        keywords: ["accessibility", "a11y", "ui/ux", "figma", "aria", "semantic html"],
      },
    ],
  },
  backend: {
    roleCategory: "Backend Engineer",
    skills: [
      {
        name: "Server-Side Language (Node.js / Java / Python / Go)",
        keywords: ["node", "nodejs", "express", "java", "spring", "springboot", "python", "django", "fastapi", "golang", "go", "c#", ".net"],
      },
      {
        name: "Relational Databases & SQL Optimization",
        keywords: ["sql", "postgresql", "postgres", "mysql", "indexing", "acid", "relational", "orm", "prisma"],
      },
      {
        name: "NoSQL Databases & In-Memory Caching",
        keywords: ["mongodb", "redis", "cassandra", "nosql", "dynamodb", "caching"],
      },
      {
        name: "RESTful & GraphQL API Architecture",
        keywords: ["rest", "restful", "api", "graphql", "grpc", "api design", "swagger", "openapi"],
      },
      {
        name: "Authentication & Web Security",
        keywords: ["jwt", "oauth", "auth", "authentication", "cors", "https", "bcrypt", "security"],
      },
      {
        name: "Data Structures & Algorithms",
        keywords: ["dsa", "data structures", "algorithms", "problem solving"],
      },
      {
        name: "Concurrency, Multithreading & Asynchronous I/O",
        keywords: ["concurrency", "multithreading", "async", "event loop", "worker threads", "goroutines"],
      },
      {
        name: "System Design & Microservices",
        keywords: ["system design", "microservices", "message queue", "kafka", "rabbitmq", "scalability", "load balancing"],
      },
      {
        name: "Cloud & Containerization (Docker, AWS)",
        keywords: ["docker", "container", "containers", "aws", "gcp", "azure", "kubernetes"],
      },
      {
        name: "Version Control & CI/CD",
        keywords: ["git", "github", "ci/cd", "jenkins", "github actions", "devops"],
      },
    ],
  },
  data: {
    roleCategory: "Data Analyst / Data Scientist",
    skills: [
      {
        name: "SQL & Advanced Database Querying",
        keywords: ["sql", "postgresql", "mysql", "window functions", "joins", "subqueries", "database"],
      },
      {
        name: "Python or R for Data Science",
        keywords: ["python", "r", "jupyter", "scripting"],
      },
      {
        name: "Data Manipulation (Pandas & NumPy)",
        keywords: ["pandas", "numpy", "data wrangling", "data cleaning", "etl"],
      },
      {
        name: "Data Visualization (Tableau / Power BI / Seaborn)",
        keywords: ["tableau", "power bi", "powerbi", "matplotlib", "seaborn", "data visualization", "dashboard"],
      },
      {
        name: "Statistics & Probability",
        keywords: ["statistics", "probability", "hypothesis testing", "regression", "statistical analysis"],
      },
      {
        name: "Machine Learning Fundamentals",
        keywords: ["machine learning", "ml", "scikit-learn", "supervised", "unsupervised", "classification", "clustering"],
      },
      {
        name: "Excel & Advanced Analytics",
        keywords: ["excel", "vlookup", "pivot tables", "advanced excel", "spreadsheets"],
      },
      {
        name: "Data Structures & Algorithmic Basics",
        keywords: ["data structures", "algorithms", "dsa", "problem solving"],
      },
      {
        name: "Version Control (Git)",
        keywords: ["git", "github", "version control"],
      },
      {
        name: "Business Intelligence & Metric Reporting",
        keywords: ["bi", "business intelligence", "kpis", "reporting", "insights", "analytics"],
      },
    ],
  },
  devops: {
    roleCategory: "Cloud & DevOps Engineer",
    skills: [
      {
        name: "Linux / Unix Administration & Shell Scripting",
        keywords: ["linux", "unix", "bash", "shell", "terminal", "scripting", "ubuntu"],
      },
      {
        name: "Cloud Platforms (AWS / GCP / Azure)",
        keywords: ["aws", "gcp", "azure", "cloud", "ec2", "s3", "iam"],
      },
      {
        name: "Containerization (Docker)",
        keywords: ["docker", "container", "containers", "dockerfile", "docker-compose"],
      },
      {
        name: "Container Orchestration (Kubernetes)",
        keywords: ["kubernetes", "k8s", "helm", "pods", "orchestration"],
      },
      {
        name: "CI/CD Automation Pipelines",
        keywords: ["ci/cd", "cicd", "github actions", "jenkins", "gitlab ci", "automation"],
      },
      {
        name: "Infrastructure as Code (Terraform / Ansible)",
        keywords: ["terraform", "ansible", "iac", "cloudformation"],
      },
      {
        name: "Networking & Cloud Security",
        keywords: ["networking", "vpc", "dns", "firewall", "ssl/tls", "security", "subnets"],
      },
      {
        name: "Monitoring & Observability (Prometheus, Grafana)",
        keywords: ["prometheus", "grafana", "monitoring", "logging", "elk", "cloudwatch"],
      },
      {
        name: "Version Control (Git)",
        keywords: ["git", "github", "gitlab"],
      },
      {
        name: "Scripting Language (Python / Go)",
        keywords: ["python", "golang", "go", "ruby", "automation"],
      },
    ],
  },
};

/**
 * Normalizes a skill string for consistent matching (removes punctuation, lowercases, handles common aliases).
 */
export function normalizeSkillString(skill: string): string {
  return skill
    .toLowerCase()
    .trim()
    .replace(/[._\-\/]/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Resolves the appropriate benchmark based on the target role string.
 */
export function getBenchmarkForRole(targetRole: string): RoleBenchmark {
  const normalized = targetRole.toLowerCase().trim();

  if (normalized.includes("front") || normalized.includes("ui") || normalized.includes("react") || normalized.includes("web dev")) {
    return ROLE_BENCHMARKS.frontend;
  }
  if (normalized.includes("back") || normalized.includes("server") || normalized.includes("api") || normalized.includes("node")) {
    return ROLE_BENCHMARKS.backend;
  }
  if (
    normalized.includes("data") ||
    normalized.includes("analyst") ||
    normalized.includes("scientist") ||
    normalized.includes("machine learning") ||
    normalized.includes("ml") ||
    normalized.includes("ai")
  ) {
    return ROLE_BENCHMARKS.data;
  }
  if (
    normalized.includes("devops") ||
    normalized.includes("cloud") ||
    normalized.includes("sre") ||
    normalized.includes("infrastructure") ||
    normalized.includes("docker")
  ) {
    return ROLE_BENCHMARKS.devops;
  }

  // Default to Software Development Engineer (SDE)
  return ROLE_BENCHMARKS.sde;
}

/**
 * Checks if a specific benchmark skill is satisfied by any of the student's normalized skills.
 */
export function isBenchmarkSkillMatched(
  userSkillsNormalized: string[],
  benchmark: BenchmarkSkill
): boolean {
  for (const userSkill of userSkillsNormalized) {
    if (!userSkill) continue;

    // Check against benchmark keywords
    for (const kw of benchmark.keywords) {
      const normalizedKw = normalizeSkillString(kw);
      if (userSkill === normalizedKw) return true;
      if (userSkill.includes(normalizedKw) || normalizedKw.includes(userSkill)) return true;
    }

    // Check against the benchmark name
    const normalizedName = normalizeSkillString(benchmark.name);
    if (userSkill === normalizedName) return true;
    if (userSkill.includes(normalizedName) || normalizedName.includes(userSkill)) return true;
  }

  return false;
}

/**
 * Deterministically evaluates matched, required, and missing skills and computes
 * the exact skill-match percentage.
 */
export function evaluateSkillsDeterministically(
  targetRole: string,
  rawStudentSkills: string[]
): {
  requiredSkills: string[];
  missingSkills: string[];
  matchedSkills: string[];
  skillMatchPercentage: number;
} {
  const benchmark = getBenchmarkForRole(targetRole);
  const normalizedUserSkills = rawStudentSkills.map(normalizeSkillString).filter((s) => s.length > 0);

  const requiredSkills: string[] = [];
  const missingSkills: string[] = [];
  const matchedSkills: string[] = [];

  for (const skill of benchmark.skills) {
    requiredSkills.push(skill.name);
    const matched = isBenchmarkSkillMatched(normalizedUserSkills, skill);
    if (matched) {
      matchedSkills.push(skill.name);
    } else {
      missingSkills.push(skill.name);
    }
  }

  const totalRequired = requiredSkills.length;
  const totalMatched = matchedSkills.length;
  const skillMatchPercentage = totalRequired > 0 ? Math.round((totalMatched / totalRequired) * 100) : 0;

  return {
    requiredSkills,
    missingSkills,
    matchedSkills,
    skillMatchPercentage,
  };
}

/**
 * Extracts and parses a JSON object from model output.
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
    throw new Error(`Failed to parse model JSON: ${msg}`);
  }
}

/**
 * Analyzes a student's skills against stable industry benchmarks.
 * Computes deterministic score and uses Groq strictly for qualitative roadmap guidance.
 */
export async function analyzeSkillGap(
  params: AnalyzeSkillGapParams
): Promise<SkillGapAnalysisOutput> {
  const client = getGroqClient();
  const model = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;

  const { targetRole, currentSkills, resumeContext } = params;

  // 1. DETERMINISTIC APPLICATION-LEVEL CALCULATION
  const { requiredSkills, missingSkills, skillMatchPercentage } =
    evaluateSkillsDeterministically(targetRole, currentSkills);

  // 2. GROQ QUALITATIVE GUIDANCE GENERATION
  const systemPrompt = `You are a Principal Technical Recruiter and Placement Curriculum Architect for Tier-1 technology companies.
The student's skill match percentage has already been computed deterministically as ${skillMatchPercentage}% (${requiredSkills.length - missingSkills.length} of ${requiredSkills.length} required skills matched).
Your task is to provide:
1. A concise, encouraging executive summary (2-3 sentences) evaluating the candidate's alignment.
2. Prioritized actionable recommendations to bridge the missing skills, with priority (High, Medium, Low), concrete study/project actions, and estimated learning duration in weeks.
Respond strictly with a valid JSON object. Do NOT include markdown fences, reasoning blocks, or commentary outside the JSON.`;

  const userPrompt = `Target Role: ${targetRole}
Current Student Skills: ${currentSkills.length > 0 ? currentSkills.join(", ") : "None logged"}
Required Industry Benchmark Skills:
${requiredSkills.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Missing Skills (Gaps):
${missingSkills.length > 0 ? missingSkills.map((s, i) => `${i + 1}. ${s}`).join("\n") : "None (Candidate matches all benchmark skills)"}

Calculated Skill Match: ${skillMatchPercentage}%
${resumeContext ? `\nResume Context: """${resumeContext.slice(0, 1000)}"""\n` : ""}

Generate the qualitative recommendations and summary. Return a JSON object with this exact schema:
{
  "summary": "<2-3 sentence executive assessment of the candidate's alignment with campus drive expectations>",
  "recommendations": [
    {
      "skill": "<missing skill name from the missing skills list>",
      "priority": "<High | Medium | Low>",
      "action": "<specific project or study action to bridge this gap>",
      "estimatedWeeks": <number of weeks, e.g. 2>
    }
  ]
}`;

  let parsedSummary = `Candidate has acquired ${requiredSkills.length - missingSkills.length} of ${requiredSkills.length} core skills for ${targetRole} (${skillMatchPercentage}% alignment). Focus on high-priority gaps to enhance placement drive readiness.`;
  let parsedRecommendations: SkillGapRecommendation[] = [];

  try {
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

    if (rawContent && typeof rawContent === "string") {
      const parsed = extractJsonFromModelOutput(rawContent);

      if (typeof parsed.summary === "string" && parsed.summary.trim().length > 0) {
        parsedSummary = parsed.summary.trim();
      }

      if (Array.isArray(parsed.recommendations)) {
        parsedRecommendations = parsed.recommendations.map((rec: unknown) => {
          const r = rec as Record<string, unknown>;
          const rawPriority = String(r.priority || "Medium");
          const priority: "High" | "Medium" | "Low" =
            rawPriority === "High" || rawPriority === "Low"
              ? rawPriority
              : "Medium";

          return {
            skill: typeof r.skill === "string" ? r.skill.trim() : "Core Skill",
            priority,
            action:
              typeof r.action === "string"
                ? r.action.trim()
                : "Review documentation and build a demonstration project.",
            estimatedWeeks:
              typeof r.estimatedWeeks === "number" && r.estimatedWeeks > 0
                ? Math.min(12, Math.round(r.estimatedWeeks))
                : 2,
          };
        });
      }
    }
  } catch (err: unknown) {
    console.warn("[Skill Gap Engine] Groq recommendation generation fallback:", err);
  }

  // Fallback recommendations if Groq returned empty or failed
  if (parsedRecommendations.length === 0 && missingSkills.length > 0) {
    parsedRecommendations = missingSkills.slice(0, 5).map((skill, index) => ({
      skill,
      priority: index < 2 ? "High" : index < 4 ? "Medium" : "Low",
      action: `Complete practical project work and exercises covering ${skill} to meet campus hiring benchmarks.`,
      estimatedWeeks: index < 2 ? 4 : 2,
    }));
  }

  // 3. RETURN DETERMINISTIC RESULT
  return {
    targetRole,
    currentSkills,
    requiredSkills, // Always stable from benchmark
    missingSkills,  // Always deterministic from comparison
    skillMatchPercentage, // Always deterministic: (matched / required) * 100
    summary: parsedSummary,
    recommendations: parsedRecommendations,
  };
}
