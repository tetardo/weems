"use client";

import type { FlightBands as Bands, FlightView, TrackView } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { formatRoute } from "../../../format/flight-format.ts";
import { TrackMap } from "../../../flight/track-map.tsx";
import { useTime } from "../../flights/band-parts.tsx";
import { EcamLegend } from "../ecam-legend.tsx";
import { unmeasuredRows } from "../ecam-values.ts";
import { EcamGrid } from "./ecam-grid.tsx";
import { NdMap } from "./nd-map.tsx";
import { useEcamReading } from "./use-ecam-reading.ts";

type Reading = ReturnType<typeof useEcamReading>;

/** Title, route and aircraft, then the scale or the zoomed stretch. */
function ScreenHeader({
  flight,
  bands,
  reading,
}: {
  flight: FlightView;
  bands: Bands;
  reading: Reading;
}) {
  const t = useTranslations("Logbook.ecamPage");
  const time = useTime();
  const { shown, zoomed, view } = reading;
  const at = (i: number) => time(bands.minutes[i]?.at ?? "");
  return (
    <div className="mb-2.5 flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
      <h2 className="m-0 border-b border-ecam-white text-[14px] font-bold tracking-[.08em]">
        {t("title")}
      </h2>
      <span className="text-ecam-white">
        {formatRoute(flight.departureIcao, flight.plannedArrivalIcao)}
        <span className="text-ecam-cyan"> · {flight.aircraft.model ?? flight.callsign}</span>
      </span>
      <span className="ml-auto flex items-center gap-2 text-[12px] text-ecam-dim">
        <span className="border border-ecam-cyan px-1.5 leading-[18px] text-ecam-cyan">
          {zoomed
            ? t("zoom", { from: at(shown.from), to: at(shown.to) })
            : t("cell", { minutes: view.size })}
        </span>
        {zoomed ? t("reset") : t("dragHint")}
      </span>
    </div>
  );
}

/** MapLibre map then ND map, both on the track point of the minute read. */
function EcamMaps({
  flight,
  points,
  reading,
}: {
  flight: FlightView;
  points: TrackView["points"];
  reading: Reading;
}) {
  const time = useTime();
  const { cursorPoint } = reading;
  const cursorAt = points[cursorPoint]?.at;
  if (points.length < 2) return null;
  return (
    <>
      <div className="mb-2.5">
        <TrackMap
          points={points}
          selected={cursorPoint < 0 ? null : cursorPoint}
          onSelect={reading.fromMap}
          className="h-[260px]"
        />
      </div>
      <NdMap
        points={points}
        framed={reading.framed}
        cursor={cursorPoint}
        label={cursorAt ? time(cursorAt) : ""}
        departure={flight.departureIcao}
        arrival={flight.plannedArrivalIcao}
        onHover={reading.fromMap}
      />
    </>
  );
}

/**
 * The ECAM page of a flight (Greg, 14/11/2026), on one cockpit screen: MapLibre map, ND map,
 * profile and bands under one reading line, values of the minute read. Both maps and the bands
 * read the same minute; a drag zooms on a stretch, beyond 120 minutes a cell is 5 minutes.
 */
export function EcamScreen({
  flight,
  points,
  bands,
}: {
  flight: FlightView;
  points: TrackView["points"];
  bands: Bands;
}) {
  const reading = useEcamReading(bands, points);
  const unmeasured = useMemo(() => unmeasuredRows(bands.unmeasured), [bands.unmeasured]);
  const { view, cell } = reading;
  return (
    <section
      onMouseLeave={reading.leave}
      className="rounded-panel border-[5px] border-ecam-bezel bg-ecam px-4 py-3.5 font-cockpit text-[13px] text-ecam-white shadow-[0_0_0_1px_var(--color-ecam-edge)]"
    >
      <ScreenHeader flight={flight} bands={bands} reading={reading} />
      <EcamMaps flight={flight} points={points} reading={reading} />
      <EcamGrid
        bands={view.bands}
        full={bands}
        window={reading.shown}
        zoomed={reading.zoomed}
        cell={cell}
        selection={reading.drag.selection}
        track={reading.drag.track}
        handlers={reading.drag.handlers}
        onReset={reading.reset}
      />
      <EcamLegend bands={view.bands} index={cell} pinned={reading.pinned} unmeasured={unmeasured} />
    </section>
  );
}
