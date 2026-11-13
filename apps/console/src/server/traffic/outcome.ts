import { z } from "zod";
import type { HistoryEntry } from "./history.ts";

type Outcome = HistoryEntry["outcome"];

/** What the console reads in the report of pnpm load (e2e/load/cli.ts, option --out). */
const LoadReport = z.object({ criteria: z.array(z.object({ passed: z.boolean().nullable() })) });

export function failedCriteria(reportJson: string): number | null {
  try {
    const report = LoadReport.parse(JSON.parse(reportJson));
    return report.criteria.filter((criterion) => criterion.passed === false).length;
  } catch {
    return null;
  }
}

/** End of a run, for the history: stopped by the console, success, or failure with its reason. */
export function outcomeOf(
  exitCode: number | null,
  stopped: boolean,
  failed: number | null,
): { outcome: Outcome; detail: string | null } {
  if (stopped) return { outcome: "stopped", detail: null };
  if (exitCode === 0) return { outcome: "success", detail: null };
  if (failed)
    return {
      outcome: "failed",
      detail: `${failed} critère${failed > 1 ? "s" : ""} raté${failed > 1 ? "s" : ""}`,
    };
  return { outcome: "failed", detail: `code ${exitCode ?? "?"}` };
}
