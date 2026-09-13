import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { continueConversation } from "@/lib/extraction";

const BodySchema = z.object({
  conversationId: z.string().uuid(),
  answer: z.string().min(1, "Answer cannot be empty."),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request body." },
      { status: 400 }
    );
  }

  try {
    const result = await continueConversation(parsed.data.conversationId, parsed.data.answer);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/clarify]", err);
    const message = err instanceof Error ? err.message : "Failed to merge clarification.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
