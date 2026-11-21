import { NextResponse } from "next/server";
import { getCacheStats } from "@/lib/cache";
import { ApiResponse } from "@/types";

export async function GET() {
  try {
    const stats = getCacheStats();

    return NextResponse.json({
      success: true,
      data: stats,
    } satisfies ApiResponse<{ total_entries: number }>);
  } catch (error) {
    console.error("Cache stats error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to retrieve cache stats",
      } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
