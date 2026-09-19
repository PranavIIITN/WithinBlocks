import { parseIntent } from "./agent.llm.js";
import { resolveCustomer, resolveInvoiceItems } from "./agent.resolvers.js";
import {
  PREVIEWERS,
  EXECUTORS,
  queryInvoices,
  queryProducts,
} from "./agent.actions.js";

// ===============================================================
// ORCHESTRATOR
// ===============================================================
//   message -> parseIntent (LLM)
//           -> resolve names to ids (DB, company-scoped)
//           -> preview (write actions) or result (read actions)
//
// Four response shapes, always with a `status`:
//   preview  — structured preview, awaiting confirmation
//   clarify  — ambiguous/unknown entity, user must choose
//   result   — read-only answer, or a completed write
//   error    — validation or execution failure
// ===============================================================

const clarify = (message, resolutions = []) => ({
  status: "clarify",
  message,
  clarify: resolutions,
});

export const runAgent = async (ctx, message, context = {}) => {
  const intent = await parseIntent(message, context);

  switch (intent.action) {
    // -----------------------------------------------------------
    case "create_invoice": {
      if (!intent.customer) {
        return clarify("Which customer is this invoice for?");
      }
      if (!intent.items || intent.items.length === 0) {
        return clarify(`What should I put on the invoice for ${intent.customer}?`);
      }

      const customer = await resolveCustomer(ctx.companyId, intent.customer);
      if (customer.status === "none") {
        return clarify(`I couldn't find a customer called "${intent.customer}".`, [customer]);
      }
      if (customer.status === "ambiguous") {
        return clarify(`Which "${intent.customer}" did you mean?`, [customer]);
      }

      const { items, unresolved } = await resolveInvoiceItems(ctx.companyId, intent.items);
      if (unresolved.length > 0) {
        const names = unresolved.map((u) => `"${u.query}"`).join(", ");
        return clarify(
          unresolved.some((u) => u.status === "ambiguous")
            ? `I need help matching ${names} to a product.`
            : `I couldn't find ${names} in your catalogue.`,
          unresolved
        );
      }

      return PREVIEWERS.create_invoice(ctx, {
        customerId: customer.match.id,
        items,
      });
    }

    // -----------------------------------------------------------
    case "add_product": {
      const p = intent.product;
      if (!p?.name) return clarify("What should the product be called?");
      if (p.price === null || p.price === undefined) {
        return clarify(`What's the selling price for ${p.name}?`);
      }

      return PREVIEWERS.add_product(ctx, {
        name: p.name,
        price: p.price,
        stock: p.stock ?? 0,
        tax: p.tax,
        unit: p.unit,
        description: p.description,
        priceType: "EXCLUSIVE",
      });
    }

    // -----------------------------------------------------------
    case "query_invoices":
      return queryInvoices(ctx, intent.filters || {});

    case "query_products":
      return queryProducts(ctx, intent.filters || {});

    // -----------------------------------------------------------
    default:
      return {
        status: "clarify",
        message:
          intent.clarification ||
          "I can create invoices, add products, and look up invoices or stock. Try: \"Create invoice for Raj Traders with 10 Mango Pickle\".",
        clarify: [],
      };
  }
};

/**
 * Recompute a preview from an edited payload. The user changed a quantity or
 * a price in the panel — the totals must be recalculated server-side so the
 * GST math stays in one place.
 */
export const previewAgentAction = async (ctx, action, data) => {
  const previewer = PREVIEWERS[action];
  if (!previewer) {
    const error = new Error(`Cannot preview action "${action}"`);
    error.statusCode = 400;
    throw error;
  }
  return previewer(ctx, data);
};

/**
 * Execute a confirmed action. The payload is re-validated and re-executed
 * through the normal service layer, which re-checks that every id belongs to
 * ctx.companyId — so an edited (or tampered) payload cannot cross tenants.
 */
export const confirmAgentAction = async (ctx, action, data) => {
  const executor = EXECUTORS[action];
  if (!executor) {
    const error = new Error(`Cannot execute action "${action}"`);
    error.statusCode = 400;
    throw error;
  }
  return executor(ctx, data);
};