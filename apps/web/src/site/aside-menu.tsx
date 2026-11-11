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
      className={`fixed top-0 z-40 flex h-screen w-64 flex-col bg-[#f8f9fa] p-4 transition-[left] xl:left-0 ${open ? "left-0" : "-left-72"}`}
    >
      <div className="mb-4 flex h-14 items-center justify-between border-b border-[#e9ecef] px-4 text-[#344767]">
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
                className={`mb-1 flex items-center rounded-lg px-3 py-2.5 text-sm ${active ? "bg-white font-semibold text-[#344767] shadow-soft" : "text-[#67748e] hover:text-[#344767]"}`}
              >
                <Icon
                  path={item.icon}
                  size={16}
                  className={`mr-3 h-8 w-8 flex-none rounded-lg shadow-soft-sm ${active ? "bg-gradient-fuchsia text-white" : "bg-white text-[#344767]"}`}
                />
                <span className="grow">{t(item.label)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
