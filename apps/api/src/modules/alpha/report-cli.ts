import { parseArgs } from "node:util";
import { loadConfig } from "../../config.ts";
import { connectDatabase } from "../../db/client.ts";
import { alphaReport } from "./alpha-report.ts";
import { formatAlphaReport } from "./format-report.ts";
import { AlphaRepository } from "./repository.ts";

/**
 * Measures the alpha against its exit criterion: `pnpm alpha-report --since 2026-12-01`.
 * Counts only the flights opened since that date (the alpha's start), so that test flights don't count.
 * Exit code 0 when the criterion is met, 1 otherwise.
 */
const { values } = parseArgs({ options: { since: { type: "string" } } });
const since = new Date(values.since ?? "");
if (Number.isNaN(since.getTime())) {
  process.stderr.write("Usage: pnpm alpha-report --since <AAAA-MM-JJ>\n");
  process.exit(2);
}

const database = connectDatabase(loadConfig().databaseUrl);
try {
  const report = alphaReport(await new AlphaRepository(database.db).flightFacts(since), new Date());
  process.stdout.write(formatAlphaReport(report, since));
  process.exitCode = report.passed ? 0 : 1;
} finally {
  await database.close();
}
