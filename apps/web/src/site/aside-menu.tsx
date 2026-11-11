"use client";

import { mdiBookOpenPageVariant, mdiClose, mdiRadar } from "@mdi/js";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "../i18n/navigation.ts";
import { Icon } from "../ui/icon.tsx";

const ITEMS = [
  { href: "/flights", label: "nav.flights", icon: mdiBookOpenPageVariant },
  { href: "/live", label: "nav.live", icon: mdiRadar },
] as const;

/**
 * Dark side menu of the Admin One template: always visible on large screens,
 * opened by the menu button of the top bar otherwise.
 */
export function AsideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("Site");
  const pathname = usePathname();
  return (
    <aside
      className={`fixed top-0 z-40 flex h-screen w-60 flex-col bg-gray-800 transition-[left] xl:left-0 ${open ? "left-0" : "-left-60"}`}
    >
      <div className="flex h-14 items-center justify-between bg-gray-900 px-6 text-white">
        <Link href="/flights" className="font-black" onClick={onClose}>
          {t("name")}
        </Link>
        <button type="button" className="xl:hidden" onClick={onClose} aria-label={t("closeMenu")}>
          <Icon path={mdiClose} />
        </button>
      </div>
      <ul className="flex-1 overflow-y-auto">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onClose}
                className={`flex py-3 ${active ? "font-bold text-white" : "text-gray-300 hover:text-white"}`}
              >
                <Icon path={item.icon} className="w-16 flex-none" />
                <span className="grow">{t(item.label)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
