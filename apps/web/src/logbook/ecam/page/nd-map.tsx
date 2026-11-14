"use client";

import type { BandMinute, TrackView } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { useState, type PointerEvent } from "react";
import { windText } from "./station-weather.ts";
import { ND_HEIGHT, ND_WIDTH, nearestProjected, projectTrack, ringStep } from "./nd-projection.ts";

type Point = TrackView["points"][number];
type At = [number, number];
type Wind = NonNullable<BandMinute["weather"]>["wind"] | undefined;

const pathOf = (projected: readonly At[]) =>
  projected.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");

const PLANE =
  "M0,-11 L3,-2 L11,3 L11,5 L3,3 L2,9 L5,12 L5,13 L0,12 L-5,13 L-5,12 L-2,9 L-3,3 L-11,5 L-11,3 L-3,-2 Z";

/** Text kept upright when the drawing turns with the track (`turn` degrees). */
const upright = (at: At, turn: number) => `rotate(${-turn} ${at[0]} ${at[1]})`;

/** The aircraft at the minute read, along its heading, with its time and flight level. */
function Aircraft({
  at,
  point,
  label,
  turn,
}: {
  at: At;
  point: Point;
  label: string;
  turn: number;
}) {
  const [x, y] = at;
  const level = `FL${String(Math.round(point.altMsl / 100)).padStart(3, "0")}`;
  return (
    <>
      <g transform={`translate(${x},${y}) rotate(${point.heading})`}>
        <path d={PLANE} className="fill-ecam-yellow" />
      </g>
      <text
        x={x + 12}
        y={y + 18}
        transform={upright(at, turn)}
        className="fill-ecam-yellow text-[10.5px]"
      >
        {label} · {level}
      </text>
    </>
  );
}

function Airport({ at, code, turn }: { at: At | undefined; code: string | null; turn: number }) {
  if (!at || !code) return null;
  return (
    <>
      <circle
        cx={at[0]}
        cy={at[1]}
        r={4}
        className="fill-none stroke-ecam-cyan"
        strokeWidth={1.5}
      />
      <text
        x={at[0] + 7}
        y={at[1] + 4}
        transform={upright(at, turn)}
        className="fill-ecam-cyan text-[10.5px]"
      >
        {code}
      </text>
    </>
  );
}

/** Three range rings around the aircraft, their distance in NM written on them (Greg, idea 10). */
function RangeRings({
  at,
  step,
  pxPerNm,
  turn,
}: {
  at: At;
  step: number;
  pxPerNm: number;
  turn: number;
}) {
  return [1, 2, 3].map((k) => {
    const r = k * step * pxPerNm;
    const label: At = [at[0] + r * 0.71 + 2, at[1] - r * 0.71 - 2];
    return (
      <g key={k}>
        <circle
          cx={at[0]}
          cy={at[1]}
          r={r}
          className="fill-none stroke-ecam-edge"
          strokeDasharray="3 5"
        />
        <text
          x={label[0]}
          y={label[1]}
          transform={upright(label, turn)}
          className="fill-ecam-dim text-[9px]"
        >
          {k * step}
        </text>
      </g>
    );
  });
}

/** The rest of the track dashed and dimmed, the part flown up to the cursor in solid green. */
function TrackPaths({ projected, cursor }: { projected: At[]; cursor: number }) {
  return (
    <>
      <path
        d={pathOf(projected.slice(cursor < 0 ? 0 : cursor))}
        className="fill-none stroke-ecam-green/40"
        strokeWidth={1.5}
        strokeDasharray="5 4"
      />
      {cursor > 0 && (
        <path
          d={pathOf(projected.slice(0, cursor + 1))}
          className="fill-none stroke-ecam-green"
          strokeWidth={2}
        />
      )}
    </>
  );
}

/**
 * Index of the track point nearest the pointer on the drawing, within 20 screen pixels; the
 * pointer is turned back first when the drawing turns with the track.
 */
function pointUnder(
  event: PointerEvent<SVGSVGElement>,
  projected: At[],
  turn: { by: number; at: At },
) {
  const box = event.currentTarget.getBoundingClientRect();
  const scale = ND_WIDTH / box.width;
  const dx = (event.clientX - box.left) * scale - turn.at[0];
  const dy = (event.clientY - box.top) * (ND_HEIGHT / box.height) - turn.at[1];
  const r = (-turn.by * Math.PI) / 180;
  const x = turn.at[0] + dx * Math.cos(r) - dy * Math.sin(r);
  const y = turn.at[1] + dx * Math.sin(r) + dy * Math.cos(r);
  return nearestProjected(projected, x, y, 20 * scale);
}

