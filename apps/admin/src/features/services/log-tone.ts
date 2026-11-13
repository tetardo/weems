/**
 * Colour of one shown log line, from its level (API, Postgres, Next.js wording) or, for an
 * API request, its HTTP status: 5xx is an error, 4xx a warning.
 */

export type LogTone = "err" | "warn" | "dim" | "";

const STATUS = / ([1-5])\d\d \d+ ms$/;
const ERROR = /\b(error|fatal|panic)\b/i;
const WARNING = /\b(warn|warning)\b/i;
const DETAIL = /\b(DEBUG|TRACE)\b/;

export function toneOf(line: string): LogTone {
  const status = STATUS.exec(line)?.[1];
  if (status === "5") return "err";
  if (status === "4") return "warn";
  if (ERROR.test(line)) return "err";
  if (WARNING.test(line)) return "warn";
  if (DETAIL.test(line)) return "dim";
  return "";
}
