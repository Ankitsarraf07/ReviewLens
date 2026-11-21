import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
const mocks = vi.hoisted(() => ({ batch: vi.fn() }));
vi.mock("@/lib/gemini", () => ({ analyzeReviewBatch: mocks.batch }));
import { analyzeAllReviews, checkRatingMismatch } from "@/lib/analyzer";
import { closeDb, getCachedAnalysis, setCachedAnalysis } from "@/lib/cache";
import { cleanReviews, parseCSV } from "@/lib/csv-parser";
const valid = { sentiment: "negative" as const, topics: ["quality" as const], summary: "Broken item.", needs_reply: true };
beforeEach(() => {
  closeDb(); vi.clearAllMocks(); vi.stubEnv("REVIEW_CACHE_PATH", ":memory:");
  mocks.batch.mockImplementation(async (reviews, _retry, count) => { count(); return { results: new Map(reviews.map((r: { id: string }) => [r.id, valid])) }; });
});
afterEach(() => { closeDb(); vi.unstubAllEnvs(); });

describe("batching and persistent cache", () => {
  it("analyses the exact sample once and serves the second upload from SQLite", async () => {
    const reviews = cleanReviews(parseCSV(readFileSync("public/reviews.csv", "utf8")));
    expect(reviews).toHaveLength(30); expect(reviews.filter((r) => r.is_empty).map((r) => r.review_id)).toEqual(["R005"]); expect(reviews.filter((r) => r.is_duplicate).map((r) => r.review_id)).toEqual(["R015"]);
    const first = await analyzeAllReviews(reviews); const second = await analyzeAllReviews(reviews);
    expect(first.stats.ai_calls_made).toBe(6); expect(first.analyzed.filter((r) => r.analysis)).toHaveLength(28);
    expect(mocks.batch.mock.calls.every((c) => c[0].length <= 5)).toBe(true);
    expect(second.stats.cache_hits).toBe(28); expect(second.stats.ai_calls_made).toBe(0);
  });
  it("counts actual attempts instead of batch wrappers", async () => {
    mocks.batch.mockImplementation(async (reviews, _retry, count) => { count(); count(); return { results: new Map([[reviews[0].id, valid]]) }; });
    const data = await analyzeAllReviews(cleanReviews([{ review_id: "A", product: "X", rating: 1, date: "", review_text: "Broken" }]));
    expect(data.stats.ai_calls_made).toBe(2); expect(data.stats.batches_processed).toBe(1);
  });
  it("does not cache failed analyses", async () => {
    mocks.batch.mockImplementation(async (reviews, _retry, count) => { count(); return { results: new Map([[reviews[0].id, null]]), error: "Unavailable" }; });
    const reviews = cleanReviews([{ review_id: "A", product: "X", rating: 1, date: "", review_text: "Broken" }]);
    expect((await analyzeAllReviews(reviews)).analyzed[0].analysis_failed).toBe(true);
    expect((await analyzeAllReviews(reviews)).stats.cache_hits).toBe(0);
  });
  it("isolates results for different configured models", () => {
    vi.stubEnv("GEMINI_MODEL", "model-a"); setCachedAnalysis("hash", "text", valid);
    vi.stubEnv("GEMINI_MODEL", "model-b"); expect(getCachedAnalysis("hash")).toBeNull();
  });
  it("compares low, middle and high ratings consistently", () => {
    expect(checkRatingMismatch(5, "negative")).toBe(true); expect(checkRatingMismatch(3, "positive")).toBe(true);
    expect(checkRatingMismatch(3, "neutral")).toBe(false); expect(checkRatingMismatch(null, "negative")).toBe(false);
  });
});
