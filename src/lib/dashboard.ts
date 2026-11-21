import type { AnalyzedReview, DashboardSummary } from "@/types";

export function deriveSummary(reviews: AnalyzedReview[]): DashboardSummary {
  const analyzed = reviews.filter((r) => r.analysis);
  const pct = (sentiment: string) => analyzed.length ? analyzed.filter((r) => r.analysis!.sentiment === sentiment).length / analyzed.length * 100 : 0;
  const rated = analyzed.filter((r) => r.rating !== null);
  return {
    total_reviews: reviews.length, analyzed_count: analyzed.length,
    positive_pct: pct("positive"), neutral_pct: pct("neutral"), negative_pct: pct("negative"),
    needs_reply_count: analyzed.filter((r) => r.analysis!.needs_reply).length,
    skipped_count: reviews.filter((r) => r.is_empty || r.is_duplicate).length,
    failed_count: reviews.filter((r) => r.analysis_failed).length,
    rating_agreement_pct: rated.length ? rated.filter((r) => !r.rating_mismatch).length / rated.length * 100 : null,
  };
}

const labels: Record<string, string> = { quality: "Product quality", delivery: "Delivery", price: "Price and value", packaging: "Packaging", support: "Customer support", size_fit: "Size and fit", other: "Other feedback" };
export function deriveInsights(reviews: AnalyzedReview[], sentiment: "positive" | "negative") {
  const themes = new Map<string, { count: number; products: Set<string>; example: string }>();
  for (const review of reviews) {
    if (review.analysis?.sentiment !== sentiment) continue;
    for (const topic of new Set(review.analysis.topics)) {
      const item = themes.get(topic) || { count: 0, products: new Set<string>(), example: review.analysis.summary };
      item.count++; item.products.add(review.product); themes.set(topic, item);
    }
  }
  return [...themes].map(([topic, item]) => ({ text: `${labels[topic]}: ${item.example}`, count: item.count, products: [...item.products] }))
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text)).slice(0, 3);
}
