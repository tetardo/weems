import type { PlanCatalog } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { featureIncluded } from "./features.ts";

const values = (free: unknown, pro: unknown) => ({
  pilot_free: free,
  pilot_pro: pro,
  company: pro,
  holding: pro,
});
const catalog = {
  features: [
    { key: "basicStats", group: "logbook", onCard: true, values: values(true, true) },
    { key: "approachAnalysis", group: "analysis", onCard: true, values: values(false, true) },
    { key: "goals", group: "logbook", onCard: true, values: values(1, "unlimited") },
  ],
} as unknown as PlanCatalog;

describe("featureIncluded", () => {
  it("reads the value of the plan in the catalog", () => {
    expect(featureIncluded(catalog, "pilot_free", "basicStats")).toBe(true);
    expect(featureIncluded(catalog, "pilot_free", "approachAnalysis")).toBe(false);
    expect(featureIncluded(catalog, "pilot_pro", "approachAnalysis")).toBe(true);
  });

  it("counts a limit as included", () => {
    expect(featureIncluded(catalog, "pilot_free", "goals")).toBe(true);
    expect(featureIncluded(catalog, "pilot_pro", "goals")).toBe(true);
  });

  it("locks a key missing from the catalog", () => {
    expect(featureIncluded(catalog, "pilot_pro", "export")).toBe(false);
  });
});
