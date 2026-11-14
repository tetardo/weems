"use client";

import type { FlightBands as Bands } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { configChanges } from "./config-changes.ts";
import { markerLanes } from "./marker-lanes.ts";
import { MILESTONE_CODES, milestones } from "./row-facts.ts";
import { cellOfMinute, type BandWindow, type WindowedBands } from "./window-bands.ts";

interface Marker {
  key: string;
  minute: number;
  text: string;
  title?: string;
  tone: string;
}

interface Placing {
  full: Bands;
  view: WindowedBands;
  window: BandWindow;
}

/** Labels at their minute over the cells, on two lines when `stagger` (they may be close). */
function Markers({
  label,
  markers,
  view,
  window,
  stagger,
}: Placing & { label: string; markers: Marker[]; stagger: boolean }) {
  const count = view.bands.minutes.length;
  const cells = markers.flatMap((m) => {
    const cell = cellOfMinute(view, window, m.minute);
    return cell === null ? [] : [{ ...m, cell }];
  });
  const lanes = stagger ? markerLanes(cells, count) : cells.map(() => 0);
  const placed = cells.map((m, i) => ({
    ...m,
    left: ((m.cell + 0.5) / count) * 100,
    lane: lanes[i] ?? 0,
  }));
  const height = (Math.max(0, ...lanes) + 1) * 14 + 2;
  return (
    <>
      <span className="text-[12.5px] text-ecam-cyan">{label}</span>
      <div className="relative" style={{ height }}>
        {placed.map((m) => (
          <span
            key={m.key}
            title={m.title}
            style={{ left: `${m.left}%`, top: m.lane * 14 }}
            className={`absolute border-l pl-0.5 text-[10.5px] leading-4 whitespace-nowrap ${m.tone}`}
          >
            {m.text}
          </span>
        ))}
      </div>
      <span />
    </>
  );
}

/** Takeoff, top of climb, top of descent and touchdown, under the phase row (Greg, idea 2). */
export function MilestoneRow(props: Placing) {
  const t = useTranslations("Logbook.ecamPage.milestones");
  const markers = milestones(props.full.minutes).map(({ key, minute }) => ({
    key,
    minute,
    text: MILESTONE_CODES[key],
    title: t(key),
    tone: "border-ecam-white/60 text-ecam-white",
  }));
  return <Markers {...props} label="" markers={markers} stagger={false} />;
}

/** Gear, flaps and autopilot changes above the time axis, AP OFF in amber (Greg, idea 9). */
export function ConfigRow(props: Placing) {
  const markers = configChanges(props.full.minutes).map((c, i) => ({
    key: `${c.code}-${i}`,
    minute: c.minute,
    text: c.code,
    tone: c.amber ? "border-ecam-amber text-ecam-amber" : "border-ecam-cyan text-ecam-cyan",
  }));
  if (markers.length === 0) return null;
  return <Markers {...props} label="CONFIG" markers={markers} stagger />;
}
