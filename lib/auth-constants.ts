/**
 * PlacementAI Authentication Constants and Helpers
 */

export const AUTHORIZED_ADMIN_EMAIL = "pavanmradder@gmail.com";
export const STUDENT_EMAIL_DOMAIN = "@mite.ac.in";

export const STUDENT_DOMAIN_ERROR =
  "Please use your official MITE college email (@mite.ac.in).";

export const ADMIN_UNAUTHORIZED_ERROR =
  "You are not authorized as an admin.";

/**
 * Normalizes an email address by trimming whitespace and converting to lowercase.
 */
export function normalizeEmail(email: string | null | undefined): string {
  if (!email) return "";
  return email.trim().toLowerCase();
}

/**
 * Checks if an email is an authorized student email ending with @mite.ac.in.
 */
export function isStudentEmail(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email);
  return normalized.endsWith(STUDENT_EMAIL_DOMAIN);
}

/**
 * Checks if an email is the single authorized admin email.
 * Case-insensitive comparison.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email);
  return normalized === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
}

/**
 * Validates a student email for registration or login.
 */
export function validateStudentEmail(email: string | null | undefined): {
  valid: boolean;
  error?: string;
} {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes("@")) {
    return {
      valid: false,
      error: "Please enter a valid email address.",
    };
  }

  if (!isStudentEmail(normalized)) {
    return {
      valid: false,
      error: STUDENT_DOMAIN_ERROR,
    };
  }

  return { valid: true };
}

/**
 * Validates an admin email.
 */
export function validateAdminEmail(email: string | null | undefined): {
  valid: boolean;
  error?: string;
} {
  const normalized = normalizeEmail(email);
  if (!isAdminEmail(normalized)) {
    return {
      valid: false,
      error: ADMIN_UNAUTHORIZED_ERROR,
    };
  }

  return { valid: true };
}
