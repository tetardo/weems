"use client";

import { Boarding } from "@weems/contrats";
import { useEffect, useState } from "react";

/**
 * Follows GET /v1/live/boarding/stream (spec web Boarding): the API sends the whole boards on
 * connection and every time they change. `board` keeps the last one while the connection is cut;
 * `failed` says it is late. EventSource reconnects by itself.
 */
export function useBoarding(apiUrl: string): { board: Boarding | null; failed: boolean } {
  const [board, setBoard] = useState<Boarding | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const source = new EventSource(`${apiUrl}/v1/live/boarding/stream`);
    source.addEventListener("open", () => setFailed(false));
    source.addEventListener("error", () => setFailed(true));
    source.addEventListener("board", (event) => {
      setBoard(Boarding.parse(JSON.parse(event.data)));
      setFailed(false);
    });
    return () => source.close();
  }, [apiUrl]);

  return { board, failed };
}
