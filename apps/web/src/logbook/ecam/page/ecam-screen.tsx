"use client";

import type { FlightBands as Bands, FlightView, TrackView } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { TrackMap } from "../../../flight/track-map.tsx";
import { landingDetails } from "../../flight/landing-details.ts";
import { useTime } from "../../flights/band-parts.tsx";
import { EcamLegend } from "../ecam-legend.tsx";
import { unmeasuredRows } from "../ecam-values.ts";
import { AlarmPanel } from "./alarm-panel.tsx";
import { EcamGrid } from "./ecam-grid.tsx";
import { NdMap } from "./nd-map.tsx";
import { ReplayBar } from "./replay-bar.tsx";
import { ScreenHeader } from "./screen-header.tsx";
import { StatusBlock } from "./status-block.tsx";
import { useEcamReading } from "./use-ecam-reading.ts";
import { useFullScreen } from "./use-full-screen.ts";
import { WeatherPanel } from "./weather-panel.tsx";

type Reading = ReturnType<typeof useEcamReading>;
type Points = TrackView["points"];

/**
 * MapLibre map then ND map, small, beside the bands and kept in sight while they scroll; above
 * them on a phone (Greg, 14/11/2026). Both show the track point of the minute read; the weather
 * at departure and arrival under them.
 */
function SideMaps({
  flight,
  bands,
  points,
  reading,
}: {
  flight: FlightView;
  bands: Bands;
  points: Points;
  reading: Reading;
}) {
  const airports = { departure: flight.departureIcao, arrival: flight.plannedArrivalIcao };
  const t = useTranslations("Logbook.ecamPage");
  const time = useTime();
  const { cursorPoint } = reading;
  const cursorAt = points[cursorPoint]?.at;
  if (points.length < 2) return null;
  return (
    <aside className="order-first grid content-start gap-2.5 lg:sticky lg:top-24 lg:order-none">
      <div>
        <div className="mb-1 text-[11px] tracking-[.06em] text-ecam-cyan">{t("map")}</div>
        <TrackMap
          points={points}
          selected={cursorPoint < 0 ? null : cursorPoint}
          onSelect={reading.fromMap}
          className="h-[200px] overflow-hidden rounded-control"
        />
      </div>
      <NdMap
        points={points}
        framed={reading.framed}
        cursor={cursorPoint}
        read={{ label: cursorAt ? time(cursorAt) : "", wind: reading.weather?.wind }}
        airports={airports}
        onHover={reading.fromMap}
      />
      <WeatherPanel bands={bands} airports={airports} onPick={reading.holdMinute} />
    </aside>
  );
}

/** Replay, bands, values of the minute read and alarms: the main column of the screen. */
function MainColumn({ bands, reading }: { bands: Bands; reading: Reading }) {
  const time = useTime();
  const unmeasured = useMemo(() => unmeasuredRows(bands.unmeasured), [bands.unmeasured]);
  const { view, cell, held, shown } = reading;
  const count = view.bands.minutes.length;
  const startOf = (c: number | null) => (c === null ? undefined : view.starts[c]);
  const heldMinute = startOf(held) ?? null;
  return (
    <div className="min-w-0">
      <ReplayBar
        replay={reading.replay}
        held={held}
        count={count}
        times={{
          now: time(bands.minutes[startOf(cell) ?? shown.from]?.at ?? ""),
          end: time(bands.minutes[shown.to]?.at ?? ""),
        }}
        onJump={reading.hold}
      />
      <EcamGrid
        view={view}
        full={bands}
        window={shown}
        zoomed={reading.zoomed}
        cell={cell}
        selection={reading.drag.selection}
        track={reading.drag.track}
        handlers={reading.drag.handlers}
        onReset={reading.reset}
      />
      <EcamLegend bands={view.bands} index={cell} pinned={reading.pinned} unmeasured={unmeasured} />
      <AlarmPanel bands={bands} heldMinute={heldMinute} onPick={reading.holdMinute} />
    </div>
  );
}

/**
 * The ECAM page of a flight (Greg, 14/11/2026, maquettes v3 and v4), on one cockpit screen:
 * STATUS, then replay, bands, values and alarms beside the MapLibre and ND maps. Everything reads
 * the same minute; a drag zooms on a stretch, beyond 120 minutes a cell is 5 minutes.
 */
export function EcamScreen({
  flight,
  points,
  bands,
}: {
  flight: FlightView;
  points: Points;
  bands: Bands;
}) {
  const reading = useEcamReading(bands, points);
  const fullScreen = useFullScreen();
  const landing = landingDetails(flight.events, points, bands);
  return (
    <section
      ref={fullScreen.screen}
      onMouseLeave={reading.leave}
      className={`rounded-panel border-[5px] border-ecam-bezel bg-ecam px-4 py-3.5 font-cockpit text-[13px] text-ecam-white shadow-[0_0_0_1px_var(--color-ecam-edge)] ${fullScreen.full ? "overflow-y-auto" : ""}`}
    >
      <ScreenHeader flight={flight} bands={bands} reading={reading} fullScreen={fullScreen} />
      <StatusBlock flight={flight} bands={bands} landing={landing} />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <MainColumn bands={bands} reading={reading} />
        <SideMaps flight={flight} bands={bands} points={points} reading={reading} />
      </div>
    </section>
  );
}
