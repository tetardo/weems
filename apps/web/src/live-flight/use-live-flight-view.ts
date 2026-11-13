"use client";

import type { PositionReport } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { utcMinutes } from "../format/flight-format.ts";
import { type RouteProgress, routeProgress } from "../live/route-progress.ts";
import { liveBands } from "./live-bands.ts";
import { mapDetail } from "./map-detail.ts";
import { useLiveFlight } from "./use-live-flight.ts";

/** Estimated arrival time, from the last position at the current ground speed; null if unknown. */
function etaOf(position: PositionReport | null, progress: RouteProgress | null): number | null {
  const minutes = progress?.remainingMinutes ?? null;
  return position && minutes !== null ? Date.parse(position.at) + minutes * 60_000 : null;
}

/**
 * What the page of a flight in progress shows, from the live stream: the flight, its progress and
 * estimated arrival (at the current ground speed), the flight bands up to that arrival and the
 * details of the map.
 */
export function useLiveFlightView(apiUrl: string, flightId: string) {
  const t = useTranslations("LiveFlight.markers");
  const live = useLiveFlight(apiUrl, flightId);
  const position = live.flight?.position ?? null;
  const departure = live.route?.departure ?? null;
  const arrival = live.route?.arrival ?? null;
  const progress = position && routeProgress(position, departure, arrival);
  const etaMs = etaOf(position, progress);
  const bands = useMemo(() => liveBands(live.points, etaMs), [live.points, etaMs]);
  const detail = useMemo(
    () =>
      mapDetail(live.points, position, { departure, arrival }, (marker) =>
        t(marker.kind, { time: utcMinutes(marker.at) }),
      ),
    [live.points, position, departure, arrival, t],
  );
  return { ...live, position, progress, etaMs, bands, detail };
}

export type LiveFlightView = ReturnType<typeof useLiveFlightView>;
