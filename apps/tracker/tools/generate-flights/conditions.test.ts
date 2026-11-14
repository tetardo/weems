import { describe, expect, it } from "vitest";
import type { Sample } from "@weems/contrats";
import { SIMULATED_TYPES } from "./aircraft-types.ts";
import { generateFlight } from "./generator.ts";
import { LFPG_LFBO, type Scenario } from "./scenario.ts";
import { oatAt, windAt } from "./weather.ts";

const samplesOf = (scenario: Scenario): Sample[] =>
  generateFlight(scenario).records.flatMap((r) => (r.type === "sample" ? [r.data] : []));

describe("conditions of a synthetic flight (fiche 021)", () => {
  const samples = samplesOf(LFPG_LFBO);
  const airborne = samples.filter((s) => !s.onGround);
  const top = Math.max(...airborne.map((s) => s.altMsl));
  const cruise = airborne.find((s) => s.altMsl > top - 500 && Math.abs(s.vs) < 100) as Sample;

  it("burns fuel and the total weight follows it", () => {
    const first = samples[0] as Sample;
    const last = samples.at(-1) as Sample;
    expect(last.fuelKg ?? 0).toBeLessThan(first.fuelKg ?? 0);
    expect((first.weightKg ?? 0) - (last.weightKg ?? 0)).toBeCloseTo(
      (first.fuelKg ?? 0) - (last.fuelKg ?? 0),
      6,
    );
    expect(first.weightKg ?? 0).toBeLessThanOrEqual(LFPG_LFBO.aircraft.maxGrossWeightKg ?? 0);
  });

  it("gives a plausible atmosphere: colder, windier, indicated speed and Mach up high", () => {
    expect(cruise.oat).toBeLessThan((samples[0] as Sample).oat - 40);
    expect(cruise.wind.speed).toBeGreaterThan((samples[0] as Sample).wind.speed);
    expect(cruise.tas).toBeGreaterThan(cruise.ias);
    expect(cruise.mach).toBeGreaterThan(0.6);
    expect(cruise.mach).toBeLessThan(0.95);
  });

  it("drives the lights, the engines and the runway like a crew", () => {
    const roll = samples.find((s) => s.onGround && s.gs > 100) as Sample;
    expect(roll).toMatchObject({ onRunway: true, lights: { landing: true, strobe: true } });
    expect(roll.engines[0]?.n1).toBeGreaterThan(85);
    expect(cruise.lights.landing).toBe(false);
    expect(cruise.engines[0]?.n1).toBe(80);
    const taxi = samples.find((s) => s.onGround && s.gs > 5 && s.gs < 30) as Sample;
    expect(taxi).toMatchObject({ onRunway: false, lights: { taxi: true, strobe: false } });
  });

  it("measures accelerations: forward on the take-off roll, a firm g at touchdown", () => {
    const roll = samples.find((s) => s.onGround && s.gs > 100) as Sample;
    expect(roll.accel.longitudinal).toBeGreaterThan(0.1);
    expect(Math.max(...samples.map((s) => s.gForce))).toBeGreaterThan(1);
  });

  const c172 = SIMULATED_TYPES.find((t) => t.aircraft.model === "C172");
  const lightFlight = samplesOf({ ...LFPG_LFBO, aircraft: c172?.aircraft ?? LFPG_LFBO.aircraft });

  it("gives no N1 for a piston engine", () => {
    const running = lightFlight.find((s) => s.engines.some((e) => e.running)) as Sample;
    expect(running.engines[0]?.n1).toBeNull();
  });

  it("pressurises the cabin of an airliner gently, not that of a piston single", () => {
    const rates = samples.map((s) => s.cabinRate ?? 0);
    expect(Math.max(...rates)).toBeLessThanOrEqual(450 + 1e-6);
    expect(Math.min(...rates)).toBeGreaterThanOrEqual(-280 - 1e-6);
    expect(cruise.altMsl - (cruise.cabinAlt ?? 0)).toBeGreaterThan(20_000);
    for (const s of lightFlight) expect(s.cabinAlt).toBe(s.altMsl);
  });

  it("keeps the standard atmosphere and the wind within physical bounds", () => {
    const weather = {
      windDirDeg: 350,
      surfaceWindKt: 30,
      isaDeviationC: 0,
      visibilityM: 10_000,
      wetRunways: false,
    };
    expect(oatAt(weather, 0)).toBe(15);
    expect(oatAt(weather, 45_000)).toBeCloseTo(oatAt(weather, 36_089), 6);
    expect(windAt(weather, 60_000)).toEqual({ dir: 50, speed: 140 });
  });
});
