import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "../../lib/prisma.js";
import { generateToken } from "../../utils/jwt.js";

const INVITE_TOKEN_BYTES = 32; // 256 bits — matches PRD §8's "length >= 32 bytes"
const INVITE_EXPIRY_HOURS = 24;

// Fields safe to ever return to a client. Never spread a raw Prisma User —
// that row also carries `password` (a bcrypt hash) and `inviteToken`
// (a bearer credential), and both are attacker-relevant if leaked.
const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

const buildInviteLink = (token) => {
  const base = process.env.FRONTEND_URL || "http://localhost:5173";
  return `${base}/accept-invite?token=${token}`;
};

// ===============================================================
// INVITE USER
// ===============================================================
const inviteUser = async (companyId, email) => {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // Schema has `email @unique` globally, not per-company (PRD §7.1's
    // acknowledged MVP limitation). That means an inactive/pending user
    // row could belong to a DIFFERENT company than the one inviting right
    // now. Re-inviting must only ever refresh a token for a pending
    // invite THIS company issued — never silently take over someone
    // else's pending invite or touch an account active anywhere else.
    if (existing.companyId !== companyId) {
      const error = new Error("This email is already associated with another account.");
      error.statusCode = 409;
      throw error;
    }

    if (existing.isActive) {
      const error = new Error("This person is already an active member of your team.");
      error.statusCode = 409;
      throw error;
    }

    // Same company, still pending — this is a legitimate re-invite.
    // Regenerate the token so the old link (possibly already leaked
    // to an inbox, a Slack message, wherever) stops working.
    const inviteToken = crypto.randomBytes(INVITE_TOKEN_BYTES).toString("hex");
    const inviteExpiry = new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000);

    const user = await prisma.user.update({
      where: { id: existing.id },
      data: { inviteToken, inviteExpiry },
    });

    return {
      user: toPublicUser(user),
      inviteLink: buildInviteLink(inviteToken),
      reinvited: true,
      companyName: company.name,
    };
  }

  const inviteToken = crypto.randomBytes(INVITE_TOKEN_BYTES).toString("hex");
  const inviteExpiry = new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      email,
      role: "STAFF",
      companyId,
      isActive: false,
      inviteToken,
      inviteExpiry,
      // name and password are set at accept-invite time — the owner never
      // sets or sees the employee's password (PRD §4.2).
    },
  });

  return {
    user: toPublicUser(user),
    inviteLink: buildInviteLink(inviteToken),
    reinvited: false,
    companyName: company.name,
  };
};

// ===============================================================
// ACCEPT INVITE
// ===============================================================
const acceptInvite = async ({ token, name, password }) => {
  const user = await prisma.user.findUnique({ where: { inviteToken: token } });

  // Deliberately vague on WHY it failed (no such token vs. expired vs.
  // already used) — distinguishing them for an attacker just helps them
  // enumerate valid-but-expired tokens.
  const invalidError = () => {
    const error = new Error("This invite link is invalid or has expired.");
    error.statusCode = 400;
    return error;
  };

  if (!user) throw invalidError();
  if (user.isActive) throw invalidError(); // already used — single-use, PRD §5.2
  if (!user.inviteExpiry || user.inviteExpiry < new Date()) throw invalidError();

  const hashedPassword = await bcrypt.hash(password, 10);

  const activated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      password: hashedPassword,
      isActive: true,
      inviteToken: null, // burns the token — cannot be replayed
      inviteExpiry: null,
    },
  });

  // Auto-login on acceptance, consistent with register/login — the new
  // employee shouldn't have to immediately re-enter the password they
  // just set.
  const jwt = generateToken({
    userId: activated.id,
    companyId: activated.companyId,
    role: activated.role,
  });

  const company = await prisma.company.findUnique({ where: { id: activated.companyId } });

  return { token: jwt, user: toPublicUser(activated), company };
};

// ===============================================================
// LIST USERS
// ===============================================================
const listUsers = async (companyId) => {
  const users = await prisma.user.findMany({
    where: { companyId },
    orderBy: { createdAt: "asc" },
  });
  return users.map(toPublicUser);
};

// ===============================================================
// DEACTIVATE USER
// ===============================================================
const deactivateUser = async (companyId, actingUserId, targetUserId) => {
  if (actingUserId === targetUserId) {
    const error = new Error("You cannot deactivate your own account.");
    error.statusCode = 400;
    throw error;
  }

  // findFirst + companyId, same pattern as every other service in this
  // codebase — a target in another company simply doesn't match, so this
  // can never deactivate a user outside the caller's own tenant.
  const target = await prisma.user.findFirst({ where: { id: targetUserId, companyId } });
  if (!target) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  // Not in the PRD, but cheap and worth having: don't let a company
  // deactivate its way into having zero active owners with no one left
  // who can re-invite or reactivate anyone.
  if (target.role === "OWNER" && target.isActive) {
    const activeOwners = await prisma.user.count({
      where: { companyId, role: "OWNER", isActive: true },
    });
    if (activeOwners <= 1) {
      const error = new Error("Cannot deactivate the only active owner of this company.");
      error.statusCode = 400;
      throw error;
    }
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { isActive: false },
  });

  return toPublicUser(updated);
};

export { inviteUser, acceptInvite, listUsers, deactivateUser };