"use client";

import type { LiveEvent } from "@weems/contrats";
import { useFormatter, useNow, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { AccountIcon, ArrivalIcon, DepartureIcon } from "../ui/icons.ts";
import type { LiveEvents } from "./events-store.ts";

const ICONS = { takeoff: DepartureIcon, landing: ArrivalIcon, started: AccountIcon } as const;

/** The sentence of an event: « WMS140 a atterri à LFMN · −142 ft/min ». */
function EventText({ event }: { event: LiveEvent }) {
  const t = useTranslations("Live.events");
  const format = useFormatter();
  const strong = (text: ReactNode) => <strong className="font-title">{text}</strong>;
  if (event.kind === "started") {
    const from = event.airportIcao ?? "none";
    return t.rich("started", {
      name: event.pilot?.name ?? event.callsign,
      from,
      to: event.arrivalIcao ?? "····",
      strong,
    });
  }
  const sentence = t.rich(event.kind, {
    callsign: event.callsign,
    airport: event.airportIcao ?? "none",
    strong,
  });
  if (event.touchdownVs === null) return sentence;
  const vs = format.number(Math.round(event.touchdownVs));
  return (
    <>
      {sentence} · <strong className="text-accent">{t("vs", { vs })}</strong>
    </>
  );
}

/** « Derniers événements » (idea 6): take-offs, landings, starts of public pilots; newest first. */
export function LiveEventsPanel({ events }: { events: LiveEvents }) {
  const t = useTranslations("Live.events");
  const format = useFormatter();
  const now = useNow({ updateInterval: 30_000 });
  if (events.length === 0) return null;
  return (
    <section className="w-90 rounded-panel border border-line bg-surface px-4 py-3 shadow-[0_14px_36px_rgb(0_0_0/.18)]">
      <h2 className="m-0 text-[12px] font-bold tracking-[0.12em] text-accent-2 uppercase">
        {t("title")}
      </h2>
      <ul className="mt-1">
        {events.slice(0, 4).map((event) => {
          const Icon = ICONS[event.kind];
          return (
            <li
              key={`${event.flightId}-${event.kind}-${event.at}`}
              className="flex gap-2.5 border-t border-line py-2 text-sm first:border-t-0"
            >
              <Icon size={17} aria-hidden="true" className="mt-0.5 flex-none text-accent" />
              <span className="flex-1">
                <EventText event={event} />
              </span>
              <time dateTime={event.at} className="text-[12px] whitespace-nowrap text-muted">
                {format.relativeTime(new Date(event.at), now)}
              </time>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
