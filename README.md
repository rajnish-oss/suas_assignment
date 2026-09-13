# Strategy Bench

Turns a natural-language trading question into a structured, backtestable
experiment. Missing details are collected through short follow-up questions before the experiment is saved.

## Setup

```bash
npm install
cp .env.example .env        # add your GEMINI_API_KEY
npx prisma db push          # creates dev.db (SQLite) from prisma/schema.prisma
npm run dev
```

Open http://localhost:3000.

Swap `DATABASE_URL` in `.env` for a Postgres connection string to run this
in production — no schema changes needed, `prisma/schema.prisma` sticks to
portable types.

## Request flow

```
user message
    │
    ▼
POST /api/query ──▶ lib/extraction.ts: startConversation()
    │                   │
    │                   ├─▶ lib/gemini.ts: extractExperimentDraft()
    │                   │     Gemini structured-output call (JSON mode,
    │                   │     responseSchema) → raw JSON
    │                   │
    │                   ├─▶ lib/schema.ts: ExperimentDraftSchema.parse()
    │                   │     Zod re-validates the raw JSON. Missing fields
    │                   │     come back as null, never invented.
    │                   │
    │                   ├─▶ checkCompleteness()
    │                   │     Are instrument / timeframe / entryCondition /
    │                   │     exitCondition / holdingPeriod all non-null?
    │                   │
    │                   └─▶ Conversation row persisted either way
    │                         (draftJson, isComplete, missingFields,
    │                          pendingField)
    ▼
isComplete? ──no──▶ generateClarificationQuestion() phrases ONE targeted
    │                 follow-up for the single next missing field, with a
    │                 static fallback (CLARIFICATION_PROMPTS) if that call
    │                 fails. Returned to the client as { status:
    │                 "needs_clarification", field, question }.
    │
    │               user answers ──▶ POST /api/clarify ──▶
    │               continueConversation(): merges the answer directly
    │               into draft[pendingField] (no re-extraction — a short
    │               reply like "3 days" is bound to the field we asked
    │               about, not re-parsed from scratch), re-checks
    │               completeness, loops or finalizes.
    │
   yes
    ▼
finalizeDraft() (Zod ExperimentSchema, no nulls allowed) → Experiment row
persisted → { status: "complete", experiment } → Experiment Preview Card
```

## Notes

- `ExperimentDraftSchema` allows missing values. `ExperimentSchema` is used
  only after all required fields are present.
- `CRITICAL_FIELDS` controls which fields are collected during clarification.
- Clarification replies are merged into the field stored in `pendingField`.
- Conversations and finalized experiments are stored through Prisma.

## Project layout

```
app/
  page.tsx                 chat UI, client-side orchestration
  api/query/route.ts        POST — new query → extraction → clarify or complete
  api/clarify/route.ts       POST — merge a clarification answer
  api/history/route.ts       GET  — past finalized experiments
lib/
  schema.ts                 Zod schemas + completeness/merge logic
  gemini.ts                 Gemini structured-output calls
  extraction.ts              orchestration: extract → check → persist
  db.ts                      Prisma client singleton
components/
  ChatInput.tsx, MessageBubble.tsx, ClarificationPrompt.tsx,
  ExperimentCard.tsx, HistoryRail.tsx
prisma/schema.prisma        Conversation / Message / Experiment models
types/experiment.ts          client-safe types shared by page.tsx + components
```

## Extending

- **More critical fields** (e.g. `positionSizing`, `benchmark`): add to
  `CRITICAL_FIELDS` and `CLARIFICATION_PROMPTS` in `lib/schema.ts`, add the
  matching property to both Zod schemas and the Gemini `responseSchema` in
  `lib/gemini.ts`.
- **Running the actual backtest**: `finalizeDraft()` output (`Experiment`)
  is the contract to hand to a backtest engine — it's already the shape a
  worker/queue job would consume.
- **Multiple missing fields asked at once**: change `nextFieldToAsk` in
  `lib/extraction.ts` to return the full array and adjust `pendingField` to
  store a list; the merge logic in `continueConversation` would need to
  parse a compound answer instead of a 1:1 bind.
