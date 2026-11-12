import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import {
  getMyLogbook,
  getMyLogbookFlights,
  getMyLogbookRoutes,
} from "../../../../api/logbook-api.ts";
import { LogbookNotice } from "../../../../profile/logbook-notice.tsx";
import { logbookLinks } from "../../../../profile/profile-links.ts";
import { ProfilePage } from "../../../../profile/profile-page.tsx";
import { apiFallback } from "../../../../site/api-fallback.tsx";
import { pageTitle } from "../../../../site/page-title.ts";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const generateMetadata = pageTitle("Logbook");

/**
 * « Mon carnet de bord »: the pilot's public page, seen by them even while it is not public
 * (preview). Landing page after login.
 */
export default async function LogbookPage({ params, searchParams }: Props) {
  setRequestLocale((await params).locale);
  const cursor = (await searchParams)["cursor"];
  const page = typeof cursor === "string" ? cursor : undefined;
  try {
    const [pilot, routes, flights] = await Promise.all([
      getMyLogbook(),
      getMyLogbookRoutes(),
      getMyLogbookFlights(page),
    ]);
    if (!pilot || !routes || !flights) notFound();
    const publicHandle = pilot.isPublic ? pilot.handle : null;
    return (
      <ProfilePage
        pilot={pilot}
        links={logbookLinks(publicHandle)}
        routes={routes}
        flights={flights}
        cursor={page}
        notice={<LogbookNotice publicHandle={publicHandle} />}
      />
    );
  } catch (error) {
    return apiFallback(error);
  }
}
