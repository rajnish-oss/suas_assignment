"use client";

import { FormEvent, useState } from "react";

export function ChatInput({
  placeholder,
  disabled,
  onSubmit,
}: {
  placeholder: string;
  disabled: boolean;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-md border border-ink-600 bg-ink-800 px-3.5 py-2.5 text-[15px] text-paper-100 placeholder:text-paper-300/70 focus:border-signal-green disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || value.trim().length === 0}
        className="rounded-md bg-signal-green px-4 py-2.5 text-sm font-medium text-ink-950 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </form>
  );
}
