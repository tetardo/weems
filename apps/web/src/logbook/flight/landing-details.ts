import {
  type FlightBands,
  type FlightEvent,
  type TrackView,
  landingSummary,
} from "@weems/contrats";

type TrackPoint = TrackView["points"][number];

/** The final landing in detail (page complète d'un vol, maquette v13): what the cards show. */
export interface LandingDetails {
  /** ft/min (negative); null when not measured. */
  touchdownVs: number | null;
  at: string;
  /** Highest load factor of the touchdown minute (flight bands); null when not recorded. */
  gForce: number | null;
  /** Indicated speed at the trajectory point nearest the touchdown, kt; null without trajectory. */
  ias: number | null;
  bounces: number;
  goArounds: number;
}

/** Trajectory point nearest a time; undefined without points. */
function pointAt(points: readonly TrackPoint[], at: string): TrackPoint | undefined {
  const time = Date.parse(at);
  let best: TrackPoint | undefined;
  for (const point of points) {
    if (!best || Math.abs(Date.parse(point.at) - time) < Math.abs(Date.parse(best.at) - time))
      best = point;
  }
  return best;
}

/** Load factor of the band minute holding the touchdown. */
function touchdownGForce(bands: FlightBands | null, at: string): number | null {
  const time = Date.parse(at);
  const minute = bands?.minutes.findLast((m) => Date.parse(m.at) <= time);
  return minute?.values["gForce"] ?? null;
}

/** Null when the flight never touched down. */
export function landingDetails(
  events: readonly FlightEvent[],
  points: readonly TrackPoint[],
  bands: FlightBands | null,
): LandingDetails | null {
  const landing = landingSummary(events);
  if (!landing) return null;
  return {
    touchdownVs: landing.touchdownVs,
    at: landing.at,
    gForce: touchdownGForce(bands, landing.at),
    ias: pointAt(points, landing.at)?.ias ?? null,
    bounces: landing.bounces,
    goArounds: landing.goArounds,
  };
}
