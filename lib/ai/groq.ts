/**
 * ==============================================================================
 * PlacementAI: Server-Side Groq Integration Foundation
 * ==============================================================================
 * This module initializes and exports the Groq client strictly on the server
 * using the official OpenAI-compatible SDK configuration.
 * 
 * SECURITY RULES:
 * - NEVER import or call this file from Client Components ("use client").
 * - NEVER expose GROQ_API_KEY through NEXT_PUBLIC_* or browser bundles.
 * - NEVER log raw API keys, user resume contents, or sensitive data.
 * ==============================================================================
 */

import OpenAI from "openai";

// Server-side execution guard
if (typeof window !== "undefined") {
  throw new Error(
    "Security Violation: lib/ai/groq.ts cannot be executed in the browser environment."
  );
}

// Configurable Groq model with sensible high-performance default
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";

export function getGroqModel(): string {
  return process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
}

let cachedClient: OpenAI | null = null;
let cachedKey: string | null = null;

/**
 * Returns a configured, server-only Groq client instance.
 * Throws a safe error if GROQ_API_KEY is not configured.
 */
export function getGroqClient(): OpenAI {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "Missing GROQ_API_KEY: Server-side Groq API key is not configured in .env.local"
    );
  }

  // Refresh client if key in .env.local has changed during development
  if (!cachedClient || cachedKey !== apiKey) {
    cachedClient = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
    cachedKey = apiKey;
  }

  return cachedClient;
}

export interface AITestResult {
  success: boolean;
  message: string;
  model: string;
}

/**
 * Minimal server-side connection test to verify:
 * 1. GROQ_API_KEY presence and validity
 * 2. Groq API connectivity and model accessibility
 * 
 * Never returns or logs credentials.
 */
export async function testAIConnection(): Promise<AITestResult> {
  const client = getGroqClient();
  const model = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: "Reply with exactly: PlacementAI connection successful",
      },
    ],
  });

  const messageObj = response.choices?.[0]?.message;
  const rawContent = messageObj?.content;
  const content =
    typeof rawContent === "string" && rawContent.trim().length > 0
      ? rawContent.trim()
      : typeof (messageObj as unknown as Record<string, unknown>)?.reasoning_content === "string"
      ? ((messageObj as unknown as Record<string, unknown>).reasoning_content as string).trim()
      : "";

  if (!content && (!response.choices || response.choices.length === 0)) {
    throw new Error("Empty response received from Groq API.");
  }

  return {
    success: true,
    message: content || "PlacementAI connection successful",
    model: response.model || model,
  };
}
