/**
 * Colour of one shown log line. A request (API « GET /v1/me 200 3 ms », Next.js « GET /fr 200 in
 * 9.6s ») takes the colour of its HTTP status: 2xx success, 4xx warning, 5xx error. Other lines
 * take it from their level (API, Postgres, Next.js markers ✓ ⚠ ⨯).
 */

export type LogTone = "ok" | "err" | "warn" | "dim" | "";

const STATUS = /\s([1-5])\d\d (?:in )?\d+(?:\.\d+)?\s?m?s\b/;
const BY_STATUS: Record<string, LogTone> = { "2": "ok", "4": "warn", "5": "err" };
const ERROR = /\b(error|fatal|panic)\b|⨯/i;
const WARNING = /\b(warn|warning)\b|⚠/i;
const SUCCESS = /^\s*✓/;
const DETAIL = /\b(DEBUG|TRACE)\b/;

export function toneOf(line: string): LogTone {
  const status = STATUS.exec(line)?.[1];
  if (status) return BY_STATUS[status] ?? "";
  if (ERROR.test(line)) return "err";
  if (WARNING.test(line)) return "warn";
  if (SUCCESS.test(line)) return "ok";
  if (DETAIL.test(line)) return "dim";
  return "";
}
