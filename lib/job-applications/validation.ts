/**
 * ==============================================================================
 * PlacementAI: Job Application Validation & Type Definitions
 * ==============================================================================
 * Validates payloads for job application CRUD operations.
 * Enforces field lengths, date formats, status enums, and ownership security.
 * ==============================================================================
 */

export const VALID_JOB_APPLICATION_STATUSES = [
  "applied",
  "oa",
  "interview",
  "offer",
  "rejected",
] as const;

export type JobApplicationStatus =
  (typeof VALID_JOB_APPLICATION_STATUSES)[number];

export interface CreateJobApplicationInput {
  company_name: string;
  job_title: string;
  application_date: string;
  status: JobApplicationStatus;
  job_url: string | null;
  location: string | null;
  package_ctc: string | null;
  notes: string | null;
}

export interface UpdateJobApplicationInput {
  company_name?: string;
  job_title?: string;
  application_date?: string;
  status?: JobApplicationStatus;
  job_url?: string | null;
  location?: string | null;
  package_ctc?: string | null;
  notes?: string | null;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates standard UUID format.
 */
export function isValidUuid(id: unknown): id is string {
  return typeof id === "string" && UUID_REGEX.test(id.trim());
}

/**
 * Validates YYYY-MM-DD date format and checks if it's a real calendar date.
 */
export function isValidDateString(dateStr: string): boolean {
  if (!DATE_REGEX.test(dateStr)) return false;
  const parsed = new Date(dateStr);
  return (
    !isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === dateStr
  );
}

/**
 * Validates a web URL string (must be http:// or https://).
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validates input for creating a new job application record.
 */
export function validateCreateJobApplication(
  body: unknown
): { success: true; data: CreateJobApplicationInput } | { success: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { success: false, error: "Invalid request payload. Expected JSON object." };
  }

  const raw = body as Record<string, unknown>;

  // 1. company_name (Required, 1-100 characters)
  if (typeof raw.company_name !== "string" || raw.company_name.trim().length === 0) {
    return { success: false, error: "company_name is required." };
  }
  const companyName = raw.company_name.trim();
  if (companyName.length > 100) {
    return { success: false, error: "company_name cannot exceed 100 characters." };
  }

  // 2. job_title (Required, 1-100 characters)
  if (typeof raw.job_title !== "string" || raw.job_title.trim().length === 0) {
    return { success: false, error: "job_title is required." };
  }
  const jobTitle = raw.job_title.trim();
  if (jobTitle.length > 100) {
    return { success: false, error: "job_title cannot exceed 100 characters." };
  }

  // 3. status (Optional, defaults to 'applied')
  let status: JobApplicationStatus = "applied";
  if (raw.status !== undefined && raw.status !== null) {
    if (
      typeof raw.status !== "string" ||
      !VALID_JOB_APPLICATION_STATUSES.includes(raw.status as JobApplicationStatus)
    ) {
      return {
        success: false,
        error: `Invalid status. Must be one of: ${VALID_JOB_APPLICATION_STATUSES.join(", ")}`,
      };
    }
    status = raw.status as JobApplicationStatus;
  }

  // 4. application_date (Optional, defaults to CURRENT_DATE in YYYY-MM-DD)
  let applicationDate = new Date().toISOString().slice(0, 10);
  if (raw.application_date !== undefined && raw.application_date !== null) {
    if (
      typeof raw.application_date !== "string" ||
      !isValidDateString(raw.application_date.trim())
    ) {
      return {
        success: false,
        error: "Invalid application_date. Expected format: YYYY-MM-DD (e.g. 2026-09-21).",
      };
    }
    applicationDate = raw.application_date.trim();
  }

  // 5. job_url (Optional, max 1000 characters)
  let jobUrl: string | null = null;
  if (raw.job_url !== undefined && raw.job_url !== null && raw.job_url !== "") {
    if (typeof raw.job_url !== "string") {
      return { success: false, error: "job_url must be a string." };
    }
    const trimmed = raw.job_url.trim();
    if (trimmed.length > 1000) {
      return { success: false, error: "job_url cannot exceed 1000 characters." };
    }
    if (!isValidUrl(trimmed)) {
      return { success: false, error: "job_url must be a valid http or https URL." };
    }
    jobUrl = trimmed;
  }

  // 6. location (Optional, max 100 characters)
  let location: string | null = null;
  if (raw.location !== undefined && raw.location !== null && raw.location !== "") {
    if (typeof raw.location !== "string") {
      return { success: false, error: "location must be a string." };
    }
    const trimmed = raw.location.trim();
    if (trimmed.length > 100) {
      return { success: false, error: "location cannot exceed 100 characters." };
    }
    location = trimmed;
  }

  // 7. package_ctc (Optional, max 50 characters)
  let packageCtc: string | null = null;
  if (raw.package_ctc !== undefined && raw.package_ctc !== null && raw.package_ctc !== "") {
    if (typeof raw.package_ctc !== "string") {
      return { success: false, error: "package_ctc must be a string." };
    }
    const trimmed = raw.package_ctc.trim();
    if (trimmed.length > 50) {
      return { success: false, error: "package_ctc cannot exceed 50 characters." };
    }
    packageCtc = trimmed;
  }

