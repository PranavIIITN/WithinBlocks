import { searchCustomers, searchProducts } from "../invoice/invoice.service.js";

// ===============================================================
// ENTITY RESOLUTION
// ===============================================================
// Reuses the search functions that already power the CreateInvoice
// typeahead. They are already scoped by companyId, so resolution can
// never cross a tenant boundary.
//
// Three outcomes, never a guess:
//   ok        — exactly one confident match
//   none      — nothing matched
//   ambiguous — several matched, the user must pick
// ===============================================================

const pickMatch = (candidates, query) => {
  if (candidates.length === 0) return { status: "none" };
  if (candidates.length === 1) return { status: "ok", match: candidates[0] };

  // Several hits, but one is an exact name match ("Raj Traders" over
  // "Raj Traders Export"). Treat that as confident.
  const needle = query.trim().toLowerCase();
  const exact = candidates.filter((c) => c.name.trim().toLowerCase() === needle);
  if (exact.length === 1) return { status: "ok", match: exact[0] };

  return { status: "ambiguous", candidates };
};

export const resolveCustomer = async (companyId, name) => {
  const candidates = await searchCustomers(companyId, name);
  const result = pickMatch(candidates, name);

  return {
    field: "customer",
    query: name,
    ...result,
    candidates:
      result.status === "ambiguous"
        ? result.candidates.map((c) => ({
            id: c.id,
            name: c.name,
            state: c.state,
            gstin: c.gstin,
          }))
        : undefined,
  };
};

export const resolveProduct = async (companyId, name) => {
  const candidates = await searchProducts(companyId, name);
  const result = pickMatch(candidates, name);

  return {
    field: "product",
    query: name,
    ...result,
    candidates:
      result.status === "ambiguous"
        ? result.candidates.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            stock: p.stock,
          }))
        : undefined,
  };
};

/**
 * Resolve every line of a create_invoice request.
 * Returns { items, unresolved } — items are only usable if unresolved is empty.
 */
export const resolveInvoiceItems = async (companyId, rawItems) => {
  const resolutions = await Promise.all(
    rawItems.map(async (item) => ({ item, resolution: await resolveProduct(companyId, item.name) }))
  );

  const unresolved = resolutions
    .filter(({ resolution }) => resolution.status !== "ok")
    .map(({ resolution }) => resolution);

  const items = resolutions
    .filter(({ resolution }) => resolution.status === "ok")
    .map(({ item, resolution }) => ({
      productId: resolution.match.id,
      quantity: Math.max(1, Math.round(item.quantity)),
      // Price and tax come from the catalogue, never from the model.
      unitPrice: resolution.match.price,
      tax: resolution.match.tax ?? null,
    }));

  return { items, unresolved };
};