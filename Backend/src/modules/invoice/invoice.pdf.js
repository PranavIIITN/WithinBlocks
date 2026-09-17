import PDFDocument from "pdfkit";

const formatMoney = (n) =>
  `Rs. ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// Used for the Totals summary box only (Subtotal/CGST/SGST/Total) — those
// lines have no shared column header to carry the unit, so "Rs." stays inline.

const formatNumber = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// Used inside the item table — the unit ("Rs") lives in the column header
// instead (e.g. "Rate (Rs)"), so cell values are plain numbers, matching a
// standard printed GST invoice rather than repeating "Rs." on every row.

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

const fetchImageBuffer = async (url) => {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
};

// Mirrors the columns on Frontend/src/pages/InvoiceDetail.jsx and
// CreateInvoice.jsx, and the two-line header style (unit on its own line)
// from the reference invoice: "Quantity / (Pcs)", "Rate / (Rs)", etc.
// Short numeric columns (Qty, Tax %) are centered rather than right-aligned —
// right-aligning a single narrow digit under a short header reads as
// "floating" away from its label even though the box math is correct.
const COLS = [
  { key: "hsn", label: "HSN", width: 32, align: "left" },
  { key: "item", label: "Item", width: 85, align: "left" },
  { key: "qty", label: "Quantity\n(Pcs)", width: 40, align: "center" },
  { key: "rate", label: "Rate\n(Rs)", width: 48, align: "right" },
  { key: "total", label: "Total\n(Rs)", width: 48, align: "right" },
  { key: "taxPct", label: "Tax\n%", width: 32, align: "center" },
  { key: "cgst", label: "CGST\n(Rs)", width: 44, align: "right" },
  { key: "sgst", label: "SGST\n(Rs)", width: 44, align: "right" },
  { key: "igst", label: "IGST\n(Rs)", width: 44, align: "right" },
  { key: "taxable", label: "Taxable Value\n(Rs)", width: 75, align: "right" },
];
const TABLE_WIDTH = COLS.reduce((sum, c) => sum + c.width, 0);

// Header height is measured rather than assumed — a two-line label like
// "Taxable Value\n(Rs)" needs more vertical room than "HSN", and computing
// it explicitly means the separator line and first data row are always
// positioned correctly regardless of which labels wrap.
function drawTableHeader(doc, x, y) {
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#52525b");
  let maxHeight = 12;
  COLS.forEach((col) => {
    const h = doc.heightOfString(col.label, { width: col.width - 4 });
    if (h > maxHeight) maxHeight = h;
  });
  let cx = x;
  COLS.forEach((col) => {
    doc.text(col.label, cx + 2, y + 3, { width: col.width - 4, align: col.align });
    cx += col.width;
  });
  const lineY = y + maxHeight + 9;
  doc.moveTo(x, lineY).lineTo(x + TABLE_WIDTH, lineY).strokeColor("#e4e4e7").stroke();
  return lineY + 8;
}

function drawTableRow(doc, x, y, values) {
  doc.font("Helvetica").fontSize(9).fillColor("#09090b");
  let maxHeight = 14;
  COLS.forEach((col) => {
    const h = doc.heightOfString(values[col.key] ?? "", { width: col.width - 4 });
    if (h > maxHeight) maxHeight = h;
  });
  let cx = x;
  COLS.forEach((col) => {
    doc.text(values[col.key] ?? "", cx + 2, y, { width: col.width - 4, align: col.align });
    cx += col.width;
  });
  return y + maxHeight + 8;
}

// Draws the full invoice onto an already-created PDFDocument (`doc`).
// Caller is responsible for `doc.pipe(...)` and `doc.end()`.
const generateInvoicePdf = async (doc, invoice, company) => {
  const marginX = 40;
  const pageWidth = doc.page.width;
  const pageBottom = doc.page.height - 40;

  const [logoBuffer, signatureBuffer] = await Promise.all([
    fetchImageBuffer(company?.logo),
    fetchImageBuffer(company?.signature),
  ]);

  let y = 40;

  // Header — logo + company info (left), "INVOICE" + number (right)
  if (logoBuffer) {
    try {
      doc.image(logoBuffer, marginX, y, { fit: [90, 60] });
    } catch {
      // Corrupt/unsupported image format — skip rather than fail the whole PDF
    }
  }
  const infoX = logoBuffer ? marginX + 100 : marginX;
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#09090b");
  const companyNameText = company?.name || "Your Company";
  doc.text(companyNameText, infoX, y, { width: 260 });
  let infoY = y + doc.heightOfString(companyNameText, { width: 260 }) + 4;
  doc.font("Helvetica").fontSize(8).fillColor("#71717a");
  if (company?.address) {
    doc.text(company.address, infoX, infoY, { width: 260 });
    infoY += doc.heightOfString(company.address, { width: 260 }) + 2;
  }
  if (company?.gstin) { doc.text(`GSTIN: ${company.gstin}`, infoX, infoY, { width: 260 }); infoY += 12; }
  if (company?.phone) { doc.text(company.phone, infoX, infoY, { width: 260 }); infoY += 12; }

  doc.font("Helvetica-Bold").fontSize(18).fillColor("#09090b")
    .text("INVOICE", marginX, y, { width: pageWidth - marginX * 2, align: "right" });
  doc.font("Helvetica").fontSize(10).fillColor("#52525b")
    .text(invoice.invoiceNo, marginX, y + 24, { width: pageWidth - marginX * 2, align: "right" });

  y = Math.max(infoY, y + 70) + 10;
  doc.moveTo(marginX, y).lineTo(pageWidth - marginX, y).strokeColor("#e4e4e7").stroke();
  y += 15;

  // Bill To (left) + Ship To (middle) + Invoice meta (right)
  const billToTop = y;
  const billToX = marginX;
  const shipToX = marginX + 175;
  const metaX = pageWidth - marginX - 165;
  const blockWidth = 160;

  doc.font("Helvetica-Bold").fontSize(8).fillColor("#71717a").text("BILL TO", billToX, y);
  let billY = y + 12;
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#09090b");
  const customerNameText = invoice.customer?.name || "";
  doc.text(customerNameText, billToX, billY, { width: blockWidth });
  billY += doc.heightOfString(customerNameText, { width: blockWidth }) + 3;
  doc.font("Helvetica").fontSize(8).fillColor("#71717a");
  if (invoice.customer?.address) {
    doc.text(invoice.customer.address, billToX, billY, { width: blockWidth });
    billY += doc.heightOfString(invoice.customer.address, { width: blockWidth }) + 2;
  }
  if (invoice.customer?.phone) { doc.text(invoice.customer.phone, billToX, billY, { width: blockWidth }); billY += 12; }
  if (invoice.customer?.email) { doc.text(invoice.customer.email, billToX, billY, { width: blockWidth }); billY += 12; }
  if (invoice.customer?.gstin) { doc.text(`GSTIN: ${invoice.customer.gstin}`, billToX, billY, { width: blockWidth }); billY += 12; }

  doc.font("Helvetica-Bold").fontSize(8).fillColor("#71717a").text("SHIP TO", shipToX, y);
  let shipY = y + 12;
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#09090b");
  doc.text(customerNameText, shipToX, shipY, { width: blockWidth });
  shipY += doc.heightOfString(customerNameText, { width: blockWidth }) + 3;
  // Falls back to the billing address for customers created before
  // shipToAddress existed — those rows are NULL, not auto-copied.
  const shipToAddressText = invoice.customer?.shipToAddress || invoice.customer?.address || "-";
  doc.font("Helvetica").fontSize(8).fillColor("#71717a").text(shipToAddressText, shipToX, shipY, { width: blockWidth });
  shipY += doc.heightOfString(shipToAddressText, { width: blockWidth });

  let metaY = billToTop;
  const metaRow = (label, value) => {
    doc.font("Helvetica").fontSize(8).fillColor("#71717a").text(label, metaX, metaY, { width: 65 });
    doc.font("Helvetica-Bold").fillColor("#09090b").text(value, metaX + 65, metaY, { width: 100, align: "right" });
    metaY += 14;
  };
  metaRow("Invoice Date", formatDate(invoice.createdAt));
  metaRow("Due Date", formatDate(invoice.dueDate));
  metaRow("Created By", invoice.createdBy?.name || "-");

  y = Math.max(billY, shipY, metaY) + 15;

  // Items table
  y = drawTableHeader(doc, marginX, y);
  invoice.items?.forEach((item) => {
    if (y > pageBottom - 60) {
      doc.addPage();
      y = 40;
      y = drawTableHeader(doc, marginX, y);
    }
    const cgst = Number(item.cgst) || 0;
    const sgst = Number(item.sgst) || 0;
    const igst = Number(item.igst) || 0;
    y = drawTableRow(doc, marginX, y, {
      hsn: item.product?.hsn || "-",
      item: item.product?.name || "",
      qty: String(item.quantity),
      rate: formatNumber(item.unitPrice),
      total: formatNumber(item.total - cgst - sgst - igst),
      taxPct: String(item.tax),
      cgst: cgst > 0 ? formatNumber(cgst) : "-",
      sgst: sgst > 0 ? formatNumber(sgst) : "-",
      igst: igst > 0 ? formatNumber(igst) : "-",
      taxable: formatNumber(item.total),
    });
  });
  doc.moveTo(marginX, y).lineTo(marginX + TABLE_WIDTH, y).strokeColor("#e4e4e7").stroke();
  y += 20;

  if (y > pageBottom - 150) {
    doc.addPage();
    y = 40;
  }

  // Notes (left) + Totals (right)
  const notesTop = y;
  if (invoice.notes) {
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#71717a").text("NOTES", marginX, y);
    y += 12;
    doc.font("Helvetica").fontSize(9).fillColor("#52525b").text(invoice.notes, marginX, y, { width: 260 });
  }

  const totalsX = pageWidth - marginX - 220;
  let totalsY = notesTop;
  const totalsRow = (label, value, bold = false) => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9).fillColor(bold ? "#09090b" : "#71717a")
      .text(label, totalsX, totalsY, { width: 110 });
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fillColor("#09090b")
      .text(value, totalsX + 110, totalsY, { width: 110, align: "right" });
    totalsY += 16;
  };
  totalsRow("Subtotal", formatMoney(invoice.subtotal));
  const hasIgst = Number(invoice.igst) > 0;
  const hasCgstSgst = Number(invoice.cgst) > 0 || Number(invoice.sgst) > 0;
  if (hasIgst) {
    totalsRow("IGST", formatMoney(invoice.igst));
  } else if (hasCgstSgst) {
    totalsRow("CGST", formatMoney(invoice.cgst));
    totalsRow("SGST", formatMoney(invoice.sgst));
  } else {
    totalsRow("Tax", formatMoney(invoice.taxAmount));
  }
  totalsY += 4;
  doc.moveTo(totalsX, totalsY).lineTo(totalsX + 220, totalsY).strokeColor("#e4e4e7").stroke();
  totalsY += 8;
  totalsRow("Total", formatMoney(invoice.totalAmount), true);

  y = Math.max(y + 20, totalsY) + 40;

  // Signature — bottom right
  if (y > pageBottom - 90) {
    doc.addPage();
    y = 40;
  }
  const sigX = pageWidth - marginX - 180;
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#09090b")
    .text(`For ${company?.name || "Your Company"}`, sigX, y, { width: 180, align: "center" });
  y += 14;
  if (signatureBuffer) {
    try {
      doc.image(signatureBuffer, sigX, y, { fit: [180, 40], align: "center" });
    } catch {
      // Corrupt/unsupported image — skip
    }
  }
  y += 45;
  doc.moveTo(sigX, y).lineTo(sigX + 180, y).strokeColor("#e4e4e7").stroke();
  y += 4;
  doc.font("Helvetica").fontSize(8).fillColor("#71717a")
    .text("Authorized Signatory", sigX, y, { width: 180, align: "center" });
};

export { generateInvoicePdf };