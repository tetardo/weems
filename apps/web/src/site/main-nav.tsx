"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "../i18n/navigation.ts";
import { isCurrentPage } from "./current-page.ts";
import { MENU } from "./menu-items.ts";

/** Tabs of the floating bar on large screens (segmented control, current page raised). */
export function MainNav() {
  const t = useTranslations("Site");
  const pathname = usePathname();
  return (
    <nav aria-label={t("mainNav")} className="mx-auto max-md:hidden">
      <ul className="flex gap-0.5 rounded-xl border border-line bg-bg/60 p-1">
        {MENU.map((item) => {
          const current = isCurrentPage(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`flex h-9 items-center gap-2 rounded-[9px] px-3.5 text-sm font-medium transition-colors ${
                  current ? "bg-surface text-ink shadow-raised" : "text-muted hover:text-ink"
                }`}
              >
                <item.icon size={17} aria-hidden="true" />
                {t(`nav.${item.label}`)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
