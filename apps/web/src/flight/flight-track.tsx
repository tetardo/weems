"use client";

import type { TrackView } from "@weems/contrats";
import { useState } from "react";
import { PointDetails } from "./point-details.tsx";
import { TrackMap } from "./track-map.tsx";
import { VerticalProfile } from "./vertical-profile.tsx";

/** Map and profile share the selected point: hovering one shows it on the other. */
export function FlightTrack({ track }: { track: TrackView }) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <TrackMap points={track.points} selected={selected} onSelect={setSelected} />
      <PointDetails point={selected === null ? undefined : track.points[selected]} />
      <VerticalProfile points={track.points} selected={selected} onSelect={setSelected} />
    </div>
  );
}
