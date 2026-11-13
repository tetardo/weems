import type { FlightView } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { formatDuration, utcTime } from "../../format/flight-format.ts";
import { PHASE_COLORS } from "../../flight/phase-colors.ts";
import { type PhaseSpan, phaseTimeline } from "../../flight/phase-timeline.ts";
import { PhasesIcon } from "../../ui/icons.ts";
import { LogbookCard } from "../logbook-card.tsx";

/** The phases side by side, each as wide as it lasted. */
function PhaseRibbon({ spans }: { spans: readonly PhaseSpan[] }) {
  const phases = useTranslations("Phases");
  const timed = spans.filter((s) => (s.durationS ?? 0) > 0);
  return (
    <div className="mb-3 flex h-6 overflow-hidden rounded-inner" aria-hidden="true">
      {timed.map((span) => (
        <div
          key={`${span.phase}-${span.startAt}`}
          title={phases(span.phase)}
          className="min-w-[3px] border-r border-surface last:border-r-0"
          style={{ flexGrow: span.durationS ?? 0, background: PHASE_COLORS[span.phase] }}
        />
      ))}
    </div>
  );
}

/** « Phases »: ribbon, then each phase with its start (UTC) and duration. */
export function PhasesCard({ flight }: { flight: FlightView }) {
  const t = useTranslations("Logbook.flight");
  const phases = useTranslations("Phases");
  const spans = phaseTimeline(flight.events, flight.closedAt);
  return (
    <LogbookCard
      icon={PhasesIcon}
      title={t("phases")}
      aside={spans.length > 0 && t("phasesAside", { count: spans.length })}
    >
      {spans.length === 0 ? (
        <p className="m-0 text-[13px] text-muted">{t("noPhases")}</p>
      ) : (
        <>
          <PhaseRibbon spans={spans} />
          <table className="w-full text-[13px]">
            <tbody>
              {spans.map((span) => (
                <tr
                  key={`${span.phase}-${span.startAt}`}
                  className="border-b border-line last:border-0"
                >
                  <td className="py-1.5">
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2.5 flex-none rounded-[2px]"
                        style={{ background: PHASE_COLORS[span.phase] }}
                      />
                      {phases(span.phase)}
                    </span>
                  </td>
                  <td className="py-1.5 text-right text-muted tabular-nums">
                    {utcTime(span.startAt)}
                  </td>
                  <td className="py-1.5 pl-3 text-right tabular-nums">
                    {formatDuration(span.durationS) ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </LogbookCard>
  );
}