  // 8. notes (Optional, max 2000 characters)
  let notes: string | null = null;
  if (raw.notes !== undefined && raw.notes !== null && raw.notes !== "") {
    if (typeof raw.notes !== "string") {
      return { success: false, error: "notes must be a string." };
    }
    const trimmed = raw.notes.trim();
    if (trimmed.length > 2000) {
      return { success: false, error: "notes cannot exceed 2000 characters." };
    }
    notes = trimmed;
  }

  return {
    success: true,
    data: {
      company_name: companyName,
      job_title: jobTitle,
      application_date: applicationDate,
      status,
      job_url: jobUrl,
      location,
      package_ctc: packageCtc,
      notes,
    },
  };
}

/**
 * Validates input for updating an existing job application record.
 */
export function validateUpdateJobApplication(
  body: unknown
): { success: true; data: UpdateJobApplicationInput } | { success: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { success: false, error: "Invalid request payload. Expected JSON object." };
  }

  const raw = body as Record<string, unknown>;
  const data: UpdateJobApplicationInput = {};
  let fieldsCount = 0;

  // 1. company_name
  if (raw.company_name !== undefined) {
    if (typeof raw.company_name !== "string" || raw.company_name.trim().length === 0) {
      return { success: false, error: "company_name cannot be empty." };
    }
    const trimmed = raw.company_name.trim();
    if (trimmed.length > 100) {
      return { success: false, error: "company_name cannot exceed 100 characters." };
    }
    data.company_name = trimmed;
    fieldsCount++;
  }

  // 2. job_title
  if (raw.job_title !== undefined) {
    if (typeof raw.job_title !== "string" || raw.job_title.trim().length === 0) {
      return { success: false, error: "job_title cannot be empty." };
    }
    const trimmed = raw.job_title.trim();
    if (trimmed.length > 100) {
      return { success: false, error: "job_title cannot exceed 100 characters." };
    }
    data.job_title = trimmed;
    fieldsCount++;
  }

  // 3. status
  if (raw.status !== undefined) {
    if (
      typeof raw.status !== "string" ||
      !VALID_JOB_APPLICATION_STATUSES.includes(raw.status as JobApplicationStatus)
    ) {
      return {
        success: false,
        error: `Invalid status. Must be one of: ${VALID_JOB_APPLICATION_STATUSES.join(", ")}`,
      };
    }
    data.status = raw.status as JobApplicationStatus;
    fieldsCount++;
  }

  // 4. application_date
  if (raw.application_date !== undefined) {
    if (
      typeof raw.application_date !== "string" ||
      !isValidDateString(raw.application_date.trim())
    ) {
      return {
        success: false,
        error: "Invalid application_date. Expected format: YYYY-MM-DD.",
      };
    }
    data.application_date = raw.application_date.trim();
    fieldsCount++;
  }

  // 5. job_url
  if (raw.job_url !== undefined) {
    if (raw.job_url === null || raw.job_url === "") {
      data.job_url = null;
      fieldsCount++;
    } else if (typeof raw.job_url === "string") {
      const trimmed = raw.job_url.trim();
      if (trimmed.length > 1000) {
        return { success: false, error: "job_url cannot exceed 1000 characters." };
      }
      if (!isValidUrl(trimmed)) {
        return { success: false, error: "job_url must be a valid http or https URL." };
      }
      data.job_url = trimmed;
      fieldsCount++;
    } else {
      return { success: false, error: "job_url must be a string or null." };
    }
  }

  // 6. location
  if (raw.location !== undefined) {
    if (raw.location === null || raw.location === "") {
      data.location = null;
      fieldsCount++;
    } else if (typeof raw.location === "string") {
      const trimmed = raw.location.trim();
      if (trimmed.length > 100) {
        return { success: false, error: "location cannot exceed 100 characters." };
      }
      data.location = trimmed;
      fieldsCount++;
    } else {
      return { success: false, error: "location must be a string or null." };
    }
  }

  // 7. package_ctc
  if (raw.package_ctc !== undefined) {
    if (raw.package_ctc === null || raw.package_ctc === "") {
      data.package_ctc = null;
      fieldsCount++;
    } else if (typeof raw.package_ctc === "string") {
      const trimmed = raw.package_ctc.trim();
      if (trimmed.length > 50) {
        return { success: false, error: "package_ctc cannot exceed 50 characters." };
      }
      data.package_ctc = trimmed;
      fieldsCount++;
    } else {
      return { success: false, error: "package_ctc must be a string or null." };
    }
  }

  // 8. notes
  if (raw.notes !== undefined) {
    if (raw.notes === null || raw.notes === "") {
      data.notes = null;
      fieldsCount++;
    } else if (typeof raw.notes === "string") {
      const trimmed = raw.notes.trim();
      if (trimmed.length > 2000) {
        return { success: false, error: "notes cannot exceed 2000 characters." };
      }
      data.notes = trimmed;
      fieldsCount++;
    } else {
      return { success: false, error: "notes must be a string or null." };
    }
  }

  if (fieldsCount === 0) {
    return {
      success: false,
      error: "No valid fields provided for update. Provide at least one field to modify.",
    };
  }

  return {
    success: true,
    data,
  };
}
