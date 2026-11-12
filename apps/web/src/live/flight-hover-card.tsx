import type { LiveFlight } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { ClickIcon } from "../ui/icons.ts";
import type { Airports } from "./airport-book.ts";
import { CARD_WIDTH, cardPosition, type MapPoint } from "./card-position.ts";
import { FlightFacts } from "./flight-facts.tsx";
import { PilotLine } from "./pilot-line.tsx";

/**
 * Card shown while the mouse is over an aircraft (spec J4, carte en direct): who flies and the
 * flight at a glance. The click follows the flight (variant B chosen by Greg on 12/11/2026).
 * Not shown on touch screens, where a tap opens the panel directly.
 */
export function FlightHoverCard({
  flight,
  airports,
  point,
  mapWidth,
}: {
  flight: LiveFlight;
  airports: Airports;
  point: MapPoint;
  mapWidth: number;
}) {
  const t = useTranslations("Live");
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 rounded-panel border border-line bg-surface px-3.5 pt-3 pb-2.5 shadow-[0_14px_36px_rgb(0_0_0/.25)]"
      style={{ ...cardPosition(point, mapWidth), width: CARD_WIDTH }}
    >
      <PilotLine pilot={flight.pilot} />
      <div className="-mx-3.5 my-2.5 h-px bg-line" />
      <FlightFacts flight={flight} airports={airports} />
      <p className="mt-2.5 flex items-center gap-1.5 text-[12.5px] text-muted">
        <ClickIcon size={15} aria-hidden="true" />
        {t.rich("hoverHint", { strong: (text) => <strong className="text-accent">{text}</strong> })}
      </p>
    </div>
  );
}
