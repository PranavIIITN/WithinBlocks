import prisma from "../../lib/prisma.js";

// ===============================
// HELPER — Calculate Tax
// ===============================
const calculateTax = (price, taxRate, priceType, isInterState) => {
  let subtotal;
  let taxAmount;

  if (priceType === "INCLUSIVE") {
    subtotal = (price * 100) / (100 + taxRate);
    taxAmount = price - subtotal;
  } else {
    subtotal = price;
    taxAmount = (subtotal * taxRate) / 100;
  }

  if (isInterState) {
    return { subtotal, igst: taxAmount, cgst: 0, sgst: 0, taxAmount };
  } else {
    return { subtotal, cgst: taxAmount / 2, sgst: taxAmount / 2, igst: 0, taxAmount };
  }
};

// ===============================
// COMPUTE INVOICE TOTALS
// ===============================
// Extracted from createInvoice so that WithinAgent's preview and the real
// invoice creation run the SAME arithmetic. Do not reimplement GST anywhere
// else — call this. (See README note about CreateInvoice.jsx duplicating it
// on the frontend; the agent deliberately does not add a third copy.)
//
// Returns the fully-priced line items plus invoice-level totals, and throws
// 404 for a customer or product that does not belong to this company.
// ===============================
const computeInvoiceTotals = async (companyId, customerId, items) => {
  const company = await prisma.company.findUnique({ where: { id: companyId } });

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId },
  });

  if (!customer) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }

  // Intra vs inter state, from the explicit `state` field on Company/Customer.
  const isInterState = company.state !== customer.state;

  let subtotal = 0;
  let totalTax = 0;

  const invoiceItems = await Promise.all(
    items.map(async (item) => {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, companyId },
      });

      if (!product) {
        const error = new Error(`Product ${item.productId} not found`);
        error.statusCode = 404;
        throw error;
      }

      const taxRate = item.tax ?? product.tax ?? 0;
      const priceType = product.priceType ?? "EXCLUSIVE";
      const unitPrice = item.unitPrice ?? product.price;
      const tax = calculateTax(unitPrice, taxRate, priceType, isInterState);

      const itemSubtotal = tax.subtotal * item.quantity;
      const itemTaxAmount = tax.taxAmount * item.quantity;
      const itemTotal = itemSubtotal + itemTaxAmount;

      subtotal += itemSubtotal;
      totalTax += itemTaxAmount;

      return {
        productId: item.productId,
        productName: product.name,
        hsn: product.hsn,
        unit: product.unit,
        stock: product.stock,
        priceType,
        quantity: item.quantity,
        unitPrice,
        tax: taxRate,
        cgst: tax.cgst * item.quantity,
        sgst: tax.sgst * item.quantity,
        igst: tax.igst * item.quantity,
        total: itemTotal,
      };
    })
  );

  return {
    company,
    customer,
    isInterState,
    items: invoiceItems,
    subtotal,
    taxAmount: totalTax,
    totalAmount: subtotal + totalTax,
    cgst: invoiceItems.reduce((sum, i) => sum + (i.cgst || 0), 0),
    sgst: invoiceItems.reduce((sum, i) => sum + (i.sgst || 0), 0),
    igst: invoiceItems.reduce((sum, i) => sum + (i.igst || 0), 0),
  };
};

// Strip the preview-only fields before handing rows to Prisma.
const toInvoiceItemRows = (items) =>
  items.map(({ productId, quantity, unitPrice, tax, cgst, sgst, igst, total }) => ({
    productId,
    quantity,
    unitPrice,
    tax,
    cgst,
    sgst,
    igst,
    total,
  }));

// ===============================
// HELPER — Generate Invoice Number
// ===============================
const generateInvoiceNumber = async (companyId, tx) => {
  const company = await tx.company.update({
    where: { id: companyId },
    data: { invoiceCounter: { increment: 1 } },
  });

  const counter = String(company.invoiceCounter).padStart(3, "0");
  return `${company.invoicePrefix}-${company.financialYear}-${counter}`;
};

// ===============================
// HELPER — Deduct Stock
// ===============================
const deductStock = async (items, tx) => {
  for (const item of items) {
    const product = await tx.product.findUnique({
      where: { id: item.productId },
    });

    if (product.stock < item.quantity) {
      const error = new Error(`Insufficient stock for product ${product.name}. Available: ${product.stock}`);
      error.statusCode = 400;
      throw error;
    }

    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }
};

// ===============================
// CHECK STOCK (read-only)
// ===============================
// deductStock only throws at execution time. The agent needs to know BEFORE
// showing a preview, otherwise the user confirms something that then fails.
// ===============================
const checkStock = async (companyId, items) => {
  const problems = [];

  for (const item of items) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, companyId },
    });
    if (!product) continue;
    if (product.stock < item.quantity) {
      problems.push({
        productId: product.id,
        name: product.name,
        requested: item.quantity,
        available: product.stock,
      });
    }
  }

  return problems;
};

