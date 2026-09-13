export interface ExperimentDraft {
  instrument: string | null;
  timeframe: string | null;
  entryCondition: string | null;
  exitCondition: string | null;
  holdingPeriod: string | null;
  filters: string[];
  coreQuestion: string;
}

export interface Experiment {
  instrument: string;
  timeframe: string;
  entryCondition: string;
  exitCondition: string;
  holdingPeriod: string;
  filters: string[];
  coreQuestion: string;
}

export type CriticalField =
  | "instrument"
  | "timeframe"
  | "entryCondition"
  | "exitCondition"
  | "holdingPeriod";

export type QueryApiResponse =
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
      experiment: Experiment;
    }
  | { error: string };

export interface HistoryItem extends Experiment {
  id: string;
  conversationId: string;
  rawQuery: string;
  createdAt: string;
}

/** One bubble in the chat transcript. */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Present only on the assistant message that renders the final card. */
  experiment?: Experiment;
}
