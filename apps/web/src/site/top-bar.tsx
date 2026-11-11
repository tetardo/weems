import { useLocale, useTranslations } from "next-intl";
import { Suspense } from "react";
import { PilotMenu } from "../auth/pilot-menu.tsx";
import { Link } from "../i18n/navigation.ts";
import { buttonClass } from "../ui/button.tsx";
import { ProfileIcon } from "../ui/icons.ts";
import { LanguageSwitch } from "./language-switch.tsx";

/** Button to the same page in the other language (pilot's menu, public bar). */
export function OtherLanguage() {
  const t = useTranslations("Site");
  const locale = useLocale();
  return (
    <Suspense>
      <LanguageSwitch other={locale === "fr" ? "en" : "fr"} label={t("language")} />
    </Suspense>
  );
}

/** Right side of the floating bar: the pilot's menu, with the public profile, language, sign out. */
export function TopBar() {
  const t = useTranslations("Site.nav");
  return (
    <PilotMenu
      before={
        <>
          <Link href="/settings/profile" className={buttonClass("ghost")}>
            <ProfileIcon size={20} aria-hidden="true" />
            {t("profile")}
          </Link>
          <OtherLanguage />
        </>
      }
    />
  );
}
