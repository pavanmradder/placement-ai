import { NextResponse } from "next/server";
import { testAIConnection, getGroqModel } from "@/lib/ai/groq";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

/**
 * Helper to strip any possible API keys or Bearer tokens from strings before output.
 */
function redactSecrets(text: string): string {
  return text
    .replace(/gsk_[a-zA-Z0-9_-]{8,}/gi, "[REDACTED_GROQ_KEY]")
    .replace(/xai-[a-zA-Z0-9_-]{8,}/gi, "[REDACTED_KEY]")
    .replace(/sk-[a-zA-Z0-9_-]{8,}/gi, "[REDACTED_KEY]")
    .replace(/Bearer\s+[^\s"']+/gi, "Bearer [REDACTED]");
}

/**
 * GET /api/ai/test
 * Server endpoint to test Groq connectivity with sanitized diagnostics.
 * 
 * Never returns or exposes the GROQ_API_KEY.
 */
export async function GET() {
  const configuredModel = getGroqModel();

  try {
    const result = await testAIConnection();
    return NextResponse.json(
      {
        success: true,
        message: result.message,
        model: result.model,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    let status: number = 500;
    let category = "unknown_error";
    let message = "An unexpected error occurred while communicating with Groq.";
    let details: string | undefined;

    if (error instanceof Error) {
      const rawMessage = redactSecrets(error.message);

      if (rawMessage.includes("Missing GROQ_API_KEY")) {
        status = 503;
        category = "missing_api_key";
        message = "Groq API key is not configured on the server. Please define GROQ_API_KEY in .env.local.";
      } else if (error instanceof OpenAI.APIError) {
        status = error.status || 500;
        details = redactSecrets(error.message);

        switch (status) {
          case 401:
            category = "authentication_error";
            message = "Invalid or unauthorized Groq API key. Please check your GROQ_API_KEY in .env.local.";
            break;
          case 402:
          case 403:
            category = "insufficient_credits_or_quota";
            message = `Groq account has insufficient credits, billing issue, or permission restriction. (HTTP ${status})`;
            break;
          case 404:
            category = "model_not_found";
            message = `The requested model '${configuredModel}' was not found or is not accessible on Groq.`;
            break;
          case 429:
            category = "rate_limit_exceeded";
            message = "Groq API rate limit reached or quota exceeded. Please wait or check your account usage.";
            break;
          default:
            if (
              rawMessage.toLowerCase().includes("credit") ||
              rawMessage.toLowerCase().includes("billing")
            ) {
              category = "insufficient_credits_or_quota";
              message = "Groq account has insufficient credits or billing issue.";
            } else if (rawMessage.toLowerCase().includes("model")) {
              category = "model_not_found";
              message = `Model issue with '${configuredModel}': ${details}`;
            } else {
              category = "groq_api_error";
              message = `Groq API returned an error (HTTP ${status}).`;
            }
            break;
        }
      } else if (
        error.name === "APIConnectionError" ||
        rawMessage.includes("ECONNREFUSED") ||
        rawMessage.includes("ENOTFOUND")
      ) {
        status = 502;
        category = "network_connection_error";
        message = "Failed to establish a network connection to https://api.groq.com/openai/v1. Check network/firewall.";
      } else {
        category = "general_error";
        message = redactSecrets(error.message);
      }
    }

    // Safe server-side diagnostic log (never logs API keys)
    console.error(`[Groq Diagnostic] Groq error status: ${status}`);
    console.error(`[Groq Diagnostic] Groq error type: ${category}`);
    if (details) {
      console.error(`[Groq Diagnostic] Groq error details: ${details}`);
    }

    return NextResponse.json(
      {
        success: false,
        category,
        status,
        error: message,
        configuredModel,
        ...(details ? { details } : {}),
      },
      { status }
    );
  }
}

/**
 * POST /api/ai/test
 * Accepts a POST request to test Groq connectivity.
 */
export async function POST() {
  return GET();
}
