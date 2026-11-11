/** Duration as in a pilot logbook, h:mm; null when not measured (spec T0: never 0). */
export function formatDuration(seconds: number | null): string | null {
  if (seconds === null) return null;
  const minutes = Math.round(seconds / 60);
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}

/** "LFPG → LFBO", with a dash for an unknown airport. */
export function formatRoute(departure: string | null, arrival: string | null): string {
  return `${departure ?? "—"} → ${arrival ?? "—"}`;
}

/** UTC time of an ISO timestamp, HH:MM:SS. */
export function utcTime(iso: string): string {
  return iso.slice(11, 19);
}
