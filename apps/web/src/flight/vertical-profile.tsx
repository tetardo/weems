"use client";

import { useFormatter, useTranslations } from "next-intl";
import { type MouseEvent, useMemo } from "react";
import { colorOf } from "./phase-colors.ts";
import {
  nearestIndex,
  type Profile,
  type ProfilePoint,
  profileGeometry,
} from "./profile-geometry.ts";

interface Props {
  points: readonly ProfilePoint[];
  selected: number | null;
  onSelect: (index: number | null) => void;
}

/** Drawing units; the SVG stretches to the page width. */
const SIZE = { width: 1000, height: 200 };
/** Theme colours (global.css): the lines stay readable in the dark and the light theme. */
const ALTITUDE_COLOR = "var(--color-ink)";
const SPEED_COLOR = "var(--color-accent-2)";

/** Phase bands, speed and altitude lines, and the selected time. */
function ProfileDrawing({ profile, cursorX }: { profile: Profile; cursorX: number | null }) {
  return (
    <>
      {profile.bands.map((band) => (
        <rect
          key={band.x}
          x={band.x}
          width={band.width}
          height={SIZE.height}
          fill={colorOf(band.phase)}
          opacity={0.22}
        />
      ))}
      <path
        d={profile.speedPath}
        fill="none"
        style={{ stroke: SPEED_COLOR }}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={profile.altitudePath}
        fill="none"
        style={{ stroke: ALTITUDE_COLOR }}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
      {cursorX !== null && (
        <line
          x1={cursorX}
          x2={cursorX}
          y1={0}
          y2={SIZE.height}
          style={{ stroke: ALTITUDE_COLOR }}
          strokeDasharray="4 3"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </>
  );
}

/** Altitude and ground speed against time, phases behind (spec site minimal, profile). */
export function VerticalProfile({ points, selected, onSelect }: Props) {
  const t = useTranslations("Flight.profile");
  const format = useFormatter();
  const profile = useMemo(() => profileGeometry(points, SIZE), [points]);
  if (!profile) return null;

  const pick = (event: MouseEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    onSelect(nearestIndex(profile.xs, ((event.clientX - box.left) / box.width) * SIZE.width));
  };
  const cursorX = selected === null ? null : profile.xs[selected];

  return (
    <figure className="m-0">
      <figcaption className="mb-1 flex justify-between text-xs">
        <span style={{ color: ALTITUDE_COLOR }}>
          {t("altitude")} · max {format.number(profile.maxAltitude)}
        </span>
        <span style={{ color: SPEED_COLOR }}>
          {t("speed")} · max {format.number(profile.maxSpeed)}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${SIZE.width} ${SIZE.height}`}
        preserveAspectRatio="none"
        className="h-48 w-full cursor-crosshair rounded-control border border-line bg-bg"
        onMouseMove={pick}
        onClick={pick}
        onMouseLeave={() => onSelect(null)}
        role="img"
        aria-label={t("title")}
      >
        <ProfileDrawing profile={profile} cursorX={cursorX ?? null} />
      </svg>
    </figure>
  );
}
