import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../../lib/prisma.js";
import {generateToken} from "../../utils/jwt.js";
import { sendPasswordResetEmail, sendPasswordChangedEmail } from "../email/email.service.js";

const RESET_TOKEN_BYTES = 32;        // 256 bits — same strength as the invite token
const RESET_EXPIRY_MINUTES = 60;

const hashResetToken = (rawToken) =>
  crypto.createHash("sha256").update(rawToken).digest("hex");

const buildResetLink = (rawToken) => {
  const base = process.env.FRONTEND_URL || "http://localhost:5173";
  return `${base}/reset-password?token=${rawToken}`;
};

const register = async ({companyName, state, name, email, password}) => {
    
    //Step 1: Check if email already exists
    const existingUser = await prisma.user.findUnique({where : {email}});
    if(existingUser) {
        const error = new Error("email already in use");
        error.statusCode = 409;
        throw error;
    }

    //Step 2: Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    //Step 3 & 4: Creating the user and the company together
    const company = await prisma.company.create({
        data: {
            name: companyName,
            state,
            email,
            users: {
                create: {
                    name,
                    email,
                    password: hashedPassword,
                    role: "OWNER",
                    isActive: true,
                },
            },
        },
        include: {users : true},
    });

    const user = company.users[0];

    //Step 5 Generating JWT token
    const token = generateToken({
        userId: user.id,
        companyId: user.companyId,
        role: user.role,
    });


    //Step 6: return User and Company
    return {token, user, company};
}

const login = async ({email, password}) => {
    
    //Step 1 Checking if user exists
    const user = await prisma.user.findUnique({
        where : {email},
        include: {company: true},
    });
    if(!user) {
        const error = new Error("User does not exist");
        error.statusCode = 401;
        throw error;
    }

    //Step 2 Check if user is active
    if(!user.isActive) {
        const error = new Error("User is not active");
        error.statusCode = 401;
        throw error;
    }

    //Step 3 Comparing the password
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) {
        const error = new Error("Incorrect Password");
        error.statusCode = 401;
        throw error;
    }

    
    //Step 4 Generating JWT token
    const token = generateToken({
        userId: user.id,
        companyId: user.companyId,
        role: user.role,
    });

    return {token, user};

}

// ===============================================================
// REQUEST PASSWORD RESET
// ===============================================================
// Deliberately returns the SAME outcome (nothing — the controller sends an
// identical message either way) regardless of whether the email exists, is
// inactive, or belongs to a real account. This endpoint is public and
// unauthenticated, so its response is the only signal it could leak through
// — an attacker who gets different behavior for "exists" vs "doesn't" can
// enumerate every registered email on the platform, one guess at a time.
const requestPasswordReset = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // No account, or an account that was invited but never activated (no
  // password has ever been set — there's nothing to "reset"; they need the
  // accept-invite link instead). Silently do nothing in both cases.
  if (!user || !user.isActive) return;

  const rawToken = crypto.randomBytes(RESET_TOKEN_BYTES).toString("hex");
  const resetPasswordTokenHash = hashResetToken(rawToken);
  const resetPasswordExpiry = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetPasswordTokenHash, resetPasswordExpiry },
  });

  const resetLink = buildResetLink(rawToken);

  // Best-effort — a failed send shouldn't change what the caller sees
  // (still the same generic message either way), only what gets logged.
  try {
    await sendPasswordResetEmail({ to: user.email, resetLink });
  } catch (err) {
    console.error(`[password-reset] email send failed for ${user.email}:`, err.message);
  }
};

// ===============================================================
// RESET PASSWORD
// ===============================================================
const resetPassword = async ({ token, password }) => {
  const resetPasswordTokenHash = hashResetToken(token);
  const user = await prisma.user.findUnique({ where: { resetPasswordTokenHash } });

  // One vague message for every failure mode (no such token, expired,
  // already used) — same reasoning as accept-invite: distinguishing them
  // would help an attacker tell a wrong guess from an expired-but-real one.
  const invalidError = () => {
    const error = new Error("This reset link is invalid or has expired.");
    error.statusCode = 400;
    return error;
  };

  if (!user) throw invalidError();
  if (!user.resetPasswordExpiry || user.resetPasswordExpiry < new Date()) throw invalidError();

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordTokenHash: null, // burns the token — single use
      resetPasswordExpiry: null,
    },
  });

  // Best-effort notification — the reset already succeeded regardless of
  // whether this send works.
  try {
    await sendPasswordChangedEmail({ to: user.email });
  } catch (err) {
    console.error(`[password-reset] confirmation email failed for ${user.email}:`, err.message);
  }
};

export {register, login, requestPasswordReset, resetPassword};