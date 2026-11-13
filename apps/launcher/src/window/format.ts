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

const number = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

/** « 12 », « 4 312 », « 1,5 ». */
export const numberText = (value: number) => number.format(value);

/** « 0 € », « 1 234,50 € ». */
export const eurosText = (value: number) => euros.format(value);

/** « ▲ +20 % » or « ▼ −8 % » from last month to this one (« ▲ » when last month was 0). */
export function trendOf(current: number, previous: number): { text: string; up: boolean } {
  const up = current >= previous;
  if (previous === 0) return { text: "▲", up };
  const percent = Math.round(((current - previous) / previous) * 100);
  return { text: `${up ? "▲ +" : "▼ −"}${Math.abs(percent)} %`, up };
}

/** Share of a progress circle, between 0 and 1 (0 when there is no maximum). */
export const shareOf = (value: number, max: number) =>
  max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;

/** « 6 % », « 100 % ». */
export const percentText = (share: number) => `${Math.round(share * 100)} %`;

/** A filling resource (disk, latency): orange past 80 %, red past 95 %. */
export function usageTone(share: number): "ok" | "warn" | "down" {
  if (share > 0.95) return "down";
  return share > 0.8 ? "warn" : "ok";
}
