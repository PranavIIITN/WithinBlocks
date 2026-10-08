import express from "express";
import { loginController, registerController, forgotPasswordController, resetPasswordController } from "./auth.controller.js";
import { authenticate, authorizeOwner } from "../../middleware/auth.middleware.js";
import { forgotPasswordLimiter, resetPasswordLimiter } from "../../middleware/rateLimit.middleware.js";

const router = express.Router();

router.post("/register", registerController);

router.post("/login", loginController);

router.post("/forgot-password", forgotPasswordLimiter, forgotPasswordController);
router.post("/reset-password", resetPasswordLimiter, resetPasswordController);

export default router;