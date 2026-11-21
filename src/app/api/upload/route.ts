import { NextRequest, NextResponse } from "next/server";
import { parseCSVReport, cleanReviews } from "@/lib/csv-parser";
import { ApiResponse, CleanedReview } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: "No CSV file provided" } satisfies ApiResponse<never>,
        { status: 400 }
      );
    }

    if (file.size > 2 * 1024 * 1024) return NextResponse.json({ success: false, error: "CSV must be smaller than 2 MB." }, { status: 413 });
    const csvContent = await file.text();

    if (!csvContent.trim()) {
      return NextResponse.json(
        { success: false, error: "CSV file is empty" } satisfies ApiResponse<never>,
        { status: 400 }
      );
    }

    const { reviews: rawReviews, warnings } = parseCSVReport(csvContent);

    if (rawReviews.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid reviews found in CSV" } satisfies ApiResponse<never>,
        { status: 400 }
      );
    }

    const cleanedReviews = cleanReviews(rawReviews);

    return NextResponse.json({
      success: true,
      data: {
        reviews: cleanedReviews,
        total: cleanedReviews.length,
        duplicates: cleanedReviews.filter((r) => r.is_duplicate).length,
        empty: cleanedReviews.filter((r) => r.is_empty).length,
        warnings,
      },
    } satisfies ApiResponse<{ reviews: CleanedReview[]; total: number; duplicates: number; empty: number; warnings: string[] }>);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process CSV file",
      } satisfies ApiResponse<never>,
      { status: 400 }
    );
  }
}
