"use client";

import { useEffect, useState } from "react";

/**
 * A switch of the live map remembered in the browser: routes (on by default, Greg, 11/11/2026),
 * night. Storage may be refused (private mode): the choice then lasts the page.
 */
export function useStoredSwitch(
  storageKey: string,
  byDefault: boolean,
): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(byDefault);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setOn(stored === "on");
    } catch {
      // Keep the default.
    }
  }, [storageKey]);

  const choose = (next: boolean) => {
    setOn(next);
    try {
      localStorage.setItem(storageKey, next ? "on" : "off");
    } catch {
      // The choice lasts until the page is left.
    }
  };
  return [on, choose];
}
