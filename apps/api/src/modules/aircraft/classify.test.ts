import type { AircraftInfo } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { catalogueCategory } from "./catalogue.ts";
import { classifyAircraft } from "./classify.ts";

const aircraft = (changes: Partial<AircraftInfo>): AircraftInfo => ({
  simulator: "msfs2024",
  title: "Some aircraft",
  model: null,
  registration: null,
  engineCount: 1,
  emptyWeightKg: null,
  engineType: null,
  airframe: null,
  maxGrossWeightKg: null,
  ...changes,
});

describe("catalogue of ICAO types", () => {
  it.each([
    ["C172", "light"],
    ["TBM9", "turboprop"],
    ["AT76", "turboprop"],
    ["C25C", "businessJet"],
    ["CRJ7", "regionalJet"],
    ["A20N", "narrowBody"],
    ["B738", "narrowBody"],
    ["B78X", "wideBody"],
    ["AS50", "helicopter"],
    ["F18", "other"],
  ])("ranks %s as %s", (type, category) => {
    expect(catalogueCategory(type)).toBe(category);
  });

  it("ignores case and spaces", () => {
    expect(catalogueCategory(" a20n ")).toBe("narrowBody");
  });

  it("does not know a made-up type", () => {
    expect(catalogueCategory("ZZZZ")).toBeNull();
  });
});

describe("classifyAircraft", () => {
  it("trusts the catalogue first, even when the simulator says otherwise", () => {
    expect(classifyAircraft(aircraft({ model: "B738", engineType: "piston" }))).toEqual({
      category: "narrowBody",
      estimated: false,
    });
  });

  it.each<[Partial<AircraftInfo>, string]>([
    [{ engineType: "piston" }, "light"],
    [{ engineType: "turboprop" }, "turboprop"],
    [{ engineType: "helicopterTurbine" }, "helicopter"],
    [{ engineType: "piston", airframe: "helicopter" }, "helicopter"],
    [{ engineType: "none" }, "other"],
    [{ engineType: "jet", maxGrossWeightKg: 7_700 }, "businessJet"],
    [{ engineType: "jet", maxGrossWeightKg: 38_000 }, "regionalJet"],
    [{ engineType: "jet", maxGrossWeightKg: 79_000 }, "narrowBody"],
    [{ engineType: "jet", maxGrossWeightKg: 254_000 }, "wideBody"],
  ])("estimates an unknown type from %o: %s", (changes, category) => {
    expect(classifyAircraft(aircraft({ model: "ZZZZ", ...changes }))).toEqual({
      category,
      estimated: true,
    });
  });

  it("cannot tell a jet without its weight", () => {
    expect(classifyAircraft(aircraft({ engineType: "jet" }))).toBeNull();
  });

  it("knows nothing about a flight of an older tracker with an unknown type", () => {
    expect(classifyAircraft(aircraft({ model: "ZZZZ" }))).toBeNull();
  });
});
