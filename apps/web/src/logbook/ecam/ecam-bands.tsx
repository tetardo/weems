"use client";

import type { BandRow, FlightBands as Bands } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { Fragment, useEffect, useMemo, useState } from "react";
import { PhaseRow, TimeAxis } from "../flights/band-parts.tsx";
import { BAND_GROUPS } from "../flights/band-rows.ts";
import { bandCells, type Cell } from "../flights/band-scale.ts";
import { useBandPointer } from "../flights/use-band-pointer.ts";
import { EcamLegend } from "./ecam-legend.tsx";
import { unmeasuredRows } from "./ecam-values.ts";

/** Cockpit colours: green values, cyan climbing, white descending. */
const SHADES: Record<Cell["tone"], readonly string[]> = {
  value: [
    "bg-ecam-off",
    "bg-ecam-green/25",
    "bg-ecam-green/45",
    "bg-ecam-green/70",
    "bg-ecam-green",
  ],
  climb: ["bg-ecam-off", "bg-ecam-cyan/30", "bg-ecam-cyan/50", "bg-ecam-cyan/75", "bg-ecam-cyan"],
  descent: [
    "bg-ecam-off",
    "bg-ecam-white/30",
    "bg-ecam-white/50",
    "bg-ecam-white/75",
    "bg-ecam-white",
  ],
};

interface Pointer {
  hovered: number | null;
  pinned: number | null;
}

function cellClass(cell: Cell | null, marked: boolean, i: number, pointer: Pointer) {
  const shade = cell ? (SHADES[cell.tone][cell.level] ?? "") : "bg-transparent";
  // White for the minute read, held or hovered (cyan would vanish on the climbing cells).
  const read = (pointer.pinned ?? pointer.hovered) === i;
  const outline = read
    ? "outline-2 outline-ecam-white"
    : marked
      ? "outline-1 outline-ecam-amber"
      : "";
  return `h-3 rounded-[1px] ${shade} ${outline}`;
}

/** One row: abbreviation (full name on hover), then one cell per minute. */
function Row({ bands, row, pointer }: { bands: Bands; row: BandRow; pointer: Pointer }) {
  const rows = useTranslations("Logbook.bands.rows");
  const short = useTranslations("Logbook.bands.shortRows");
  const marks = bands.marks ?? [];
  return (
    <>
      <abbr title={rows(row)} className="cursor-help truncate pr-2 text-[12.5px] no-underline">
        {short(row)}
      </abbr>
      <div
        className="grid gap-px"
        style={{ gridTemplateColumns: `repeat(${bands.minutes.length}, minmax(0, 1fr))` }}
      >
        {bandCells(bands.minutes, row).map((cell, i) => (
          <span
            key={i}
            className={cellClass(
              cell,
              marks.some((m) => m.row === row && i >= m.from && i <= m.to),
              i,
              pointer,
            )}
          />
        ))}
      </div>
    </>
  );
}

/** A clicked minute stays read; ← → move it by one minute, Escape lets it go. */
function usePinnedMinute(count: number) {
  const [pinned, setPinned] = useState<number | null>(null);
  const held = pinned !== null;
  useEffect(() => {
    if (!held) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPinned(null);
      else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const step = event.key === "ArrowLeft" ? -1 : 1;
        setPinned((i) => (i === null ? i : Math.min(count - 1, Math.max(0, i + step))));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [held, count]);
  const toggle = (i: number) => setPinned((current) => (current === i ? null : i));
  return [pinned, toggle] as const;
}

/** The rows by group (TRAJ, CMD, FEUX / CAB), groups without any value left out. */
function Groups({ bands, pointer }: { bands: Bands; pointer: Pointer }) {
  const groups = useTranslations("Logbook.ecam.groups");
  return BAND_GROUPS.map(({ key, rows }) => {
    const shown = rows.filter((row) => bands.rows.includes(row));
    if (shown.length === 0) return null;
    return (
      <Fragment key={key}>
        <span className="col-span-full mt-2 text-[11.5px] tracking-[.08em] text-ecam-cyan">
          <span className="border-b border-ecam-cyan">{groups(key)}</span>
        </span>
        {shown.map((row) => (
          <Row key={row} bands={bands} row={row} pointer={pointer} />
        ))}
      </Fragment>
    );
  });
}

/**
 * The flight bands on a cockpit screen (ECAM look, Greg 14/11/2026), shown above the classic
 * bands to compare them: always black, B612 Mono, abbreviations, and the values of the minute read
 * below in a frame that never changes size. Hover reads a minute, a click holds it.
 */
export function EcamBands({ bands }: { bands: Bands }) {
  const t = useTranslations("Logbook.ecam");
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned, togglePin] = usePinnedMinute(bands.minutes.length);
  const unmeasured = useMemo(() => unmeasuredRows(bands.unmeasured), [bands.unmeasured]);
  const pointer: Pointer = { hovered, pinned };
  const reader = useBandPointer(bands.minutes.length, setHovered, togglePin);
  return (
    <section
      aria-label={t("label")}
      onMouseLeave={() => setHovered(null)}
      className="rounded-panel border-[5px] border-ecam-bezel bg-ecam px-4 py-3.5 font-cockpit text-ecam-white shadow-[0_0_0_1px_var(--color-ecam-edge)]"
    >
      <h3 className="m-0 mb-3 inline-block border-b border-ecam-white text-[14px] font-bold tracking-[.08em]">
        {t("title")}
      </h3>
      <div className="overflow-x-auto overflow-y-hidden">
        <div
          {...reader.handlers}
          className="grid min-w-[560px] cursor-pointer touch-pan-y grid-cols-[7.5em_minmax(0,1fr)] items-center gap-y-1"
        >
          <PhaseRow
            bands={bands}
            track={reader.track}
            label={t("phase")}
            labelClass="text-ecam-cyan"
          />
          <Groups bands={bands} pointer={pointer} />
          <TimeAxis bands={bands} tone="text-ecam-cyan" />
        </div>
      </div>
      <EcamLegend
        bands={bands}
        index={pinned ?? hovered}
        pinned={pinned !== null}
        unmeasured={unmeasured}
      />
    </section>
  );
}
