import type { PositionReport } from "@weems/contrats";

/** One point kept every 15 s of flight time: a 2-hour flight is 480 points, about 12 KB of JSON. */
const KEEP_EVERY_MS = 15_000;
/** Past this, every other point is dropped: memory stays bounded on very long flights. */
const MAX_POINTS = 1_500;

type Point = [lon: number, lat: number];

interface Trail {
  points: Point[];
  lastKeptMs: number;
}

/**
 * Where each open flight has been, in memory like the rest of the live map (architecture, step
 * 2): lost when the API restarts, which only shortens the line drawn. 500 flights × 1 500 points
 * stay under 30 MB.
 */
export class LiveTrails {
  private readonly trails = new Map<string, Trail>();

  add(flightId: string, report: PositionReport): void {
    const atMs = Date.parse(report.at);
    const point: Point = [report.lon, report.lat];
    const trail = this.trails.get(flightId);
    if (!trail) {
      this.trails.set(flightId, { points: [point], lastKeptMs: atMs });
      return;
    }
    // Sample time, not arrival time: re-sent batches and paused simulators add nothing.
    if (atMs - trail.lastKeptMs < KEEP_EVERY_MS) return;
    trail.points.push(point);
    trail.lastKeptMs = atMs;
    if (trail.points.length > MAX_POINTS) {
      trail.points = trail.points.filter((_, i) => i % 2 === 0 || i === trail.points.length - 1);
    }
  }

  /** Points of the flight, oldest first; empty when the API has not received any. */
  of(flightId: string): Point[] {
    return [...(this.trails.get(flightId)?.points ?? [])];
  }

  forget(flightId: string): void {
    this.trails.delete(flightId);
  }
}
