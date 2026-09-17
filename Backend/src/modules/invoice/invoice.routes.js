import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
  createInvoiceController,
  getAllInvoicesController,
  getInvoiceByIdController,
  updateInvoiceStatusController,
  deleteInvoiceController,
  searchProductsController,
  searchCustomersController,
  downloadInvoicePdfController,
} from "./invoice.controller.js";

const router = express.Router();

router.post("/", authenticate, createInvoiceController);
router.get("/", authenticate, getAllInvoicesController);
router.get("/search/products", authenticate, searchProductsController);
router.get("/search/customers", authenticate, searchCustomersController);
router.get("/:id/pdf", authenticate, downloadInvoicePdfController);
router.get("/:id", authenticate, getInvoiceByIdController);
router.put("/:id", authenticate, updateInvoiceStatusController);
router.delete("/:id", authenticate, deleteInvoiceController);

export default router;