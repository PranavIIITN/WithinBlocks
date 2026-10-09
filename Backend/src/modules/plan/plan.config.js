// ===============================================================
// PLAN CONFIGURATION — the single source of truth for what each plan
// costs and allows. This is DATA ONLY. Nothing here blocks or limits
// anything yet; the entitlement/gating layer (PRD 2) will read from it.
//
// Conventions
// - A limit of `null` means UNLIMITED. Not Infinity: Infinity silently
//   becomes null as soon as it passes through JSON, which would leave two
//   meanings for the same thing. Not a huge number like 999999999 either.
// - Always use isUnlimited(). And never treat a MISSING limit as unlimited:
//   that would fail open (an absent key would grant everything).
// - Prices are whole rupees.
// - This module imports nothing, so it is trivially testable and safe to
//   import from anywhere (including code that must not touch the database).
// ===============================================================

const deepFreeze = (obj) => {
  Object.values(obj).forEach((value) => {
    if (value && typeof value === "object") deepFreeze(value);
  });
  return Object.freeze(obj);
};

// Frozen on purpose: a config object that gets mutated at runtime by
// accident would change what every company is allowed to do, process-wide.
export const PLANS = deepFreeze({
  FREE: {
    name: "Free",
    pricing: { monthly: 0, yearly: 0 },
    limits: {
      users: 1,
      products: 20,
      invoicesPerMonth: 20,
      aiActionsPerMonth: 20,
    },
    features: {
      gstInvoicing: true,
      inventory: true,
      advancedAgent: false,
      shopifyIntegration: false,
      advancedAnalytics: false,
      roleBasedPermissions: false,
      apiAccess: false,
    },
  },

  STARTER: {
    name: "Starter",
    pricing: { monthly: 299, yearly: 2990 },
    limits: {
      users: 2,
      products: null, // unlimited
      invoicesPerMonth: null, // unlimited
      aiActionsPerMonth: 100,
    },
    features: {
      gstInvoicing: true,
      inventory: true,
      advancedAgent: false,
      shopifyIntegration: false,
      advancedAnalytics: false,
      roleBasedPermissions: false,
      apiAccess: false,
    },
  },

  PRO: {
    name: "Pro",
    pricing: { monthly: 699, yearly: 6990 },
    limits: {
      users: 5,
      products: null, // unlimited
      invoicesPerMonth: null, // unlimited
      aiActionsPerMonth: 500,
    },
    features: {
      gstInvoicing: true,
      inventory: true,
      advancedAgent: true,
      shopifyIntegration: true,
      advancedAnalytics: true,
      roleBasedPermissions: true,
      apiAccess: true,
    },
  },
});

export const PLAN_KEYS = Object.freeze(Object.keys(PLANS));

// Strictly `=== null`. 0 is a real limit (nothing allowed), and undefined
// means "this limit isn't configured", which must never read as unlimited.
export const isUnlimited = (limit) => limit === null;

export const getPlanConfiguration = (plan) => {
  // hasOwn, not PLANS[plan]: a plain lookup would happily "find" inherited
  // keys such as "constructor" or "toString".
  if (!Object.hasOwn(PLANS, plan)) {
    throw new Error(`Unknown plan: ${String(plan)}`);
  }
  return PLANS[plan];
};