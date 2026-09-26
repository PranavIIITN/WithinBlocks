import express from "express";
import { authenticate, authorizeOwner } from "../../middleware/auth.middleware.js";
import {
  inviteUserController,
  acceptInviteController,
  listUsersController,
  deactivateUserController,
} from "./user.controller.js";

const router = express.Router();

// Public — the invite token itself is the credential; no login exists yet
// for the person accepting it.
router.post("/accept-invite", acceptInviteController);

// Owner-only, per the PRD's permissions matrix.
router.post("/invite", authenticate, authorizeOwner, inviteUserController);
router.get("/", authenticate, authorizeOwner, listUsersController);
router.patch("/:id/deactivate", authenticate, authorizeOwner, deactivateUserController);

export default router;