import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { getPilotRoutes, getPublicPilot } from "../../../../../api/public-api.ts";
import { SHARE_SIZE, ShareImage } from "../../../../../profile/share-image.tsx";
import { siteUrl } from "../../../../../site/site-url.ts";

export const size = SHARE_SIZE;
export const contentType = "image/png";

interface Props {
  params: Promise<{ locale: string; handle: string }>;
}

/** Share image of a public profile (spec J4): drawn by Next.js, no external service. */
export default async function Image({ params }: Props) {
  const { locale, handle } = await params;
  const [pilot, routes] = await Promise.all([getPublicPilot(handle), getPilotRoutes(handle)]);
  if (!pilot) notFound();
  const t = await getTranslations({ locale, namespace: "Profile" });
  const subtitle = [
    pilot.level ? t(`levels.${pilot.level}`) : null,
    pilot.homeIcao ? t("share.base", { icao: pilot.homeIcao }) : null,
  ].filter(Boolean);
  const { flights, airborneS, airports } = pilot.stats;
  const site = siteUrl();
  return new ImageResponse(
    <ShareImage
      card={{
        name: pilot.name,
        subtitle: subtitle.join(" · "),
        stats: [
          { value: String(flights), label: t("share.flights", { count: flights }) },
          { value: `${Math.round(airborneS / 3600)} h`, label: t("share.hours") },
          { value: String(airports), label: t("share.airports", { count: airports }) },
        ],
        routes: routes?.routes ?? [],
        address: `${site.host}/pilots/${pilot.handle}`,
      }}
    />,
    SHARE_SIZE,
  );
}
