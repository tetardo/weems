import type { FlightPhase, TrackView } from "@weems/contrats";

type Point = TrackView["points"][number];

/** The five stages the Résumé shows (maquette v6): ground, climb, cruise, descent, approach. */
export type Stage = "ground" | "climb" | "cruise" | "descent" | "approach";

const STAGE_OF: Record<FlightPhase, Stage> = {
  BOARDING: "ground",
  PUSHBACK: "ground",
  TAXI_OUT: "ground",
  TAKEOFF: "climb",
  CLIMB: "climb",
  CRUISE: "cruise",
  DESCENT: "descent",
  APPROACH: "approach",
  FINAL: "approach",
  LANDING: "approach",
  TAXI_IN: "ground",
  ARRIVED: "ground",
};

interface StageSpan {
  stage: Stage;
  durationS: number;
  /** Left edge and width in drawing units. */
  x: number;
  width: number;
  /** Altitude line of the span, and the same closed down to the ground (filled area). */
  line: string;
  area: string;
}

export interface PhaseProfile {
  spans: StageSpan[];
  /** Highest altitude, ft MSL, and its position. */
  top: { altFt: number; x: number; y: number };
}

const seconds = (a: Point, b: Point) => (Date.parse(b.at) - Date.parse(a.at)) / 1000;

/**
 * Consecutive points of the same stage. A point's phase holds from that point on, so a span ends
 * at the first point of the next one.
 */
function split(points: readonly Point[]): { stage: Stage; points: Point[] }[] {
  const spans: { stage: Stage; points: Point[] }[] = [];
  for (const point of points) {
    const last = spans.at(-1);
    const stage = point.phase ? STAGE_OF[point.phase] : (last?.stage ?? "ground");
    last?.points.push(point);
    if (stage !== last?.stage) spans.push({ stage, points: [point] });
  }
  return spans.filter((span) => span.points.length > 1);
}

/**
 * Altitude profile of a flight cut into stages, in a box of `width` × `height` drawing units:
 * time along x, altitude (MSL) up y. Null without at least two points.
 */
export function phaseProfile(
  points: readonly Point[],
  { width, height }: { width: number; height: number },
): PhaseProfile | null {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last || points.length < 2) return null;
  const total = Math.max(1, seconds(first, last));
  const maxAlt = Math.max(1, ...points.map((p) => p.altMsl));
  const x = (p: Point) => (seconds(first, p) / total) * width;
  const y = (p: Point) => height - (Math.max(0, p.altMsl) / maxAlt) * (height - 4);
  const xy = (p: Point) => `${x(p).toFixed(1)},${y(p).toFixed(1)}`;
  const spans = split(points).map(({ stage, points: span }) => {
    const [start, end] = [span[0] as Point, span.at(-1) as Point];
    const line = `M${span.map(xy).join("L")}`;
    return {
      stage,
      durationS: seconds(start, end),
      x: x(start),
      width: x(end) - x(start),
      line,
      area: `${line}L${x(end).toFixed(1)},${height}L${x(start).toFixed(1)},${height}Z`,
    };
  });
  const highest = points.reduce((best, p) => (p.altMsl > best.altMsl ? p : best), first);
  return { spans, top: { altFt: highest.altMsl, x: x(highest), y: y(highest) } };
}
