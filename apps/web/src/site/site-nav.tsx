"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "../i18n/navigation.ts";
import { isCurrentPage } from "./current-page.ts";
import { navFor } from "./menu-items.ts";

/**
 * Links after the logo, without frames (bar A « Épurée », 13/11): the page being read is lit and
 * underlined by a line of light along the bottom of the bar (phones: the menu, site-menu.tsx).
 */
export function SiteNav({ loggedIn }: { loggedIn: boolean }) {
  const t = useTranslations("Site");
  const pathname = usePathname();
  return (
    <nav aria-label={t("mainNav")} className="mr-auto ml-4 self-stretch max-md:hidden">
      <ul className="flex h-full gap-1">
        {navFor(loggedIn).map((item) => {
          const current = isCurrentPage(pathname, item.href);
          return (
            <li key={item.href} className="h-full">
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`relative flex h-full items-center gap-2 px-3 text-sm font-medium transition-colors ${
                  current ? "nav-current text-ink [&>svg]:text-accent" : "text-muted hover:text-ink"
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
