import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  AIRCRAFT_NUMBER_VARS,
  AIRCRAFT_STRING_VARS,
  decodeAircraft,
  decodeSample,
  ENGINE_SLOTS,
  ENGINE_VARS,
  SAMPLE_VARS,
  sampleDefinition,
} from "./sim-vars.ts";

/** name → { unit, verified } from docs/reference/simvars.yaml (one flow mapping per line). */
function referenceSimVars(): Map<string, { unit: string; verified: boolean }> {
  const yaml = readFileSync(
    new URL("../../../docs/reference/simvars.yaml", import.meta.url),
    "utf8",
  );
  const entries = new Map<string, { unit: string; verified: boolean }>();
  for (const match of yaml.matchAll(/\{ name: "?([^",]+)"?, unit: ([^,]+),.*verified: (\w+)/g)) {
    const [, name = "", unit = "", verified] = match;
    entries.set(name, { unit: unit.trim(), verified: verified === "true" });
  }
  return entries;
}

describe("SimVars read by the MSFS connector", () => {
  const reference = referenceSimVars();
  const all = [
    ...SAMPLE_VARS,
    ...AIRCRAFT_STRING_VARS,
    ...AIRCRAFT_NUMBER_VARS,
    ...ENGINE_VARS.map(([key, name, unit]) => [key, `${name}:n`, unit] as const),
  ];

  it.each(all.map(([, name, unit]) => [name, unit]))(
    "%s is verified in simvars.yaml, with the same unit",
    (name, unit) => {
      expect(reference.get(name)).toEqual({ unit, verified: true });
    },
  );

  it("declares every sample variable once, engines last", () => {
    const definition = sampleDefinition();
    expect(definition).toHaveLength(SAMPLE_VARS.length + ENGINE_SLOTS * ENGINE_VARS.length);
    expect(new Set(definition.map((d) => d.name)).size).toBe(definition.length);
    expect(definition.at(-1)).toEqual({ name: `TURB ENG N1:${ENGINE_SLOTS}`, unit: "percent" });
  });

  it("decodes values in the declared order", () => {
    let next = 0;
    const raw = decodeSample(() => next++);
    expect(raw.values.lat).toBe(0);
    expect(raw.values.slew).toBe(SAMPLE_VARS.length - 1);
    expect(raw.engines[0]).toEqual({ running: SAMPLE_VARS.length, n1: SAMPLE_VARS.length + 1 });
    expect(raw.engines).toHaveLength(ENGINE_SLOTS);
  });

  it("decodes the aircraft identity, strings first", () => {
    const strings = ["Airbus A320neo", "A320", "F-WEMS"];
    const numbers = [2, 90_000];
    const raw = decodeAircraft(
      () => strings.shift() ?? "",
      () => numbers.shift() ?? 0,
    );
    expect(raw).toEqual({
      strings: { title: "Airbus A320neo", model: "A320", registration: "F-WEMS" },
      numbers: { engineCount: 2, emptyWeightLb: 90_000 },
    });
  });
});
