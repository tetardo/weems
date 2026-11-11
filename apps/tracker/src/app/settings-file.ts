import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { z } from "zod";
import type { FlightPlan } from "../core/session.ts";
import type { FlightSettings } from "./app-state.ts";

const ICAO = z.string().regex(/^[A-Z]{4}$/);

/**
 * What the pilot may save: callsign as in a flight plan (EF-04), departure and arrival
 * required (decision 007). The same airport twice is allowed: circuits, local flights.
 */
export const FlightSettingsSchema = z.object({
  callsign: z.string().regex(/^[A-Z0-9]{2,8}$/),
  departureIcao: ICAO,
  arrivalIcao: ICAO,
});

/** What may be on disk: airports still empty on a first launch or a file from before 004. */
const StoredSettingsSchema = FlightSettingsSchema.extend({
  departureIcao: z.union([z.literal(""), ICAO]),
  arrivalIcao: z.union([z.literal(""), ICAO]),
});

const DEFAULTS: FlightSettings = { callsign: "WMS1", departureIcao: "", arrivalIcao: "" };

/** Settings kept between launches; an unreadable file gives the defaults. */
export function loadSettings(path: string): FlightSettings {
  if (!existsSync(path)) return DEFAULTS;
  try {
    return StoredSettingsSchema.parse(JSON.parse(readFileSync(path, "utf8")));
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(path: string, settings: FlightSettings): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(FlightSettingsSchema.parse(settings), null, 2));
}

/** The flight plan of these settings, or null while departure or arrival is missing. */
export function flightPlanOf(settings: FlightSettings): FlightPlan | null {
  const { departureIcao, arrivalIcao } = settings;
  return departureIcao && arrivalIcao ? { departureIcao, arrivalIcao } : null;
}
