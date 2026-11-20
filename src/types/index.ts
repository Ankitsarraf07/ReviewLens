// Raw review as parsed from CSV
export interface RawReview {
  review_id: string;
  product: string;
  rating: string | number | null;
  date: string;
  review_text: string;
}

// Cleaned review ready for analysis
export interface CleanedReview {
  review_id: string;
  product: string;
  rating: number | null; // null = missing/invalid
  date: string;
  review_text: string;
  is_duplicate: boolean;
  is_empty: boolean;
  original_rating: string | number | null;
  has_html: boolean;
  cleaned_text: string; // text with HTML stripped
}

// AI analysis result for a single review
export interface ReviewAnalysis {
  sentiment: "positive" | "neutral" | "negative";
  topics: Array<"quality" | "delivery" | "price" | "packaging" | "support" | "size_fit" | "other">;
  summary: string;
  needs_reply: boolean;
}

// A fully analyzed review
export interface AnalyzedReview extends CleanedReview {
  analysis: ReviewAnalysis | null;
  analysis_failed: boolean;
  rating_mismatch: boolean; // bonus: rating disagrees with sentiment
}

// Dashboard summary stats
export interface DashboardSummary {
  total_reviews: number;
  analyzed_count: number;
  positive_pct: number;
  neutral_pct: number;
  negative_pct: number;
  needs_reply_count: number;
  skipped_count: number; // empty + duplicates
  failed_count: number;
  rating_agreement_pct: number | null; // null when no comparable ratings
}

// Top insight (complaint or praise)
export interface TopInsight {
  text: string;
  count: number;
  product: string;
}

// Processing stats (bonus: cost and speed log)
export interface ProcessingStats {
  total_reviews: number;
  ai_calls_made: number;
  cache_hits: number;
  processing_time_ms: number;
  batches_processed: number;
  mode: "live" | "demo";
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
