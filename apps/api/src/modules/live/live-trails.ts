import type { LiveTrailPoint, PositionReport } from "@weems/contrats";

/** One point kept every 15 s of flight time: a 2-hour flight is 480 points, about 40 KB of JSON. */
const KEEP_EVERY_MS = 15_000;
/** Past this, every other point is dropped: memory stays bounded on very long flights. */
const MAX_POINTS = 1_500;

type Point = [lon: number, lat: number];

interface Trail {
  points: LiveTrailPoint[];
  lastKeptMs: number;
}

const kept = ({ at, lat, lon, altMsl, gs, vs, phase }: PositionReport): LiveTrailPoint => ({
  at,
  lat,
  lon,
  altMsl,
  gs,
  vs,
  phase,
});

/**
 * Where each open flight has been, in memory like the rest of the live map (architecture, step
 * 2): lost when the API restarts, which only shortens the line drawn. Each point keeps altitude,
 * speeds and phase too, for the page of a flight in progress (spec vol en cours): 500 flights ×
 * 1 500 points stay around 100 MB.
 */
export class LiveTrails {
  private readonly trails = new Map<string, Trail>();

  add(flightId: string, report: PositionReport): void {
    const atMs = Date.parse(report.at);
    const trail = this.trails.get(flightId);
    if (!trail) {
      this.trails.set(flightId, { points: [kept(report)], lastKeptMs: atMs });
      return;
    }
    // Sample time, not arrival time: re-sent batches and paused simulators add nothing.
    if (atMs - trail.lastKeptMs < KEEP_EVERY_MS) return;
    trail.points.push(kept(report));
    trail.lastKeptMs = atMs;
    if (trail.points.length > MAX_POINTS) {
      trail.points = trail.points.filter((_, i) => i % 2 === 0 || i === trail.points.length - 1);
    }
  }

  /** Positions of the flight as [lon, lat], oldest first; empty when none was received. */
  of(flightId: string): Point[] {
    return this.pointsOf(flightId).map((p) => [p.lon, p.lat]);
  }

  /** Points of the flight with altitude, speeds and phase, oldest first. */
  pointsOf(flightId: string): LiveTrailPoint[] {
    return [...(this.trails.get(flightId)?.points ?? [])];
  }

  forget(flightId: string): void {
    this.trails.delete(flightId);
  }
}
