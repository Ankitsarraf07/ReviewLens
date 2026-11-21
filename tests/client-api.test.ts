import { afterEach, describe, expect, it, vi } from "vitest";
import { uploadAndAnalyze, requestReply, analyzeReviews } from "@/lib/client-api";
const review = { review_id: "A", product: "Mug", rating: 1, date: "2026-10-01", review_text: "Broken", original_rating: "1", cleaned_text: "Broken", is_duplicate: false, is_empty: false, has_html: false };
const analyzed = { ...review, analysis: { sentiment: "negative", topics: ["quality"], summary: "Broken mug.", needs_reply: true }, analysis_failed: false, rating_mismatch: false };
const stats = { total_reviews: 1, ai_calls_made: 1, cache_hits: 0, processing_time_ms: 5, batches_processed: 1, mode: "live" };
const ok = (data: unknown) => new Response(JSON.stringify({ success: true, data }), { status: 200 });
afterEach(() => vi.unstubAllGlobals());

describe("frontend and API contracts", () => {
  it("passes data.analyzed to the dashboard after upload", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(ok({ reviews: [review], total: 1, empty: 0, duplicates: 0, warnings: [] })).mockResolvedValueOnce(ok({ analyzed: [analyzed], stats }));
    vi.stubGlobal("fetch", fetcher); const progress = vi.fn();
    const result = await uploadAndAnalyze(new File(["csv"], "reviews.csv"), progress);
    expect(result.analyzed[0].review_id).toBe("A"); expect(progress).toHaveBeenCalledOnce();
    expect(JSON.parse(fetcher.mock.calls[1][1].body).reviews).toEqual([review]);
  });
  it("extracts the reply string from data.reply", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok({ reply: "Please contact support." })));
    expect(await requestReply({ review_text: "Broken", sentiment: "negative", summary: "Broken." })).toBe("Please contact support.");
  });
  it("rejects a stale analysis response shape instead of crashing the dashboard", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok({ reviews: [analyzed], stats })));
    await expect(analyzeReviews([review])).rejects.toThrow("unexpected response");
  });
  it("surfaces unsuccessful reply responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false, error: "Rate limit reached" }), { status: 502 })));
    await expect(requestReply({ review_text: "Broken", sentiment: "negative", summary: "Broken." })).rejects.toThrow("Rate limit");
  });
  it("keeps sample reply templates separate from real AI requests", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    expect(await requestReply({ review_text: "Broken", sentiment: "negative", summary: "Broken." }, "demo")).toContain("order details"); expect(fetcher).not.toHaveBeenCalled();
  });
});
