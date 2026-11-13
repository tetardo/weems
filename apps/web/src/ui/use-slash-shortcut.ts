"use client";

import { useEffect } from "react";

/** « / » anywhere on the page but in a field puts the cursor in the search. */
export function useSlashShortcut(input: { current: HTMLInputElement | null }): void {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLElement && event.target.closest("input, textarea");
      if (event.key !== "/" || typing) return;
      event.preventDefault();
      input.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [input]);
}
