import { describe, expect, it } from "vitest";
import { ReplayConnector } from "../../src/connectors/replay/replay-connector.ts";
import { parseReplay, serializeReplay } from "../../src/connectors/replay/replay-format.ts";
import { AIRLINER_PARAMS } from "../../src/core/phases/params.ts";
import { FlightSession } from "../../src/core/session.ts";
import { generateFlight } from "./generator.ts";
import { type Disturbance, LFPG_LFBO } from "./scenario.ts";

/** Plays a generated flight through the real core; returns phases and notable events. */
async function track(disturbances: Disturbance[]): Promise<string> {
  const connector = new ReplayConnector(generateFlight({ ...LFPG_LFBO, disturbances }));
  const seen: string[] = [];
  const session = new FlightSession(
    {
      callsign: "WMS1",
      trackerVersion: "0.1.0",
      clock: { nowUtcMs: () => 0 },
      newFlightId: () => "id",
      params: AIRLINER_PARAMS,
      positionIntervalMs: 10_000,
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

const DEPARTURE = "BOARDING PUSHBACK TAXI_OUT TAKEOFF CLIMB CRUISE";
const ARRIVAL = "DESCENT APPROACH FINAL *touchdown LANDING";
const END = "TAXI_IN ARRIVED closed:normal";

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
  it.each<[string, Disturbance[], string]>([
    ["normal flight", [], `${DEPARTURE} ${ARRIVAL} ${END}`],
    [
      "go-around",
      ["goAround"],
      `${DEPARTURE} DESCENT APPROACH FINAL *goAround CLIMB CRUISE ${ARRIVAL} ${END}`,
    ],
    ["bounce", ["bounce"], `${DEPARTURE} ${ARRIVAL} *bounce ${END}`],
    [
      "touch-and-go",
      ["touchAndGo"],
      `${DEPARTURE} ${ARRIVAL} *touchAndGo CLIMB CRUISE ${ARRIVAL} ${END}`,
    ],
    [
      "rejected take-off",
      ["rejectedTakeoff"],
      `BOARDING PUSHBACK TAXI_OUT TAKEOFF *rejectedTakeoff TAXI_OUT TAKEOFF CLIMB CRUISE ${ARRIVAL} ${END}`,
    ],
    [
      "pause, time acceleration, slew, teleport",
      ["pause", "timeAcceleration", "slew", "teleport"],
      `${DEPARTURE} *paused *unpaused *simRateChanged *simRateChanged *slew *slew *positionChanged ${ARRIVAL} ${END}`,
    ],
    ["crash", ["crash"], `${DEPARTURE} *crashed ARRIVED closed:crash`],
  ])("%s", async (_name, disturbances, expected) => {
    expect(await track(disturbances)).toBe(expected);
  });
});
