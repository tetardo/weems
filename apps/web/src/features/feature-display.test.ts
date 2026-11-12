import type { PlanCatalog, PlanFeature } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { featureLimits, firstPlanWith } from "./feature-display.ts";

const plan = (id: PlanCatalog["plans"][0]["id"]) => ({
  id,
  audience: "pilot" as const,
  includes: null,
  recommended: false,
  monthlyCents: 0,
  yearlyCents: 0,
});
const catalog: PlanCatalog = {
  indicativePrices: true,
  currency: "EUR",
  fairUseActivePilots: 1000,
  plans: [plan("pilot_free"), plan("pilot_pro"), plan("company"), plan("holding")],
  features: [],
};
const feature = (free: unknown, pro: unknown, company: unknown, holding: unknown): PlanFeature =>
  ({
    key: "goals",
    group: "logbook",
    onCard: true,
    availability: "available",
    values: { pilot_free: free, pilot_pro: pro, company, holding },
  }) as PlanFeature;

describe("firstPlanWith", () => {
  it("names the first plan that includes the feature, limits counting as included", () => {
    expect(firstPlanWith(catalog, feature(true, true, true, true))).toBe("pilot_free");
    expect(firstPlanWith(catalog, feature(false, true, true, true))).toBe("pilot_pro");
    expect(firstPlanWith(catalog, feature(false, false, 1, 5))).toBe("company");
    expect(firstPlanWith(catalog, feature(false, false, false, true))).toBe("holding");
  });

  it("gives null for a feature no plan includes", () => {
    expect(firstPlanWith(catalog, feature(false, false, false, false))).toBeNull();
  });
});

describe("featureLimits", () => {
  it("is empty for a feature simply included or not", () => {
    expect(featureLimits(catalog, feature(false, true, true, true))).toEqual([]);
  });

  it("lists the limit of every plan that has the feature, in plan order", () => {
    expect(featureLimits(catalog, feature(1, "unlimited", "unlimited", "unlimited"))).toEqual([
      { plan: "pilot_free", value: 1 },
      { plan: "pilot_pro", value: "unlimited" },
      { plan: "company", value: "unlimited" },
      { plan: "holding", value: "unlimited" },
    ]);
    expect(featureLimits(catalog, feature(false, false, 50, "unlimited"))).toEqual([
      { plan: "company", value: 50 },
      { plan: "holding", value: "unlimited" },
    ]);
  });
});
