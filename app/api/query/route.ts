import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { startConversation } from "@/lib/extraction";

const BodySchema = z.object({
  query: z.string().min(3, "Query is too short."),
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
    const result = await startConversation(parsed.data.query);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/query]", err);
    const message = err instanceof Error ? err.message : "Extraction failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
