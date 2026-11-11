import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getHiddenFlights, getMyProfile } from "../../../../../api/profile-api.ts";
import { currentPilot } from "../../../../../auth/server-session.ts";
import { SettingsPage } from "../../../../../settings/settings-page.tsx";
import { ApiUnavailable } from "../../../../../api/api-request.ts";
import { apiFallback } from "../../../../../site/api-fallback.tsx";
import { siteUrl } from "../../../../../site/site-url.ts";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "Settings" });
  return { title: t("title") };
}

/** Spec J4 profil public: the pilot's settings of their public profile. */
export default async function SettingsRoute({ params }: Props) {
  setRequestLocale((await params).locale);
  try {
    const [profile, hidden, pilot] = await Promise.all([
      getMyProfile(),
      getHiddenFlights(),
      currentPilot(),
    ]);
    if (!profile) throw new ApiUnavailable("/v1/me/profile", new Error("no profile"));
    return (
      <SettingsPage
        profile={profile}
        hidden={hidden}
        pilotName={pilot?.name ?? ""}
        siteHost={siteUrl().host}
      />
    );
  } catch (error) {
    return apiFallback(error);
  }
}
