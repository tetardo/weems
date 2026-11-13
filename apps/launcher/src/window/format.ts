/** Texts of the window that do not depend on the page: durations, colours of the log lines. */

/** « 4 s », « 20 min », « 2 h 05 » since an ISO start time. */
export function sinceText(since: string | null, nowMs: number): string | null {
  if (since === null) return null;
  const seconds = Math.max(0, Math.round((nowMs - Date.parse(since)) / 1000));
  if (Number.isNaN(seconds)) return null;
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
}

const ANSI = new RegExp(String.raw`\u001b\[[0-9;]*[A-Za-z]`, "g");

/** Terminal colours written by pnpm, Next.js and the scripts: removed, the window has its own. */
export function plainText(line: string): string {
  return line.replace(ANSI, "");
}

export type LineKind = "error" | "warn" | "step" | "ok" | null;

export function lineKind(line: string): LineKind {
  if (/\b(ERROR|error|Error)\b|✗|⨯/.test(line)) return "error";
  if (/\b(WARN|warn|Warning)\b|⚠|^!/.test(line)) return "warn";
  if (line.startsWith("›")) return "step";
  if (/✓|\bReady\b/.test(line)) return "ok";
  return null;
}
