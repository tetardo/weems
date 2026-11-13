"use client";

import { LiveTrail, type LiveFlight, type LiveTrailPoint } from "@weems/contrats";
import { useEffect, useState } from "react";
import { withPosition } from "./live-trail.ts";

/**
 * Points of a flight in progress with altitude, speeds and phase (spec vol en cours): read once
 * from GET /v1/live/flights/{id}/trail when the flight is on the stream, then grown from its
 * positions. Empty until then, or when the API does not answer: the stream alone fills it.
 */
export function useLiveTrail(
  apiUrl: string,
  flight: LiveFlight | undefined,
): readonly LiveTrailPoint[] {
  const flightId = flight?.flightId ?? null;
  const [points, setPoints] = useState<readonly LiveTrailPoint[]>([]);

  useEffect(() => {
    if (!flightId) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(`${apiUrl}/v1/live/flights/${flightId}/trail`, {
          signal: controller.signal,
        });
        if (response.ok) setPoints(LiveTrail.parse(await response.json()).points);
      } catch {
        // Network cut: the positions of the stream still draw what comes next.
      }
    };
    void load();
    return () => controller.abort();
  }, [apiUrl, flightId]);

  const position = flight?.position;
  useEffect(() => {
    if (position) setPoints((current) => withPosition(current, position));
  }, [position]);

  return points;
}
