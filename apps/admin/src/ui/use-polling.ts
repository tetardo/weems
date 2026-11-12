"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ActionResult } from "../actions/result.ts";

/**
 * Calls a server action now and every `everyMs`, while the tab is visible.
 * `refresh` reads again at once (after a button).
 */
export function usePolling<T>(read: () => Promise<ActionResult<T>>, everyMs: number) {
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reader = useRef(read);
  reader.current = read;

  const refresh = useCallback(async () => {
    const result = await reader.current();
    if (result.ok) {
      setValue(result.value);
      setError(null);
    } else setError(result.error);
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, everyMs);
    return () => clearInterval(timer);
  }, [refresh, everyMs]);

  return { value, error, refresh };
}
