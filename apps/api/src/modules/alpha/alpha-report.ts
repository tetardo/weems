/** What the API knows about one flight, enough to measure the alpha (spec J3). */
export interface FlightFacts {
  pilotId: string;
  openedAt: Date;
  closedAt: Date | null;
  hasTrack: boolean;
  /** The pilot's review of the phases, null when not checked. */
  phases: "correct" | "wrong" | null;
}

/** J3 exit criterion: 5 pilots, 50 flights, zero lost flight, phases right on 95 % of the checked flights. */
export const ALPHA_TARGETS = { pilots: 5, flights: 50, correctShare: 0.95 } as const;

/** A flight still open after this long is counted as possibly lost (its closing never arrived). */
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export interface AlphaReport {
  pilots: number;
  flights: number;
  closedFlights: number;
  /** Open for more than 24 h: the closing never reached the API. */
  staleFlights: number;
  /** Closed but without trajectory: the trajectory never reached the API. */
  closedWithoutTrack: number;
  reviewed: number;
  correct: number;
  /** correct / reviewed, null when nothing was checked. */
  correctShare: number | null;
  checks: { pilots: boolean; flights: boolean; noLostFlight: boolean; phases: boolean };
  passed: boolean;
}

/** Measures the alpha from the flights' facts. Pure: the time is given. */
export function alphaReport(facts: readonly FlightFacts[], now: Date): AlphaReport {
  const closed = facts.filter((f) => f.closedAt !== null);
  const staleFlights = facts.filter(
    (f) => f.closedAt === null && now.getTime() - f.openedAt.getTime() > STALE_AFTER_MS,
  ).length;
  const closedWithoutTrack = closed.filter((f) => !f.hasTrack).length;
  const reviewed = closed.filter((f) => f.phases !== null);
  const correct = reviewed.filter((f) => f.phases === "correct").length;
  const correctShare = reviewed.length > 0 ? correct / reviewed.length : null;
  const pilots = new Set(closed.map((f) => f.pilotId)).size;
  const checks = {
    pilots: pilots >= ALPHA_TARGETS.pilots,
    flights: closed.length >= ALPHA_TARGETS.flights,
    noLostFlight: staleFlights === 0 && closedWithoutTrack === 0,
    phases: correctShare !== null && correctShare >= ALPHA_TARGETS.correctShare,
  };
  return {
    pilots,
    flights: facts.length,
    closedFlights: closed.length,
    staleFlights,
    closedWithoutTrack,
    reviewed: reviewed.length,
    correct,
    correctShare,
    checks,
    passed: Object.values(checks).every(Boolean),
  };
}
