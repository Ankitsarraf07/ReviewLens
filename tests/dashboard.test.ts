import { describe, expect, it } from "vitest";
import { deriveInsights, deriveSummary } from "@/lib/dashboard";
import type { AnalyzedReview } from "@/types";
const review = (summary: string): AnalyzedReview => ({ review_id: summary, product: "Mug", rating: null, date: "", review_text: summary, original_rating: null, cleaned_text: summary, is_empty: false, is_duplicate: false, has_html: false, analysis: { sentiment: "negative", topics: ["delivery"], summary, needs_reply: true }, analysis_failed: false, rating_mismatch: false });
describe("dashboard calculations", () => {
  it("groups differently worded complaints under the same topic", () => { expect(deriveInsights([review("Late parcel."), review("Took three weeks.")], "negative")[0].count).toBe(2); });
  it("uses successful reviews for percentages and reports unknown rating agreement", () => {
    const summary = deriveSummary([review("Late parcel."), { ...review("Failed"), analysis: null, analysis_failed: true }]);
    expect(summary.negative_pct).toBe(100); expect(summary.failed_count).toBe(1); expect(summary.rating_agreement_pct).toBeNull();
  });
});
