import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { getCompanyController, updateCompanyController } from "./company.controller.js";

const router = express.Router();

router.get("/", authenticate, getCompanyController);
router.put("/", authenticate, updateCompanyController);

export default router;