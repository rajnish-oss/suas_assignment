import { prisma } from "@/lib/db";
import { extractExperimentDraft, generateClarificationQuestion } from "@/lib/gemini";
import {
  CLARIFICATION_PROMPTS,
  CriticalField,
  ExperimentDraft,
  ExperimentDraftSchema,
  checkCompleteness,
  finalizeDraft,
  mergeClarificationAnswer,
} from "@/lib/schema";

export type QueryResponse =
  | {
      status: "needs_clarification";
      conversationId: string;
      question: string;
      field: CriticalField;
      draft: ExperimentDraft;
    }
  | {
      status: "complete";
      conversationId: string;
      experiment: ReturnType<typeof finalizeDraft>;
    };

function nextFieldToAsk(missingFields: CriticalField[]): CriticalField {
  return missingFields[0];
}

async function resolveClarificationQuestion(field: CriticalField, draft: ExperimentDraft) {
  try {
    const question = await generateClarificationQuestion(field, draft);
    if (question && question.length > 0) return question;
  } catch {
  }
  return CLARIFICATION_PROMPTS[field];
}

async function persistExperiment(conversationId: string, draft: ExperimentDraft) {
  const experiment = finalizeDraft(draft);
  await prisma.experiment.upsert({
    where: { conversationId },
    create: { conversationId, ...experiment, filters: JSON.stringify(experiment.filters) },
    update: { ...experiment, filters: JSON.stringify(experiment.filters) },
  });
  return experiment;
}

export async function startConversation(rawQuery: string): Promise<QueryResponse> {
  const raw = await extractExperimentDraft(rawQuery);
  const draft = ExperimentDraftSchema.parse(raw);
  const { isComplete, missingFields } = checkCompleteness(draft);

  const conversation = await prisma.conversation.create({
    data: {
      rawQuery,
      draftJson: JSON.stringify(draft),
      isComplete,
      missingFields: JSON.stringify(missingFields),
      pendingField: isComplete ? null : nextFieldToAsk(missingFields),
      messages: { create: { role: "user", content: rawQuery } },
    },
  });

  if (isComplete) {
    const experiment = await persistExperiment(conversation.id, draft);
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: "All required fields captured. Rendering experiment preview.",
      },
    });
    return { status: "complete", conversationId: conversation.id, experiment };
  }

  const field = nextFieldToAsk(missingFields);
  const question = await resolveClarificationQuestion(field, draft);
  await prisma.message.create({
    data: { conversationId: conversation.id, role: "assistant", content: question },
  });

  return { status: "needs_clarification", conversationId: conversation.id, question, field, draft };
}

export async function continueConversation(
  conversationId: string,
  answer: string
): Promise<QueryResponse> {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) {
    throw new Error(`No conversation found for id ${conversationId}`);
  }
  if (conversation.isComplete || !conversation.pendingField) {
    throw new Error("This conversation has no pending clarification to answer.");
  }

  const field = conversation.pendingField as CriticalField;
  const priorDraft = ExperimentDraftSchema.parse(JSON.parse(conversation.draftJson));
  const mergedDraft = mergeClarificationAnswer(priorDraft, field, answer);
  const { isComplete, missingFields } = checkCompleteness(mergedDraft);

  await prisma.message.create({
    data: { conversationId, role: "user", content: answer },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      draftJson: JSON.stringify(mergedDraft),
      isComplete,
      missingFields: JSON.stringify(missingFields),
      pendingField: isComplete ? null : nextFieldToAsk(missingFields),
    },
  });

  if (isComplete) {
    const experiment = await persistExperiment(conversationId, mergedDraft);
    await prisma.message.create({
      data: {
        conversationId,
        role: "assistant",
        content: "All required fields captured. Rendering experiment preview.",
      },
    });
    return { status: "complete", conversationId, experiment };
  }

  const nextField = nextFieldToAsk(missingFields);
  const question = await resolveClarificationQuestion(nextField, mergedDraft);
  await prisma.message.create({
    data: { conversationId, role: "assistant", content: question },
  });

  return {
    status: "needs_clarification",
    conversationId,
    question,
    field: nextField,
    draft: mergedDraft,
  };
}
