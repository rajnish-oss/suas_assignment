"use client";

import { useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { ChatInput } from "@/components/ChatInput";
import { ClarificationPrompt } from "@/components/ClarificationPrompt";
import { MessageBubble } from "@/components/MessageBubble";
import { HistoryRail } from "@/components/HistoryRail";
import type { ChatMessage, CriticalField, HistoryItem, QueryApiResponse } from "@/types/experiment";

const EXAMPLE_QUERY = "Does buying NIFTY after a 1% fall work better during high-volatility periods?";

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pendingField, setPendingField] = useState<CriticalField | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    refreshHistory();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function refreshHistory() {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      setHistory(data.experiments ?? []);
    } catch {
      // history is a nice-to-have; a failed fetch shouldn't block the chat
    }
  }

  function pushMessage(msg: ChatMessage) {
    setMessages((prev) => [...prev, msg]);
  }

  async function handleNewQuery(text: string) {
    pushMessage({ id: uuid(), role: "user", content: text });
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      const data: QueryApiResponse = await res.json();
      handleApiResponse(data);
    } catch {
      setError("Something went wrong reaching the extraction service.");
    } finally {
      setLoading(false);
    }
  }

  async function handleClarificationReply(text: string) {
    if (!conversationId) return;
    pushMessage({ id: uuid(), role: "user", content: text });
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, answer: text }),
      });
      const data: QueryApiResponse = await res.json();
      handleApiResponse(data);
    } catch {
      setError("Something went wrong saving that answer.");
    } finally {
      setLoading(false);
    }
  }

  function handleApiResponse(data: QueryApiResponse) {
    if ("error" in data) {
      setError(data.error);
      return;
    }

    setConversationId(data.conversationId);

    if (data.status === "needs_clarification") {
      setPendingField(data.field);
      pushMessage({ id: uuid(), role: "assistant", content: data.question });
      return;
    }

    setPendingField(null);
    pushMessage({
      id: uuid(),
      role: "assistant",
      content: "Every required field is filled in. Here's the experiment:",
      experiment: data.experiment,
    });
    refreshHistory();
  }

  function startFresh() {
    setMessages([]);
    setConversationId(null);
    setPendingField(null);
    setError(null);
  }

  function loadFromHistory(item: HistoryItem) {
    startFresh();
    setMessages([
      { id: uuid(), role: "user", content: item.rawQuery },
      {
        id: uuid(),
        role: "assistant",
        content: "Loaded from your saved experiments:",
        experiment: item,
      },
    ]);
  }

  const isMidConversation = pendingField !== null;

  return (
    <div className="flex h-screen">
      <HistoryRail items={history} onSelect={loadFromHistory} />

      <main className="flex-1 flex flex-col">
        <header className="border-b border-ink-600 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[15px] text-paper-100">Strategy Bench</p>
            <p className="text-xs text-paper-300 mt-0.5">
              Describe a trading idea in plain English and it becomes a structured experiment.
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={startFresh}
              className="text-xs text-paper-300 hover:text-paper-100 border border-ink-600 rounded-md px-3 py-1.5"
            >
              New query
            </button>
          )}
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6">
          <div className="mx-auto max-w-2xl flex flex-col gap-4">
            {messages.length === 0 && (
              <button
                onClick={() => handleNewQuery(EXAMPLE_QUERY)}
                className="text-left rounded-md border border-dashed border-ink-600 px-4 py-3 text-sm text-paper-300 hover:text-paper-100 hover:border-ink-500"
              >
                Try: “{EXAMPLE_QUERY}”
              </button>
            )}
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-md border border-ink-600 px-4 py-2.5 text-sm text-paper-300">
                  Thinking…
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-md border border-signal-coral/40 bg-signal-coral/10 px-4 py-2.5 text-sm text-signal-coral">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-ink-600 px-6 py-4">
          <div className="mx-auto max-w-2xl">
            {pendingField && <ClarificationPrompt field={pendingField} />}
            <ChatInput
              disabled={loading}
              placeholder={
                isMidConversation
                  ? "Type your answer…"
                  : "Ask a trading research question…"
              }
              onSubmit={isMidConversation ? handleClarificationReply : handleNewQuery}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
