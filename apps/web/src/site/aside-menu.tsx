"use client";

import { mdiBookOpenPageVariantOutline, mdiClose, mdiRadar } from "@mdi/js";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "../i18n/navigation.ts";
import { buttonClass } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";
import { Brand } from "./brand.tsx";

const ITEMS = [
  { href: "/flights", label: "nav.flights", icon: mdiBookOpenPageVariantOutline },
  { href: "/live", label: "nav.live", icon: mdiRadar },
] as const;

/**
 * Side menu in the GameLab look (admin menu: 44 px items, current page filled with the accent):
 * always visible on large screens, opened by the menu button of the top bar otherwise.
 */
export function AsideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("Site");
  const pathname = usePathname();
  return (
    <aside
      className={`fixed top-0 z-40 flex h-screen w-60 flex-col border-r border-line bg-surface transition-[left] lg:left-0 ${open ? "left-0" : "-left-60"}`}
    >
      <div className="flex h-13 flex-none items-center justify-between border-b border-line px-3">
        <Brand name={t("name")} />
        <button
          type="button"
          className={`${buttonClass("ghost")} lg:hidden`}
          onClick={onClose}
          aria-label={t("closeMenu")}
        >
          <Icon path={mdiClose} size={20} />
        </button>
      </div>
      <ul className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 transition-colors ${
                  active
                    ? "bg-accent font-semibold text-on-accent"
                    : "text-muted hover:bg-accent/14 hover:text-ink"
                }`}
              >
                <Icon path={item.icon} size={20} />
                {t(item.label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
