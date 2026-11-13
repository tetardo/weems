import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { httpApiClient } from "../../src/sender/api-client.ts";
import { fleetOf } from "../generate-flights/fleet.ts";
import { seededRandom } from "../generate-flights/random.ts";
import type { SimulationProgress } from "@weems/contrats";
import { runSimulation } from "./simulation.ts";

/**
 * pnpm simulate [--count 10] [--speed 1] [--stagger 30] [--seed N] [--api http://localhost:3000] [--progress]
 * Flies the J1 fleet of simulated pilots against a running API, departing at random intervals
 * averaging --stagger simulated seconds (--seed: the same intervals again).
 * Ctrl+C (or SIGTERM, sent by the admin console) closes the flights in the air as interrupted.
 * --progress: one JSON line per second, then one with the result (read by the admin console).
 */
const { values } = parseArgs({
  options: {
    count: { type: "string", default: "10" },
    speed: { type: "string", default: "1" },
    stagger: { type: "string", default: "30" },
    seed: { type: "string" },
    api: { type: "string", default: "http://localhost:3000" },
    token: { type: "string", default: "dev-token" },
    progress: { type: "boolean", default: false },
  },
});

const trackerVersion = "0.1.0";
const scenarios = fleetOf(Number(values.count));
const json = (line: object) => process.stdout.write(`${JSON.stringify(line)}\n`);
if (!values.progress) {
  process.stdout.write(`${scenarios.length} pilots, ×${values.speed}, API ${values.api}\n`);
}

const controller = new AbortController();
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => controller.abort());
}
let lastProgressMs = 0;
const onProgress = (progress: SimulationProgress) => {
  if (Date.now() - lastProgressMs < 1000) return;
  lastProgressMs = Date.now();
  json({ type: "progress", ...progress });
};

const results = await runSimulation({
  scenarios,
  api: httpApiClient({ baseUrl: values.api, token: values.token, trackerVersion }),
  speed: Number(values.speed),
  staggerS: Number(values.stagger),
  random: seededRandom(Number(values.seed ?? Date.now() % 2 ** 31)),
  workDir: join(tmpdir(), `weems-simulate-${Date.now()}`),
  trackerVersion,
  signal: controller.signal,
  ...(values.progress ? { onProgress } : {}),
});

const flights = results.filter((r) => r.flightId).length;
const pending = results.reduce((sum, r) => sum + r.pending, 0);
if (values.progress) {
  json({ type: "result", stopped: controller.signal.aborted, flights, pending });
} else {
  for (const r of results) {
    process.stdout.write(
      `${r.scenario.callsign} ${r.scenario.name} ${r.flightId} pending=${r.pending}\n`,
    );
  }
}
process.exitCode =
  controller.signal.aborted || (flights === results.length && pending === 0) ? 0 : 1;
