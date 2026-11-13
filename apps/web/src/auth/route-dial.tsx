"use client";

import { DialFlight } from "./dial-flight.tsx";
import { DialRing } from "./dial-ring.tsx";
import { DIAL } from "./route-dial-geometry.ts";
import { useRouteMorph } from "./use-route-morph.ts";

/**
 * Illustration of the login page: a heading dial in thin lines with two flights crossing their
 * routes slowly; hovering it changes the destinations (use-route-morph.ts).
 */
export function RouteDial({ label }: { label: string }) {
  const { flights, opacity, start, stop } = useRouteMorph();
  return (
    <svg
      viewBox={`0 0 ${DIAL.size} ${DIAL.height}`}
      role="img"
      aria-label={label}
      onMouseEnter={start}
      onMouseLeave={stop}
      className="group mx-auto h-auto max-h-[380px] w-full max-w-[500px] cursor-crosshair"
    >
      <defs>
        <radialGradient id="dial-halo" cx=".5" cy=".5" r=".5">
          <stop offset="0" style={{ stopColor: "var(--wm-flight-1)" }} stopOpacity={0.1} />
          <stop offset="1" style={{ stopColor: "var(--wm-flight-1)" }} stopOpacity={0} />
        </radialGradient>
      </defs>
      <DialRing />
      <DialFlight flight={flights[0]} id="a" tone="fill-flight-1" aircraftOpacity={opacity[0]} />
      <DialFlight flight={flights[1]} id="b" tone="fill-flight-2" aircraftOpacity={opacity[1]} />
    </svg>
  );
}