/**
 * Ground speed and wind of the minute at the top left, as on an ND: the arrow points where the
 * wind blows, turned with the drawing; unit of the rings at the bottom left.
 */
function NdCorners({ point, wind, turn }: { point: Point | undefined; wind: Wind; turn: number }) {
  return (
    <>
      {point && (
        <text x={8} y={14} className="fill-ecam-white text-[10.5px]">
          GS {Math.round(point.gs)}
        </text>
      )}
      {wind && (
        <>
          <text x={8} y={28} className="fill-ecam-cyan text-[10.5px]">
            {windText(wind).replace(" KT", "")}
          </text>
          <g transform={`translate(${ND_WIDTH - 22} 22) rotate(${wind.dir + 180 + turn})`}>
            <path
              d="M0,10 L0,-10 M-4,-5 L0,-10 L4,-5"
              className="fill-none stroke-ecam-cyan"
              strokeWidth={1.5}
            />
          </g>
        </>
      )}
      <text x={8} y={ND_HEIGHT - 8} className="fill-ecam-dim text-[10px]">
        NM
      </text>
    </>
  );
}

/** NORTH ↑ or TRACK ↑ above the ND. */
function Orientation({ trackUp, onChange }: { trackUp: boolean; onChange: (up: boolean) => void }) {
  const t = useTranslations("Logbook.ecamPage");
  const choice = (up: boolean, text: string) => (
    <button
      type="button"
      aria-pressed={trackUp === up}
      onClick={() => onChange(up)}
      className={`ml-1 cursor-pointer border px-1.5 ${trackUp === up ? "border-ecam-cyan text-ecam-cyan" : "border-ecam-edge text-ecam-dim"}`}
    >
      {text}
    </button>
  );
  return (
    <div className="mb-1 flex items-center justify-between text-[11px] tracking-[.06em] text-ecam-cyan">
      <span>ND</span>
      <span>
        {choice(false, t("northUp"))}
        {choice(true, t("trackUp"))}
      </span>
    </div>
  );
}

/**
 * The track drawn like a navigation display (ND): no basemap, the flown part in green, the rest
 * dimmed, airports in cyan, the aircraft at the minute read, range rings in NM, north or track up
 * and the wind of the minute (Greg, 14/11/2026). Framed on `framed` (the zoomed stretch); hovering near the track reads the
 * nearest point.
 */
export function NdMap({
  points,
  framed,
  cursor,
  read,
  airports,
  onHover,
}: {
  points: readonly Point[];
  framed: readonly Point[];
  cursor: number;
  /** Time of the minute read, and its wind. */
  read: { label: string; wind: Wind };
  airports: { departure: string | null; arrival: string | null };
  onHover: (index: number) => void;
}) {
  const [trackUp, setTrackUp] = useState(false);
  const { at: projected, pxPerNm } = projectTrack(points, framed);
  const at = projected[cursor];
  const point = points[cursor];
  const turn = trackUp && point ? -point.heading : 0;
  const centre: At = at ?? [ND_WIDTH / 2, ND_HEIGHT / 2];
  return (
    <div>
      <Orientation trackUp={trackUp} onChange={setTrackUp} />
      <svg
        viewBox={`0 0 ${ND_WIDTH} ${ND_HEIGHT}`}
        onPointerMove={(event) => {
          const index = pointUnder(event, projected, { by: turn, at: centre });
          if (index !== null) onHover(index);
        }}
        className="block w-full overflow-hidden rounded-control border border-ecam-edge"
      >
        <g transform={`rotate(${turn} ${centre[0]} ${centre[1]})`}>
          {at && <RangeRings at={at} step={ringStep(pxPerNm)} pxPerNm={pxPerNm} turn={turn} />}
          <TrackPaths projected={projected} cursor={cursor} />
          <Airport at={projected[0]} code={airports.departure} turn={turn} />
          <Airport at={projected.at(-1)} code={airports.arrival} turn={turn} />
          {at && point && <Aircraft at={at} point={point} label={read.label} turn={turn} />}
        </g>
        <NdCorners point={point} wind={read.wind} turn={turn} />
      </svg>
    </div>
  );
}
