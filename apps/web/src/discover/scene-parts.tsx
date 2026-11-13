/**
 * Drawing pieces of the little scenes above the step illustrations (inside an SVG): a cloud, a
 * plane seen from above, the sun, a runway. Colours come from the site tokens, so the scenes
 * follow the light and dark themes.
 */

/** Outline of a plane seen from above, nose up-right, in a 24 × 24 box (same shape as the icons). */
const PLANE =
  "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z";

export function Plane({
  x,
  y,
  size = 26,
  turn = 0,
  tone = "stroke-accent",
}: {
  x: number;
  y: number;
  size?: number;
  /** Degrees, clockwise, from the nose up-right. */
  turn?: number;
  tone?: string;
}) {
  const scale = size / 24;
  return (
    <g
      transform={`translate(${x - size / 2} ${y - size / 2}) scale(${scale}) rotate(${turn} 12 12)`}
    >
      <path
        d={PLANE}
        className={`fill-surface ${tone}`}
        strokeWidth={1.6 / scale}
        strokeLinejoin="round"
      />
    </g>
  );
}

export function Cloud({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${scale})`}
      d="M0 16 C0 10 6 8 10 10 C11 4 18 0 24 3 C28 0 36 2 37 9 C42 9 45 13 44 16 Z"
      className="fill-muted/25"
    />
  );
}

export function Sun({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="16" className="fill-accent-2/15" />
      <circle cx={x} cy={y} r="9" className="fill-accent-2/70" />
    </g>
  );
}

/** Runway seen from the side: a strip on the ground with its centre line. */
export function Runway({ x, width, y = 58 }: { x: number; width: number; y?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={width} height="5" rx="1.5" className="fill-muted/35" />
      <line
        x1={x + 6}
        x2={x + width - 6}
        y1={y + 2.5}
        y2={y + 2.5}
        strokeDasharray="6 5"
        strokeWidth="1"
        className="stroke-surface"
      />
    </g>
  );
}

/** Dashed path of a flight in the scene. */
export function Trail({ d, tone = "stroke-accent" }: { d: string; tone?: string }) {
  return <path d={d} fill="none" strokeWidth="1.6" strokeDasharray="4 4" className={tone} />;
}

/** Ground line across the scene. */
export function Ground() {
  return <line x1="0" x2="400" y1="63" y2="63" strokeWidth="1" className="stroke-line" />;
}
