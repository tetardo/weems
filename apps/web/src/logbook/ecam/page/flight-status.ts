import type { FlightBands as Bands, FlightView } from "@weems/contrats";

/** The STATUS block of the ECAM page (maquette v3, Greg 14/11/2026): the flight in figures. */
export interface FlightStatus {
  blockS: number | null;
  distanceNm: number;
  fuelKg: number | null;
  touchdownVs: number | null;
  touchdownG: number | null;
  bankMax: number | null;
  /** Highest IAS in the air below 10,000 ft, and whether a 250 kt mark was raised. */
  iasLow: number | null;
  iasLowMarked: boolean;
}

const LOW_ALTITUDE_FT = 10_000;
const AIRBORNE = new Set(["TAKEOFF", "CLIMB", "CRUISE", "DESCENT", "APPROACH", "FINAL"]);

const largest = (values: (number | null | undefined)[]) => {
  const known = values.filter((v): v is number => v !== null && v !== undefined);
  return known.length === 0 ? null : Math.max(...known);
};

export function flightStatus(
  flight: Pick<FlightView, "times">,
  bands: Bands,
  touchdown: { touchdownVs: number | null; gForce: number | null } | null,
): FlightStatus {
  const low = bands.minutes.filter(
    (m) =>
      m.phase !== null &&
      AIRBORNE.has(m.phase) &&
      (m.values.altitude ?? Infinity) < LOW_ALTITUDE_FT,
  );
  return {
    blockS: flight.times.blockS,
    distanceNm: bands.distanceNm,
    fuelKg: bands.fuelUsedKg,
    touchdownVs: touchdown?.touchdownVs ?? null,
    touchdownG: touchdown?.gForce ?? null,
    bankMax: largest(
      bands.minutes.map((m) => (m.values.bank === null ? null : Math.abs(m.values.bank ?? 0))),
    ),
    iasLow: largest(low.map((m) => m.values.speed)),
    iasLowMarked: (bands.marks ?? []).some((m) => m.reason === "speed250"),
  };
}
