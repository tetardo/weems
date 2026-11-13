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

/** Hours and minutes UTC of an ISO 8601 time: « 08:21 ». */
export function utcMinutes(iso: string): string {
  return iso.slice(11, 16);
}

/** Above this altitude a level is read in hundreds of feet (FL350); below, in feet. */
const FLIGHT_LEVEL_FROM_FT = 10_000;

/** Level of an aircraft: « FL350 » up high, else null and the caller writes feet. */
export function flightLevel(altMslFt: number): string | null {
  if (altMslFt < FLIGHT_LEVEL_FROM_FT) return null;
  return `FL${String(Math.round(altMslFt / 100)).padStart(3, "0")}`;
}
