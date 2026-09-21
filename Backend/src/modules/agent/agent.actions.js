import {
  createInvoice,
  computeInvoiceTotals,
  checkStock,
  getAllInvoices,
} from "../invoice/invoice.service.js";
import { createProduct, getAllProducts } from "../product/product.service.js";
import { createCustomer } from "../customer/customer.service.js";
import { resolveInvoiceItems } from "./agent.resolvers.js";
import {
  invoicePayloadSchema,
  productPayloadSchema,
  customerPayloadWithResumeSchema,
  customerPreviewSchema,
} from "./agent.schemas.js";

// ===============================================================
// ACTION REGISTRY
// ===============================================================
// Every action goes through the SAME service functions the REST API
// uses. The agent never touches Prisma. companyId/userId always come
// from the verified JWT, never from the model or the client body.
// ===============================================================

const round = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// ---------------------------------------------------------------
// CREATE INVOICE — preview
// ---------------------------------------------------------------
export const previewInvoice = async ({ companyId }, payload) => {
  const parsed = invoicePayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0].message,
    };
  }

  const totals = await computeInvoiceTotals(
    companyId,
    parsed.data.customerId,
    parsed.data.items
  );

  // Pre-flight: deductStock only throws at execution time, and a preview
  // that later fails on confirm is exactly the trust problem we're avoiding.
  const stockProblems = await checkStock(companyId, parsed.data.items);

  return {
    status: "preview",
    action: "create_invoice",
    needsConfirmation: true,
    // Echo back the exact payload to send to /agent/confirm.
    data: {
      customerId: parsed.data.customerId,
      items: totals.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        tax: i.tax,
      })),
      status: parsed.data.status || "UNPAID",
      notes: parsed.data.notes ?? null,
      dueDate: parsed.data.dueDate ?? null,
    },
    preview: {
      customer: {
        id: totals.customer.id,
        name: totals.customer.name,
        state: totals.customer.state,
        gstin: totals.customer.gstin,
      },
      taxType: totals.isInterState ? "IGST" : "CGST_SGST",
      items: totals.items.map((i) => ({
        productId: i.productId,
        name: i.productName,
        hsn: i.hsn,
        unit: i.unit,
        quantity: i.quantity,
        unitPrice: round(i.unitPrice),
        taxRate: i.tax,
        cgst: round(i.cgst),
        sgst: round(i.sgst),
        igst: round(i.igst),
        total: round(i.total),
        availableStock: i.stock,
      })),
      subtotal: round(totals.subtotal),
      cgst: round(totals.cgst),
      sgst: round(totals.sgst),
      igst: round(totals.igst),
      taxAmount: round(totals.taxAmount),
      totalAmount: round(totals.totalAmount),
    },
    warnings: stockProblems.map(
      (p) => `Only ${p.available} of ${p.name} in stock — invoice asks for ${p.requested}.`
    ),
    blocked: stockProblems.length > 0,
  };
};

// ---------------------------------------------------------------
// CREATE INVOICE — execute
// ---------------------------------------------------------------
export const executeInvoice = async ({ companyId, userId }, payload) => {
  const parsed = invoicePayloadSchema.safeParse(payload);
  if (!parsed.success) {
    const error = new Error(parsed.error.issues[0].message);
    error.statusCode = 400;
    throw error;
  }

  const invoice = await createInvoice(companyId, userId, parsed.data);

  return {
    status: "result",
    action: "create_invoice",
    message: `Invoice ${invoice.invoiceNo} created for ${invoice.customer.name}.`,
    data: invoice,
    link: `/invoices/${invoice.id}`,
  };
};

// ---------------------------------------------------------------
// ADD PRODUCT — preview
// ---------------------------------------------------------------
export const previewProduct = async (_ctx, payload) => {
  const parsed = productPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0].message,
    };
  }

  return {
    status: "preview",
    action: "add_product",
    needsConfirmation: true,
    data: parsed.data,
    preview: parsed.data,
    warnings:
      parsed.data.tax === null || parsed.data.tax === undefined
        ? ["No GST rate set — invoices for this product will be taxed at 0%."]
        : [],
    blocked: false,
  };
};

// ---------------------------------------------------------------
// ADD PRODUCT — execute
// ---------------------------------------------------------------
export const executeProduct = async ({ companyId }, payload) => {
  const parsed = productPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    const error = new Error(parsed.error.issues[0].message);
    error.statusCode = 400;
    throw error;
  }

  const product = await createProduct(companyId, parsed.data);

  return {
    status: "result",
    action: "add_product",
    message: `${product.name} added to your catalogue.`,
    data: product,
    link: `/products`,
  };
};

