import { describe, it, expect } from "vitest";
import { parseCSV, cleanReviews, getAnalyzableReviews } from "@/lib/csv-parser";
import { parseRating } from "@/lib/utils";

// ---------------------------------------------------------------------------
// parseCSV
// ---------------------------------------------------------------------------
describe("parseCSV", () => {
  it("correctly parses valid CSV with headers", () => {
    const csv = [
      "review_id,product,rating,date,review_text",
      'R001,Widget,5,2024-01-01,"Great product"',
      'R002,Gadget,3,2024-01-02,"It was okay"',
    ].join("\n");

    const rows = parseCSV(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].review_id).toBe("R001");
    expect(rows[0].product).toBe("Widget");
    expect(rows[0].review_text).toBe("Great product");
    expect(rows[1].review_id).toBe("R002");
  });

  it("normalises headers (trims, lowercases, replaces spaces with underscores)", () => {
    const csv = [
      " Review ID , Product , Rating , Date , Review Text ",
      "R010,Phone,4,2024-02-01,Nice phone",
    ].join("\n");

    const rows = parseCSV(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].review_id).toBe("R010");
    expect(rows[0].review_text).toBe("Nice phone");
  });

  it("filters out rows without a review_id", () => {
    const csv = [
      "review_id,product,rating,date,review_text",
      "R001,Widget,5,2024-01-01,Good",
      ",,,,Empty row",
    ].join("\n");

    const rows = parseCSV(csv);
    expect(rows).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// cleanReviews — empty detection
// ---------------------------------------------------------------------------
describe("cleanReviews – empty reviews", () => {
  it("flags both empty and whitespace-only review text", () => {
    const raw = [
      { review_id: "R005", product: "A", rating: "4", date: "2024-01-01", review_text: "" },
      { review_id: "EMPTY", product: "B", rating: "3", date: "2024-01-02", review_text: "   " },
      { review_id: "R001", product: "C", rating: "5", date: "2024-01-03", review_text: "Great!" },
    ];

    const cleaned = cleanReviews(raw);
    expect(cleaned.find((r) => r.review_id === "R005")!.is_empty).toBe(true);
    expect(cleaned.find((r) => r.review_id === "EMPTY")!.is_empty).toBe(true);
    expect(cleaned.find((r) => r.review_id === "R001")!.is_empty).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// cleanReviews — duplicate detection
// ---------------------------------------------------------------------------
describe("cleanReviews – duplicate reviews", () => {
  it("detects duplicate reviews with identical text (like R012 and R015)", () => {
    const raw = [
      { review_id: "R012", product: "X", rating: "4", date: "2024-01-01", review_text: "Absolutely love it" },
      { review_id: "R015", product: "X", rating: "4", date: "2024-01-05", review_text: "Absolutely love it" },
    ];

    const cleaned = cleanReviews(raw);
    const r012 = cleaned.find((r) => r.review_id === "R012")!;
    const r015 = cleaned.find((r) => r.review_id === "R015")!;

    // First occurrence is kept, second is duplicate
    expect(r012.is_duplicate).toBe(false);
    expect(r015.is_duplicate).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// cleanReviews — HTML stripping
// ---------------------------------------------------------------------------
describe("cleanReviews – HTML stripping", () => {
  it("strips HTML tags from review text (like R024 with <b> tags)", () => {
    const raw = [
      { review_id: "R024", product: "Z", rating: "5", date: "2024-01-01", review_text: "<b>Bold</b> and <i>italic</i>" },
    ];

    const cleaned = cleanReviews(raw);
    const r024 = cleaned.find((r) => r.review_id === "R024")!;
    expect(r024.has_html).toBe(true);
    expect(r024.cleaned_text).toBe("Bold and italic");
  });
});

// ---------------------------------------------------------------------------
// parseRating
// ---------------------------------------------------------------------------
describe("parseRating", () => {
  it('handles word ratings ("five" -> 5)', () => {
    expect(parseRating("five")).toBe(5);
    expect(parseRating("one")).toBe(1);
    expect(parseRating("Three")).toBe(3);
  });

  it("returns null for missing/undefined/empty ratings", () => {
    expect(parseRating(null)).toBeNull();
    expect(parseRating(undefined)).toBeNull();
    expect(parseRating("")).toBeNull();
  });

  it("parses numeric strings", () => {
    expect(parseRating("4")).toBe(4);
    expect(parseRating("2")).toBe(2);
  });

  it("returns null for out-of-range numbers", () => {
    expect(parseRating(0)).toBeNull();
    expect(parseRating(6)).toBeNull();
    expect(parseRating("99")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getAnalyzableReviews
// ---------------------------------------------------------------------------
describe("getAnalyzableReviews", () => {
  it("filters out empty and duplicate reviews", () => {
    const raw = [
      { review_id: "R001", product: "A", rating: "5", date: "2024-01-01", review_text: "Great product" },
      { review_id: "R005", product: "A", rating: "4", date: "2024-01-02", review_text: "" },
      { review_id: "R010", product: "B", rating: "3", date: "2024-01-03", review_text: "Good stuff" },
      { review_id: "R012", product: "B", rating: "3", date: "2024-01-04", review_text: "Good stuff" }, // duplicate
    ];

    const cleaned = cleanReviews(raw);
    const analyzable = getAnalyzableReviews(cleaned);

    expect(analyzable).toHaveLength(2);
    expect(analyzable.map((r) => r.review_id)).toEqual(["R001", "R010"]);
  });
});