// ===============================
// HELPER — Restore Stock
// ===============================
const restoreStock = async (invoiceId, tx) => {
  const items = await tx.invoiceItem.findMany({
    where: { invoiceId },
  });

  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }
};

// ===============================
// CREATE INVOICE
// ===============================
const createInvoice = async (companyId, userId, data) => {
  const isDraft = data.status === "DRAFT";

  // Single source of truth for pricing + GST.
  const totals = await computeInvoiceTotals(companyId, data.customerId, data.items);
  const invoiceItems = toInvoiceItemRows(totals.items);

  const invoice = await prisma.$transaction(async (tx) => {
    // Auto generate invoice number if not provided
    const invoiceNo = data.invoiceNo || (await generateInvoiceNumber(companyId, tx));

    // Deduct stock only if not a draft
    if (!isDraft) {
      await deductStock(invoiceItems, tx);
    }

    const newInvoice = await tx.invoice.create({
      data: {
        invoiceNo,
        status: isDraft ? "DRAFT" : "UNPAID",
        subtotal: totals.subtotal,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes,
        companyId,
        customerId: data.customerId,
        createdById: userId,
        items: {
          create: invoiceItems,
        },
      },
      include: {
        items: { include: { product: true } },
        customer: true,
      },
    });

    return newInvoice;
  });

  return invoice;
};

// ===============================
// GET ALL INVOICES
// ===============================
const getAllInvoices = async (companyId) => {
  const invoices = await prisma.invoice.findMany({
    where: { companyId },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return invoices;
};

// ===============================
// GET INVOICE BY ID
// ===============================
const getInvoiceById = async (id, companyId) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id, companyId },
    include: {
      customer: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      items: { include: { product: true } },
    },
  });
  return invoice;
};

// Used by the PDF export — needs both the invoice and the company's own
// details (name, GSTIN, logo, signature) to render the letterhead.
const getInvoiceWithCompany = async (id, companyId) => {
  const [invoice, company] = await Promise.all([
    getInvoiceById(id, companyId),
    prisma.company.findUnique({ where: { id: companyId } }),
  ]);
  return { invoice, company };
};

// ===============================
// UPDATE INVOICE STATUS
// ===============================
const updateInvoiceStatus = async (id, companyId, status) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id, companyId },
  });

  if (!invoice) {
    const error = new Error("Invoice not found");
    error.statusCode = 404;
    throw error;
  }

  // If cancelling — restore stock (only if was not a draft)
  if (status === "CANCELLED" && invoice.status !== "DRAFT") {
    await prisma.$transaction(async (tx) => {
      await restoreStock(id, tx);
      await tx.invoice.update({
        where: { id, companyId },
        data: { status },
      });
    });
    return;
  }

  // If finalizing a draft — deduct stock
  if (invoice.status === "DRAFT" && status === "UNPAID") {
    await prisma.$transaction(async (tx) => {
      const items = await tx.invoiceItem.findMany({ where: { invoiceId: id } });
      await deductStock(items, tx);
      await tx.invoice.update({
        where: { id, companyId },
        data: { status },
      });
    });
    return;
  }

  const updatedInvoice = await prisma.invoice.update({
    where: { id, companyId },
    data: { status },
  });

  return updatedInvoice;
};

// ===============================
// DELETE INVOICE
// ===============================
const deleteInvoice = async (id, companyId) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id, companyId },
  });

  if (!invoice) {
    const error = new Error("Invoice not found");
    error.statusCode = 404;
    throw error;
  }

  await prisma.$transaction(async (tx) => {
    // Restore stock if invoice was not a draft
    if (invoice.status !== "DRAFT" && invoice.status !== "CANCELLED") {
      await restoreStock(id, tx);
    }

    await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
    await tx.invoice.delete({ where: { id, companyId } });
  });
};

// ===============================
// SEARCH PRODUCTS
// ===============================
const searchProducts = async (companyId, query) => {
  return await prisma.product.findMany({
    where: {
      companyId,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { ean: query },
      ],
    },
    take: 10,
  });
};

// ===============================
// SEARCH CUSTOMERS
// ===============================
const searchCustomers = async (companyId, query) => {
  return await prisma.customer.findMany({
    where: {
      companyId,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
        { gstin: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 10,
  });
};

export {
  createInvoice,
  computeInvoiceTotals,
  checkStock,
  getAllInvoices,
  getInvoiceById,
  getInvoiceWithCompany,
  updateInvoiceStatus,
  deleteInvoice,
  searchProducts,
  searchCustomers,
};