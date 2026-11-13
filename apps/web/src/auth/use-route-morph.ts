"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type DialFlight,
  easeInOut,
  mixFlights,
  routePair,
  scrambleCode,
  transit,
} from "./route-dial-geometry.ts";

type Pair = readonly [DialFlight, DialFlight];

interface DialView {
  flights: Pair;
  /** Opacity of each aircraft: it fades in and out at the ends of its transit. */
  opacity: readonly [number, number];
}

interface Morph {
  from: Pair;
  to: Pair;
  begin: number;
}

const MORPH_MS = 1100;
const CYCLE_MS = 2600;
/** The two aircraft are half a transit apart, so they never fade together. */
const OFFSETS = [0, 0.5] as const;

const STILL: DialView = { flights: routePair(0), opacity: [1, 1] };

const reducedMotion = (): boolean => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A flight on its way to the next one: position eased, codes settling letter by letter. */
function inBetween(a: DialFlight, b: DialFlight, k: number): DialFlight {
  const flight = mixFlights(a, b, easeInOut(k));
  return {
    ...flight,
    from: { ...flight.from, code: scrambleCode(b.from.code, k) },
    to: { ...flight.to, code: scrambleCode(b.to.code, k) },
  };
}

/** The dial at `now`: pair of flights (morphing or not), each aircraft on its slow transit. */
function viewAt(now: number, pair: Pair): DialView {
  const [a, b] = OFFSETS.map((offset) => transit(now, offset)) as [
    ReturnType<typeof transit>,
    ReturnType<typeof transit>,
  ];
  return {
    flights: [
      { ...pair[0], progress: a.progress },
      { ...pair[1], progress: b.progress },
    ],
    opacity: [a.opacity, b.opacity],
  };
}

/**
 * Flights of the login page's dial. Both aircraft cross their routes slowly, all the time.
 * While the mouse is over the dial, the routes glide to the next pair of airports every few
 * seconds, their ICAO codes scrambling then settling. Nothing moves when the system asks for
 * less motion.
 */
export function useRouteMorph(): DialView & { start: () => void; stop: () => void } {
  const [view, setView] = useState<DialView>(STILL);
  const index = useRef(0);
  const morph = useRef<Morph | null>(null);
  const timer = useRef(0);

  const pairAt = useCallback((now: number): Pair => {
    const current = morph.current;
    if (!current) return routePair(index.current);
    const k = Math.min(1, (now - current.begin) / MORPH_MS);
    if (k === 1) {
      morph.current = null;
      index.current += 1;
      return current.to;
    }
    return [
      inBetween(current.from[0], current.to[0], k),
      inBetween(current.from[1], current.to[1], k),
    ];
  }, []);

  useEffect(() => {
    if (reducedMotion()) return;
    let frame = requestAnimationFrame(function step(now) {
      setView(viewAt(now, pairAt(now)));
      frame = requestAnimationFrame(step);
    });
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(timer.current);
    };
  }, [pairAt]);

  const next = useCallback(() => {
    if (morph.current) return;
    const from = routePair(index.current);
    morph.current = { from, to: routePair(index.current + 1), begin: performance.now() };
  }, []);

  const stop = useCallback(() => window.clearInterval(timer.current), []);
  const start = useCallback(() => {
    if (reducedMotion() || !window.matchMedia("(hover: hover)").matches) return;
    stop();
    next();
    timer.current = window.setInterval(next, CYCLE_MS);
  }, [next, stop]);

  return { ...view, start, stop };
}
