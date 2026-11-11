import { describe, expect, it } from "vitest";
import { ReplayConnector } from "../../src/connectors/replay/replay-connector.ts";
import { parseReplay, serializeReplay } from "../../src/connectors/replay/replay-format.ts";
import { AIRLINER_PARAMS } from "../../src/core/phases/params.ts";
import { FlightSession } from "../../src/core/session.ts";
import { generateFlight } from "./generator.ts";
import { expectedTrace } from "./expected-phases.ts";
import { FLEET } from "./fleet.ts";
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
});
