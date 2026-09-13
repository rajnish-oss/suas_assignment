import type { CriticalField } from "@/types/experiment";

const FIELD_LABELS: Record<CriticalField, string> = {
  instrument: "Instrument",
  timeframe: "Timeframe",
  entryCondition: "Entry condition",
  exitCondition: "Exit condition",
  holdingPeriod: "Holding period",
};

export function ClarificationPrompt({ field }: { field: CriticalField }) {
  return (
    <div className="flex items-center gap-2 px-1 pb-2 text-xs text-signal-amber">
      <span className="h-1.5 w-1.5 rounded-full bg-signal-amber" />
      <span>
        Waiting on <span className="font-mono">{FIELD_LABELS[field]}</span> to complete the experiment
      </span>
    </div>
  );
}
