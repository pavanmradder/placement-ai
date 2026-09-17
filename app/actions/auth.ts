"use server";

import { createClient } from "@/lib/supabase/server";
import {
  normalizeEmail,
  isStudentEmail,
  isAdminEmail,
  STUDENT_DOMAIN_ERROR,
  ADMIN_UNAUTHORIZED_ERROR,
} from "@/lib/auth-constants";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  hasSession?: boolean;
  role?: "student" | "admin";
  redirectUrl?: string;
}

/**
 * Server-side student registration action.
 * Strictly enforces @mite.ac.in email domain on the server.
 */
export async function registerStudentAction(formData: {
  name: string;
  email: string;
  password: string;
  targetRole: string;
}): Promise<AuthActionResult> {
  const normalizedEmail = normalizeEmail(formData.email);

  // SERVER-SIDE RESTRICTION: Must end with @mite.ac.in
  if (!isStudentEmail(normalizedEmail)) {
    return {
      success: false,
      error: STUDENT_DOMAIN_ERROR,
    };
  }

  if (formData.password.length < 6) {
    return {
      success: false,
      error: "Password must be at least 6 characters long.",
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: formData.password,
      options: {
        data: {
          name: formData.name.trim(),
          full_name: formData.name.trim(),
          target_role: formData.targetRole,
          targetRole: formData.targetRole,
          college: "Mangalore Institute of Technology and Engineering (MITE)",
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      hasSession: !!data.session,
      role: "student",
      redirectUrl: "/dashboard",
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected registration error occurred.";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server-side student sign-in action.
 * Enforces @mite.ac.in (or redirects admin to /admin).
 */
export async function loginStudentAction(formData: {
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  const normalizedEmail = normalizeEmail(formData.email);

  // If the single authorized admin attempts login on student form, allow sign-in and redirect to /admin
  if (isAdminEmail(normalizedEmail)) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: formData.password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        role: "admin",
        redirectUrl: "/admin",
      };
    } catch {
      return { success: false, error: "Authentication failed. Please try again." };
    }
  }

  // SERVER-SIDE RESTRICTION: Student email must end with @mite.ac.in
  if (!isStudentEmail(normalizedEmail)) {
    return {
      success: false,
      error: STUDENT_DOMAIN_ERROR,
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: formData.password,
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Invalid email or password. Please try again.",
      };
    }

    return {
      success: true,
      role: "student",
      redirectUrl: "/dashboard",
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred during sign in.";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server-side admin sign-in action.
 * Strictly enforces that ONLY pavanmradder@gmail.com can authenticate as admin.
 */
export async function loginAdminAction(formData: {
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  const normalizedEmail = normalizeEmail(formData.email);

  // SERVER-SIDE RESTRICTION: Only pavanmradder@gmail.com is authorized
  if (!isAdminEmail(normalizedEmail)) {
    return {
      success: false,
      error: ADMIN_UNAUTHORIZED_ERROR,
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: formData.password,
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Invalid admin credentials. Please try again.",
      };
    }

    return {
      success: true,
      role: "admin",
      redirectUrl: "/admin",
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred during sign in.";
    return {
      success: false,
      error: message,
    };
  }
}
