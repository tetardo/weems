import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { seededRandom } from "../generate-flights/random.ts";
import { devApi } from "./dev-api.ts";
import { runLive } from "./live.ts";
import { createPopulation } from "./population.ts";

/**
 * Simulated activity of the whole site (spec admin, page Activité simulée), development only:
 *   pnpm populate create [--accounts 50] [--flights 5-40] [--days 180] [--public 75] [--seed N]
 *   pnpm populate live [--flights 12] [--visitors 100] [--minutes 30] [--speed 1]
 *   pnpm populate status | delete
 * `create` replaces the fictitious population. `live` needs one. --progress: one JSON line per
 * second, then one with the result (formats PopulationLine and LiveActivityLine, read by the admin console).
 * Ctrl+C (or SIGTERM, sent by the admin console) stops; `live` then closes its flights as interrupted.
 */
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    accounts: { type: "string", default: "50" },
    flights: { type: "string" },
    days: { type: "string", default: "180" },
    public: { type: "string", default: "75" },
    seed: { type: "string" },
    visitors: { type: "string", default: "100" },
    minutes: { type: "string", default: "30" },
    speed: { type: "string", default: "1" },
    api: { type: "string", default: "http://localhost:3000" },
    token: { type: "string", default: "dev-token" },
    progress: { type: "boolean", default: false },
  },
});

const TRACKER_VERSION = "0.1.0";
const command = positionals[0] ?? "status";
const api = devApi(values.api, values.token);
const random = seededRandom(Number(values.seed ?? Date.now() % 2 ** 31));
const workDir = join(tmpdir(), `weems-populate-${Date.now()}`);
const controller = new AbortController();
for (const signal of ["SIGINT", "SIGTERM"] as const) process.once(signal, () => controller.abort());

let lastLineMs = 0;
function progressLine(progress: object): void {
  if (!values.progress || Date.now() - lastLineMs < 1000) return;
  lastLineMs = Date.now();
  write({ type: "progress", ...progress });
}
function write(line: object): void {
  process.stdout.write(`${JSON.stringify(line)}\n`);
}

/** "5-40" → [5, 40]; "20" → [20, 20]. */
function rangeOf(text: string): [number, number] {
  const [min = NaN, max = min] = text.split("-").map(Number);
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min) {
    throw new Error(`--flights: expected a number or a range like 5-40, got "${text}".`);
  }
  return [min, max];
}

async function create(): Promise<void> {
  const [minFlights, maxFlights] = rangeOf(values.flights ?? "5-40");
  const result = await createPopulation({
    api,
    apiUrl: values.api,
    accounts: Number(values.accounts),
    minFlights,
    maxFlights,
    days: Number(values.days),
    publicShare: Number(values.public) / 100,
    random,
    workDir,
    trackerVersion: TRACKER_VERSION,
    signal: controller.signal,
    onProgress: progressLine,
  });
  write({ type: "result", ...result });
}

/**
 * Each account flies live under the pseudonym of its past flights. A population created
 * before the pseudonyms keeps its old "WMS…" callsigns until `create` is run again.
 */
function livePilotsOf(pilotIds: readonly string[]) {
  return Promise.all(
    pilotIds.map(async (pilotId, index) => ({
      token: api.tokenOf(pilotId),
      callsign: (await api.callsignOf(pilotId)) ?? `Pilot${index + 1}`,
    })),
  );
}

async function live(): Promise<void> {
  const { pilotIds } = await api.population();
  if (pilotIds.length === 0)
    throw new Error("No fictitious account: run `pnpm populate create` first.");
  const result = await runLive({
    apiUrl: values.api,
    pilots: await livePilotsOf(pilotIds),
    airborne: Number(values.flights ?? "12"),
    visitors: Number(values.visitors),
    durationS: Number(values.minutes) * 60,
    speed: Number(values.speed),
    random,
    workDir,
    trackerVersion: TRACKER_VERSION,
    signal: controller.signal,
    onProgress: progressLine,
  });
  write({ type: "result", stopped: controller.signal.aborted, ...result });
}

const commands: Record<string, () => Promise<void>> = {
  create,
  live,
  status: async () => write(await api.population()),
  delete: async () => write(await api.deleteAll()),
};
const run = commands[command];
if (!run) throw new Error(`Unknown command "${command}": create, live, status or delete.`);
await run();
