import { useLocale, useTranslations } from "next-intl";
import { Suspense } from "react";
import { PilotMenu } from "../auth/pilot-menu.tsx";
import { LanguageSwitch } from "./language-switch.tsx";

/** Right side of the floating bar: the pilot's menu, with the language and sign out. */
export function TopBar() {
  const t = useTranslations("Site");
  const locale = useLocale();
  return (
    <PilotMenu
      before={
        <Suspense>
          <LanguageSwitch other={locale === "fr" ? "en" : "fr"} label={t("language")} />
        </Suspense>
      }
    />
  );
}
