import { describe, expect, it } from "vitest";
import { airframeOf, engineTypeOf, icaoTypeOf } from "./aircraft-identity.ts";

describe("icaoTypeOf (ATC MODEL)", () => {
  it.each([
    ["TT:ATCCOM.AC_MODEL_B738.0.text", "B738"],
    ["TT:ATCCOM.AC_MODEL A20N.0.text", "A20N"],
    ["ATCCOM.AC_MODEL_C172.0.text", "C172"],
    ["$$:TBM9", "TBM9"],
    ["a20n", "A20N"],
    [" B78X ", "B78X"],
  ])("reads %s as %s", (model, type) => {
    expect(icaoTypeOf(model)).toBe(type);
  });
});

describe("engineTypeOf (ENGINE TYPE)", () => {
  it.each([
    [0, "piston"],
    [1, "jet"],
    [2, "none"],
    [3, "helicopterTurbine"],
    [5, "turboprop"],
  ])("reads %i as %s", (code, type) => {
    expect(engineTypeOf(code)).toBe(type);
  });

  it("treats unsupported and unexpected values as unknown", () => {
    expect(engineTypeOf(4)).toBeNull();
    expect(engineTypeOf(Number.NaN)).toBeNull();
  });
});

describe("airframeOf (CATEGORY)", () => {
  it("keeps airplanes and helicopters, nothing else", () => {
    expect(airframeOf("Airplane")).toBe("airplane");
    expect(airframeOf("Helicopter")).toBe("helicopter");
    expect(airframeOf("GroundVehicle")).toBeNull();
  });
});
