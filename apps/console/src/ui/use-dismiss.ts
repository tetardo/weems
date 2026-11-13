"use client";

import { type RefObject, useEffect } from "react";

/** Closes a menu on a click outside `box` or on Escape, while it is open. */
export function useDismiss(open: boolean, box: RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onEvent = (event: Event) => {
      const outside = !box.current?.contains(event.target as Node);
      if (event instanceof KeyboardEvent ? event.key === "Escape" : outside) close();
    };
    document.addEventListener("mousedown", onEvent);
    document.addEventListener("keydown", onEvent);
    return () => {
      document.removeEventListener("mousedown", onEvent);
      document.removeEventListener("keydown", onEvent);
    };
  }, [open, box, close]);
}
