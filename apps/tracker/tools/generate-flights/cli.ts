import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { serializeReplay } from "../../src/connectors/replay/replay-format.ts";
import { generateFlight } from "./generator.ts";
import { type Disturbance, LFPG_LFBO } from "./scenario.ts";

/**
 * pnpm generate-flight --out flight.jsonl [--seed 7] [--with goAround,bounce]
 * Writes a synthetic LFPG-LFBO flight in the replay format.
 */
const { values } = parseArgs({
  options: {
    out: { type: "string", default: "flight.jsonl" },
    seed: { type: "string", default: String(LFPG_LFBO.seed) },
    with: { type: "string", default: "" },
  },
});

const disturbances = values.with.split(",").filter(Boolean) as Disturbance[];
const replay = generateFlight({ ...LFPG_LFBO, seed: Number(values.seed), disturbances });
await writeFile(values.out, serializeReplay(replay));
process.stdout.write(`${replay.records.length} records written to ${values.out}\n`);
