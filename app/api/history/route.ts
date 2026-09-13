import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const experiments = await prisma.experiment.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
    include: { conversation: { select: { rawQuery: true } } },
  });

  const payload = experiments.map((e) => ({
    id: e.id,
    conversationId: e.conversationId,
    rawQuery: e.conversation.rawQuery,
    instrument: e.instrument,
    timeframe: e.timeframe,
    entryCondition: e.entryCondition,
    exitCondition: e.exitCondition,
    holdingPeriod: e.holdingPeriod,
    filters: JSON.parse(e.filters) as string[],
    coreQuestion: e.coreQuestion,
    createdAt: e.createdAt,
  }));

  return NextResponse.json({ experiments: payload });
}
