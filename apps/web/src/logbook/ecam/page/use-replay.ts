"use client";

import { useEffect, useState } from "react";

/** Replay speeds: flight minutes per real minute. */
export const REPLAY_SPEEDS = [10, 30, 60] as const;
export type ReplaySpeed = (typeof REPLAY_SPEEDS)[number];

/** Real milliseconds between two cells of `size` minutes at `speed`. */
export const replayStep = (speed: ReplaySpeed, size: number) => (60_000 * size) / speed;

/**
 * Replay of the flight (maquette v3, Greg 14/11/2026): moves the held cell forward until the
 * end; the space bar plays or pauses. `hold` sets the held cell (null lets it go).
 */
export function useReplay(
  count: number,
  size: number,
  held: number | null,
  hold: (i: number) => void,
) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<ReplaySpeed>(30);
  const toggle = () => {
    if (!playing && (held === null || held >= count - 1)) hold(0);
    setPlaying(!playing);
  };
  useEffect(() => {
    if (!playing) return;
    if (held === null || held >= count - 1) return setPlaying(false);
    const timer = window.setTimeout(() => hold(held + 1), replayStep(speed, size));
    return () => window.clearTimeout(timer);
  }, [playing, held, count, size, speed, hold]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== " " || event.target instanceof HTMLInputElement) return;
      event.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  return { playing, speed, setSpeed, toggle, stop: () => setPlaying(false) };
}
