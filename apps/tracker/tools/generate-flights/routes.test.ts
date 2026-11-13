import { distanceBetweenNm } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { SIMULATED_TYPES, type TypeFamily, typesOf } from "./aircraft-types.ts";
import { airportOf } from "./airports/airport-data.ts";
import { generateFlight } from "./generator.ts";
import { destinationsOf, estimatedAirborneS, scenarioOf } from "./routes.ts";

/** Liftoff to last touchdown of a generated flight, s. */
function airborneS(records: ReturnType<typeof generateFlight>["records"]): number {
  const samples = records.flatMap((r) => (r.type === "sample" ? [r] : []));
  const liftoff = samples.find((s) => !s.data.onGround);
  const touchdown = samples.findLast(
    (s, i) => s.data.onGround && samples[i - 1]?.data.onGround === false,
  );
  return ((touchdown?.t ?? 0) - (liftoff?.t ?? 0)) / 1000;
}

describe("simulated types and routes", () => {
  it("covers every family, each type with a catalogue designator of its own", () => {
    const families = new Set(SIMULATED_TYPES.map((t) => t.family));
    expect(families).toEqual(
      new Set<TypeFamily>(["light", "turboprop", "business", "regional", "narrow", "wide"]),
    );
    const models = SIMULATED_TYPES.map((t) => t.aircraft.model);
    expect(new Set(models).size).toBe(models.length);
  });

  it("goes only to airports in the type's range, with a runway long enough", () => {
    const from = airportOf("LFPG");
    for (const type of SIMULATED_TYPES) {
      for (const to of destinationsOf(type, from)) {
        const nm = distanceBetweenNm(from, to);
        expect(nm).toBeGreaterThanOrEqual(type.rangeNm[0]);
        expect(nm).toBeLessThanOrEqual(type.rangeNm[1]);
        expect(Math.max(...to.runways.map((r) => r.lengthFt))).toBeGreaterThanOrEqual(
          type.minRunwayFt,
        );
      }
    }
    const [c172] = typesOf(["light"]);
    expect(
      c172 &&
        destinationsOf(c172, airportOf("KJFK")).every(
          (a) => a.icao.startsWith("K") || a.icao.startsWith("C"),
        ),
    ).toBe(true);
  });

  it.each([
    ["C172", "LFBH", "LFRS"],
    ["TBM9", "LFST", "EDDH"],
    ["E190", "LFPO", "LOWW"],
    ["A21N", "LFSB", "LTFM"],
    ["B789", "LFBP", "KJFK"],
  ])("estimates the time in the air of a %s flight within 12 %%", (model, from, to) => {
    const type = SIMULATED_TYPES.find((t) => t.aircraft.model === model);
    if (!type) throw new Error(model);
    const order = { callsign: "WMS1", seed: 1, type, from: airportOf(from), to: airportOf(to) };
    const actual = airborneS(generateFlight(scenarioOf(order)).records);
    const estimate = estimatedAirborneS(type, order.from, order.to);
    expect(Math.abs(estimate / actual - 1)).toBeLessThan(0.12);
  });
});
