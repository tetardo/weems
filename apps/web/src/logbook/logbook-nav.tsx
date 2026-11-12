"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "../i18n/navigation.ts";
import { isLogbookPage, LOGBOOK_PAGES } from "./logbook-pages.ts";

const SIDE = "flex h-10 items-center gap-2.5 rounded-control px-2.5 font-medium";
const TAB =
  "flex flex-1 items-center justify-center rounded-inner px-1 py-2 text-[13.5px] font-medium whitespace-nowrap";

/**
 * Pages of the logbook: a column on large screens, tabs under the bar on phones. A page still to
 * come is greyed with « bientôt ».
 */
export function LogbookNav({ variant }: { variant: "side" | "tabs" }) {
  const t = useTranslations("Logbook.nav");
  const pathname = usePathname();
  return LOGBOOK_PAGES.map(({ href, label, icon: Icon, soon }) => {
    const current = isLogbookPage(pathname, href);
    const look = variant === "side" ? SIDE : TAB;
    if (soon)
      return (
        <span
          key={href}
          className={`${look} cursor-default text-muted opacity-60`}
          title={t("soon")}
        >
          {variant === "side" && <Icon size={18} aria-hidden="true" />}
          {t(label)}
          {variant === "side" && <small className="ml-auto text-[11px]">{t("soon")}</small>}
        </span>
      );
    return (
      <Link
        key={href}
        href={href}
        aria-current={current ? "page" : undefined}
        className={`${look} ${current ? "bg-accent/12 text-link" : "text-muted hover:text-ink"}`}
      >
        {variant === "side" && <Icon size={18} aria-hidden="true" />}
        {t(label)}
      </Link>
    );
  });
}
