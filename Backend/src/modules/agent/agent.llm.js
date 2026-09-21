import { GoogleGenerativeAI } from "@google/generative-ai";
import { geminiResponseSchema, llmOutputSchema } from "./agent.schemas.js";

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    "GEMINI_API_KEY is not set. Add it to Backend/.env and make sure you're running " +
      "`npm run dev` (which loads .env via -r dotenv/config)."
  );
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// gemini-3.1-flash-lite (GA since May 2026) is the current pick: light,
// cheap, and less contended than heavier Flash models — a good fit for a
// task this narrow (one-sentence intent parsing).
//
// gemini-1.5-flash and gemini-2.5-flash have both been retired/pulled
// (2.5-flash was removed early and inconsistently ahead of its official
// Oct 16, 2026 retirement date — see the Google AI forum for reports).
// If GEMINI_MODEL ever 404s with "no longer available", check
// ai.google.dev/gemini-api/docs/models for the current free-tier model
// and update .env — no code change needed, this only reads the env var.
const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

const model = genAI.getGenerativeModel({
  model: MODEL,
  generationConfig: {
    temperature: 0,
    responseMimeType: "application/json",
    responseSchema: geminiResponseSchema,
  },
});

const SYSTEM_PROMPT = `You are WithinAgent, the intent parser inside WithinBlocks, a GST invoicing app for Indian small businesses.

Your ONLY job is to turn one sentence of user input into a structured action. You do not execute anything, you do not reply conversationally, and you do not do arithmetic.

Choose exactly one action:

- "create_invoice" — the user wants to bill a customer.
  Put the customer's name in "customer" exactly as the user typed it.
  Put each line in "items" as { name, quantity }. Default quantity to 1 if unstated.

- "add_product" — the user wants to create a new product in the catalogue.
  Fill "product". Leave any attribute the user did not state as null.
  "tax" is a GST percentage (0, 5, 12, 18, 28), not a rupee amount.

- "add_customer" — the user wants to add a new customer/contact, with no
  mention of billing them right now. Put the name in "customer".
  (If they want to bill someone who turns out to be new, that's still
  "create_invoice" — new-customer creation for an invoice is handled
  separately, after the customer fails to resolve. Only use "add_customer"
  when the user is explicitly just adding a contact, e.g. "add a new
  customer named X", "save Y as a customer".)

- "query_invoices" — the user wants to see invoices.
  Use filters.status for words like unpaid, paid, overdue, draft, cancelled.
  Use filters.customer if they named a customer.

- "query_products" — the user wants to see products / stock.
  For "low stock" or "running out", set filters.lowStockThreshold (default 10).
  Use filters.search for a name fragment.

- "unknown" — anything you cannot confidently map, or anything outside
  invoices/products/customers. Put a short, friendly one-line explanation in
  "clarification" telling the user what you can do instead.

HARD RULES:
- NEVER invent an id, a price, a rate, a tax amount or a total. You do not have
  access to the catalogue. Prices and GST are looked up by the server.
- NEVER guess a customer or product that the user did not mention.
- If a required piece of information is missing (e.g. "create an invoice" with no
  customer), use "unknown" and ask for the missing piece in "clarification".
- Amounts are rupees. "10 Mango Pickle" means quantity 10 of "Mango Pickle".
- Set every field you are not using to null.`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Turn a natural-language message into a validated structured action.
 * One LLM call, no chaining — the whole round trip has a <2-3s budget.
 * Retries once on a transient overload (503) before giving up, since Gemini's
 * free tier occasionally returns "high demand, try again" under load.
 */
export const parseIntent = async (message, context = {}) => {
  const contextLine = context.page
    ? `The user is currently on the "${context.page}" page of the app.`
    : "";

  const userContent = [contextLine, message].filter(Boolean).join("\n\n");

  let result;
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Gemini has no separate "system" role on this SDK path — prepend the
      // instructions to the single user turn instead. There is only ever one
      // turn per call, so this is equivalent in effect to a system prompt.
      result = await model.generateContent([
        { text: SYSTEM_PROMPT },
        { text: `User message:\n${userContent}` },
      ]);
      break;
    } catch (err) {
      const status = err?.status ?? err?.statusCode;
      const isOverloaded = status === 503 || /overload|high demand/i.test(err?.message || "");
      if (isOverloaded && attempt < maxAttempts) {
        await sleep(600 * attempt); // brief backoff, then one retry
        continue;
      }
      const error = new Error(
        isOverloaded
          ? "The assistant is busy right now — please try again in a few seconds."
          : "Could not reach the assistant. Please try again."
      );
      error.statusCode = isOverloaded ? 503 : 502;
      throw error;
    }
  }

  const raw = result.response.text();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const error = new Error("The assistant returned an unreadable response. Please try rephrasing.");
    error.statusCode = 502;
    throw error;
  }

  // Gemini's responseSchema enforces types and enums, but "required" only
  // covers "action" here (nullable siblings aren't strictly enforceable the
  // way OpenAI's strict mode does it) — so backfill any field the model
  // left out entirely before validating against the shared zod schema.
  const normalized = {
    action: parsed.action ?? "unknown",
    customer: parsed.customer ?? null,
    items: parsed.items ?? null,
    product: parsed.product ?? null,
    filters: parsed.filters ?? null,
    clarification: parsed.clarification ?? null,
  };

  const validated = llmOutputSchema.safeParse(normalized);
  if (!validated.success) {
    const error = new Error("Could not understand that request. Please try rephrasing.");
    error.statusCode = 422;
    throw error;
  }

  return validated.data;
};