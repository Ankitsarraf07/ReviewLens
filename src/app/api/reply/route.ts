import { NextRequest, NextResponse } from "next/server";
import { generateReply } from "@/lib/gemini";
import { ApiResponse } from "@/types";
import { ReplyRequestSchema } from "@/lib/schema";
import { AIConfigurationError } from "@/lib/gemini";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const checked = ReplyRequestSchema.safeParse(await request.json().catch(() => null));
    if (!checked.success) return NextResponse.json({ success: false, error: "Provide review text, a valid sentiment, and a summary." }, { status: 400 });
    const { review_text, sentiment, summary } = checked.data;

    if (!review_text || !sentiment || !summary) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: review_text, sentiment, summary",
        } satisfies ApiResponse<never>,
        { status: 400 }
      );
    }

    const validSentiments = ["positive", "neutral", "negative"];
    if (!validSentiments.includes(sentiment)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid sentiment. Must be one of: ${validSentiments.join(", ")}`,
        } satisfies ApiResponse<never>,
        { status: 400 }
      );
    }

    const reply = await generateReply(review_text, sentiment, summary);

    return NextResponse.json({
      success: true,
      data: { reply },
    } satisfies ApiResponse<{ reply: string }>);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate reply",
      } satisfies ApiResponse<never>,
      { status: error instanceof AIConfigurationError ? 503 : 502 }
    );
  }
}
