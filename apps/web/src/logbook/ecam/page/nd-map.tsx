"use client";

import type { TrackView } from "@weems/contrats";
import type { PointerEvent } from "react";
import { ND_HEIGHT, ND_WIDTH, nearestProjected, projectTrack } from "./nd-projection.ts";

type Point = TrackView["points"][number];

const pathOf = (projected: readonly [number, number][]) =>
  projected.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");

const PLANE =
  "M0,-11 L3,-2 L11,3 L11,5 L3,3 L2,9 L5,12 L5,13 L0,12 L-5,13 L-5,12 L-2,9 L-3,3 L-11,5 L-11,3 L-3,-2 Z";

/** The aircraft at the minute read, along its heading, with its time and flight level. */
function Aircraft({ at, point, label }: { at: [number, number]; point: Point; label: string }) {
  const [x, y] = at;
  const level = `FL${String(Math.round(point.altMsl / 100)).padStart(3, "0")}`;
  return (
    <>
      <g transform={`translate(${x},${y}) rotate(${point.heading})`}>
        <path d={PLANE} className="fill-ecam-yellow" />
      </g>
      <text x={x + 16} y={y + 22} className="fill-ecam-yellow text-[12px]">
        {label} · {level}
      </text>
    </>
  );
}

function Airport({ at, code }: { at: [number, number] | undefined; code: string | null }) {
  if (!at || !code) return null;
  return (
    <>
      <circle
        cx={at[0]}
        cy={at[1]}
        r={5}
        className="fill-none stroke-ecam-cyan"
        strokeWidth={1.5}
      />
      <text x={at[0] + 9} y={at[1] + 4} className="fill-ecam-cyan text-[12px]">
        {code}
      </text>
    </>
  );
}

/** Range rings around the aircraft, as on the ND. */
function RangeRings({ at }: { at: [number, number] }) {
  return [70, 140, 210].map((r) => (
    <circle
      key={r}
      cx={at[0]}
      cy={at[1]}
      r={r}
      className="fill-none stroke-ecam-edge"
      strokeDasharray="3 5"
    />
  ));
}

/** The rest of the track dashed and dimmed, the part flown up to the cursor in solid green. */
function TrackPaths({ projected, cursor }: { projected: [number, number][]; cursor: number }) {
  return (
    <>
      <path
        d={pathOf(projected.slice(cursor < 0 ? 0 : cursor))}
        className="fill-none stroke-ecam-green/40"
        strokeWidth={2}
        strokeDasharray="6 5"
      />
      {cursor > 0 && (
        <path
          d={pathOf(projected.slice(0, cursor + 1))}
          className="fill-none stroke-ecam-green"
          strokeWidth={2.5}
        />
      )}
    </>
  );
}

/** Index of the track point nearest the pointer on the drawing, within 30 screen pixels. */
function pointUnder(event: PointerEvent<SVGSVGElement>, projected: [number, number][]) {
  const box = event.currentTarget.getBoundingClientRect();
  const scale = ND_WIDTH / box.width;
  const x = (event.clientX - box.left) * scale;
  const y = (event.clientY - box.top) * (ND_HEIGHT / box.height);
  return nearestProjected(projected, x, y, 30 * scale);
}

/**
 * The track drawn like a navigation display (ND): no basemap, the flown part in green, the rest
 * dimmed, airports in cyan, the aircraft at the minute read (Greg, 14/11/2026). Framed on
 * `framed` (the zoomed stretch); hovering near the track reads the nearest point.
 */
export function NdMap({
  points,
  framed,
  cursor,
  label,
  departure,
  arrival,
  onHover,
}: {
  points: readonly Point[];
  framed: readonly Point[];
  cursor: number;
  label: string;
  departure: string | null;
  arrival: string | null;
  onHover: (index: number) => void;
}) {
  const projected = projectTrack(points, framed);
  const at = projected[cursor];
  const point = points[cursor];
  return (
    <svg
      viewBox={`0 0 ${ND_WIDTH} ${ND_HEIGHT}`}
      onPointerMove={(event) => {
        const index = pointUnder(event, projected);
        if (index !== null) onHover(index);
      }}
      className="mb-2.5 block h-[240px] w-full rounded-control border border-ecam-edge"
    >
      {at && <RangeRings at={at} />}
      <TrackPaths projected={projected} cursor={cursor} />
      <Airport at={projected[0]} code={departure} />
      <Airport at={projected.at(-1)} code={arrival} />
      {at && point && <Aircraft at={at} point={point} label={label} />}
      <text x={10} y={18} className="fill-ecam-dim text-[12px]">
        N ↑
      </text>
    </svg>
  );
}
