import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { createProductController, getAllProductsController, getProductByIdController, updateProductController, deleteProductController } from "./product.controller.js";

const router = express.Router();

router.post("/", authenticate, createProductController);
router.get("/", authenticate, getAllProductsController);
router.get("/:id", authenticate, getProductByIdController);
router.put("/:id", authenticate, updateProductController);
router.delete("/:id", authenticate, deleteProductController);

export default router;