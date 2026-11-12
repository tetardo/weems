import { useTranslations } from "next-intl";
import { buttonClass } from "@weems/ui";
import { PilotMenu } from "../auth/pilot-menu.tsx";
import { Link } from "../i18n/navigation.ts";
import { AccountIcon, ProfileIcon } from "../ui/icons.ts";

const iconButton = `${buttonClass("ghost")} border border-line px-0`;

/** A visitor's way in: « Créer un compte » (large screens) and the silhouette to log in. */
function VisitorAccess() {
  const t = useTranslations("Site.public");
  return (
    <>
      <Link href="/signup" className={`${buttonClass("primary")} max-md:hidden`}>
        {t("signup")}
      </Link>
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

/** Account side of the bar: the way in for a visitor, the pilot's menu (initial) once logged in. */
export function SiteAccount({ loggedIn }: { loggedIn: boolean }) {
  return loggedIn ? <PilotMenu before={<ProfileLink />} /> : <VisitorAccess />;
}
