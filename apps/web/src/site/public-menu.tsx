"use client";

import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { buttonClass } from "@weems/ui";
import { Link } from "../i18n/navigation.ts";
import { CloseIcon, FlightsIcon, MenuIcon } from "../ui/icons.ts";
import { useDismiss } from "../ui/use-dismiss.ts";
import { PUBLIC_LINKS } from "./public-nav.tsx";

const ROW = "flex h-12 items-center gap-3 rounded-xl px-3.5 font-medium text-ink hover:bg-surface";

/**
 * Menu button of the public bar under 768 px: the links of the bar, then « Créer un compte » for
 * a visitor or « Mes vols » for a logged-in pilot.
 */
export function PublicMenu({ loggedIn }: { loggedIn: boolean }) {
  const t = useTranslations("Site.public");
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
        aria-label={t(open ? "closeMenu" : "menu")}
        className={`${buttonClass("ghost")} text-muted hover:text-ink`}
      >
        <Icon size={22} aria-hidden="true" />
      </button>
      {open && (
        <div className="fixed inset-x-3 top-[76px] border border-line bg-surface shadow-floating z-30 flex flex-col gap-0.5 rounded-[18px] p-2 sm:inset-x-6">
          {PUBLIC_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={close} className={ROW}>
              <link.icon size={20} aria-hidden="true" />
              {t(link.label)}
            </Link>
          ))}
          {loggedIn ? (
            <Link href="/flights" onClick={close} className={ROW}>
              <FlightsIcon size={20} aria-hidden="true" />
              {t("flights")}
            </Link>
          ) : (
            <Link href="/signup" onClick={close} className={`${buttonClass("primary")} m-1 mt-2`}>
              {t("signup")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
