import { useTranslations } from "next-intl";
import { buttonClass } from "@weems/ui";
import { PilotMenu } from "../auth/pilot-menu.tsx";
import { Link } from "../i18n/navigation.ts";
import { AccountIcon, ProfileIcon, ProIcon } from "../ui/icons.ts";
import { promoTextClass } from "./promo-button.ts";
import { TestPlanSlot } from "./test-plan-slot.tsx";

/** The Pilot Pro offer of a visitor's bar, towards the offers (large screens; phones: the menu). */
export function VisitorOffer() {
  const t = useTranslations("Site.public");
  return (
    <Link href="/plans" className={`${promoTextClass} max-md:hidden`}>
      <ProIcon size={16} aria-hidden="true" />
      {t("pilotPro")}
    </Link>
  );
}

/** A visitor's way in: « Se connecter », the silhouette alone on phones. */
function LoginLink() {
  const t = useTranslations("Site.public");
  return (
    <Link
      href="/login"
      className="inline-flex h-9 items-center gap-2 rounded-control bg-ink px-3.5 text-[13.5px] font-semibold whitespace-nowrap text-bg transition-opacity hover:opacity-90 max-md:px-2.5"
    >
      <AccountIcon size={18} aria-hidden="true" className="md:hidden" />
      <span className="max-md:sr-only">{t("login")}</span>
    </Link>
  );
}

/** Entry of the pilot's menu towards the settings of the public profile (« Mon profil »). */
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
 * Account end of the bar: « Se connecter » for a visitor, the pilot's menu (photo, or initial) once
 * logged in, with the Free | Pro test switch inside it (outside production).
 */
export function SiteAccount({ loggedIn }: { loggedIn: boolean }) {
  if (!loggedIn) return <LoginLink />;
  return (
    <PilotMenu
      before={
        <>
          <ProfileLink />
          <TestPlanSlot labelled className="flex items-center justify-between! gap-3 px-3 py-1.5" />
        </>
      }
    />
  );
}
