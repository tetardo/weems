import type { PilotPage, PilotRoutes, PublicFlightList } from "@weems/contrats";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CardBox } from "../ui/card-box.tsx";
import { FlightsIcon, MapIcon, StatsIcon } from "../ui/icons.ts";
import { InfoTip } from "../ui/info-tip.tsx";
import { SectionMain } from "../ui/section-main.tsx";
import { SectionTitle } from "../ui/section-title.tsx";
import { ExperiencePanel } from "./experience-panel.tsx";
import { ProfileCharts } from "./profile-charts.tsx";
import { ProfileHeader } from "./profile-header.tsx";
import type { ProfileLinks } from "./profile-links.ts";
import { PublicFlights } from "./public-flights.tsx";
import { RoutesLegend } from "./routes-legend.tsx";
import { RoutesMap } from "./routes-map.tsx";
import { StatTiles } from "./stat-tiles.tsx";

const Note = ({ children }: { children: string }) => (
  <span className="text-sm text-muted">{children}</span>
);

/** Map of the flights with its legend, or a note while there is none. */
function ProfileMap({ routes }: { routes: PilotRoutes }) {
  const t = useTranslations("Profile");
  const help = useTranslations("Profile.help");
  return routes.routes.length > 0 ? (
    <div className="relative">
      <RoutesMap routes={routes.routes} />
      <RoutesLegend routes={routes.routes} />
      <InfoTip text={help("map")} label={help("label")} />
    </div>
  ) : (
    <CardBox>
      <p className="m-0 text-muted">{t("map.empty")}</p>
    </CardBox>
  );
}

/**
 * A public pilot profile (spec J4), in the order validated on the mock-up: header, map of the
 * flights, statistics (charts then tiles), experience by aircraft category, flights. Companies
 * (lot 3) and medals (beside the experience) come later: no empty block until then.
 * Also the pilot's own logbook (`links`, and `notice` under the header).
 */
export function ProfilePage({
  pilot,
  links,
  routes,
  flights,
  cursor,
  notice,
}: {
  pilot: PilotPage;
  links: ProfileLinks;
  routes: PilotRoutes;
  flights: PublicFlightList;
  cursor: string | undefined;
  notice?: ReactNode;
}) {
  const t = useTranslations("Profile");
  return (
    <SectionMain>
      <ProfileHeader pilot={pilot} links={links} />
      {notice}
      <SectionTitle icon={MapIcon} title={t("map.title")}>
        <Note>
          {t("map.note", { airports: pilot.stats.airports, flights: pilot.stats.flights })}
        </Note>
      </SectionTitle>
      <ProfileMap routes={routes} />
      <SectionTitle icon={StatsIcon} title={t("stats.title")}>
        <Note>{t("stats.note")}</Note>
      </SectionTitle>
      <ProfileCharts charts={pilot.charts} />
      <StatTiles stats={pilot.stats} />
      <ExperiencePanel experience={pilot.stats.experience} />
      <SectionTitle icon={FlightsIcon} title={t("flights.title")}>
        <Note>{t("flights.note", { count: pilot.stats.flights })}</Note>
      </SectionTitle>
      <PublicFlights links={links} list={flights} cursor={cursor} />
      <p className="mt-8 text-center text-xs text-muted">{t("footer")}</p>
    </SectionMain>
  );
}
