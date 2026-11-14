import { magvar } from "magvar";

const FEET_PER_KM = 3280.84;

/** Magnetic declination in degrees, east positive, at a place and a date (World Magnetic Model 2025-2030). */
export const declination = (lat: number, lon: number, elevationFt: number, when: Date): number =>
  magvar(lat, lon, elevationFt / FEET_PER_KM, when);
