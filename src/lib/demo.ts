import type { AnalyzedReview, CleanedReview, ReviewAnalysis } from "@/types";

// Hand-authored preview fixtures, never written to the live AI cache.
const samples: Record<string, [ReviewAnalysis["sentiment"], ReviewAnalysis["topics"], string, boolean]> = {
  R001: ["positive", ["quality", "price"], "Soft, colourfast bedsheets offer good value.", false],
  R002: ["negative", ["size_fit"], "The customer received queen size instead of the ordered king size.", true],
  R003: ["negative", ["delivery"], "The customer sarcastically complains about a three-week delivery.", true],
  R004: ["neutral", ["quality", "packaging"], "The product is good but arrived in torn, poor packaging.", true],
  R006: ["positive", ["quality"], "The attractive mugs matched the photos and made a successful gift.", false],
  R007: ["negative", ["quality", "support"], "A broken mug remains unrefunded after slow customer support.", true],
  R008: ["negative", ["quality"], "Both mug handles broke within a week despite the five-star rating.", true],
  R009: ["positive", ["other"], "The thumbs-up emojis express approval.", false],
  R010: ["neutral", ["quality", "price"], "The mugs are good quality but overpriced compared with local shops.", true],
  R011: ["positive", ["quality", "price"], "Good sound and battery life offer value despite a cheap-feeling case.", false],
  R012: ["negative", ["quality"], "The left earbud stopped working after two days.", true],
  R013: ["negative", ["quality", "support"], "Frequent connection drops persist and support has been unhelpful.", true],
  R014: ["positive", ["quality", "size_fit", "delivery"], "Strong bass, comfortable fit and next-day delivery pleased the customer.", false],
  R016: ["neutral", ["quality"], "The sound is good but the battery runs out quickly.", true],
  R017: ["positive", ["quality", "size_fit"], "Light, comfortable shoes performed well during a half marathon.", false],
  R018: ["negative", ["size_fit", "support"], "The misleading size chart led to tight shoes, although exchange was smooth.", true],
  R019: ["positive", ["quality"], "Good-looking shoes have good grip with expected sole wear after daily use.", false],
  R020: ["negative", ["quality"], "The customer received a used pair of shoes with muddy soles.", true],
  R021: ["neutral", ["quality", "delivery"], "The product is average and the delivery person was rude.", true],
  R022: ["positive", ["quality"], "The customer considers these the best shoes they have bought online.", false],
  R023: ["positive", ["quality", "other"], "The sturdy organiser has a neat design but confusing assembly instructions.", true],
  R024: ["positive", ["quality"], "The bamboo organiser keeps the desk tidy and smells pleasant.", false],
  R025: ["negative", ["size_fit"], "The organiser is smaller than the photos suggest and barely holds pens.", true],
  R026: ["positive", ["price", "quality"], "The product is good quality despite a slightly high price.", false],
  R027: ["negative", ["delivery", "support"], "A package marked delivered is missing and the support ticket is unanswered.", true],
  R028: ["positive", ["quality", "size_fit", "price"], "Premium bedsheets are recommended despite tight pillow covers.", true],
  R029: ["neutral", ["quality", "other"], "The nice mugs are not microwave safe, which the listing failed to disclose.", true],
  R030: ["negative", ["quality"], "The earbuds sound good but their microphone is unusable for calls.", true],
};

export function demoReviews(reviews: CleanedReview[]): AnalyzedReview[] {
  return reviews.map((r) => {
    const sample = !r.is_empty && !r.is_duplicate ? samples[r.review_id] : undefined;
    const analysis: ReviewAnalysis | null = sample ? { sentiment: sample[0], topics: sample[1], summary: sample[2], needs_reply: sample[3] } : null;
    const expected = r.rating === null ? null : r.rating >= 4 ? "positive" : r.rating <= 2 ? "negative" : "neutral";
    return { ...r, analysis, analysis_failed: false, rating_mismatch: Boolean(analysis && expected && expected !== analysis.sentiment) };
  });
}
