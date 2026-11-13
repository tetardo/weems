"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type DialFlight,
  easeInOut,
  mixFlights,
  routePair,
  scrambleCode,
} from "./route-dial-geometry.ts";

type Pair = readonly [DialFlight, DialFlight];

const MORPH_MS = 1100;
const CYCLE_MS = 2600;

/** Only with a mouse, and never when the system asks for less motion. */
function canAnimate(): boolean {
  return (
    window.matchMedia("(hover: hover)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** A flight on its way to the next one: position eased, codes settling letter by letter. */
function inBetween(a: DialFlight, b: DialFlight, k: number): DialFlight {
  const flight = mixFlights(a, b, easeInOut(k));
  return {
    ...flight,
    from: { ...flight.from, code: scrambleCode(b.from.code, k) },
    to: { ...flight.to, code: scrambleCode(b.to.code, k) },
  };
}

/**
 * Flights of the login page's dial. While the mouse is over it, both flights glide to the next
 * pair of the list every few seconds, their ICAO codes scrambling then settling.
 */
export function useRouteMorph(): { flights: Pair; start: () => void; stop: () => void } {
  const [flights, setFlights] = useState<Pair>(() => routePair(0));
  const index = useRef(0);
  const frame = useRef(0);
  const timer = useRef(0);

  const morph = useCallback(() => {
    if (frame.current) return;
    const from = routePair(index.current);
    const nextIndex = index.current + 1;
    const to = routePair(nextIndex);
    const begin = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - begin) / MORPH_MS);
      setFlights([inBetween(from[0], to[0], k), inBetween(from[1], to[1], k)]);
      if (k < 1) {
        frame.current = requestAnimationFrame(step);
        return;
      }
      frame.current = 0;
      index.current = nextIndex;
    };
    frame.current = requestAnimationFrame(step);
  }, []);

  const stop = useCallback(() => window.clearInterval(timer.current), []);
  const start = useCallback(() => {
    if (!canAnimate()) return;
    stop();
    morph();
    timer.current = window.setInterval(morph, CYCLE_MS);
  }, [morph, stop]);

  useEffect(
    () => () => {
      window.clearInterval(timer.current);
      cancelAnimationFrame(frame.current);
    },
    [],
  );

  return { flights, start, stop };
}
