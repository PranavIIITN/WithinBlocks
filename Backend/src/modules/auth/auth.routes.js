import express from "express";
import { loginController, registerController } from "./auth.controller.js";
import { authenticate, authorizeOwner } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerController);

router.post("/login", loginController);

export default router;


