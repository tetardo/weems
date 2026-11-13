import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { runLoad } from "./load-run.ts";
import { formatReport, isSuccess, judge } from "./report.ts";

/**
 * pnpm load [--pilots 50] [--viewers 100] [--minutes 30] [--speed 1]
 *           [--api http://localhost:3000] [--out rapport.json]
 * Spec J4 (montée en charge du direct), against an API already running outside production.
 * Ctrl+C (or SIGTERM, sent by the console) ends the run early, with the report so far.
 */
const { values } = parseArgs({
  options: {
    pilots: { type: "string", default: "50" },
    viewers: { type: "string", default: "100" },
    minutes: { type: "string", default: "30" },
    speed: { type: "string", default: "1" },
    api: { type: "string", default: "http://localhost:3000" },
    token: { type: "string", default: "dev-token" },
    out: { type: "string" },
  },
});

const controller = new AbortController();
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => controller.abort());
}
const stamp = new Date().toISOString().replaceAll(":", "-").slice(0, 19);
const options = {
  baseUrl: values.api,
  token: values.token,
  pilots: Number(values.pilots),
  viewers: Number(values.viewers),
  minutes: Number(values.minutes),
  speed: Number(values.speed),
  workDir: join(tmpdir(), `weems-load-${stamp}`),
  signal: controller.signal,
};
process.stdout.write(
  `Charge : ${options.pilots} pilotes, ${options.viewers} spectateurs, ×${options.speed}, ` +
    `${options.minutes} min, API ${options.baseUrl}\n`,
);

const measures = await runLoad(options);
const criteria = judge(measures);
process.stdout.write(`${formatReport(measures, criteria)}\n`);

const out = values.out ?? join(tmpdir(), `weems-load-${stamp}.json`);
const summary = {
  ...measures,
  positionResponseMs: summarize(measures.positionResponseMs),
  deliveryDelayMs: summarize(measures.deliveryDelayMs),
  criteria,
};
writeFileSync(out, JSON.stringify(summary, null, 2));
process.stdout.write(`Détail : ${out}\n`);
process.exitCode = isSuccess(criteria) ? 0 : 1;

function summarize(h: (typeof measures)["deliveryDelayMs"]) {
  return { count: h.count, p50: h.percentile(50), p95: h.percentile(95), max: Math.round(h.max) };
}
