"use client";

import type { FlightBands as Bands } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { PhaseRow, TimeAxis } from "../flights/band-parts.tsx";
import { useBandPointer } from "../flights/use-band-pointer.ts";
import { EcamLegend } from "./ecam-legend.tsx";
import { Groups, type Pointer } from "./ecam-rows.tsx";
import { unmeasuredRows } from "./ecam-values.ts";
import { usePinnedMinute } from "./use-pinned-minute.ts";

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
