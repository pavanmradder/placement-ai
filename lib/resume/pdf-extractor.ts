/**
 * ==============================================================================
 * PlacementAI: Server-Side PDF Text Extraction & Validation Utility
 * ==============================================================================
 * Securely extracts, normalizes, and validates text from PDF resumes.
 * 
 * SECURITY RULES:
 * - Server-side only: never execute in browser.
 * - Never log raw resume text or candidate PII.
 * - Enforce maximum character limits before sending to LLM.
 * ==============================================================================
 */

import { extractText } from "unpdf";

// Server-side execution guard
if (typeof window !== "undefined") {
  throw new Error(
    "Security Violation: lib/resume/pdf-extractor.ts cannot be executed in the browser environment."
  );
}

// Configurable maximum characters to prevent token explosion
export const DEFAULT_MAX_RESUME_TEXT_CHARS = 16000;
export const MIN_RESUME_TEXT_CHARS = 50;

export function getMaxResumeTextChars(): number {
  const envVal = process.env.MAX_RESUME_TEXT_CHARS?.trim();
  if (envVal && !isNaN(Number(envVal))) {
    return Number(envVal);
  }
  return DEFAULT_MAX_RESUME_TEXT_CHARS;
}

/**
 * Cleans, removes non-printable characters, and normalizes excessive whitespace.
 */
function normalizeResumeText(rawText: string): string {
  return rawText
    // Replace non-printable characters with space (preserve standard whitespace)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ")
    // Normalize tab characters to spaces
    .replace(/\t/g, " ")
    // Collapse multiple horizontal spaces into a single space
    .replace(/[ ]{2,}/g, " ")
    // Collapse 3 or more consecutive newlines into 2
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  charCount: number;
  isTruncated: boolean;
}

/**
 * Extracts and normalizes text from a PDF ArrayBuffer or Uint8Array.
 * Rejects empty or scanned (image-only) PDFs.
 */
export async function extractTextFromPdfBuffer(
  buffer: ArrayBuffer | Uint8Array
): Promise<PdfExtractionResult> {
  let rawText = "";
  let totalPages = 1;

  try {
    const result = await extractText(buffer);
    totalPages = result.totalPages || 1;
    // unpdf can return text as string or array of strings per page
    if (Array.isArray(result.text)) {
      rawText = result.text.join("\n\n");
    } else if (typeof result.text === "string") {
      rawText = result.text;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "PDF extraction failed";
    throw new Error(`Failed to parse PDF document: ${msg}`);
  }

  const normalizedText = normalizeResumeText(rawText);

  // Validate that useful text was actually extracted
  if (normalizedText.length < MIN_RESUME_TEXT_CHARS) {
    throw new Error(
      "No readable text found in the PDF. Please ensure your resume is not an image-only scanned document and contains selectable text."
    );
  }

  const maxChars = getMaxResumeTextChars();
  const isTruncated = normalizedText.length > maxChars;

  const text = isTruncated
    ? `${normalizedText.slice(0, maxChars)}\n\n[Resume text truncated for analysis]`
    : normalizedText;

  return {
    text,
    pageCount: totalPages,
    charCount: text.length,
    isTruncated,
  };
}
