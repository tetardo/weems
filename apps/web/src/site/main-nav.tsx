"use client";

import { mdiBookOpenPageVariantOutline, mdiRadar } from "@mdi/js";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "../i18n/navigation.ts";
import { Icon } from "../ui/icon.tsx";

const ITEMS = [
  { href: "/flights", label: "nav.flights", icon: mdiBookOpenPageVariantOutline },
  { href: "/live", label: "nav.live", icon: mdiRadar },
] as const;

/** Pages of the site, as buttons of the top bar (GameLab bar); icons only on phones. */
export function MainNav() {
  const t = useTranslations("Site");
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-1">
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={t(item.label)}
              className={`flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-[10px] px-3 font-medium transition-colors ${
                active ? "bg-accent/14 text-link" : "text-muted hover:bg-ink/9 hover:text-ink"
              }`}
            >
              <Icon path={item.icon} size={20} />
              <span className="max-sm:sr-only">{t(item.label)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
