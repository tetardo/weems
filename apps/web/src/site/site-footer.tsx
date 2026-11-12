import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.ts";

/** Pages not written yet (spec J4 accueil): the links are there, the pages will follow. */
const LINKS = ["legal", "terms", "privacy", "contact"] as const;

function Separator() {
  return (
    <span aria-hidden="true" className="opacity-50">
      ·
    </span>
  );
}

/** Footer P2 of the public pages: one centred line, no border; « Découvrir Weems » for everyone. */
export function SiteFooter() {
  const t = useTranslations("Site.footer");
  return (
    <footer className="flex min-h-[38px] flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 px-4 py-2 text-xs text-muted">
      <span>{t("copyright", { year: new Date().getFullYear() })}</span>
      <span className="flex items-center gap-2.5">
        <Separator />
        <Link href="/discover" className="hover:text-ink">
          {t("discover")}
        </Link>
      </span>
      {LINKS.map((link) => (
        <span key={link} className="flex items-center gap-2.5">
          <Separator />
          <a href="#" className="hover:text-ink">
            {t(link)}
          </a>
        </span>
      ))}
    </footer>
  );
}
