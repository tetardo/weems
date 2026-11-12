import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPilotRoutes, getPublicFlights, getPublicPilot } from "../../../../../api/public-api.ts";
import { publicPageMetadata } from "../../../../../profile/page-metadata.ts";
import { publicProfileLinks } from "../../../../../profile/profile-links.ts";
import { ProfilePage } from "../../../../../profile/profile-page.tsx";
import { apiFallback } from "../../../../../site/api-fallback.tsx";

interface Props {
  params: Promise<{ locale: string; handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, handle } = await params;
  const t = await getTranslations({ locale, namespace: "Profile.meta" });
  try {
    const pilot = await getPublicPilot(handle);
    if (!pilot) return {};
    const { flights, airports } = pilot.stats;
    return publicPageMetadata({
      locale,
      path: `/pilots/${pilot.handle}`,
      title: t("title", { name: pilot.name, flights }),
      description: t("description", { name: pilot.name, flights, airports }),
    });
  } catch {
    return {};
  }
}

/** A public pilot profile (spec J4): open without an account, 404 when off or unknown. */
export default async function PilotRoute({ params, searchParams }: Props) {
  const { locale, handle } = await params;
  setRequestLocale(locale);
  const cursor = (await searchParams)["cursor"];
  const page = typeof cursor === "string" ? cursor : undefined;
  try {
    const [pilot, routes, flights] = await Promise.all([
      getPublicPilot(handle),
      getPilotRoutes(handle),
      getPublicFlights(handle, page),
    ]);
    if (!pilot || !routes || !flights) notFound();
    return (
      <ProfilePage
        pilot={pilot}
        links={publicProfileLinks(pilot.handle)}
        routes={routes}
        flights={flights}
        cursor={page}
      />
    );
  } catch (error) {
    return apiFallback(error);
  }
}
