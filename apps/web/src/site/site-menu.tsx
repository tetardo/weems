"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useCallback, useRef, useState } from "react";
import { buttonClass } from "@weems/ui";
import { Link, usePathname } from "../i18n/navigation.ts";
import { CloseIcon, MenuIcon } from "../ui/icons.ts";
import { useDismiss } from "../ui/use-dismiss.ts";
import { isCurrentPage } from "./current-page.ts";
import { menuFor } from "./menu-items.ts";

const ROW = "flex h-12 items-center gap-3 rounded-box px-3.5 font-medium hover:bg-surface";

interface Props {
  loggedIn: boolean;
  /** Bottom of the menu: the Free | Pro test switch, which has no room in the phone bar. */
  footer?: ReactNode;
}

/** Menu button of the bar under 768 px: the links of the bar, then « Créer un compte » for a visitor. */
export function SiteMenu({ loggedIn, footer }: Props) {
  const t = useTranslations("Site");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  const Icon = open ? CloseIcon : MenuIcon;
  return (
    <div ref={ref} className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={t(open ? "public.closeMenu" : "public.menu")}
        className={`${buttonClass("ghost")} text-muted hover:text-ink`}
      >
        <Icon size={22} aria-hidden="true" />
      </button>
      {open && (
        <nav
          aria-label={t("mainNav")}
          className="fixed inset-x-3 top-[76px] z-30 flex flex-col gap-0.5 rounded-panel border border-line bg-surface p-2 shadow-floating sm:inset-x-6"
        >
          {menuFor(loggedIn).map((item) => {
            const current = isCurrentPage(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                aria-current={current ? "page" : undefined}
                className={`${ROW} ${current ? "text-accent" : "text-ink"}`}
              >
                <item.icon size={20} aria-hidden="true" />
                {t(`nav.${item.label}`)}
              </Link>
            );
          })}
          {!loggedIn && (
            <Link href="/signup" onClick={close} className={`${buttonClass("primary")} m-1 mt-2`}>
              {t("public.signup")}
            </Link>
          )}
          {footer}
        </nav>
      )}
    </div>
  );
}
