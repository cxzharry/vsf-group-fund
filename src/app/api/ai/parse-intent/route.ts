import { NextResponse } from "next/server";
import { parseIntentLocal } from "@/lib/ai-intent-parser";

/**
 * POST /api/ai/parse-intent
 * Parses a Vietnamese chat message to detect bill creation intent.
 * Uses local regex parser (fast, free). LLM fallback can be added later.
 */
export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    const result = parseIntentLocal(message.trim());

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse intent" },
      { status: 500 }
    );
  }
}
