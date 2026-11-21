import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { cleanReviews, parseCSV } from "@/lib/csv-parser";
import { demoReviews } from "@/lib/demo";

export const runtime = "nodejs";
export async function GET() {
  const csv = await readFile(path.join(process.cwd(), "public", "reviews.csv"), "utf8");
  return NextResponse.json({ success: true, data: {
    analyzed: demoReviews(cleanReviews(parseCSV(csv))),
    stats: { total_reviews: 30, ai_calls_made: 0, cache_hits: 0, processing_time_ms: 0, batches_processed: 0, mode: "demo" },
    warnings: [],
  } });
}
