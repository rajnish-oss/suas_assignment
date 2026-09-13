"use client";

import type { HistoryItem } from "@/types/experiment";

export function HistoryRail({
  items,
  onSelect,
}: {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}) {
  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-ink-600 bg-ink-900">
      <div className="px-4 pt-5 pb-3">
        <p className="text-sm text-paper-100">Past experiments</p>
        <p className="text-xs text-paper-300 mt-0.5">{items.length} saved</p>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-4">
        {items.length === 0 && (
          <p className="px-2 py-4 text-xs text-paper-300">
            Finalized experiments will show up here once you complete one.
          </p>
        )}
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="w-full text-left rounded-md px-3 py-2.5 mb-1 hover:bg-ink-800 transition-colors"
          >
            <p className="text-sm text-paper-100 truncate">{item.rawQuery}</p>
            <p className="text-xs text-paper-300 font-mono mt-0.5 truncate">
              {item.instrument} on {item.timeframe}
            </p>
          </button>
        ))}
      </div>
    </aside>
  );
}
