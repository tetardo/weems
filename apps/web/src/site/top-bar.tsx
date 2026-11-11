import { useLocale, useTranslations } from "next-intl";
import { Suspense } from "react";
import { PilotMenu } from "../auth/pilot-menu.tsx";
import { LanguageSwitch } from "./language-switch.tsx";

/** Button to the same page in the other language (top bar of every page). */
export function OtherLanguage() {
  const t = useTranslations("Site");
  const locale = useLocale();
  return (
    <Suspense>
      <LanguageSwitch other={locale === "fr" ? "en" : "fr"} label={t("language")} />
    </Suspense>
  );
}

/** Right side of the top bar: language, then the pilot and the sign-out button. */
export function TopBar() {
  return (
    <>
      <OtherLanguage />
      <PilotMenu />
    </>
  );
}
