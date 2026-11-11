import { useLocale, useTranslations } from "next-intl";
import { Suspense } from "react";
import { PilotMenu } from "../auth/pilot-menu.tsx";
import { Link } from "../i18n/navigation.ts";
import { LanguageSwitch } from "./language-switch.tsx";

/** Top bar of every page: site name, sections, language, pilot. No branding before J4. */
export function SiteHeader() {
  const t = useTranslations("Site");
  const locale = useLocale();
  return (
    <header className="flex items-center gap-6 border-b border-line px-4 py-2 text-sm">
      <Link href="/" className="font-semibold">
        {t("name")}
      </Link>
      <nav className="flex gap-4">
        <Link href="/flights">{t("nav.flights")}</Link>
        <Link href="/live">{t("nav.live")}</Link>
      </nav>
      <Suspense>
        <LanguageSwitch other={locale === "fr" ? "en" : "fr"} label={t("language")} />
      </Suspense>
      <PilotMenu />
    </header>
  );
}
