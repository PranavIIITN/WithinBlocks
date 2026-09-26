import { z } from "zod";

// PRD §8: password 6-8+ chars, hashed with bcrypt. Going with 8 as the
// floor — 6 is genuinely too weak even for an MVP, and this costs nothing
// extra to enforce.
export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, "Invite token is required"),
  name: z.string().trim().min(1, "Name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});