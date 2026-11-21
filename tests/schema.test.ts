import { describe, it, expect } from "vitest";
import { validateAnalysis, validateBatchAnalysis } from "@/lib/schema";

// ---------------------------------------------------------------------------
// Helper: a valid analysis object
// ---------------------------------------------------------------------------
function validAnalysis() {
  return {
    sentiment: "positive" as const,
    topics: ["quality" as const, "price" as const],
    summary: "Good quality and fair price.",
    needs_reply: false,
  };
}

// ---------------------------------------------------------------------------
// validateAnalysis
// ---------------------------------------------------------------------------
describe("validateAnalysis", () => {
  it.each(["   ", "One line\nAnother line"])("rejects a blank or multiline summary: %s", (summary) => { expect(validateAnalysis({ ...validAnalysis(), summary }).success).toBe(false); });
  it("rejects extra AI fields", () => { expect(validateAnalysis({ ...validAnalysis(), injected: true }).success).toBe(false); });
  it("passes with a fully valid analysis object", () => {
    const result = validateAnalysis(validAnalysis());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sentiment).toBe("positive");
      expect(result.data.topics).toContain("quality");
    }
  });

  it("fails with an invalid sentiment value", () => {
    const result = validateAnalysis({ ...validAnalysis(), sentiment: "happy" });
    expect(result.success).toBe(false);
  });

  it("fails with an invalid topic value", () => {
    const result = validateAnalysis({
      ...validAnalysis(),
      topics: ["quality", "shipping"], // "shipping" not in allowed list
    });
    expect(result.success).toBe(false);
  });

  it("fails with an empty topics array", () => {
    const result = validateAnalysis({ ...validAnalysis(), topics: [] });
    expect(result.success).toBe(false);
  });

  it("fails with missing required fields", () => {
    const result = validateAnalysis({ sentiment: "positive" });
    expect(result.success).toBe(false);
  });

  it("fails when summary is empty string", () => {
    const result = validateAnalysis({ ...validAnalysis(), summary: "" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateBatchAnalysis
// ---------------------------------------------------------------------------
describe("validateBatchAnalysis", () => {
  it("passes with a valid array of analyses", () => {
    const result = validateBatchAnalysis([
      validAnalysis(),
      { ...validAnalysis(), sentiment: "negative", topics: ["delivery"], summary: "Late delivery." },
    ]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
    }
  });

  it("fails when one item in the array is invalid", () => {
    const result = validateBatchAnalysis([
      validAnalysis(),
      { ...validAnalysis(), sentiment: "terrible" }, // invalid
    ]);
    expect(result.success).toBe(false);
  });
});
