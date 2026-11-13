import type { FlightEvent, FlightPhase } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { formatDuration } from "../format/flight-format.ts";
import { colorOf } from "../flight/phase-colors.ts";
import { LogbookCard } from "../logbook/logbook-card.tsx";
import { PhasesIcon } from "../ui/icons.ts";
import { phaseSteps } from "./phase-steps.ts";

/** Hours and minutes in UTC. */
function useUtcTime() {
  const format = useFormatter();
  return (ms: number) =>
    format.dateTime(new Date(ms), { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

/** Estimated arrival and time left, at the current ground speed. */
function EtaBox({
  etaMs,
  remainingMinutes,
}: {
  etaMs: number | null;
  remainingMinutes: number | null;
}) {
  const t = useTranslations("LiveFlight.sections");
  const time = useUtcTime();
  return (
    <dl className="mt-auto grid grid-cols-2 gap-2 rounded-box border border-line px-3 py-2.5">
      <div>
        <dt className="text-[11px] text-muted">{t("eta")}</dt>
        <dd className="m-0 font-title text-[16px] font-bold">
          {etaMs === null ? "—" : `~${time(etaMs)} UTC`}
        </dd>
      </div>
      <div>
        <dt className="text-[11px] text-muted">{t("etaIn")}</dt>
        <dd className="m-0 font-title text-[16px] font-bold">
          {remainingMinutes === null ? "—" : `~${formatDuration(remainingMinutes * 60)}`}
        </dd>
      </div>
    </dl>
  );
}

/**
 * « Phases »: those flown with their start (UTC), the current one highlighted, those left greyed;
 * then the estimated arrival and the time left at the current ground speed.
 */
export function LivePhases({
  events,
  current,
  etaMs,
  remainingMinutes,
}: {
  events: readonly FlightEvent[];
  current: FlightPhase;
  etaMs: number | null;
  remainingMinutes: number | null;
}) {
  const t = useTranslations("LiveFlight.sections");
  const phases = useTranslations("Phases");
  const time = useUtcTime();
  const steps = phaseSteps(events, current);
  const done = steps.filter((s) => s.state !== "next").length - 1;
  return (
    <LogbookCard
      icon={PhasesIcon}
      title={t("phases")}
      aside={t("phasesAside", { done, total: steps.length })}
      className="flex flex-col"
    >
      <ol className="m-0 grid list-none gap-0.5 p-0 text-[13px]">
        {steps.map((step, i) => (
          <li
            key={`${step.phase}-${i}`}
            className={`grid grid-cols-[12px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-box px-2 py-1 ${step.state === "now" ? "bg-accent/12 font-semibold text-link" : ""} ${step.state === "next" ? "text-muted" : ""}`}
          >
            <span
              className={`size-2.5 rounded-full ${step.state === "next" ? "border-2 border-line" : ""}`}
              style={step.state === "next" ? undefined : { background: colorOf(step.phase) }}
            />
            <span>{phases(step.phase)}</span>
            <span className="text-[12px] tabular-nums">
              {step.startAt ? time(Date.parse(step.startAt)) : ""}
            </span>
          </li>
        ))}
      </ol>
      <EtaBox etaMs={etaMs} remainingMinutes={remainingMinutes} />
    </LogbookCard>
  );
}
