import rateLimit from "express-rate-limit";

// Password reset request — the main abuse vectors are spamming someone's
// inbox with reset emails, and probing many emails to find which ones are
// registered (the generic response closes the direct signal, but a flood of
// attempts is still worth throttling on its own). Keyed by IP, which is the
// default; a single attacker spraying many emails from one IP is the
// realistic case this stops.
export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

// Reset-password itself: the token is a 256-bit random value, so brute
// forcing it directly isn't realistic — but throttling here is still cheap
// defense-in-depth against scripted abuse hitting the endpoint repeatedly.
export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});