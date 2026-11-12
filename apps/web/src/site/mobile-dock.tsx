"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "../i18n/navigation.ts";
import { isCurrentPage } from "./current-page.ts";
import { MENU } from "./menu-items.ts";

/** Floating dock at the bottom of phones and small tablets, within reach of the thumb. */
export function MobileDock() {
  const t = useTranslations("Site");
  const pathname = usePathname();
  return (
    <nav
      aria-label={t("mainNav")}
      className="glass fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-[22px] p-1.5 md:hidden"
    >
      <ul className="flex gap-1">
        {MENU.map((item) => {
          const current = isCurrentPage(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                aria-label={t(`nav.${item.label}`)}
                className={`grid h-12 w-15 place-items-center rounded-2xl transition-colors ${
                  current ? "bg-accent text-on-accent" : "text-muted hover:text-ink"
                }`}
              >
                <item.icon size={22} aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
