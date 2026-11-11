import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { httpApiClient } from "../../src/sender/api-client.ts";
import { fleetOf } from "../generate-flights/fleet.ts";
import { runSimulation } from "./simulation.ts";

/**
 * pnpm simulate [--count 10] [--speed 1] [--stagger 30] [--api http://localhost:3000]
 * Flies the J1 fleet of simulated pilots against a running API.
 */
const { values } = parseArgs({
  options: {
    count: { type: "string", default: "10" },
    speed: { type: "string", default: "1" },
    stagger: { type: "string", default: "30" },
    api: { type: "string", default: "http://localhost:3000" },
    token: { type: "string", default: "dev-token" },
  },
});

const trackerVersion = "0.1.0";
const scenarios = fleetOf(Number(values.count));
process.stdout.write(`${scenarios.length} pilots, ×${values.speed}, API ${values.api}\n`);

const results = await runSimulation({
  scenarios,
  api: httpApiClient({ baseUrl: values.api, token: values.token, trackerVersion }),
  speed: Number(values.speed),
  staggerS: Number(values.stagger),
  workDir: join(tmpdir(), `weems-simulate-${Date.now()}`),
  trackerVersion,
});

for (const r of results) {
  process.stdout.write(
    `${r.scenario.callsign} ${r.scenario.name} ${r.flightId} pending=${r.pending}\n`,
  );
}
process.exitCode = results.every((r) => r.flightId && r.pending === 0) ? 0 : 1;
