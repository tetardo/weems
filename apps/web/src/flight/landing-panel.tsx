import type { FlightEvent } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { landingSummary } from "@weems/contrats";
import { Section } from "./section.tsx";

/** Touchdown rate, bounces, go-arounds (spec site minimal; full context from J4). */
export function LandingPanel({ events }: { events: readonly FlightEvent[] }) {
  const t = useTranslations("Flight.landing");
  const site = useTranslations("Site");
  const format = useFormatter();
  const landing = landingSummary(events);
  if (!landing) {
    return (
      <Section title={t("title")}>
        <p className="text-muted">{t("none")}</p>
      </Section>
    );
  }
  const rows: [string, string][] = [
    [
      t("vs"),
      landing.touchdownVs === null
        ? site("notMeasured")
        : `${format.number(Math.round(landing.touchdownVs))} ft/min`,
    ],
    [t("bounces"), String(landing.bounces)],
    [t("touchdowns"), String(landing.touchdowns)],
    [t("goArounds"), String(landing.goArounds)],
  ];
  return (
    <Section title={t("title")}>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd className="m-0 font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
