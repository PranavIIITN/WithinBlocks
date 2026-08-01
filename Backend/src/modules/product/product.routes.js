import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { createProductController } from "./product.controller.js";

const router = express.Router();

router.post("/", authenticate, createProductController);

export default router;
