/** The dashed route of the photo banners, between two airports (drawing units). */
const ROUTE = "M70 300 C 190 120, 380 50, 530 92";
const [START, END] = [
  { x: 70, y: 300 },
  { x: 530, y: 92 },
];

/** A small plane pointing right (along the route: animateMotion turns it). */
const PLANE =
  "M-9 -1.5 L3 -1.5 L8 0 L3 1.5 L-9 1.5 Z M-1 -1.5 L-5 -8 L-2 -8 L4 -1.5 Z M-1 1.5 L-5 8 L-2 8 L4 1.5 Z M-9 -1.5 L-11 -5 L-9 -5 L-6 -1.5 Z M-9 1.5 L-11 5 L-9 5 L-6 1.5 Z";

function Airport({ x, y, code }: { x: number; y: number; code: string }) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={14}
        className="fill-accent/20 motion-safe:animate-ping"
        style={{ transformOrigin: `${x}px ${y}px` }}
      />
      <circle cx={x} cy={y} r={6} className="fill-hero-ink stroke-accent" strokeWidth={3} />
      <text
        x={x}
        y={y - 18}
        textAnchor="middle"
        className="fill-hero-ink font-title text-[15px] font-semibold tracking-wider"
      >
        {code}
      </text>
    </g>
  );
}

/**
 * Decoration of the photo banners (Découvrir, Fonctionnalités): the dashed route of the site, now
 * flowing, a plane flying it and the two airports pulsing. Decorative only (aria-hidden).
 */
export function RouteFlourish({
  from,
  to,
  className = "",
}: {
  from: string;
  to: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 600 380" aria-hidden="true" className={className}>
      <path
        d={ROUTE}
        fill="none"
        className="stroke-hero-ink/25"
        strokeWidth={10}
        strokeLinecap="round"
      />
      <path
        d={ROUTE}
        fill="none"
        className="route-flow stroke-hero-ink"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray="2 10"
      />
      <Airport {...START} code={from} />
      <Airport {...END} code={to} />
      <g className="motion-reduce:hidden">
        <path d={PLANE} className="fill-accent" transform="scale(1.6)" />
        <animateMotion dur="9s" repeatCount="indefinite" rotate="auto" path={ROUTE} />
      </g>
    </svg>
  );
}
