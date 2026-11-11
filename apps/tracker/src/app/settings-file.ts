import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { z } from "zod";
import type { FlightSettings } from "./app-state.ts";

const ICAO = z.union([z.literal(""), z.string().regex(/^[A-Z]{4}$/)]);

/** Callsign: letters and digits, as in a flight plan (EF-04). */
export const FlightSettingsSchema = z.object({
  callsign: z.string().regex(/^[A-Z0-9]{2,8}$/),
  departureIcao: ICAO,
  arrivalIcao: ICAO,
});

const DEFAULTS: FlightSettings = { callsign: "WMS1", departureIcao: "", arrivalIcao: "" };

/** Settings kept between launches; an unreadable file gives the defaults. */
export function loadSettings(path: string): FlightSettings {
  if (!existsSync(path)) return DEFAULTS;
  try {
    return FlightSettingsSchema.parse(JSON.parse(readFileSync(path, "utf8")));
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(path: string, settings: FlightSettings): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(FlightSettingsSchema.parse(settings), null, 2));
}
