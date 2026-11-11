/**
 * API logs are pino JSON lines: shown as « 19:42:07 INFO POST /v1/flights 201 6 ms ».
 * The console's own polling (health, metrics, counts) is left out: it would fill the panel.
 */

const LEVELS: Record<number, string> = {
  10: "TRACE",
  20: "DEBUG",
  30: "INFO",
  40: "WARN",
  50: "ERROR",
  60: "FATAL",
};
const POLLING = ["/v1/health", "/v1/dev/metrics", "/v1/dev/flight-counts", "/v1/admin/"];

interface PinoLine {
  level?: number;
  time?: number;
  msg?: string;
  reqId?: string;
  req?: { method?: string; url?: string };
  res?: { statusCode?: number };
  responseTime?: number;
}

function parse(line: string): PinoLine | null {
  if (!line.startsWith("{")) return null;
  try {
    return JSON.parse(line) as PinoLine;
  } catch {
    return null;
  }
}

const clockOf = (time: number | undefined) =>
  time
    ? new Date(time).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "";

function describe(entry: PinoLine, request: string | undefined): string {
  if (entry.res && request) {
    return `${request} ${entry.res.statusCode ?? ""} ${Math.round(entry.responseTime ?? 0)} ms`;
  }
  return entry.msg ?? "";
}

// Colour codes of terminal output (Better Auth warnings…), unreadable in the page.
// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*m/g;

/** One parsed line: null to leave it out (request start, console polling). */
function lineOf(entry: PinoLine, requests: Map<string, string>): string | null {
  if (entry.req && entry.reqId) {
    requests.set(entry.reqId, `${entry.req.method ?? ""} ${entry.req.url ?? ""}`);
    return null; // shown once completed, with its status
  }
  const request = entry.reqId ? requests.get(entry.reqId) : undefined;
  if (request && POLLING.some((path) => request.includes(path))) return null;
  return `${clockOf(entry.time)} ${LEVELS[entry.level ?? 30] ?? "INFO"} ${describe(entry, request)}`;
}

export function formatLogs(lines: readonly string[]): string[] {
  const requests = new Map<string, string>();
  const out: string[] = [];
  for (const line of lines) {
    const entry = parse(line);
    const shown = entry ? lineOf(entry, requests) : line.replace(ANSI, "");
    if (shown !== null) out.push(shown);
  }
  return out;
}
