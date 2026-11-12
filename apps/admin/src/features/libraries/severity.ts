import type { Severity } from "../../server/libraries/report.ts";

const LABELS: Record<Severity, string> = {
  critical: "critique",
  high: "élevée",
  moderate: "modérée",
  low: "faible",
  info: "info",
};

/** « 3 élevées », « modérée ». */
export function severityLabel(severity: Severity, count = 1): string {
  const word = LABELS[severity];
  return count > 1 ? `${count} ${word}s` : word;
}
