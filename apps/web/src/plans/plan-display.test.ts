import type { PlanCatalog } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { cardLines, featureGroups, formatPrice } from "./plan-display.ts";

const plans: PlanCatalog["plans"] = [
  {
    id: "pilot_free",
    audience: "pilot",
    includes: null,
    recommended: false,
    monthlyCents: 0,
    yearlyCents: 0,
  },
  {
    id: "pilot_pro",
    audience: "pilot",
    includes: "pilot_free",
    recommended: true,
    monthlyCents: 499,
    yearlyCents: 4990,
  },
  {
    id: "company",
    audience: "company",
    includes: "pilot_pro",
    recommended: false,
    monthlyCents: 1900,
    yearlyCents: 19000,
  },
  {
    id: "holding",
    audience: "company",
    includes: "company",
    recommended: false,
    monthlyCents: 5900,
    yearlyCents: 59000,
  },
];
const values = (free: unknown, pro: unknown, company: unknown, holding: unknown) =>
  ({ pilot_free: free, pilot_pro: pro, company, holding }) as PlanCatalog["features"][0]["values"];
const catalog: PlanCatalog = {
  indicativePrices: true,
  currency: "EUR",
  fairUseActivePilots: 1000,
  plans,
  features: [
    { key: "tracker", group: "fly", onCard: true, values: values(true, true, true, true) },
    { key: "flightNotes", group: "logbook", onCard: false, values: values(true, true, true, true) },
    {
      key: "goals",
      group: "logbook",
      onCard: true,
      values: values(1, "unlimited", "unlimited", "unlimited"),
    },
    { key: "export", group: "analysis", onCard: true, values: values(false, true, true, true) },
    { key: "companies", group: "company", onCard: true, values: values(false, false, 1, 5) },
  ],
};
const [free, pro, company, holding] = plans as [
  (typeof plans)[0],
  (typeof plans)[0],
  (typeof plans)[0],
  (typeof plans)[0],
];

describe("cardLines", () => {
  it("lists every card feature of the first plan", () => {
    expect(cardLines(catalog, free)).toEqual([
      { key: "tracker", value: true },
      { key: "goals", value: 1 },
    ]);
  });

  it("lists only what a plan adds to the plan it includes", () => {
    expect(cardLines(catalog, pro)).toEqual([
      { key: "goals", value: "unlimited" },
      { key: "export", value: true },
    ]);
    expect(cardLines(catalog, company)).toEqual([{ key: "companies", value: 1 }]);
    expect(cardLines(catalog, holding)).toEqual([{ key: "companies", value: 5 }]);
  });
});

describe("featureGroups", () => {
  it("keeps the catalogue order, card features or not", () => {
    expect(featureGroups(catalog).map(([group, rows]) => [group, rows.length])).toEqual([
      ["fly", 1],
      ["logbook", 2],
      ["analysis", 1],
      ["company", 1],
    ]);
  });
});

describe("formatPrice", () => {
  it("shows cents only when there are some", () => {
    expect(formatPrice(499, "fr")).toBe("4,99 €");
    expect(formatPrice(1900, "fr")).toBe("19 €");
    expect(formatPrice(4990, "en")).toBe("€49.90");
  });
});
