import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("@/lib/analyzer", () => ({ analyzeAllReviews: vi.fn(async (reviews) => ({ analyzed: reviews.map((r: object) => ({ ...r, analysis: null, analysis_failed: true, rating_mismatch: false })), stats: { total_reviews: reviews.length, ai_calls_made: 1, cache_hits: 0, processing_time_ms: 1, batches_processed: 1, mode: "live" }, warnings: [] })) }));
import { POST as analyze } from "@/app/api/analyze/route";
import { POST as upload } from "@/app/api/upload/route";
import { POST as reply } from "@/app/api/reply/route";
import ProductPage from "@/app/products/[product]/page";
const post = (path: string, body: unknown) => new NextRequest(`http://localhost/api/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
describe("backend request validation", () => {
  it("opens encoded product links using the actual product name", async () => {
    const page = await ProductPage({ params: Promise.resolve({ product: "Wireless%20Earbuds%20X2" }) });
    expect(page.props.product).toBe("Wireless Earbuds X2");
  });
  it("rejects malformed review records with 400", async () => { expect((await analyze(post("analyze", { reviews: [null] }))).status).toBe(400); });
  it("recomputes cleaning and ignores forged skip flags", async () => {
    const res = await analyze(post("analyze", { reviews: [{ review_id: "A", review_text: "<b>Broken</b>", is_empty: true, is_duplicate: true }] }));
    const body = await res.json(); expect(body.data.analyzed[0].is_empty).toBe(false); expect(body.data.analyzed[0].cleaned_text).toBe("Broken");
  });
  it("rejects missing CSV columns", async () => {
    const form = new FormData(); form.append("file", new File(["review_id\nA"], "wrong.csv"));
    const res = await upload(new NextRequest("http://localhost/api/upload", { method: "POST", body: form }));
    expect(res.status).toBe(400); expect((await res.json()).error).toContain("Missing CSV columns");
  });
  it("rejects invalid reply fields before making an AI call", async () => { expect((await reply(post("reply", { review_text: {}, sentiment: "happy" }))).status).toBe(400); });
});
