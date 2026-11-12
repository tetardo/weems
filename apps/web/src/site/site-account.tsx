import { useTranslations } from "next-intl";
import { buttonClass } from "@weems/ui";
import { PilotMenu } from "../auth/pilot-menu.tsx";
import { Link } from "../i18n/navigation.ts";
import { AccountIcon, ProfileIcon, ProIcon } from "../ui/icons.ts";
import { LiveLink } from "./live-link.tsx";
import { promoClass } from "./promo-button.ts";

const iconButton = `${buttonClass("ghost")} border border-line px-0`;

/** A visitor's way in: the Pilot Pro offer, live flights (large screens), the silhouette to log in. */
function VisitorAccess() {
  const t = useTranslations("Site.public");
  return (
    <>
      <Link href="/plans" className={`${promoClass} max-md:hidden`}>
        <ProIcon size={17} aria-hidden="true" />
        {t("pilotPro")}
      </Link>
      <LiveLink />
      <Link href="/login" className={iconButton} aria-label={t("login")} title={t("login")}>
        <AccountIcon size={20} aria-hidden="true" />
      </Link>
    </>
  );
}

/** Entry of the pilot's menu towards the settings of the public profile. */
function ProfileLink() {
  const t = useTranslations("Site.nav");
  return (
    <Link href="/settings/profile" className={buttonClass("ghost")}>
      <ProfileIcon size={20} aria-hidden="true" />
      {t("profile")}
    </Link>
  );
}

/**
 * Account side of the bar: the way in for a visitor, live flights and the pilot's menu (photo, or
 * initial) once logged in.
 */
export function SiteAccount({ loggedIn }: { loggedIn: boolean }) {
  if (!loggedIn) return <VisitorAccess />;
  return (
    <>
      <LiveLink />
      <PilotMenu before={<ProfileLink />} />
    </>
  );
}
