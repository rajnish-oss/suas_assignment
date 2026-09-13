import type { Experiment } from "@/types/experiment";

const ROWS: { key: keyof Experiment; label: string }[] = [
  { key: "instrument", label: "Instrument" },
  { key: "timeframe", label: "Timeframe" },
  { key: "entryCondition", label: "Entry" },
  { key: "exitCondition", label: "Exit" },
  { key: "holdingPeriod", label: "Holding period" },
];

export function ExperimentCard({ experiment }: { experiment: Experiment }) {
  return (
    <div className="max-w-[85%] rounded-md border border-ink-600 bg-ink-800 shadow-panel overflow-hidden">
      <div className="border-l-2 border-signal-green">
        <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
          <div>
            <p className="text-xs text-paper-300">Experiment ready</p>
            <p className="mt-1 text-[15px] text-paper-100 leading-snug">{experiment.coreQuestion}</p>
          </div>
          <span className="shrink-0 rounded-sm border border-signal-green/40 px-2 py-0.5 text-[11px] text-signal-green">
            complete
          </span>
        </div>

        <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 px-5 py-4 border-t border-ink-600">
          {ROWS.map(({ key, label }) => (
            <RowPair key={key} label={label} value={experiment[key] as string} />
          ))}

          <dt className="text-xs text-paper-300 self-start pt-0.5">Filters</dt>
          <dd className="font-mono text-sm text-paper-100">
            {experiment.filters.length === 0 ? (
              <span className="text-paper-300">none</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {experiment.filters.map((f) => (
                  <span
                    key={f}
                    className="rounded-sm bg-ink-700 border border-ink-600 px-2 py-0.5 text-xs"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </dd>
        </dl>
      </div>
    </div>
  );
}

function RowPair({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-xs text-paper-300 self-start pt-0.5">{label}</dt>
      <dd className="font-mono text-sm text-paper-100">{value}</dd>
    </>
  );
}
