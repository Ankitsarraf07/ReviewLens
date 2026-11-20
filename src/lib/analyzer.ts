import { CleanedReview, AnalyzedReview, ProcessingStats } from "@/types";
import { analyzeReviewBatch } from "./gemini";
import { getCachedAnalysis, setCachedAnalysis } from "./cache";
import { hashText, chunk } from "./utils";

const BATCH_SIZE = 5;

/**
 * Check if a rating mismatches the AI sentiment.
 * e.g., 5 stars but negative sentiment = mismatch
 */
export function checkRatingMismatch(
  rating: number | null,
  sentiment: string
): boolean {
  if (rating === null) return false;

  const expected = rating >= 4 ? "positive" : rating <= 2 ? "negative" : "neutral";
  return expected !== sentiment;
}

/**
 * Analyze all reviews: check cache first, then batch-call AI for uncached ones.
 */
export async function analyzeAllReviews(
  reviews: CleanedReview[]
): Promise<{ analyzed: AnalyzedReview[]; stats: ProcessingStats; warnings: string[] }> {
  const startTime = Date.now();
  let aiCalls = 0;
  let cacheHits = 0;
  let batchesProcessed = 0;
  const warnings = new Set<string>();

  const analyzed: AnalyzedReview[] = [];
  const needsAnalysis: { index: number; review: CleanedReview }[] = [];

  // Step 1: Check cache for each analyzable review
  for (const review of reviews) {
    if (review.is_empty || review.is_duplicate) {
      analyzed.push({
        ...review,
        analysis: null,
        analysis_failed: false,
        rating_mismatch: false,
      });
      continue;
    }

    const textHash = hashText(review.cleaned_text);
    const cached = getCachedAnalysis(textHash);

    if (cached) {
      cacheHits++;
      analyzed.push({
        ...review,
        analysis: cached,
        analysis_failed: false,
        rating_mismatch: checkRatingMismatch(review.rating, cached.sentiment),
      });
    } else {
      // Mark position for later filling
      const idx = analyzed.length;
      analyzed.push({
        ...review,
        analysis: null,
        analysis_failed: false,
        rating_mismatch: false,
      });
      needsAnalysis.push({ index: idx, review });
    }
  }

  // Step 2: Batch-analyze uncached reviews
  if (needsAnalysis.length > 0) {
    const batches = chunk(needsAnalysis, BATCH_SIZE);

    for (const batch of batches) {
      const batchInput = batch.map((item) => ({
        id: item.review.review_id,
        text: item.review.cleaned_text,
      }));

      const { results, error } = await analyzeReviewBatch(batchInput, 1, () => { aiCalls++; });
      if (error) warnings.add(error);
      batchesProcessed++;

      for (const item of batch) {
        const analysis = results.get(item.review.review_id) || null;

        if (analysis) {
          // Cache the successful result
          const textHash = hashText(item.review.cleaned_text);
          setCachedAnalysis(textHash, item.review.cleaned_text, analysis);

          analyzed[item.index] = {
            ...analyzed[item.index],
            analysis,
            analysis_failed: false,
            rating_mismatch: checkRatingMismatch(
              item.review.rating,
              analysis.sentiment
            ),
          };
        } else {
          analyzed[item.index] = {
            ...analyzed[item.index],
            analysis: null,
            analysis_failed: true,
            rating_mismatch: false,
          };
        }
      }
    }
  }

  const stats: ProcessingStats = {
    total_reviews: reviews.length,
    ai_calls_made: aiCalls,
    cache_hits: cacheHits,
    processing_time_ms: Date.now() - startTime,
    batches_processed: batchesProcessed,
    mode: "live",
  };

  return { analyzed, stats, warnings: [...warnings] };
}
