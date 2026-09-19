import PDFDocument from "pdfkit";
import {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  getInvoiceWithCompany,
  updateInvoiceStatus,
  deleteInvoice,
  searchProducts,
  searchCustomers,
} from "./invoice.service.js";
import { generateInvoicePdf } from "./invoice.pdf.js";

const createInvoiceController = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const userId = req.user.userId;
    const data = req.body;
    const invoice = await createInvoice(companyId, userId, data);
    res.status(201).json({ success: true, message: "Invoice created successfully", data: invoice });
  } catch (error) {
    next(error);
  }
};

const getAllInvoicesController = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const invoices = await getAllInvoices(companyId);
    res.status(200).json({ success: true, message: "Invoices fetched successfully", data: invoices });
  } catch (error) {
    next(error);
  }
};

const getInvoiceByIdController = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const invoice = await getInvoiceById(id, companyId);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
    res.status(200).json({ success: true, message: "Invoice fetched successfully", data: invoice });
  } catch (error) {
    next(error);
  }
};

const updateInvoiceStatusController = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const { status } = req.body;
    const invoice = await updateInvoiceStatus(id, companyId, status);
    res.status(200).json({ success: true, message: "Invoice status updated successfully", data: invoice });
  } catch (error) {
    next(error);
  }
};

const deleteInvoiceController = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;
    await deleteInvoice(id, companyId);
    res.status(200).json({ success: true, message: "Invoice deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const searchProductsController = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: "Search query required" });
    const products = await searchProducts(companyId, q);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

const searchCustomersController = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: "Search query required" });
    const customers = await searchCustomers(companyId, q);
    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

const downloadInvoicePdfController = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const { invoice, company } = await getInvoiceWithCompany(id, companyId);
    console.log("PDF company object:", company); // TEMP — remove after debugging
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${invoice.invoiceNo}.pdf"`);

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    doc.pipe(res);

    try {
      await generateInvoicePdf(doc, invoice, company);
      doc.end();
    } catch (pdfError) {
      // Headers (and possibly part of the PDF body) are already sent by this
      // point, so a JSON error response isn't possible — just log and cut
      // the stream rather than passing to next(), which would try to send
      // one anyway and fail with a "headers already sent" error.
      console.error(`PDF generation failed for invoice ${id}:`, pdfError);
      doc.end();
    }
  } catch (error) {
    next(error);
  }
};

export {
  createInvoiceController,
  getAllInvoicesController,
  getInvoiceByIdController,
  updateInvoiceStatusController,
  deleteInvoiceController,
  searchProductsController,
  searchCustomersController,
  downloadInvoicePdfController,
};