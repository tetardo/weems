"use client";

import { mdiClose } from "@mdi/js";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "../i18n/navigation.ts";
import { buttonClass } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";
import { Brand } from "./brand.tsx";
import { MENU, type MenuItem } from "./menu-items.ts";

const ITEM_CLASS = "flex min-h-11 items-center gap-3 rounded-[10px] px-3 transition-colors";

/**
 * Side menu in the GameLab look (admin menu: 44 px items, current page filled with the accent),
 * in titled sections: always visible on large screens, opened by the menu button otherwise.
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
          <Icon path={mdiClose} size={20} />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        {MENU.map((section) => (
          <section key={section.title ?? "main"} className="mb-4 last:mb-0">
            {section.title && (
              <h2 className="mx-3 mt-2 mb-1.5 font-sans text-[.75em] font-semibold tracking-wider text-muted uppercase">
                {t(`menu.${section.title}`)}
              </h2>
            )}
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <MenuEntry item={item} onClose={onClose} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
    </aside>
  );
}

/** A page of the site, or an entry planned for a later lot (shown, not clickable). */
function MenuEntry({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const t = useTranslations("Site");
  const pathname = usePathname();
  const content = (
    <>
      <Icon path={item.icon} size={20} />
      {t(`nav.${item.label}`)}
    </>
  );
  if (item.lot !== undefined) {
    return (
      <span
        className={`${ITEM_CLASS} cursor-default text-muted`}
        title={t("planned", { lot: item.lot })}
      >
        {content}
      </span>
    );
  }
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  return (
    <Link
      href={item.href}
      onClick={onClose}
      aria-current={active ? "page" : undefined}
      className={`${ITEM_CLASS} ${
        active
          ? "bg-accent font-semibold text-on-accent"
          : "text-muted hover:bg-accent/14 hover:text-ink"
      }`}
    >
      {content}
    </Link>
  );
}
