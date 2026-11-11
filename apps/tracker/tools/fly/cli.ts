import { createWriteStream, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";
import { SimConnectLink } from "../../src/connectors/msfs/simconnect-link.ts";
import { httpApiClient } from "../../src/sender/api-client.ts";
import { startMsfsTracker } from "../../src/runtime/msfs-tracker.ts";

/**
 * pnpm fly --api http://<Mac>:3000 --from LFPG --to LFBO [--callsign WMS1] [--no-record]
 * J2: reads MSFS on the Windows PC and sends the flight to the API. Type "fin" + Entrée to
 * close the flight by hand, Ctrl+C to quit (an open flight resumes at the next start).
 */
const { values } = parseArgs({
  options: {
    api: { type: "string", default: "http://localhost:3000" },
    token: { type: "string", default: "dev-token" },
    callsign: { type: "string", default: "WMS1" },
    from: { type: "string" },
    to: { type: "string" },
    "no-record": { type: "boolean", default: false },
  },
});

// Departure and arrival are required (decision 007): the live map needs the arrival.
const icao = (code: string | undefined) => code?.trim().toUpperCase() ?? "";
const flightPlan = { departureIcao: icao(values.from), arrivalIcao: icao(values.to) };
if (![flightPlan.departureIcao, flightPlan.arrivalIcao].every((code) => /^[A-Z]{4}$/.test(code))) {
  process.stderr.write("Départ et arrivée obligatoires : --from LFPG --to LFBO (codes OACI).\n");
  process.exit(2);
}

const trackerVersion = "0.1.0";
const say = (message: string) =>
  process.stdout.write(`${new Date().toLocaleTimeString("fr-FR")}  ${message}\n`);
const dataDir = join(homedir(), ".weems-tracker");
const recordingsDir = join(import.meta.dirname, "..", "..", "recordings");
mkdirSync(dataDir, { recursive: true });
mkdirSync(recordingsDir, { recursive: true });

const recordingPath = join(
  recordingsDir,
  `${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`,
);
const recording = values["no-record"] ? null : createWriteStream(recordingPath);

const fly = startMsfsTracker({
  link: new SimConnectLink(),
  api: httpApiClient({ baseUrl: values.api, token: values.token, trackerVersion }),
  databasePath: join(dataDir, "tracker.db"),
  callsign: values.callsign,
  flightPlan,
  trackerVersion,
  ...(recording && { record: (line: string) => recording.write(line) }),
  report: say,
  now: () => performance.now(),
  utcNow: () => Date.now(),
});

say(`API ${values.api}. En attente de MSFS…`);
if (recording) say(`Enregistrement du rejeu : ${recordingPath}`);
say(`Tapez "fin" puis Entrée pour clore le vol à la main, Ctrl+C pour quitter.`);

const input = createInterface({ input: process.stdin });
input.on("line", (line) => {
  if (line.trim().toLowerCase() !== "fin") return;
  fly.closeFlight();
  say("Vol clos à la main.");
});

process.on("SIGINT", () => {
  input.close();
  void fly.stop().then((pending) => {
    recording?.end();
    say(
      pending === 0 ? "Tout est envoyé." : `${pending} message(s) partiront au prochain lancement.`,
    );
    process.exit(0);
  });
});
