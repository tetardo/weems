"use client";

import { useEffect, useState } from "react";

/**
 * Where a key moves the held minute: ← → one minute, with Shift ten, Home and End the first and
 * last; null for any other key.
 */
export function keyTarget(event: Pick<KeyboardEvent, "key" | "shiftKey">, at: number, count: number) {
  const last = count - 1;
  const step = event.shiftKey ? 10 : 1;
  const targets: Record<string, number> = {
    ArrowLeft: at - step,
    ArrowRight: at + step,
    Home: 0,
    End: last,
  };
  const target = targets[event.key];
  return target === undefined ? null : Math.min(last, Math.max(0, target));
}

/** A clicked minute stays read; arrows, Home and End move it, Escape lets it go. */
export function usePinnedMinute(count: number) {
  const [pinned, setPinned] = useState<number | null>(null);
  useEffect(() => {
    if (pinned === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") return setPinned(null);
      const target = keyTarget(event, pinned, count);
      if (target === null) return;
      event.preventDefault();
      setPinned(target);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pinned, count]);
  const toggle = (i: number) => setPinned((current) => (current === i ? null : i));
  return [pinned, toggle, setPinned] as const;
}
