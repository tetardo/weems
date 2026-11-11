"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "../i18n/navigation.ts";
import { buttonClass } from "../ui/button.tsx";
import { CloseIcon } from "../ui/icons.ts";
import { Brand } from "./brand.tsx";
import { MENU, type MenuItem } from "./menu-items.ts";

/**
 * Side menu in the GameLab look (admin menu: 44 px items, current page filled with the accent),
 * always visible on large screens, opened by the menu button otherwise.
 */
export function AsideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("Site");
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
          <CloseIcon size={20} aria-hidden="true" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        {MENU.map((section) => (
          <div key={section.title ?? "main"}>
            {section.title && (
              <p className="mx-3 mt-4 mb-1.5 text-xs tracking-wider text-muted uppercase">
                {t(`nav.${section.title}`)}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <MenuEntry item={item} onClose={onClose} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

/** A page of the site; the current one is filled with the accent. */
function MenuEntry({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const t = useTranslations("Site");
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  return (
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
      <item.icon size={20} aria-hidden="true" />
      {t(`nav.${item.label}`)}
    </Link>
  );
}
