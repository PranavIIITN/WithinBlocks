import { Resend } from "resend";

// Lazily constructed so a missing key fails at send-time with a clear error
// rather than crashing the whole process at import.
let resendClient = null;
const getClient = () => {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      const error = new Error("RESEND_API_KEY is not configured");
      error.statusCode = 500;
      throw error;
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

// onboarding@resend.dev works with zero setup, but — a real platform
// restriction, not a bug — it can only deliver to the email address your
// Resend account itself was signed up with, until a domain is verified at
// resend.com/domains. Set RESEND_FROM_EMAIL once a domain is verified.
const FROM = process.env.RESEND_FROM_EMAIL || "WithinBlocks <onboarding@resend.dev>";

const wrapper = (inner) => `
  <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
    <div style="font-size: 15px; font-weight: 600; color: #09090b; margin-bottom: 24px;">
      within<span style="color: #2563eb;">blocks</span>
    </div>
    ${inner}
  </div>
`;

const send = async ({ to, subject, html }) => {
  const client = getClient();
  const { error } = await client.emails.send({ from: FROM, to, subject, html });
  if (error) {
    const err = new Error(error.message || "Failed to send email");
    err.statusCode = 502;
    err.cause = error;
    throw err;
  }
};

/**
 * The reset link itself is the entire security model for this flow — see
 * auth.service.js. This function's caller must never log or return the
 * resetLink anywhere a response could leak it; email delivery IS the proof
 * of identity here.
 */
export const sendPasswordResetEmail = async ({ to, resetLink }) => {
  await send({
    to,
    subject: "Reset your WithinBlocks password",
    html: wrapper(`
      <h2 style="font-size: 20px; color: #09090b; margin: 0 0 8px;">Reset your password</h2>
      <p style="font-size: 14px; color: #52525b; line-height: 1.5; margin: 0 0 24px;">
        We received a request to reset your WithinBlocks password. This link is valid for 1 hour.
      </p>
      <a href="${resetLink}"
         style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none;
                font-size: 14px; font-weight: 500; padding: 10px 20px; border-radius: 8px;">
        Reset password
      </a>
      <p style="font-size: 12px; color: #a1a1aa; margin-top: 24px;">
        If you didn't request this, you can safely ignore this email — your
        password will not be changed.
      </p>
    `),
  });
};

/**
 * Invite links are lower-stakes than reset links (an invite only activates
 * a brand-new, never-logged-into account — see user.service.js's inviteUser
 * for why the token itself is still stored raw, not hashed, unlike reset).
 * Caller should still treat send failures as real — see user.controller.js,
 * which falls back to surfacing the link directly if this throws.
 */
export const sendInviteEmail = async ({ to, companyName, inviteLink }) => {
  await send({
    to,
    subject: `You've been invited to join ${companyName} on WithinBlocks`,
    html: wrapper(`
      <h2 style="font-size: 20px; color: #09090b; margin: 0 0 8px;">You've been invited to join ${companyName}</h2>
      <p style="font-size: 14px; color: #52525b; line-height: 1.5; margin: 0 0 24px;">
        Set a password to activate your account and get started right away.
      </p>
      <a href="${inviteLink}"
         style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none;
                font-size: 14px; font-weight: 500; padding: 10px 20px; border-radius: 8px;">
        Accept invite
      </a>
      <p style="font-size: 12px; color: #a1a1aa; margin-top: 24px;">
        This link expires in 24 hours and can only be used once. If you
        weren't expecting this, you can ignore this email.
      </p>
    `),
  });
};

/**
 * Sent after a successful reset so the real account owner finds out if
 * someone else performed it. Standard practice (Google, GitHub, etc.) —
 * it's the detection mechanism for an unauthorized reset, not a convenience.
 */
export const sendPasswordChangedEmail = async ({ to }) => {
  await send({
    to,
    subject: "Your WithinBlocks password was changed",
    html: wrapper(`
      <h2 style="font-size: 20px; color: #09090b; margin: 0 0 8px;">Password changed</h2>
      <p style="font-size: 14px; color: #52525b; line-height: 1.5; margin: 0;">
        Your WithinBlocks password was just changed. If this wasn't you,
        please contact your account owner immediately.
      </p>
    `),
  });
};