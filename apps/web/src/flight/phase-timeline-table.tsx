import type { FlightView } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { formatDuration, utcTime } from "../format/flight-format.ts";
import { PHASE_COLORS } from "./phase-colors.ts";
import { phaseTimeline } from "./phase-timeline.ts";
import { Section } from "./section.tsx";

/** The phases with their start and duration (spec site minimal, timeline). */
export function PhaseTimelineTable({ flight }: { flight: FlightView }) {
  const t = useTranslations("Flight.phases");
  const phases = useTranslations("Phases");
  const spans = phaseTimeline(flight.events, flight.closedAt);
  return (
    <Section title={t("title")}>
      {spans.length === 0 ? (
        <p className="text-muted">{t("none")}</p>
      ) : (
        <table className="text-sm">
          <thead className="text-muted">
            <tr>
              <th />
              <th className="px-2 text-left font-normal">{t("start")}</th>
              <th className="px-2 text-right font-normal">{t("duration")}</th>
            </tr>
          </thead>
          <tbody>
            {spans.map((span) => (
              <tr key={`${span.phase}-${span.startAt}`}>
                <td className="flex items-center gap-2 py-0.5 pr-2">
                  <span
                    className="inline-block size-3 rounded-sm"
                    style={{ background: PHASE_COLORS[span.phase] }}
                  />
                  {phases(span.phase)}
                </td>
                <td className="px-2 tabular-nums">{utcTime(span.startAt)}</td>
                <td className="px-2 text-right tabular-nums">
                  {formatDuration(span.durationS) ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}
