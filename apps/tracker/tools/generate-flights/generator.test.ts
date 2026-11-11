import { describe, expect, it } from "vitest";
import { ReplayConnector } from "../../src/connectors/replay/replay-connector.ts";
import { parseReplay, serializeReplay } from "../../src/connectors/replay/replay-format.ts";
import { AIRLINER_PARAMS } from "../../src/core/phases/params.ts";
import { FlightSession } from "../../src/core/session.ts";
import { angleDiffDeg, bearingDeg, crossTrackNm, distanceNm, type Sample } from "@weems/contrats";
import { FlightScript } from "./flight-script.ts";
import { generateFlight } from "./generator.ts";
import { expectedTrace } from "./expected-phases.ts";
import { FLEET, fleetOf } from "./fleet.ts";
import { type Disturbance, LFPG_LFBO, type Scenario } from "./scenario.ts";

/** Plays a generated flight through the real core; returns phases and notable events. */
async function track(scenario: Scenario, disturbances: readonly Disturbance[]): Promise<string> {
  const connector = new ReplayConnector(generateFlight({ ...scenario, disturbances }));
  const seen: string[] = [];
  const session = new FlightSession(
    {
      callsign: "WMS1",
      trackerVersion: "0.1.0",
      clock: { nowUtcMs: () => 0 },
      newFlightId: () => "id",
      params: AIRLINER_PARAMS,
    },
    {
      open: () => {},
      event: (e) => seen.push(e.type === "phaseChanged" ? String(e.context["to"]) : `*${e.type}`),
      position: () => {},
      close: (c) => seen.push(`closed:${c.reason}`),
    },
  );
  connector.onAircraft((a) => session.setAircraft(a));
  connector.onSample((s) => session.handleSample(s));
  connector.onEvent((e) => session.handleSimEvent(e));
  await connector.start();
  return seen.join(" ");
}

describe("generator", () => {
  it("is deterministic: same scenario and seed, same file", () => {
    const a = serializeReplay(generateFlight(LFPG_LFBO));
    expect(serializeReplay(generateFlight(LFPG_LFBO))).toBe(a);
    expect(serializeReplay(generateFlight({ ...LFPG_LFBO, seed: 7 }))).not.toBe(a);
  });

  it("writes valid replay files", () => {
    const replay = generateFlight({ ...LFPG_LFBO, disturbances: ["goAround", "pause"] });
    expect(parseReplay(serializeReplay(replay))).toEqual(replay);
  });
});

describe("generated flights through the core", () => {
  it.each<[string, Disturbance[]]>([
    ["normal flight", []],
    ["go-around", ["goAround"]],
    ["bounce", ["bounce"]],
    ["touch-and-go", ["touchAndGo"]],
    ["rejected take-off", ["rejectedTakeoff"]],
    ["pause, time acceleration, slew, teleport", ["pause", "timeAcceleration", "slew", "teleport"]],
  ])("%s", async (_name, disturbances) => {
    expect(await track(LFPG_LFBO, disturbances)).toBe(
      `${expectedTrace(disturbances)} closed:normal`,
    );
  });

  it("crash", async () => {
    expect(await track(LFPG_LFBO, ["crash"])).toBe(`${expectedTrace(["crash"])} closed:crash`);
  });

  it.each(FLEET.map((s) => [s.name, s] as const))("fleet route %s", async (_name, scenario) => {
    expect(await track(scenario, scenario.disturbances)).toBe(
      `${expectedTrace(scenario.disturbances)} closed:normal`,
    );
  });

  it.each(
    fleetOf(16)
      .slice(10)
      .map((s) => [`${s.callsign} ${s.name}`, s] as const),
  )("large fleet route %s", async (_name, scenario) => {
    expect(await track(scenario, [])).toBe(`${expectedTrace([])} closed:normal`);
  });
});

const samplesOf = (scenario: Scenario): Sample[] =>
  generateFlight(scenario).records.flatMap((r) => (r.type === "sample" ? [r.data] : []));

/** Position of `at` on the runway axis: ft past the threshold and ft beside the centreline. */
function onRunway(at: Sample, runway: FlightScript["choices"]["departureRunway"]) {
  const ahead = Math.abs(angleDiffDeg(runway.headingDeg, bearingDeg(runway, at))) < 90;
  const along = distanceNm(runway.lat, runway.lon, at.lat, at.lon) * 6076 * (ahead ? 1 : -1);
  return { along, beside: crossTrackNm(at, runway, runway.headingDeg) * 6076 };
}

describe("generated tracks", () => {
  it.each(FLEET.map((s) => [s.name, s] as const))("%s uses real runways", (_name, scenario) => {
    const { departureRunway, arrivalRunway } = new FlightScript(scenario).choices;
    const samples = samplesOf(scenario);
    const liftOff = samples.findIndex((s) => !s.onGround);
    const touchdown = samples.findIndex((s, i) => i > liftOff && s.onGround);
    const takeoff = onRunway(samples[liftOff] as Sample, departureRunway);
    const landing = onRunway(samples[touchdown] as Sample, arrivalRunway);
    expect(takeoff.along).toBeGreaterThan(0);
    expect(takeoff.along).toBeLessThan(departureRunway.lengthFt);
    expect(Math.abs(takeoff.beside)).toBeLessThan(75);
    expect(landing.along).toBeGreaterThan(arrivalRunway.displacedThresholdFt);
    expect(landing.along).toBeLessThan(arrivalRunway.lengthFt / 2);
    expect(Math.abs(landing.beside)).toBeLessThan(75);
  });

  it("parks at the arrival airport, at the elevation of its runway", () => {
    const last = samplesOf(LFPG_LFBO).at(-1) as Sample;
    const { arrival } = LFPG_LFBO;
    expect(distanceNm(last.lat, last.lon, arrival.lat, arrival.lon)).toBeLessThan(0.05);
    const { arrivalRunway } = new FlightScript(LFPG_LFBO).choices;
    expect(last.altMsl).toBeCloseTo(arrivalRunway.elevationFt, 0);
  });

  it("records the sink rate at touchdown, then nothing on the ground", () => {
    for (const disturbances of [[], ["bounce"], ["touchAndGo"]] as Disturbance[][]) {
      const samples = samplesOf({ ...LFPG_LFBO, disturbances });
      const contacts = samples.filter((s, i) => s.onGround && samples[i - 1]?.onGround === false);
      for (const contact of contacts) expect(contact.vs).toBeLessThan(-50);
      const rolling = samples.filter((s, i) => s.onGround && samples[i - 1]?.onGround);
      expect(rolling.every((s) => s.vs === 0)).toBe(true);
    }
  });

  it("turns at standard rate, never beyond 25° of bank", () => {
    const banks = samplesOf(LFPG_LFBO).map((s) => Math.abs(s.bank));
    expect(Math.max(...banks)).toBeLessThanOrEqual(25.01);
    expect(banks.filter((bank) => bank > 5).length).toBeGreaterThan(30);
  });

  it("varies the touchdown with the seed", () => {
    const rates = [1, 2, 3, 4].map((seed) => {
      const samples = samplesOf({ ...LFPG_LFBO, seed });
      const contact = samples.find((s, i) => s.onGround && samples[i - 1]?.onGround === false);
      return Math.round(contact?.vs ?? 0);
    });
    expect(new Set(rates).size).toBe(4);
  });
});
