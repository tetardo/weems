import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { SIMULATED_AIRPORTS } from "./airport-data.ts";
import { extractAirports } from "./ourairports-extract.ts";

/**
 * pnpm airports:simulated [--add LFML,EGKK]
 * Rewrites airports.json (airports of the simulated fleet) from OurAirports.
 * The file is frozen in the repository so that generated flights only change on purpose.
 */
const SOURCE = "https://raw.githubusercontent.com/davidmegginson/ourairports-data/main";
const FILE = new URL("./airports.json", import.meta.url);

const { values } = parseArgs({ options: { add: { type: "string", default: "" } } });
const icaos = [...SIMULATED_AIRPORTS.map((a) => a.icao), ...values.add.split(",").filter(Boolean)];

const download = async (name: string) => {
  const response = await fetch(`${SOURCE}/${name}`);
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  return response.text();
};

const airports = extractAirports(
  icaos,
  await download("airports.csv"),
  await download("runways.csv"),
);
const missing = icaos.filter((icao) => !airports.some((a) => a.icao === icao && a.runways.length));
if (missing.length > 0) throw new Error(`No usable runway for ${missing.join(", ")}`);

const previous = JSON.parse(await readFile(FILE, "utf8")) as { source: string };
const source = `OurAirports (public domain), ${new Date().toISOString().slice(0, 10)}`;
await writeFile(FILE, `${JSON.stringify({ ...previous, source, airports }, null, 2)}\n`);
process.stdout.write(`${airports.length} airports written to airports.json\n`);
