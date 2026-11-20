import Papa from "papaparse";
import { RawReview, CleanedReview } from "@/types";
import { hashText, stripHtml, parseRating, isEmptyReview } from "./utils";
import { RawReviewSchema } from "./schema";

/**
 * Parse a CSV string into raw reviews.
 */
export function parseCSV(csvContent: string): RawReview[] {
  return parseCSVReport(csvContent).reviews;
}

export function parseCSVReport(csvContent: string): { reviews: RawReview[]; warnings: string[] } {
  const result = Papa.parse<RawReview>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  const required = ["review_id", "product", "rating", "date", "review_text"];
  const missing = required.filter((name) => !result.meta.fields?.includes(name));
  if (missing.length) throw new Error(`Missing CSV columns: ${missing.join(", ")}`);
  if (result.data.length > 500) throw new Error("Upload at most 500 reviews at a time.");
  const warnings: string[] = [];
  const badRows = new Set<number>();
  for (const error of result.errors) {
    if (error.row === undefined) throw new Error("The CSV is malformed. Check the header and quoted fields.");
    badRows.add(error.row);
    warnings.push(`CSV row ${error.row + 2} was skipped: ${error.message}`);
  }
  const ids = new Set<string>();
  const reviews: RawReview[] = [];
  result.data.forEach((row, index) => {
    if (badRows.has(index)) return;
    const checked = RawReviewSchema.safeParse(row);
    if (!checked.success) { warnings.push(`CSV row ${index + 2} was skipped: missing ID or invalid field lengths.`); return; }
    if (ids.has(checked.data.review_id)) { warnings.push(`CSV row ${index + 2} was skipped: duplicate review ID.`); return; }
    ids.add(checked.data.review_id);
    reviews.push(checked.data);
  });
  return { reviews, warnings };
}

/**
 * Clean and validate parsed reviews.
 * Handles: empty text, missing/invalid ratings, HTML tags, duplicates.
 */
export function cleanReviews(rawReviews: RawReview[]): CleanedReview[] {
  const seenHashes = new Map<string, string>(); // hash -> first review_id
  const cleaned: CleanedReview[] = [];

  for (const raw of rawReviews) {
    const reviewText = raw.review_text || "";
    const hasHtml = /<[^>]*>/.test(reviewText);
    const cleanedText = stripHtml(reviewText);
    const empty = isEmptyReview(cleanedText);
    const rating = parseRating(raw.rating);

    // Check for duplicates based on cleaned text hash
    let isDuplicate = false;
    if (!empty) {
      const textHash = hashText(cleanedText);
      if (seenHashes.has(textHash)) {
        isDuplicate = true;
      } else {
        seenHashes.set(textHash, raw.review_id);
      }
    }

    cleaned.push({
      review_id: raw.review_id.trim(),
      product: raw.product?.trim() || "Unknown Product",
      rating,
      date: raw.date?.trim() || "",
      review_text: reviewText,
      is_duplicate: isDuplicate,
      is_empty: empty,
      original_rating: raw.rating ?? null,
      has_html: hasHtml,
      cleaned_text: cleanedText,
    });
  }

  return cleaned;
}

/**
 * Get reviews that are valid for AI analysis (not empty, not duplicate).
 */
export function getAnalyzableReviews(reviews: CleanedReview[]): CleanedReview[] {
  return reviews.filter((r) => !r.is_empty && !r.is_duplicate);
}
