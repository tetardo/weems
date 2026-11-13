import type { AircraftCategory, LogbookStats } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { CATEGORY_FILL } from "../../aircraft/category-tone.ts";
import { formatDuration } from "../../format/flight-format.ts";
import { AircraftIcon, ArrivalIcon, RoutesIcon } from "../../ui/icons.ts";
import { LogbookCard } from "../logbook-card.tsx";
import { TouchdownValue } from "../touchdown-value.tsx";
import { MeterRow } from "./meter-row.tsx";
import { StatsThemeSection } from "./stats-theme.tsx";
import { useCategoryName } from "./use-category-name.ts";

const fillOf = (category: AircraftCategory | null) =>
  category ? CATEGORY_FILL[category] : "bg-muted";

function Empty() {
  const t = useTranslations("Logbook.stats");
  return <p className="m-0 text-[13px] text-muted">{t("empty")}</p>;
}

function CategoriesCard({ categories }: Pick<LogbookStats, "categories">) {
  const t = useTranslations("Logbook.stats.fleet");
  const name = useCategoryName();
  const max = Math.max(1, ...categories.map((c) => c.airborneS));
  return (
    <LogbookCard icon={AircraftIcon} title={t("categories")}>
      {categories.length === 0 && <Empty />}
      <ul className="m-0 list-none p-0">
        {categories.map((c) => (
          <MeterRow
            key={c.category ?? "none"}
            label={name(c.category)}
            value={formatDuration(c.airborneS) ?? "—"}
            ratio={c.airborneS / max}
            fill={fillOf(c.category)}
          />
        ))}
      </ul>
    </LogbookCard>
  );
}

function AircraftCard({ aircraft }: Pick<LogbookStats, "aircraft">) {
  const t = useTranslations("Logbook.stats.fleet");
  return (
    <LogbookCard icon={AircraftIcon} title={t("aircraft")}>
      {aircraft.length === 0 ? (
        <Empty />
      ) : (
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="text-left text-[12px] text-muted">
              <th className="pb-1.5 font-normal">{t("aircraftName")}</th>
              <th className="pb-1.5 font-normal">{t("flights")}</th>
              <th className="pb-1.5 text-right font-normal">{t("hours")}</th>
            </tr>
          </thead>
          <tbody>
            {aircraft.map((a) => (
              <tr key={a.name} className="border-t border-line">
                <td className="max-w-0 truncate py-1.5 pr-2">
                  <i className={`mr-2 inline-block size-2 rounded-full ${fillOf(a.category)}`} />
                  {a.name}
                </td>
                <td className="py-1.5 tabular-nums">{a.flights}</td>
                <td className="py-1.5 text-right tabular-nums">{formatDuration(a.airborneS)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </LogbookCard>
  );
}

function AirportsCard({ airports }: Pick<LogbookStats, "airports">) {
  const t = useTranslations("Logbook.stats.fleet");
  const max = Math.max(1, ...airports.map((a) => a.visits));
  return (
    <LogbookCard icon={ArrivalIcon} title={t("airports")}>
      {airports.length === 0 && <Empty />}
      <ul className="m-0 list-none p-0">
        {airports.map((a) => (
          <MeterRow
            key={a.icao}
            label={
              <span title={a.name ?? undefined}>
                <b className="font-semibold">{a.icao}</b>{" "}
                <span className="text-muted">{a.name}</span>
              </span>
            }
            value={String(a.visits)}
            ratio={a.visits / max}
          />
        ))}
      </ul>
    </LogbookCard>
  );
}

function RoutesCard({ routes }: Pick<LogbookStats, "routes">) {
  const t = useTranslations("Logbook.stats.fleet");
  return (
    <LogbookCard icon={RoutesIcon} title={t("routes")} aside={t("routesAside")}>
      {routes.length === 0 && <Empty />}
      <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {routes.map((r) => (
          <li key={r.airports.join()} className="rounded-box border border-line px-3 py-2.5">
            <b className="block font-semibold">{r.airports.join(" ⇄ ")}</b>
            <span className="block text-[12.5px] text-muted">
              {t("routeLine", { count: r.flights, time: formatDuration(r.blockS) ?? "—" })}
            </span>
            {r.touchdownAverage !== null && (
              <TouchdownValue vs={r.touchdownAverage} className="text-[15px]" />
            )}
          </li>
        ))}
      </ul>
    </LogbookCard>
  );
}

/** Theme Avions et routes: categories, aircraft, airports, then the favourite routes. */
export function FleetTheme({ stats }: { stats: LogbookStats }) {
  return (
    <StatsThemeSection id="fleet">
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <CategoriesCard categories={stats.categories} />
        <AircraftCard aircraft={stats.aircraft} />
        <AirportsCard airports={stats.airports} />
      </div>
      <RoutesCard routes={stats.routes} />
    </StatsThemeSection>
  );
}
