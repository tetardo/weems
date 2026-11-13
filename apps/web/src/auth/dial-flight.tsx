import { type DialFlight as Flight, flightShape, type LabelPlace } from "./route-dial-geometry.ts";

type Point = readonly [number, number];

/** Airliner seen from above, nose up, about 40 units long. */
const AIRCRAFT =
  "M0 -20C1.6 -20 2.4 -17 2.4 -14V-4L18 4V7L2.4 3V12L7 15.5V17.5L0 16L-7 17.5V15.5L-2.4 12V3L-18 7V4L-2.4 -4V-14C-2.4 -17 -1.6 -20 0 -20Z";

const TONES = {
  "fill-flight-1": "var(--wm-flight-1)",
  "fill-flight-2": "var(--wm-flight-2)",
} as const;

/** Route coloured from departure (green) through the flight's colour to arrival (orange). */
function RouteLine({
  id,
  from,
  to,
  color,
  flown,
  remaining,
}: {
  id: string;
  from: Point;
  to: Point;
  color: string;
  flown: string;
  remaining: string;
}) {
  const stroke = `url(#${id})`;
  return (
    <>
      <defs>
        <linearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          x1={from[0]}
          y1={from[1]}
          x2={to[0]}
          y2={to[1]}
        >
          <stop offset="0" style={{ stopColor: "var(--wm-route-start)" }} />
          <stop offset=".55" style={{ stopColor: color }} />
          <stop offset="1" style={{ stopColor: "var(--wm-route-end)" }} />
        </linearGradient>
      </defs>
      <path d={flown} stroke={stroke} strokeWidth={1.8} strokeLinecap="round" fill="none" />
      <path
        d={remaining}
        stroke={stroke}
        strokeWidth={1.3}
        strokeOpacity={0.7}
        strokeDasharray="3 6"
        fill="none"
      />
    </>
  );
}

/** An airport: soft halo (grows on hover), point (hollow at departure, full at arrival), code. */
function Endpoint({
  at,
  code,
  place,
  kind,
}: {
  at: Point;
  code: string;
  place: LabelPlace;
  kind: "departure" | "arrival";
}) {
  const fill = kind === "departure" ? "fill-route-start" : "fill-route-end";
  const point = kind === "departure" ? "fill-auth-panel stroke-route-start" : "fill-route-end";
  return (
    <>
      <circle
        cx={at[0]}
        cy={at[1]}
        r={10}
        fillOpacity={0.12}
        className={`${fill} transition-[r] duration-400 group-hover:[r:14px]`}
      />
      <circle cx={at[0]} cy={at[1]} r={4.5} strokeWidth={1.6} className={point} />
      <text
        x={place.x}
        y={place.y}
        textAnchor={place.anchor}
        className={`${fill} font-mono text-[11.5px] font-medium tracking-[.1em]`}
      >
        {code}
      </text>
    </>
  );
}

/** One flight on the dial: route, flown part solid and the rest dashed, airports, aircraft. */
export function DialFlight({
  flight,
  id,
  tone,
}: {
  flight: Flight;
  id: string;
  tone: keyof typeof TONES;
}) {
  const shape = flightShape(flight);
  return (
    <g>
      <RouteLine
        id={`route-${id}`}
        from={flight.from.at}
        to={flight.to.at}
        color={TONES[tone]}
        flown={shape.flown}
        remaining={shape.remaining}
      />
      <Endpoint
        at={flight.from.at}
        code={flight.from.code}
        place={shape.fromLabel}
        kind="departure"
      />
      <Endpoint at={flight.to.at} code={flight.to.code} place={shape.toLabel} kind="arrival" />
      <path d={AIRCRAFT} transform={shape.aircraft} className={tone} />
    </g>
  );
}
