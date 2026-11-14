"use client";

import { useEffect, useState } from "react";

/** A clicked minute stays read; ← → move it by one minute, Escape lets it go. */
export function usePinnedMinute(count: number) {
  const [pinned, setPinned] = useState<number | null>(null);
  const held = pinned !== null;
  useEffect(() => {
    if (!held) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPinned(null);
      else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const step = event.key === "ArrowLeft" ? -1 : 1;
        setPinned((i) => (i === null ? i : Math.min(count - 1, Math.max(0, i + step))));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [held, count]);
  const toggle = (i: number) => setPinned((current) => (current === i ? null : i));
  return [pinned, toggle, setPinned] as const;
}
