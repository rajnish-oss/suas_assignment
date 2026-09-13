import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const modelName = "gemini-3.5-flash-lite";

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to your .env file (see .env.example)."
    );
  }
  if (!client) client = new GoogleGenerativeAI(apiKey);
  return client;
}

// Keep this in sync with ExperimentDraftSchema; Gemini does not accept Zod
// schemas, so the response is validated again after it comes back.
const EXTRACTION_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    instrument: { type: SchemaType.STRING, nullable: true },
    timeframe: { type: SchemaType.STRING, nullable: true },
    entryCondition: { type: SchemaType.STRING, nullable: true },
    exitCondition: { type: SchemaType.STRING, nullable: true },
    holdingPeriod: { type: SchemaType.STRING, nullable: true },
    filters: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    coreQuestion: { type: SchemaType.STRING },
  },
  required: [
    "instrument",
    "timeframe",
    "entryCondition",
    "exitCondition",
    "holdingPeriod",
    "filters",
    "coreQuestion",
  ],
} as const;

const EXTRACTION_SYSTEM_INSTRUCTION = `You are a parser for a trading-strategy research tool. You convert a trader's
natural-language question into a strict JSON object. You do not evaluate the
strategy, you do not invent missing details, and you do not add commentary.

Rules:
- Extract only what the user actually stated or unambiguously implied.
- If a field was not mentioned, return null for it (empty string is NOT
  allowed for a missing field - use null).
- "filters" is any additional condition that narrows *when* the strategy is
  allowed to fire, beyond the entry trigger itself (e.g. "during high
  volatility", "RSI < 30", "only in the first hour of trading"). Return an
  empty array if there are none.
- "coreQuestion" is a one-sentence restatement of what the user is trying to
  learn, in your own words.
- Never fabricate an instrument, timeframe, exit condition, or holding
  period that the user did not say or clearly imply.`;

export async function extractExperimentDraft(rawQuery: string) {
  const model = getClient().getGenerativeModel({
    model: modelName,
    systemInstruction: EXTRACTION_SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: EXTRACTION_RESPONSE_SCHEMA,
      temperature: 0.1,
    },
  });

  const result = await model.generateContent(rawQuery);
  const text = result.response.text();
  return JSON.parse(text);
}

// The caller handles the fallback question when this request fails.
export async function generateClarificationQuestion(
  fieldLabel: string,
  knownContext: Record<string, unknown>
) {
  const model = getClient().getGenerativeModel({
    model: modelName,
    generationConfig: { temperature: 0.4 },
  });

  const prompt = `A trader is building a backtest experiment. Here is what we know so far:
${JSON.stringify(knownContext, null, 2)}

We are missing the field "${fieldLabel}". Ask ONE short, specific, plain-English
question to get it from the trader. Do not greet them, do not explain why you're
asking, just ask the question. Keep it under 20 words.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
