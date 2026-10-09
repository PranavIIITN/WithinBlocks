// Run with:  node --test
// Uses Node's built-in test runner, so no new dependency.
//
// Covers the parts of PRD 1 section 20 that are pure logic. The parts that
// need a real database (new-company defaults, migrating existing companies,
// storing COMPED/TRIALING rows) can't be unit-tested here; see the manual
// checklist in PLAN_SETUP.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PLANS, PLAN_KEYS, isUnlimited, getPlanConfiguration } from "./plan.config.js";

test("monthly pricing", () => {
  assert.equal(PLANS.FREE.pricing.monthly, 0);
  assert.equal(PLANS.STARTER.pricing.monthly, 299);
  assert.equal(PLANS.PRO.pricing.monthly, 699);
});

test("yearly pricing", () => {
  assert.equal(PLANS.FREE.pricing.yearly, 0);
  assert.equal(PLANS.STARTER.pricing.yearly, 2990);
  assert.equal(PLANS.PRO.pricing.yearly, 6990);
});

test("FREE limits", () => {
  assert.deepEqual(PLANS.FREE.limits, {
    users: 1,
    products: 20,
    invoicesPerMonth: 20,
    aiActionsPerMonth: 20,
  });
});

test("STARTER limits: products and invoices unlimited", () => {
  assert.deepEqual(PLANS.STARTER.limits, {
    users: 2,
    products: null,
    invoicesPerMonth: null,
    aiActionsPerMonth: 100,
  });
});

test("PRO limits: products and invoices unlimited", () => {
  assert.deepEqual(PLANS.PRO.limits, {
    users: 5,
    products: null,
    invoicesPerMonth: null,
    aiActionsPerMonth: 500,
  });
});

test("isUnlimited is strict: only null means unlimited", () => {
  assert.equal(isUnlimited(null), true);
  assert.equal(isUnlimited(0), false); // 0 is a real limit, not "unlimited"
  assert.equal(isUnlimited(20), false);
  // A missing limit must never read as unlimited, or an absent key would
  // grant everything (fail open).
  assert.equal(isUnlimited(undefined), false);
});

test("nothing is lost through JSON (no Infinity hiding in the config)", () => {
  // Infinity would serialise to null and come back different.
  assert.deepEqual(JSON.parse(JSON.stringify(PLANS)), PLANS);
});

test("every plan defines the same limit and feature keys", () => {
  const limitKeys = Object.keys(PLANS.FREE.limits).sort();
  const featureKeys = Object.keys(PLANS.FREE.features).sort();
  for (const key of PLAN_KEYS) {
    assert.deepEqual(Object.keys(PLANS[key].limits).sort(), limitKeys, `${key} limits`);
    assert.deepEqual(Object.keys(PLANS[key].features).sort(), featureKeys, `${key} features`);
  }
});

test("features: FREE and STARTER match the PRD, PRO has everything", () => {
  const basic = { gstInvoicing: true, inventory: true };
  for (const key of ["FREE", "STARTER"]) {
    for (const [feature, on] of Object.entries(PLANS[key].features)) {
      assert.equal(on, basic[feature] === true, `${key}.${feature}`);
    }
  }
  assert.ok(Object.values(PLANS.PRO.features).every((on) => on === true));
});

test("config is frozen: it cannot be mutated at runtime", () => {
  assert.throws(() => {
    PLANS.PRO.limits.users = 999;
  }, TypeError);
  assert.throws(() => {
    PLANS.FREE.features.apiAccess = true;
  }, TypeError);
});

test("getPlanConfiguration returns the plan, and rejects anything else", () => {
  assert.equal(getPlanConfiguration("PRO"), PLANS.PRO);
  assert.equal(getPlanConfiguration("PRO").name, "Pro");
  assert.throws(() => getPlanConfiguration("ENTERPRISE"), /Unknown plan/);
  assert.throws(() => getPlanConfiguration(undefined), /Unknown plan/);
  // Inherited object keys must not count as plans.
  assert.throws(() => getPlanConfiguration("constructor"), /Unknown plan/);
  assert.throws(() => getPlanConfiguration("toString"), /Unknown plan/);
});

test("config plans match the Plan enum in schema.prisma", () => {
  // Guards against adding a plan in one place and forgetting the other.
  const schema = readFileSync(new URL("../../../prisma/schema.prisma", import.meta.url), "utf8");
  const body = schema.match(/enum Plan \{([^}]*)\}/)?.[1];
  assert.ok(body, "enum Plan not found in schema.prisma");
  const enumValues = body
    .split("\n")
    .map((line) => line.replace(/\/\/.*/, "").trim())
    .filter(Boolean);
  assert.deepEqual([...enumValues].sort(), [...PLAN_KEYS].sort());
});