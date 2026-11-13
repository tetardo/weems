"use client";

import type { TrackView } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { PointDetails } from "../../flight/point-details.tsx";
import { TrackMap } from "../../flight/track-map.tsx";
import { VerticalProfile } from "../../flight/vertical-profile.tsx";
import { RoutesIcon, StatsIcon } from "../../ui/icons.ts";
import { LogbookCard } from "../logbook-card.tsx";

/**
 * « Vue d'ensemble »: the map beside the phases, filling its whole box (Greg, 13/11), then the
 * altitude and speed profile; hovering the map or the profile shows the point on both.
 */
export function FlightOverview({
  points,
  phases,
}: {
  points: TrackView["points"];
  /** The phases card, drawn on the server. */
  phases: ReactNode;
}) {
  const t = useTranslations("Logbook.flight");
  const [selected, setSelected] = useState<number | null>(null);
  const drawn = points.length > 1;
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <LogbookCard icon={RoutesIcon} title={t("map")} className="flex flex-col">
          {drawn ? (
            <>
              <TrackMap
                points={points}
                selected={selected}
                onSelect={setSelected}
                className="min-h-80 flex-1"
              />
              <div className="mt-2">
                <PointDetails point={selected === null ? undefined : points[selected]} />
              </div>
            </>
          ) : (
            <p className="m-0 text-[13px] text-muted">{t("noTrack")}</p>
          )}
        </LogbookCard>
        {phases}
      </div>
      {drawn && (
        <LogbookCard icon={StatsIcon} title={t("profile")} aside={t("profileAside")}>
          <VerticalProfile points={points} selected={selected} onSelect={setSelected} />
        </LogbookCard>
      )}
    </>
  );
}
