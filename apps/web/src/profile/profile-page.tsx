import type { PilotRoutes, PublicFlightList, PublicPilot } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { CardBox } from "../ui/card-box.tsx";
import { FlightsIcon, MapIcon, StatsIcon } from "../ui/icons.ts";
import { InfoTip } from "../ui/info-tip.tsx";
import { SectionMain } from "../ui/section-main.tsx";
import { SectionTitle } from "../ui/section-title.tsx";
import { ProfileCharts } from "./profile-charts.tsx";
import { ProfileHeader } from "./profile-header.tsx";
import { PublicFlights } from "./public-flights.tsx";
import { RoutesMap } from "./routes-map.tsx";
import { StatTiles } from "./stat-tiles.tsx";

const Note = ({ children }: { children: string }) => (
  <span className="text-sm text-muted">{children}</span>
);

/**
 * A public pilot profile (spec J4), in the order validated on the mock-up: header, map of the
 * flights, statistics (charts then tiles), flights. Companies (lot 3), experience by category
 * and medals come later: no empty block until then.
 */
export function ProfilePage({
  pilot,
  routes,
  flights,
  cursor,
}: {
  pilot: PublicPilot;
  routes: PilotRoutes;
  flights: PublicFlightList;
  cursor: string | undefined;
}) {
  const t = useTranslations("Profile");
  const help = useTranslations("Profile.help");
  return (
    <SectionMain>
      <ProfileHeader pilot={pilot} />
      <SectionTitle icon={MapIcon} title={t("map.title")}>
        <Note>
          {t("map.note", { airports: pilot.stats.airports, flights: pilot.stats.flights })}
        </Note>
      </SectionTitle>
      {routes.routes.length > 0 ? (
        <div className="relative">
          <RoutesMap routes={routes.routes} />
          <InfoTip text={help("map")} label={help("label")} />
        </div>
      ) : (
        <CardBox>
          <p className="m-0 text-muted">{t("map.empty")}</p>
        </CardBox>
      )}
      <SectionTitle icon={StatsIcon} title={t("stats.title")}>
        <Note>{t("stats.note")}</Note>
      </SectionTitle>
      <ProfileCharts charts={pilot.charts} />
      <StatTiles stats={pilot.stats} />
      <SectionTitle icon={FlightsIcon} title={t("flights.title")}>
        <Note>{t("flights.note", { count: pilot.stats.flights })}</Note>
      </SectionTitle>
      <PublicFlights handle={pilot.handle} list={flights} cursor={cursor} />
      <p className="mt-8 text-center text-xs text-muted">{t("footer")}</p>
    </SectionMain>
  );
}
