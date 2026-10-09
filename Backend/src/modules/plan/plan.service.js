import prisma from "../../lib/prisma.js";
import { getPlanConfiguration } from "./plan.config.js";

// Re-exported so callers have one import for everything plan-related.
// The function itself lives in plan.config.js to keep that module free of
// database imports (and therefore testable without Prisma).
export { getPlanConfiguration };

/**
 * A company's current subscription state, exactly as stored:
 *   { plan, billingStatus, planStartedAt, planExpiresAt }
 *
 * This reports state; it deliberately does NOT interpret it. Whether PRO +
 * COMPED, or an EXPIRED plan, means "allowed" or "blocked" is the
 * entitlement layer's job (PRD 2). Don't assume a plan implies payment.
 *
 * `companyId` must come from the verified JWT (req.user.companyId), never
 * from a request body. `select` keeps the result to exactly these four
 * fields so no other company data leaks through this function.
 */
export const getCompanyPlan = async (companyId) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      plan: true,
      billingStatus: true,
      planStartedAt: true,
      planExpiresAt: true,
    },
  });

  if (!company) {
    const error = new Error("Company not found");
    error.statusCode = 404;
    throw error;
  }

  return company;
};