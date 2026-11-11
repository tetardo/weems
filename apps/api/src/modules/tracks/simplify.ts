import type { TrackPoint } from "@weems/contrats";

const NM_PER_DEGREE = 60;
/** 1 000 ft of altitude weighs as much as 1 NM sideways: keeps the vertical profile faithful. */
const FT_PER_NM_EQUIVALENT = 1_000;

type Vector = [number, number, number];

/** Array access for indices known to be in range (keeps the code free of "!"). */
function get<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) throw new RangeError(`No item at ${index}`);
  return item;
}

function toVector(point: TrackPoint, cosLat: number): Vector {
  return [
    point.lon * NM_PER_DEGREE * cosLat,
    point.lat * NM_PER_DEGREE,
    point.altMsl / FT_PER_NM_EQUIVALENT,
  ];
}

/** Distance from `p` to the segment a-b, in NM-equivalent. */
function distanceToSegment(
  [px, py, pz]: Vector,
  [ax, ay, az]: Vector,
  [bx, by, bz]: Vector,
): number {
  const [abx, aby, abz] = [bx - ax, by - ay, bz - az];
  const [apx, apy, apz] = [px - ax, py - ay, pz - az];
  const lengthSq = abx ** 2 + aby ** 2 + abz ** 2;
  const k =
    lengthSq === 0 ? 0 : Math.min(1, Math.max(0, (apx * abx + apy * aby + apz * abz) / lengthSq));
  return Math.hypot(apx - k * abx, apy - k * aby, apz - k * abz);
}

/** Douglas-Peucker: marks in `keep` the points farther than `tolerance` from the simplified line. */
function douglasPeucker(vectors: Vector[], tolerance: number, keep: boolean[]): void {
  const stack: [number, number][] = [[0, vectors.length - 1]];
  while (stack.length > 0) {
    const [first, last] = get(stack.splice(-1, 1), 0);
    let farthest = -1;
    let farthestDistance = tolerance;
    for (let i = first + 1; i < last; i++) {
      const distance = distanceToSegment(get(vectors, i), get(vectors, first), get(vectors, last));
      if (distance > farthestDistance) [farthest, farthestDistance] = [i, distance];
    }
    if (farthest < 0) continue;
    keep[farthest] = true;
    stack.push([first, farthest], [farthest, last]);
  }
}

/** Liftoffs and touchdowns: always kept, they matter on the profile. */
function groundChanges(points: readonly TrackPoint[]): number[] {
  const indices: number[] = [];
  for (let i = 1; i < points.length; i++) {
    if (get(points, i).onGround !== get(points, i - 1).onGround) indices.push(i - 1, i);
  }
  return indices;
}

/**
 * At most `maxPoints` points that still draw the same trajectory and profile (spec J2).
 * The first and last points, ground changes and the `mustKeep` indices are always kept.
 */
export function simplifyTrack(
  points: readonly TrackPoint[],
  maxPoints: number,
  mustKeep: readonly number[] = [],
): TrackPoint[] {
  if (points.length <= maxPoints) return [...points];
  const cosLat = Math.cos((get(points, 0).lat * Math.PI) / 180);
  const vectors = points.map((p) => toVector(p, cosLat));
  const forced = [0, points.length - 1, ...groundChanges(points), ...mustKeep];
  let tolerance = 0.01;
  for (;;) {
    const keep = points.map(() => false);
    for (const index of forced) if (index >= 0 && index < points.length) keep[index] = true;
    douglasPeucker(vectors, tolerance, keep);
    const kept = points.filter((_, i) => keep[i]);
    if (kept.length <= maxPoints || tolerance > 100) return kept;
    tolerance *= 1.5;
  }
}