// ---------------------------------------------------------------
// QUERIES — read-only, no confirmation needed
// ---------------------------------------------------------------
export const queryInvoices = async ({ companyId }, filters = {}) => {
  let invoices = await getAllInvoices(companyId);

  if (filters.status) {
    invoices = invoices.filter((i) => i.status === filters.status);
  }
  if (filters.customer) {
    const needle = filters.customer.toLowerCase();
    invoices = invoices.filter((i) => i.customer?.name?.toLowerCase().includes(needle));
  }

  const rows = invoices.slice(0, 25).map((i) => ({
    id: i.id,
    invoiceNo: i.invoiceNo,
    customer: i.customer?.name,
    status: i.status,
    totalAmount: round(i.totalAmount),
    createdAt: i.createdAt,
    link: `/invoices/${i.id}`,
  }));

  return {
    status: "result",
    action: "query_invoices",
    message: rows.length
      ? `Found ${invoices.length} invoice${invoices.length === 1 ? "" : "s"}${
          filters.status ? ` marked ${filters.status.toLowerCase()}` : ""
        }.`
      : "No invoices matched that.",
    table: {
      columns: ["invoiceNo", "customer", "status", "totalAmount"],
      rows,
      totalCount: invoices.length,
    },
  };
};

export const queryProducts = async ({ companyId }, filters = {}) => {
  let products = await getAllProducts(companyId);

  if (filters.lowStockThreshold) {
    products = products.filter((p) => p.stock <= filters.lowStockThreshold);
  }
  if (filters.search) {
    const needle = filters.search.toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(needle));
  }

  const rows = products.slice(0, 25).map((p) => ({
    id: p.id,
    name: p.name,
    stock: p.stock,
    price: round(p.price),
    tax: p.tax,
    link: `/products/${p.id}/edit`,
  }));

  return {
    status: "result",
    action: "query_products",
    message: rows.length
      ? `Found ${products.length} product${products.length === 1 ? "" : "s"}${
          filters.lowStockThreshold ? ` at or below ${filters.lowStockThreshold} in stock` : ""
        }.`
      : "No products matched that.",
    table: {
      columns: ["name", "stock", "price", "tax"],
      rows,
      totalCount: products.length,
    },
  };
};

// ---------------------------------------------------------------
// ADD CUSTOMER — preview
// ---------------------------------------------------------------
// Offered by agent.service.js when an invoice's customer doesn't resolve.
// resumeInvoiceItems (if present) is carried through unchanged so confirm
// can pick the original invoice back up — never re-interpreted or re-sent
// through the LLM, so it can't drift from what the user actually typed.
export const previewCustomer = async (_ctx, payload) => {
  const parsed = customerPreviewSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0].message,
    };
  }

  const missingState = !parsed.data.state;

  return {
    status: "preview",
    action: "add_customer",
    needsConfirmation: true,
    data: parsed.data,
    preview: {
      name: parsed.data.name,
      state: parsed.data.state ?? null,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      gstin: parsed.data.gstin ?? null,
      resumingInvoiceFor: parsed.data.resumeInvoiceItems?.length
        ? parsed.data.resumeInvoiceItems.map((i) => `${i.quantity} × ${i.name}`).join(", ")
        : null,
    },
    warnings: [
      ...(missingState ? ["Select the customer's state before confirming — needed for GST."] : []),
      ...(!missingState && !parsed.data.gstin
        ? ["No GSTIN set — fine for an unregistered/individual customer, but check if that's intended."]
        : []),
    ],
    blocked: missingState,
  };
};

// ---------------------------------------------------------------
// ADD CUSTOMER — execute
// ---------------------------------------------------------------
// Creates the customer, then — if this was interrupting an invoice —
// immediately re-resolves and re-previews that invoice with the new
// customer, so the user doesn't have to repeat their original request.
export const executeCustomer = async (ctx, payload) => {
  const parsed = customerPayloadWithResumeSchema.safeParse(payload);
  if (!parsed.success) {
    const error = new Error(parsed.error.issues[0].message);
    error.statusCode = 400;
    throw error;
  }

  const { resumeInvoiceItems, ...customerData } = parsed.data;
  const customer = await createCustomer(ctx.companyId, customerData);

  if (!resumeInvoiceItems?.length) {
    return {
      status: "result",
      action: "add_customer",
      message: `${customer.name} added to your customers.`,
      data: customer,
      link: `/customers`,
    };
  }

  // Resume the invoice the user originally asked for, now that the
  // customer exists. Product resolution still goes through the normal
  // resolvers — a new customer doesn't skip product-name checks.
  const { items, unresolved } = await resolveInvoiceItems(ctx.companyId, resumeInvoiceItems);

  if (unresolved.length > 0) {
    const names = unresolved.map((u) => `"${u.query}"`).join(", ");
    return {
      status: "clarify",
      message: `${customer.name} was created. Now I couldn't find ${names} in your catalogue — want to add them, or did you mean something else?`,
      clarify: unresolved,
    };
  }

  const invoicePreview = await previewInvoice(ctx, { customerId: customer.id, items });
  return {
    ...invoicePreview,
    message: `${customer.name} was added. Here's the invoice:`,
  };
};

export const EXECUTORS = {
  create_invoice: executeInvoice,
  add_product: executeProduct,
  add_customer: executeCustomer,
};

export const PREVIEWERS = {
  create_invoice: previewInvoice,
  add_product: previewProduct,
  add_customer: previewCustomer,
};