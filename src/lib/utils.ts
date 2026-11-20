import CryptoJS from "crypto-js";

/**
 * Generate a SHA-256 hash of a string (used for cache keys).
 */
export function hashText(text: string): string {
  return CryptoJS.SHA256(text.trim().toLowerCase()).toString();
}

/**
 * Strip HTML tags from a string.
 */
export function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "").trim();
}

/**
 * Parse a rating value that might be a number, string number, word, or missing.
 * Returns a number 1-5 or null if invalid/missing.
 */
export function parseRating(rating: string | number | null | undefined): number | null {
  if (rating === null || rating === undefined || rating === "") {
    return null;
  }

  // If it's already a number
  if (typeof rating === "number") {
    if (rating >= 1 && rating <= 5) return Math.round(rating);
    return null;
  }

  // Try parsing as number string
  const num = Number(rating);
  if (!isNaN(num) && num >= 1 && num <= 5) {
    return Math.round(num);
  }

  // Try parsing word ratings
  const wordMap: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
  };
  const lower = rating.toString().trim().toLowerCase();
  if (Object.hasOwn(wordMap, lower)) {
    return wordMap[lower];
  }

  return null;
}

/**
 * Check if a review text is effectively empty.
 */
export function isEmptyReview(text: string | null | undefined): boolean {
  if (!text) return true;
  // Remove whitespace and common non-content characters
  const cleaned = text.replace(/[\s\u200B-\u200D\uFEFF]/g, "");
  return cleaned.length === 0;
}

/**
 * Sleep for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Chunk an array into batches of a given size.
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * cn utility for className merging (simple version)
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
