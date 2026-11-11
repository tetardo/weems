import type { AppState } from "../app-state.ts";
import type { MessageKey } from "./messages.ts";

type LastFlight = NonNullable<AppState["lastFlight"]>;
type Text = (key: MessageKey) => string;

/** "08:00 – 10:05 (2 h 05)", in the pilot's time zone. */
export function flightTimes(flight: LastFlight, lang: string): string {
  const time = (iso: string) =>
    new Date(iso).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" });
  const minutes = Math.round((Date.parse(flight.closedAt) - Date.parse(flight.openedAt)) / 60_000);
  const duration = `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
  return `${time(flight.openedAt)} – ${time(flight.closedAt)} (${duration})`;
}

/** "Touchdown −145 ft/min · 1 go-around(s)": what the pilot looks at first. */
export function landingLine(flight: LastFlight, text: Text): string {
  const parts = [
    flight.touchdownFpm === null
      ? text("notMeasured")
      : `${text("touchdown")} ${Math.round(flight.touchdownFpm)} ft/min`,
  ];
  if (flight.goArounds > 0) parts.push(`${flight.goArounds} ${text("goArounds")}`);
  if (flight.bounces > 0) parts.push(`${flight.bounces} ${text("bounces")}`);
  return parts.join(" · ");
}
