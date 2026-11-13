import type { FlightEvent } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { utcTime } from "../format/flight-format.ts";
import { logEntries } from "./event-log.ts";
import { useEventSentence } from "./event-sentence.ts";
import { Section } from "./section.tsx";

/** Dated events: pauses, time acceleration, slew, teleport, aircraft change, crash… */
export function EventLogTable({ events }: { events: readonly FlightEvent[] }) {
  const t = useTranslations("Flight.log");
  const text = useEventSentence();
  const entries = logEntries(events);
  return (
    <Section title={t("title")}>
      {entries.length === 0 ? (
        <p className="text-muted">{t("none")}</p>
      ) : (
        <table className="text-sm">
          <thead className="text-muted">
            <tr>
              <th className="pr-4 text-left font-normal">{t("time")}</th>
              <th className="text-left font-normal">{t("event")}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((event) => (
              <tr key={event.seq}>
                <td className="pr-4 tabular-nums">{utcTime(event.at)}</td>
                <td>{text(event)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}
