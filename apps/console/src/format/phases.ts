import type { FlightPhase } from "@weems/contrats";

/** Names of the phases in the console (same words as the site's messages/fr.json). */
export const PHASE_LABELS: Record<FlightPhase, string> = {
  BOARDING: "Embarquement",
  PUSHBACK: "Repoussage",
  TAXI_OUT: "Roulage départ",
  TAKEOFF: "Décollage",
  CLIMB: "Montée",
  CRUISE: "Croisière",
  DESCENT: "Descente",
  APPROACH: "Approche",
  FINAL: "Finale",
  LANDING: "Atterrissage",
  TAXI_IN: "Roulage arrivée",
  ARRIVED: "Arrivé",
};
