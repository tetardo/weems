"use client";

import type { BandRow, FlightBands as Bands } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { useLayoutEffect, useRef, useState, type HTMLAttributes, type Ref } from "react";
import { colorOf } from "../../../flight/phase-colors.ts";
import { PhaseRow, TimeAxis } from "../../flights/band-parts.tsx";
import { Groups } from "../ecam-rows.tsx";
import type { Selection } from "./use-band-drag.ts";
import { linePath } from "./line-path.ts";
import { ConfigRow, MilestoneRow } from "./marker-rows.tsx";
import { PageRow } from "./page-rows.tsx";
import type { BandWindow, WindowedBands } from "./window-bands.ts";

type TrackRef = Ref<HTMLDivElement> & React.RefObject<HTMLDivElement | null>;

const columns = (count: number) => ({
  gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
});

/** The whole flight, thin, with the zoomed stretch framed in cyan. */
function Overview({ bands, window }: { bands: Bands; window: BandWindow }) {
  const t = useTranslations("Logbook.ecamPage");
  const count = bands.minutes.length;
  return (
    <>
      <span className="text-[12.5px] text-ecam-cyan">{t("overview")}</span>
      <div className="relative grid gap-px" style={columns(count)}>
        {bands.minutes.map((m) => (
          <span key={m.at} className="h-2 opacity-55" style={{ background: colorOf(m.phase) }} />
        ))}
        <span
          className="pointer-events-none absolute -inset-y-1 border border-ecam-cyan bg-ecam-cyan/10"
          style={{
            left: `${(window.from / count) * 100}%`,
            width: `${((window.to - window.from + 1) / count) * 100}%`,
          }}
        />
      </div>
      <span />
    </>
  );
}

/** Altitude over the cells, under the same reading line as the bands, on the whole flight's scale. */
function Profile({ bands, full, cell }: { bands: Bands; full: Bands; cell: number | null }) {
  const t = useTranslations("Logbook.ecamPage");
  const count = bands.minutes.length;
  const altitudes = bands.minutes.map((m) => m.values.altitude ?? null);
  const top = Math.max(1000, ...full.minutes.map((m) => m.values.altitude ?? 0));
  const x = (i: number) => ((i + 0.5) / count) * 1000;
  const y = (a: number) => 52 - (a / top) * 46;
  const line = linePath(altitudes, x, y);
  const read = cell === null ? null : altitudes[cell];
  return (
    <>
      <span className="text-[12.5px] text-ecam-cyan">{t("profile")}</span>
      <svg viewBox="0 0 1000 56" preserveAspectRatio="none" className="block h-14 w-full">
        {line && <path d={`${line} V56 H${x(0)} Z`} className="fill-ecam-green/12" />}
        {line && (
          <path
            d={line}
            className="fill-none stroke-ecam-green"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {cell !== null && read != null && (
          <circle cx={x(cell)} cy={y(read)} r={4} className="fill-ecam-yellow" />
        )}
      </svg>
      <span />
    </>
  );
}

/** Reading line and drag selection over the cells, placed from the phase row's box. */
function useOverlays(
  grid: React.RefObject<HTMLDivElement | null>,
  track: React.RefObject<HTMLDivElement | null>,
  count: number,
  read: { cell: number | null; selection: Selection | null },
) {
  const { cell, selection } = read;
  const line = useRef<HTMLDivElement>(null);
  const brush = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const outer = grid.current?.getBoundingClientRect();
    const cells = track.current?.getBoundingClientRect();
    if (!outer || !cells || count === 0) return;
    const left = (i: number) => cells.left - outer.left + (i / count) * cells.width;
    const top = cells.top - outer.top - 2;
    const height = outer.height - top - 20; // down to the time axis
    const place = (el: HTMLDivElement | null, from: number | null, width: number) => {
      if (!el) return;
      el.style.display = from === null ? "none" : "block";
      if (from === null) return;
      Object.assign(el.style, {
        left: `${left(from)}px`,
        width: `${width}px`,
        top: `${top}px`,
        height: `${height}px`,
      });
    };
    place(line.current, cell === null ? null : cell + 0.5, 2);
    place(
      brush.current,
      selection ? selection.from : null,
      selection ? ((selection.to - selection.from + 1) / count) * cells.width : 0,
    );
  });
  return { line, brush };
}

interface GridProps {
  view: WindowedBands;
  full: Bands;
  window: BandWindow;
  zoomed: boolean;
  cell: number | null;
}

/** Rows of the grid, three columns each: name, cells, range (or nothing). */
function GridRows({ view, full, window, zoomed, cell, track }: GridProps & { track: TrackRef }) {
  const t = useTranslations("Logbook.ecam");
  const [open, setOpen] = useState<BandRow | null>(null);
  const bands = view.bands;
  return (
    <>
      {zoomed && <Overview bands={full} window={window} />}
      <PhaseRow bands={bands} track={track} label={t("phase")} labelClass="text-ecam-cyan" />
      <span />
      <MilestoneRow full={full} view={view} window={window} />
      <Profile bands={bands} full={full} cell={cell} />
      <Groups
        bands={bands}
        pointer={{ hovered: cell, pinned: null }}
        renderRow={(row) => (
          <PageRow
            bands={bands}
            full={full}
            row={row}
            cell={cell}
            open={open === row}
            onToggle={() => setOpen(open === row ? null : row)}
          />
        )}
      />
      <ConfigRow full={full} view={view} window={window} />
      <TimeAxis bands={bands} tone="text-ecam-cyan" current={cell} />
      <span />
    </>
  );
}

/**
 * Bands of the ECAM page: the whole flight above when zoomed, phase and its milestones, profile,
 * the rows by group with their range, and the time axis with the minute read; one white line
 * reads across all of them.
 */
export function EcamGrid({
  selection,
  track,
  handlers,
  onReset,
  ...props
}: GridProps & {
  selection: Selection | null;
  track: TrackRef;
  handlers: HTMLAttributes<HTMLDivElement>;
  onReset: () => void;
}) {
  const grid = useRef<HTMLDivElement>(null);
  const count = props.view.bands.minutes.length;
  const overlays = useOverlays(grid, track, count, { cell: props.cell, selection });
  return (
    <div className="overflow-x-auto overflow-y-hidden">
      <div
        ref={grid}
        {...handlers}
        onDoubleClick={onReset}
        className="relative grid min-w-[640px] cursor-crosshair touch-pan-y grid-cols-[7.5em_minmax(0,1fr)_9.5em] items-center gap-y-1 select-none"
      >
        <GridRows {...props} track={track} />
        <div ref={overlays.line} className="pointer-events-none absolute bg-ecam-white/90" />
        <div
          ref={overlays.brush}
          className="pointer-events-none absolute border border-ecam-cyan bg-ecam-cyan/15"
        />
      </div>
    </div>
  );
}
