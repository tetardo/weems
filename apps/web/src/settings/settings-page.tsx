import type { HiddenFlights, MyProfile } from "@weems/contrats";
import { useLocale, useTranslations } from "next-intl";
import { countriesByName } from "../format/countries.ts";
import { Link } from "../i18n/navigation.ts";
import { buttonClass } from "../ui/button.tsx";
import { ExternalIcon, ProfileIcon } from "../ui/icons.ts";
import { SectionMain } from "../ui/section-main.tsx";
import { SectionTitle } from "../ui/section-title.tsx";
import { HiddenFlightsPanel } from "./hidden-flights-panel.tsx";
import { PhotoField } from "./photo-field.tsx";
import { ProfileForm } from "./profile-form.tsx";
import { VisiblePanel } from "./visible-panel.tsx";

/** The /settings/profile page (spec J4): the form in its cards, what is visible and hidden on the right. */
export function SettingsPage({
  profile,
  hidden,
  pilotName,
  siteHost,
}: {
  profile: MyProfile;
  hidden: HiddenFlights;
  pilotName: string;
  siteHost: string;
}) {
  const t = useTranslations("Settings");
  const locale = useLocale();
  return (
    <SectionMain>
      <SectionTitle icon={ProfileIcon} title={t("title")} main>
        {profile.isPublic && profile.handle && (
          <Link href={`/pilots/${profile.handle}`} className={buttonClass("outline")}>
            <ExternalIcon size={16} aria-hidden="true" />
            {t("view")}
          </Link>
        )}
      </SectionTitle>
      <p className="-mt-2 mb-5 text-muted">{t("intro")}</p>
      <div className="grid items-start gap-4 lg:grid-cols-[1.6fr_1fr]">
        <ProfileForm
          profile={profile}
          countries={countriesByName(locale)}
          siteHost={siteHost}
          photo={
            <PhotoField
              hasPhoto={profile.hasPhoto}
              initials={pilotName.slice(0, 1).toUpperCase()}
            />
          }
        />
        <div className="flex flex-col gap-4">
          <VisiblePanel />
          <HiddenFlightsPanel hidden={hidden} />
        </div>
      </div>
    </SectionMain>
  );
}
