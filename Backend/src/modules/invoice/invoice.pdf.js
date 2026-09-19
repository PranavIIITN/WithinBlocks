// NOTE ON THE RUPEE SIGN
// The screen version uses "₹". pdfkit's built-in Helvetica is WinAnsi-encoded
// and has no glyph for U+20B9, so writing "₹" here renders as a blank box.
// Until a Unicode TTF (e.g. Noto Sans) is registered with doc.registerFont(),
// "Rs." is the faithful substitute. Everything else below mirrors
// Frontend/src/pages/InvoiceDetail.jsx one-for-one.

const RUPEE = "Rs.";

const formatMoney = (n) =>
  `${RUPEE} ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

// Palette lifted from InvoiceDetail.jsx so the PDF and the screen share colours.
const INK = "#09090b";
const MUTED = "#71717a";
const BODY = "#52525b";
const BORDER = "#e4e4e7";
const ROW_LINE = "#f4f4f5";
const HEADER_BG = "#fafafa";

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

// Mirrors INVOICE_ITEM_GRID_COLS in InvoiceDetail.jsx — same ten columns, same
// labels, same alignment (everything but HSN Code and Item is right-aligned).
// The unit lives on a second header line ("Rate / (Rs)") because repeating
// "Rs." in every cell will not fit inside A4's 515pt of usable width.
const COLS = [
  { key: "hsn", label: "HSN Code", width: 52, align: "left" },
  { key: "item", label: "Item", width: 87, align: "left" },
  { key: "qty", label: "Qty", width: 26, align: "right" },
  { key: "rate", label: `Rate\n(${RUPEE})`, width: 56, align: "right" },
  { key: "total", label: `Total\n(${RUPEE})`, width: 56, align: "right" },
  { key: "taxPct", label: "Tax %", width: 30, align: "right" },
  { key: "cgst", label: `CGST\n(${RUPEE})`, width: 48, align: "right" },
  { key: "sgst", label: `SGST\n(${RUPEE})`, width: 48, align: "right" },
  { key: "igst", label: `IGST\n(${RUPEE})`, width: 48, align: "right" },
  { key: "taxable", label: `Taxable Value\n(${RUPEE})`, width: 62, align: "right" },
];
const TABLE_WIDTH = COLS.reduce((sum, c) => sum + c.width, 0); // 513pt — fits A4 at a 40pt margin
const CELL_PAD = 5;

// Header height is measured rather than assumed — a two-line label like
// "Taxable Value\n(Rs.)" needs more vertical room than "Qty", and computing it
// explicitly keeps the rule and the first data row correctly placed no matter
// which labels wrap.
function drawTableHeader(doc, x, y) {
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(MUTED);
  let maxHeight = 10;
  COLS.forEach((col) => {
    const h = doc.heightOfString(col.label, { width: col.width - CELL_PAD * 2 });
    if (h > maxHeight) maxHeight = h;
  });
  const rowHeight = maxHeight + 14;

  doc.save().rect(x, y, TABLE_WIDTH, rowHeight).fillColor(HEADER_BG).fill().restore();

  let cx = x;
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(MUTED);
  COLS.forEach((col) => {
    doc.text(col.label, cx + CELL_PAD, y + 7, { width: col.width - CELL_PAD * 2, align: col.align });
    cx += col.width;
  });

  const lineY = y + rowHeight;
  doc.moveTo(x, lineY).lineTo(x + TABLE_WIDTH, lineY).strokeColor(BORDER).lineWidth(1).stroke();
  return lineY;
}

function drawTableRow(doc, x, y, values, { isLast }) {
  doc.font("Helvetica").fontSize(8);
  let maxHeight = 11;
  COLS.forEach((col) => {
    const h = doc.heightOfString(values[col.key] ?? "", { width: col.width - CELL_PAD * 2 });
    if (h > maxHeight) maxHeight = h;
  });
  const rowHeight = maxHeight + 13;

  let cx = x;
  COLS.forEach((col) => {
    // Item name and Taxable Value are the emphasised cells on screen; the rest
    // are body-grey.
    const emphasised = col.key === "item" || col.key === "taxable";
    doc.font(emphasised ? "Helvetica-Bold" : "Helvetica").fillColor(emphasised ? INK : BODY);
    doc.text(values[col.key] ?? "", cx + CELL_PAD, y + 6.5, {
      width: col.width - CELL_PAD * 2,
      align: col.align,
      lineBreak: col.key === "item",
      ellipsis: col.key === "item",
      height: col.key === "item" ? maxHeight : undefined,
    });
    cx += col.width;
  });

  const bottom = y + rowHeight;
  if (!isLast) {
    doc.moveTo(x, bottom).lineTo(x + TABLE_WIDTH, bottom).strokeColor(ROW_LINE).lineWidth(1).stroke();
  }
  return bottom;
}

// Draws the full invoice onto an already-created PDFDocument (`doc`).
// Caller is responsible for `doc.pipe(...)` and `doc.end()`.
const generateInvoicePdf = async (doc, invoice, company) => {
  const marginX = 40;
  const pageWidth = doc.page.width;
  const pageBottom = doc.page.height - 40;
  const contentWidth = pageWidth - marginX * 2;

  const [logoBuffer, signatureBuffer] = await Promise.all([
    fetchImageBuffer(company?.logo),
    fetchImageBuffer(company?.signature),
  ]);

  let y = 40;

  // ── Header: logo + company block (left), "TAX INVOICE" + number (right) ──
  if (logoBuffer) {
    try {
      doc.image(logoBuffer, marginX, y, { fit: [110, 90] });
    } catch {
      // Corrupt/unsupported image format — skip rather than fail the whole PDF
    }
  }
  const infoX = logoBuffer ? marginX + 124 : marginX;
  const infoWidth = 250;

  doc.font("Helvetica-Bold").fontSize(13).fillColor(INK);
  const companyNameText = company?.name || "Your Company";
  doc.text(companyNameText, infoX, y, { width: infoWidth });
  let infoY = y + doc.heightOfString(companyNameText, { width: infoWidth }) + 3;

  doc.font("Helvetica").fontSize(8.5).fillColor(MUTED);
  // Same fields, same order as the company block on InvoiceDetail.jsx.
  const companyLines = [
    company?.address,
    company?.phone,
    company?.email,
    company?.gstin ? `GSTIN: ${company.gstin}` : null,
    company?.state ? `State: ${company.state}` : null,
  ].filter(Boolean);
  companyLines.forEach((line) => {
    doc.text(line, infoX, infoY, { width: infoWidth });
    infoY += doc.heightOfString(line, { width: infoWidth }) + 1.5;
  });

  doc.font("Helvetica-Bold").fontSize(18).fillColor(INK)
    .text("TAX INVOICE", marginX, y, { width: contentWidth, align: "right" });
  doc.font("Helvetica").fontSize(10).fillColor(BODY)
    .text(invoice.invoiceNo, marginX, y + 24, { width: contentWidth, align: "right" });

  y = Math.max(infoY, y + 70) + 12;
  doc.moveTo(marginX, y).lineTo(pageWidth - marginX, y).strokeColor(BORDER).lineWidth(1).stroke();
  y += 16;

  // ── Bill To (left) + Ship To (middle) + invoice meta (right) ──
  const blockTop = y;
  const billToX = marginX;
  const shipToX = marginX + 178;
  const metaX = pageWidth - marginX - 170;
  const blockWidth = 165;

  const sectionLabel = (text, x, yy) => {
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(MUTED).text(text.toUpperCase(), x, yy, {
      width: blockWidth,
      characterSpacing: 0.5,
    });
  };

  sectionLabel("Bill To", billToX, y);
  let billY = y + 13;
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(INK);
  const customerNameText = invoice.customer?.name || "";
  doc.text(customerNameText, billToX, billY, { width: blockWidth });
  billY += doc.heightOfString(customerNameText, { width: blockWidth }) + 3;

  doc.font("Helvetica").fontSize(8.5).fillColor(MUTED);
  [invoice.customer?.address, invoice.customer?.phone, invoice.customer?.email]
    .filter(Boolean)
    .forEach((line) => {
      doc.text(line, billToX, billY, { width: blockWidth });
      billY += doc.heightOfString(line, { width: blockWidth }) + 1.5;
    });

  // Rendered as a bordered chip, matching the GSTIN pill on InvoiceDetail.jsx.
  if (invoice.customer?.gstin) {
    billY += 4;
    const chipText = `GSTIN ${invoice.customer.gstin}`;
    doc.font("Courier").fontSize(8);
    const chipWidth = doc.widthOfString(chipText) + 12;
    doc.save()
      .roundedRect(billToX, billY, chipWidth, 15, 3)
      .fillColor(ROW_LINE).fill()
      .restore();
    doc.roundedRect(billToX, billY, chipWidth, 15, 3).strokeColor(BORDER).lineWidth(1).stroke();
    doc.fillColor(BODY).text(chipText, billToX + 6, billY + 4.5, { width: chipWidth - 12, lineBreak: false });
    billY += 18;
  }

  sectionLabel("Ship To", shipToX, y);
  let shipY = y + 13;
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(INK);
  doc.text(customerNameText, shipToX, shipY, { width: blockWidth });
  shipY += doc.heightOfString(customerNameText, { width: blockWidth }) + 3;
  // Falls back to the billing address for customers created before
  // shipToAddress existed — those rows are NULL, not auto-copied.
  const shipToAddressText = invoice.customer?.shipToAddress || invoice.customer?.address || "—";
  doc.font("Helvetica").fontSize(8.5).fillColor(MUTED)
    .text(shipToAddressText, shipToX, shipY, { width: blockWidth });
  shipY += doc.heightOfString(shipToAddressText, { width: blockWidth });

  let metaY = blockTop;
  const metaRow = (label, value) => {
    doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text(label, metaX, metaY, { width: 70 });
    doc.font("Helvetica-Bold").fillColor(INK).text(value, metaX + 70, metaY, { width: 100, align: "right" });
    metaY += 14;
  };
  metaRow("Invoice Date", formatDate(invoice.createdAt));
  metaRow("Due Date", formatDate(invoice.dueDate));
  metaRow("Created By", invoice.createdBy?.name || "—");

  y = Math.max(billY, shipY, metaY) + 18;

  // ── Items table (bordered box, shaded header, hairline row separators) ──
  let tableTop = y;
  const closeTableBox = (bottomY) => {
    doc.roundedRect(marginX, tableTop, TABLE_WIDTH, bottomY - tableTop, 6)
      .strokeColor(BORDER).lineWidth(1).stroke();
  };

  y = drawTableHeader(doc, marginX, y);
  const items = invoice.items || [];
  items.forEach((item, index) => {
    if (y > pageBottom - 60) {
      closeTableBox(y);
      doc.addPage();
      y = 40;
      tableTop = y;
      y = drawTableHeader(doc, marginX, y);
    }
    const cgst = Number(item.cgst) || 0;
    const sgst = Number(item.sgst) || 0;
    const igst = Number(item.igst) || 0;
    const money = (n) =>
      Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    y = drawTableRow(doc, marginX, y, {
      hsn: item.product?.hsn || "—",
      item: item.product?.name || "",
      qty: String(item.quantity),
      rate: money(item.unitPrice),
      // Backend stores the tax-inclusive line total plus the cgst/sgst/igst
      // split — back out the pre-tax "Total" column from those, exactly as
      // InvoiceDetail.jsx does.
      total: money(item.total - cgst - sgst - igst),
      taxPct: `${item.tax ?? 0}%`,
      cgst: cgst > 0 ? money(cgst) : "—",
      sgst: sgst > 0 ? money(sgst) : "—",
      igst: igst > 0 ? money(igst) : "—",
      taxable: money(item.total),
    }, { isLast: index === items.length - 1 });
  });
  closeTableBox(y);
  y += 24;

  if (y > pageBottom - 170) {
    doc.addPage();
    y = 40;
  }

  // ── Notes (left) + Totals box (right) ──
  const notesTop = y;
  if (invoice.notes) {
    sectionLabel("Notes", marginX, y);
    doc.font("Helvetica").fontSize(8.5).fillColor(BODY)
      .text(invoice.notes, marginX, y + 14, { width: 250 });
  }

  const totalsWidth = 240;
  const totalsX = pageWidth - marginX - totalsWidth;
  let totalsY = notesTop;
  const totalsTop = totalsY;

  const totalsRow = (label, value, { emphasis = false, shaded = false, divider = true } = {}) => {
    const rowHeight = emphasis ? 26 : 22;
    if (shaded) {
      doc.save().rect(totalsX, totalsY, totalsWidth, rowHeight).fillColor(HEADER_BG).fill().restore();
    }
    const textY = totalsY + (emphasis ? 8.5 : 7);
    doc.font(emphasis ? "Helvetica-Bold" : "Helvetica").fontSize(emphasis ? 10 : 9)
      .fillColor(emphasis ? INK : MUTED)
      .text(label, totalsX + 12, textY, { width: totalsWidth / 2 });
    doc.font(emphasis ? "Helvetica-Bold" : "Helvetica").fillColor(INK)
      .text(value, totalsX + totalsWidth / 2, textY, { width: totalsWidth / 2 - 12, align: "right" });
    totalsY += rowHeight;
    if (divider) {
      doc.moveTo(totalsX, totalsY).lineTo(totalsX + totalsWidth, totalsY)
        .strokeColor(BORDER).lineWidth(1).stroke();
    }
  };

  const hasIgst = Number(invoice.igst) > 0;
  const hasCgstSgst = Number(invoice.cgst) > 0 || Number(invoice.sgst) > 0;

  totalsRow("Subtotal", formatMoney(invoice.subtotal));
  // Independent checks, not if/else — same as InvoiceDetail.jsx, so a mixed
  // invoice with both an intra-state and an inter-state component shows every
  // head instead of silently dropping CGST/SGST.
  if (hasCgstSgst) {
    totalsRow("CGST", formatMoney(invoice.cgst));
    totalsRow("SGST", formatMoney(invoice.sgst));
  }
  if (hasIgst) {
    totalsRow("IGST", formatMoney(invoice.igst));
  }
  if (!hasCgstSgst && !hasIgst) {
    totalsRow("Tax", formatMoney(invoice.taxAmount));
  }
  totalsRow("Total", formatMoney(invoice.totalAmount), { emphasis: true, shaded: true, divider: false });

  doc.roundedRect(totalsX, totalsTop, totalsWidth, totalsY - totalsTop, 6)
    .strokeColor(BORDER).lineWidth(1).stroke();

  y = Math.max(notesTop + 60, totalsY) + 40;

  // ── Signature — bottom right ──
  if (y > pageBottom - 110) {
    doc.addPage();
    y = 40;
  }
  const sigWidth = 180;
  const sigX = pageWidth - marginX - sigWidth;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(INK)
    .text(`For ${company?.name || "Your Company"}`, sigX, y, { width: sigWidth, align: "center" });
  y += 16;
  if (signatureBuffer) {
    try {
      doc.image(signatureBuffer, sigX, y, { fit: [sigWidth, 60], align: "center" });
    } catch {
      // Corrupt/unsupported image — skip
    }
  }
  // Fixed 60pt gap whether or not a signature image exists, so the rule sits in
  // the same place on every invoice (matches the empty 60px spacer on screen).
  y += 66;
  doc.moveTo(sigX, y).lineTo(sigX + sigWidth, y).strokeColor(BORDER).lineWidth(1).stroke();
  y += 5;
  doc.font("Helvetica").fontSize(8).fillColor(MUTED)
    .text("Authorized Signatory", sigX, y, { width: sigWidth, align: "center" });
};

export { generateInvoicePdf };