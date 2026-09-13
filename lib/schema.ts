import { z } from "zod";

export const ExperimentDraftSchema = z.object({
  instrument: z.string().nullable(),
  timeframe: z.string().nullable(),
  entryCondition: z.string().nullable(),
  exitCondition: z.string().nullable(),
  holdingPeriod: z.string().nullable(),
  filters: z.array(z.string()).default([]),
  coreQuestion: z.string(),
});
export type ExperimentDraft = z.infer<typeof ExperimentDraftSchema>;

export const ExperimentSchema = z.object({
  instrument: z.string(),
  timeframe: z.string(),
  entryCondition: z.string(),
  exitCondition: z.string(),
  holdingPeriod: z.string(),
  filters: z.array(z.string()),
  coreQuestion: z.string(),
});
export type Experiment = z.infer<typeof ExperimentSchema>;

export const CRITICAL_FIELDS = [
  "instrument",
  "timeframe",
  "entryCondition",
  "exitCondition",
  "holdingPeriod",
] as const;
export type CriticalField = (typeof CRITICAL_FIELDS)[number];

export const CLARIFICATION_PROMPTS: Record<CriticalField, string> = {
  instrument: "Which instrument should this test - e.g. NIFTY, BANKNIFTY, a specific stock?",
  timeframe: "What timeframe should the strategy run on - e.g. Daily candles, 15-minute, 1-hour?",
  entryCondition: "What exact condition should trigger an entry?",
  exitCondition: "How should a position be exited - a target/stop-loss, a fixed number of bars, or a signal-based exit?",
  holdingPeriod: "How long should the position be held - intraday, a fixed number of days, or until the exit condition fires?",
};

export interface CompletenessResult {
  isComplete: boolean;
  missingFields: CriticalField[];
}

export function checkCompleteness(draft: ExperimentDraft): CompletenessResult {
  const missingFields = CRITICAL_FIELDS.filter((field) => {
    const value = draft[field];
    return value === null || value === undefined || value.trim().length === 0;
  });
  return { isComplete: missingFields.length === 0, missingFields };
}

export function finalizeDraft(draft: ExperimentDraft): Experiment {
  const { isComplete, missingFields } = checkCompleteness(draft);
  if (!isComplete) {
    throw new Error(`Cannot finalize an incomplete draft. Missing: ${missingFields.join(", ")}`);
  }
  return ExperimentSchema.parse(draft);
}

export function mergeClarificationAnswer(
  draft: ExperimentDraft,
  field: CriticalField,
  answer: string
): ExperimentDraft {
  return { ...draft, [field]: answer.trim() };
}
