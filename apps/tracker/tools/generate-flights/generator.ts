import type { Replay } from "../../src/connectors/replay/replay-format.ts";
import { arrivalGround, departureGround, takeoff } from "./ground-profile.ts";
import { climb, cruise, descentAndApproach } from "./air-profile.ts";
import { FlightScript } from "./flight-script.ts";
import type { Scenario } from "./scenario.ts";

/** Deterministic synthetic flight: same scenario and seed give exactly the same replay. */
export function generateFlight(scenario: Scenario): Replay {
  const script = new FlightScript(scenario);
  departureGround(script);
  takeoff(script, scenario);
  climb(script, scenario);
  if (cruise(script, scenario)) {
    descentAndApproach(script, scenario);
    arrivalGround(script, scenario);
  }
  return {
    header: {
      format: "weems-replay",
      version: 1,
      source: "synthetic",
      seed: scenario.seed,
      scenario: scenario.name,
    },
    records: script.records,
  };
}
