import type { AircraftCategory, AircraftClass, AircraftInfo } from "@weems/contrats";
import { catalogueCategory } from "./catalogue.ts";

/** Maximum take-off weights separating the jets when the type is unknown (kg). */
const JET_WEIGHT_LIMITS: readonly (readonly [number, AircraftCategory])[] = [
  [30_000, "businessJet"],
  [60_000, "regionalJet"],
  [150_000, "narrowBody"],
];

function jetCategory(maxGrossWeightKg: number | null): AircraftCategory | null {
  if (maxGrossWeightKg === null) return null;
  return JET_WEIGHT_LIMITS.find(([limit]) => maxGrossWeightKg < limit)?.[1] ?? "wideBody";
}

/** Estimate from what the simulator says, for a type missing from the catalogue. */
function estimatedCategory(aircraft: AircraftInfo): AircraftCategory | null {
  if (aircraft.airframe === "helicopter") return "helicopter";
  switch (aircraft.engineType) {
    case "helicopterTurbine":
      return "helicopter";
    case "piston":
      return "light";
    case "turboprop":
      return "turboprop";
    case "jet":
      return jetCategory(aircraft.maxGrossWeightKg);
    case "none":
      return "other";
    case null:
      return null;
  }
}

/**
 * Category of the aircraft of a flight: from the ICAO type when the catalogue knows it,
 * otherwise estimated; null when nothing is known (flights of older trackers).
 */
export function classifyAircraft(aircraft: AircraftInfo): AircraftClass | null {
  const known = aircraft.model === null ? null : catalogueCategory(aircraft.model);
  if (known) return { category: known, estimated: false };
  const estimated = estimatedCategory(aircraft);
  return estimated && { category: estimated, estimated: true };
}
