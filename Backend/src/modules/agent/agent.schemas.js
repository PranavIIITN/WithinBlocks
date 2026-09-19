import { z } from "zod";

// ===============================================================
// WHAT THE LLM IS ALLOWED TO SAY
// ===============================================================
// The model may only emit NAMES and QUANTITIES. It never emits an
// id, a unitPrice, a tax rate or a companyId — those are resolved
// server-side from the database. A hallucinated name is harmless
// (it resolves to zero matches -> clarification). A hallucinated
// id or price would be a silently wrong invoice.
// ===============================================================

export const ACTIONS = [
  "create_invoice",
  "add_product",
  "query_invoices",
  "query_products",
  "unknown",
];

export const llmOutputSchema = z.object({
  action: z.enum(ACTIONS),
  customer: z.string().min(1).nullable(),
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        quantity: z.number().positive(),
      })
    )
    .nullable(),
  product: z
    .object({
      name: z.string().min(1),
      price: z.number().nonnegative().nullable(),
      stock: z.number().int().nonnegative().nullable(),
      tax: z.number().min(0).max(100).nullable(),
      unit: z.string().nullable(),
      description: z.string().nullable(),
    })
    .nullable(),
  filters: z
    .object({
      status: z
        .enum(["DRAFT", "UNPAID", "PAID", "OVERDUE", "CANCELLED"])
        .nullable(),
      customer: z.string().nullable(),
      lowStockThreshold: z.number().int().positive().nullable(),
      search: z.string().nullable(),
    })
    .nullable(),
  clarification: z.string().nullable(),
});

// ===============================================================
// GEMINI SCHEMA
// ===============================================================
// Gemini's responseSchema is an OpenAPI-3.0-style subset: it does not
// support ["string","null"] unions like OpenAI's json_schema mode does.
// "Optional" is expressed with `nullable: true` on a single-typed field
// instead. This mirrors llmJsonSchema field-for-field, just in that dialect.
// ===============================================================
export const geminiResponseSchema = {
  type: "OBJECT",
  properties: {
    action: { type: "STRING", enum: ACTIONS },
    customer: { type: "STRING", nullable: true },
    items: {
      type: "ARRAY",
      nullable: true,
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          quantity: { type: "NUMBER" },
        },
        required: ["name", "quantity"],
      },
    },
    product: {
      type: "OBJECT",
      nullable: true,
      properties: {
        name: { type: "STRING" },
        price: { type: "NUMBER", nullable: true },
        stock: { type: "INTEGER", nullable: true },
        tax: { type: "NUMBER", nullable: true },
        unit: { type: "STRING", nullable: true },
        description: { type: "STRING", nullable: true },
      },
      required: ["name"],
    },
    filters: {
      type: "OBJECT",
      nullable: true,
      properties: {
        status: {
          type: "STRING",
          nullable: true,
          enum: ["DRAFT", "UNPAID", "PAID", "OVERDUE", "CANCELLED"],
        },
        customer: { type: "STRING", nullable: true },
        lowStockThreshold: { type: "INTEGER", nullable: true },
        search: { type: "STRING", nullable: true },
      },
    },
    clarification: { type: "STRING", nullable: true },
  },
  required: ["action"],
};

// The JSON Schema handed to OpenAI structured outputs. In strict mode
// every property must be listed in `required`; "optional" is expressed
// as a nullable type instead.
export const llmJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["action", "customer", "items", "product", "filters", "clarification"],
  properties: {
    action: { type: "string", enum: ACTIONS },
    customer: { type: ["string", "null"] },
    items: {
      type: ["array", "null"],
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "quantity"],
        properties: {
          name: { type: "string" },
          quantity: { type: "number" },
        },
      },
    },
    product: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["name", "price", "stock", "tax", "unit", "description"],
      properties: {
        name: { type: "string" },
        price: { type: ["number", "null"] },
        stock: { type: ["integer", "null"] },
        tax: { type: ["number", "null"] },
        unit: { type: ["string", "null"] },
        description: { type: ["string", "null"] },
      },
    },
    filters: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["status", "customer", "lowStockThreshold", "search"],
      properties: {
        status: {
          type: ["string", "null"],
          enum: ["DRAFT", "UNPAID", "PAID", "OVERDUE", "CANCELLED", null],
        },
        customer: { type: ["string", "null"] },
        lowStockThreshold: { type: ["integer", "null"] },
        search: { type: ["string", "null"] },
      },
    },
    clarification: { type: ["string", "null"] },
  },
};

// ===============================================================
// WHAT THE CLIENT IS ALLOWED TO SEND BACK
// ===============================================================
// /agent/preview and /agent/confirm take the *resolved* payload the
// server produced (possibly edited by the user). These are re-validated
// and re-executed through the normal service layer, which re-checks
// that every id belongs to the caller's companyId — so an edited or
// tampered payload can never reach another tenant's data.
// ===============================================================

export const invoicePayloadSchema = z.object({
  customerId: z.string().uuid(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().nonnegative(),
        tax: z.number().min(0).max(100).nullable().optional(),
      })
    )
    .min(1, "An invoice needs at least one item"),
  status: z.enum(["DRAFT", "UNPAID"]).optional(),
  dueDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const productPayloadSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  price: z.number().nonnegative("Price cannot be negative"),
  stock: z.number().int().nonnegative().default(0),
  tax: z.number().min(0).max(100).nullable().optional(),
  unit: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  priceType: z.enum(["INCLUSIVE", "EXCLUSIVE"]).default("EXCLUSIVE"),
  ean: z.string().nullable().optional(),
});

export const confirmSchema = z.object({
  action: z.enum(["create_invoice", "add_product"]),
  data: z.unknown(),
});