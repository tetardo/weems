/**
 * Geometry of the heading dial of the login page: a ring, and flights drawn as quadratic curves
 * from a departure to an arrival, the aircraft at `progress` along the curve. Pure, tested.
 */

type Point = readonly [number, number];

interface DialAirport {
  code: string;
  at: Point;
}

export interface DialFlight {
  from: DialAirport;
  to: DialAirport;
  /** Control point of the quadratic curve. */
  bend: Point;
  /** Part of the route already flown, 0 to 1. */
  progress: number;
}

export interface LabelPlace {
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
}

export interface FlightShape {
  flown: string;
  remaining: string;
  aircraft: string;
  fromLabel: LabelPlace;
  toLabel: LabelPlace;
}

export const DIAL = { size: 600, height: 460, center: [300, 230] as Point, radius: 176 };

const LABEL_GAP = 16;

const airport = (code: string, x: number, y: number): DialAirport => ({ code, at: [x, y] });

/** Pairs of flights shown in turn on hover. Real ICAO codes, positions drawn freely in the dial. */
export const DIAL_ROUTES: readonly (readonly [DialFlight, DialFlight])[] = [
  [
    {
      from: airport("LFML", 190, 310),
      to: airport("LSZH", 420, 140),
      bend: [220, 214],
      progress: 0.6,
    },
    {
      from: airport("EGLL", 410, 320),
      to: airport("LEBL", 196, 150),
      bend: [330, 196],
      progress: 0.35,
    },
  ],
  [
    {
      from: airport("LFPG", 222, 118),
      to: airport("LIRF", 402, 326),
      bend: [370, 150],
      progress: 0.55,
    },
    {
      from: airport("LEMD", 160, 262),
      to: airport("EDDF", 330, 92),
      bend: [196, 140],
      progress: 0.4,
    },
  ],
  [
    {
      from: airport("LPPT", 168, 330),
      to: airport("EHAM", 382, 116),
      bend: [236, 168],
      progress: 0.7,
    },
    {
      from: airport("LFBO", 438, 248),
      to: airport("LFRS", 262, 352),
      bend: [376, 340],
      progress: 0.45,
    },
  ],
  [
    {
      from: airport("LOWW", 420, 170),
      to: airport("LGAV", 372, 360),
      bend: [452, 280],
      progress: 0.5,
    },
    {
      from: airport("EKCH", 260, 96),
      to: airport("LFLL", 170, 290),
      bend: [150, 160],
      progress: 0.62,
    },
  ],
];

/** The pair of flights at `index` in the hover cycle (wraps around). */
export function routePair(index: number): readonly [DialFlight, DialFlight] {
  const pair = DIAL_ROUTES[index % DIAL_ROUTES.length];
  if (!pair) throw new Error("The dial has no routes.");
  return pair;
}

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
const lerpPoint = (a: Point, b: Point, k: number): Point => [
  lerp(a[0], b[0], k),
  lerp(a[1], b[1], k),
];
const round = (value: number): number => Math.round(value * 10) / 10;
const pt = (p: Point): string => `${round(p[0])} ${round(p[1])}`;

/** Smooth start and end of a morph (cubic ease in and out). */
export function easeInOut(k: number): number {
  return k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;
}

/** Label of an airport, pushed away from the dial's centre so it never sits on the route. */
export function labelPlace(at: Point): LabelPlace {
  const [dx, dy] = [at[0] - DIAL.center[0], at[1] - DIAL.center[1]];
  const length = Math.hypot(dx, dy) || 1;
  const anchor = dx < -20 ? "end" : dx > 20 ? "start" : "middle";
  return {
    x: round(at[0] + (dx / length) * LABEL_GAP),
    y: round(at[1] + (dy / length) * LABEL_GAP + 4),
    anchor,
  };
}

/** Paths of a flight: flown part, remaining part (split at the aircraft), aircraft transform. */
export function flightShape({ from, to, bend, progress: t }: DialFlight): FlightShape {
  const firstBend = lerpPoint(from.at, bend, t);
  const secondBend = lerpPoint(bend, to.at, t);
  const aircraft = lerpPoint(firstBend, secondBend, t);
  const heading = Math.atan2(secondBend[1] - firstBend[1], secondBend[0] - firstBend[0]);
  const rotation = round((heading * 180) / Math.PI + 90);
  return {
    flown: `M${pt(from.at)}Q${pt(firstBend)} ${pt(aircraft)}`,
    remaining: `M${pt(aircraft)}Q${pt(secondBend)} ${pt(to.at)}`,
    aircraft: `translate(${pt(aircraft)}) rotate(${rotation}) scale(.85)`,
    fromLabel: labelPlace(from.at),
    toLabel: labelPlace(to.at),
  };
}

/** A flight between two others, `k` from 0 (first) to 1 (second); codes are the second's. */
export function mixFlights(a: DialFlight, b: DialFlight, k: number): DialFlight {
  return {
    from: { code: b.from.code, at: lerpPoint(a.from.at, b.from.at, k) },
    to: { code: b.to.code, at: lerpPoint(a.to.at, b.to.at, k) },
    bend: lerpPoint(a.bend, b.bend, k),
    progress: lerp(a.progress, b.progress, k),
  };
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * A code settling letter by letter, like a departures board: at `k` (0 to 1) the first letters
 * are final, the others random (`random` gives 0 to 1).
 */
export function scrambleCode(code: string, k: number, random: () => number = Math.random): string {
  return [...code]
    .map((letter, index) =>
      k >= 1 || k > 0.25 + index * 0.15 ? letter : LETTERS[Math.floor(random() * LETTERS.length)],
    )
    .join("");
}

/** Ticks of the heading ring, every 5°: long every 30°, medium every 10°. */
export function ringTicks(): { d: string; major: boolean }[] {
  const [cx, cy] = DIAL.center;
  const r = DIAL.radius;
  const ticks: { d: string; major: boolean }[] = [];
  for (let degrees = 0; degrees < 360; degrees += 5) {
    const angle = (degrees * Math.PI) / 180;
    const length = degrees % 30 === 0 ? 14 : degrees % 10 === 0 ? 8 : 4;
    const [sin, cos] = [Math.sin(angle), -Math.cos(angle)];
    const inner: Point = [cx + r * sin, cy + r * cos];
    const outer: Point = [cx + (r + length) * sin, cy + (r + length) * cos];
    ticks.push({ d: `M${pt(inner)}L${pt(outer)}`, major: degrees % 30 === 0 });
  }
  return ticks;
}
