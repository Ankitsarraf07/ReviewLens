import { describe, it, expect } from "vitest";
import { chunk, hashText, isEmptyReview, stripHtml } from "@/lib/utils";

// ---------------------------------------------------------------------------
// chunk
// ---------------------------------------------------------------------------
describe("chunk", () => {
  it("splits an array into batches of the given size", () => {
    const result = chunk([1, 2, 3, 4, 5], 2);
    expect(result).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns single chunk when array is smaller than size", () => {
    expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
  });

  it("returns empty array for empty input", () => {
    expect(chunk([], 3)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// hashText
// ---------------------------------------------------------------------------
describe("hashText", () => {
  it("produces consistent hashes for the same input", () => {
    const h1 = hashText("hello world");
    const h2 = hashText("hello world");
    expect(h1).toBe(h2);
  });

  it("is case-insensitive (trims and lowercases)", () => {
    const h1 = hashText("Hello World");
    const h2 = hashText("  hello world  ");
    expect(h1).toBe(h2);
  });

  it("produces different hashes for different inputs", () => {
    const h1 = hashText("hello");
    const h2 = hashText("world");
    expect(h1).not.toBe(h2);
  });
});

// ---------------------------------------------------------------------------
// isEmptyReview
// ---------------------------------------------------------------------------
describe("isEmptyReview", () => {
  it("returns true for empty string", () => {
    expect(isEmptyReview("")).toBe(true);
  });

  it("returns true for whitespace-only string", () => {
    expect(isEmptyReview("   \t\n  ")).toBe(true);
  });

  it("returns true for null", () => {
    expect(isEmptyReview(null)).toBe(true);
  });

  it("returns true for undefined", () => {
    expect(isEmptyReview(undefined)).toBe(true);
  });

  it("returns false for emoji-only text (👍👍)", () => {
    expect(isEmptyReview("👍👍")).toBe(false);
  });

  it("returns false for real text", () => {
    expect(isEmptyReview("Great product")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// stripHtml
// ---------------------------------------------------------------------------
describe("stripHtml", () => {
  it("removes HTML tags properly", () => {
    expect(stripHtml("<b>Bold</b> text")).toBe("Bold text");
  });

  it("handles multiple nested tags", () => {
    expect(stripHtml("<div><p>Hello</p></div>")).toBe("Hello");
  });

  it("handles self-closing tags", () => {
    expect(stripHtml("Line one<br/>Line two")).toBe("Line oneLine two");
  });

  it("returns plain text unchanged", () => {
    expect(stripHtml("no tags here")).toBe("no tags here");
  });
});
