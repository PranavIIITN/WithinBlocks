import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { createCustomerController, getAllCustomersController, getCustomerByIdController, updateCustomerController, deleteCustomerController } from "./customer.controller.js";

const router = express.Router();

router.post("/", authenticate, createCustomerController);
router.get("/", authenticate, getAllCustomersController);
router.get("/:id", authenticate, getCustomerByIdController);
router.put("/:id", authenticate, updateCustomerController);
router.delete("/:id", authenticate, deleteCustomerController);

export default router;