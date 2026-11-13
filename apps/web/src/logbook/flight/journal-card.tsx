import type { FlightEvent } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { utcTime } from "../../format/flight-format.ts";
import { logEntries } from "../../flight/event-log.ts";
import { useEventSentence } from "../../flight/event-sentence.ts";
import { ListIcon } from "../../ui/icons.ts";
import { LogbookCard } from "../logbook-card.tsx";

/** « Journal »: the dated events of the flight, as a timeline (UTC). */
export function JournalCard({ events }: { events: readonly FlightEvent[] }) {
  const t = useTranslations("Logbook.flight.journal");
  const text = useEventSentence();
  const entries = logEntries(events);
  return (
    <LogbookCard
      icon={ListIcon}
      title={t("title")}
      aside={t("aside", { count: entries.length })}
      className="h-full"
    >
      {entries.length === 0 ? (
        <p className="m-0 text-[13px] text-muted">{t("none")}</p>
      ) : (
        <ol className="m-0 grid list-none gap-0 p-0">
          {entries.map((event) => (
            <li key={event.seq} className="grid grid-cols-[3.2em_14px_minmax(0,1fr)] gap-x-2">
              <span className="py-1.5 text-[12.5px] text-muted tabular-nums">
                {utcTime(event.at)}
              </span>
              <span className="relative flex justify-center">
                <span className="absolute inset-y-0 w-px bg-line" />
                <span className="relative mt-2.5 size-2 rounded-full bg-accent" />
              </span>
              <span className="py-1.5 text-[13px]">{text(event)}</span>
            </li>
          ))}
        </ol>
      )}
    </LogbookCard>
  );
}
