/** Times and durations as the console writes them, in French, in the Mac's time zone. */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** « 45 s », « 4 min 12 s », « 2 h 14 ». */
export function elapsed(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ${seconds % 60} s`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
}

/** « à l'instant », « il y a 12 min », « il y a 2 h », « hier », « il y a 5 j ». */
export function ago(iso: string, nowMs: number): string {
  const ms = nowMs - Date.parse(iso);
  if (ms < MINUTE) return "à l'instant";
  if (ms < HOUR) return `il y a ${Math.floor(ms / MINUTE)} min`;
  if (ms < DAY) return `il y a ${Math.floor(ms / HOUR)} h`;
  if (ms < 2 * DAY) return "hier";
  return `il y a ${Math.floor(ms / DAY)} j`;
}

/** Whole days left before `iso`, rounded up (« expire dans 13 j »); 0 or less once passed. */
export function daysLeft(iso: string, nowMs: number): number {
  return Math.max(0, Math.ceil((Date.parse(iso) - nowMs) / DAY));
}

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

export const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

/** « 11/11 18:02 », for the history. */
export const dayAndClock = (iso: string) =>
  `${new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })} ${clock(iso)}`;
