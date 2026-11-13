"use client";

import { Boarding } from "@weems/contrats";
import { useEffect, useState } from "react";

/** The boards are read again this often: the board follows the flights live. */
const READ_EVERY_MS = 5_000;

/**
 * GET /v1/live/boarding, read from the browser every 5 s (spec web Boarding). `board` keeps the
 * last answer while the API does not answer; `failed` says it is late.
 */
export function useBoarding(apiUrl: string): { board: Boarding | null; failed: boolean } {
  const [board, setBoard] = useState<Boarding | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let stopped = false;
    let controller = new AbortController();
    const read = async () => {
      controller = new AbortController();
      try {
        const response = await fetch(`${apiUrl}/v1/live/boarding`, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const next = Boarding.parse(await response.json());
        if (!stopped) {
          setBoard(next);
          setFailed(false);
        }
      } catch {
        if (!stopped) setFailed(true);
      }
    };
    void read();
    const timer = setInterval(() => void read(), READ_EVERY_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
      controller.abort();
    };
  }, [apiUrl]);

  return { board, failed };
}
