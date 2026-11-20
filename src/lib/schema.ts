import { z } from "zod/v4";

// Allowed values for sentiment
export const VALID_SENTIMENTS = ["positive", "neutral", "negative"] as const;

// Allowed values for topics
export const VALID_TOPICS = [
  "quality",
  "delivery",
  "price",
  "packaging",
  "support",
  "size_fit",
  "other",
] as const;

// Zod schema for a single review analysis from the AI
export const ReviewAnalysisSchema = z.strictObject({
  sentiment: z.enum(VALID_SENTIMENTS),
  topics: z
    .array(z.enum(VALID_TOPICS))
    .min(1, "At least one topic is required"),
  summary: z.string().trim().min(1, "Summary cannot be empty").max(500)
    .refine((s) => !/[\r\n]/.test(s), "Summary must be one line"),
  needs_reply: z.boolean(),
});

// Schema for validating a batch response (array of analyses)
export const BatchAnalysisSchema = z.array(ReviewAnalysisSchema);

export const RawReviewSchema = z.object({
  review_id: z.string().trim().min(1).max(100),
  product: z.string().max(200).optional().default("Unknown Product"),
  rating: z.union([z.string().max(40), z.number(), z.null()]).optional().default(null),
  date: z.string().max(100).optional().default(""),
  review_text: z.string().max(10000).optional().default(""),
});
export const AnalyzeRequestSchema = z.object({ reviews: z.array(RawReviewSchema).min(1).max(500) });
export const ReplyRequestSchema = z.object({
  review_text: z.string().trim().min(1).max(10000), sentiment: z.enum(VALID_SENTIMENTS),
  summary: z.string().trim().min(1).max(500),
});
export const CleanedReviewSchema = RawReviewSchema.extend({
  product: z.string(), date: z.string(), review_text: z.string(),
  rating: z.number().int().min(1).max(5).nullable(),
  original_rating: z.union([z.string(), z.number(), z.null()]),
  is_duplicate: z.boolean(), is_empty: z.boolean(), has_html: z.boolean(), cleaned_text: z.string(),
});
export const AnalyzedReviewSchema = CleanedReviewSchema.extend({
  analysis: ReviewAnalysisSchema.nullable(), analysis_failed: z.boolean(), rating_mismatch: z.boolean(),
});
export const ProcessingStatsSchema = z.object({
  total_reviews: z.number(), ai_calls_made: z.number(), cache_hits: z.number(),
  processing_time_ms: z.number(), batches_processed: z.number(), mode: z.enum(["live", "demo"]),
});
export const AnalysisPayloadSchema = z.object({ analyzed: z.array(AnalyzedReviewSchema), stats: ProcessingStatsSchema, warnings: z.array(z.string()).default([]) });
export const UploadPayloadSchema = z.object({
  reviews: z.array(CleanedReviewSchema), total: z.number(), duplicates: z.number(), empty: z.number(), warnings: z.array(z.string()),
});

// Validate a single analysis result
export function validateAnalysis(
  data: unknown
): { success: true; data: z.infer<typeof ReviewAnalysisSchema> } | { success: false; error: string } {
  const result = ReviewAnalysisSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.issues.map((i) => i.message).join("; "),
  };
}

// Validate a batch of analysis results
export function validateBatchAnalysis(
  data: unknown
): { success: true; data: z.infer<typeof BatchAnalysisSchema> } | { success: false; error: string } {
  const result = BatchAnalysisSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.issues.map((i) => i.message).join("; "),
  };
}
