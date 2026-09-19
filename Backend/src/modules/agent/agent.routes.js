import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
  runAgentController,
  previewAgentController,
  confirmAgentController,
} from "./agent.controller.js";

const router = express.Router();

// Every agent route is authenticated — companyId comes off the token.
router.post("/run", authenticate, runAgentController);
router.post("/preview", authenticate, previewAgentController);
router.post("/confirm", authenticate, confirmAgentController);

export default router;