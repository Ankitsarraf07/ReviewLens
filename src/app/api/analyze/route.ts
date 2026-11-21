import { NextRequest, NextResponse } from "next/server";
import { analyzeAllReviews } from "@/lib/analyzer";
import { ApiResponse, AnalyzedReview, CleanedReview, ProcessingStats } from "@/types";
import { AnalyzeRequestSchema } from "@/lib/schema";
import { cleanReviews } from "@/lib/csv-parser";
import { AIConfigurationError, describeAIError } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const checked = AnalyzeRequestSchema.safeParse(body);

    if (!checked.success) {
      return NextResponse.json(
        { success: false, error: "Provide 1-500 reviews with valid IDs and text up to 10,000 characters." } satisfies ApiResponse<never>,
        { status: 400 }
      );
    }

    // Recompute flags and cleaned text. Never trust client-supplied skip flags.
    const reviews: CleanedReview[] = cleanReviews(checked.data.reviews);

    const { analyzed, stats, warnings } = await analyzeAllReviews(reviews);

    return NextResponse.json({
      success: true,
      data: { analyzed, stats, warnings },
    } satisfies ApiResponse<{ analyzed: AnalyzedReview[]; stats: ProcessingStats; warnings: string[] }>);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: describeAIError(error),
      } satisfies ApiResponse<never>,
      { status: error instanceof AIConfigurationError ? 503 : 500 }
    );
  }
}
