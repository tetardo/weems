"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { buttonClass } from "../ui/button.tsx";
import { MenuIcon } from "../ui/icons.ts";
import { AsideMenu } from "./aside-menu.tsx";

/**
 * Frame of the pages of a logged-in pilot (GameLab look): side menu, 52 px top bar, content.
 * `topBar`: right side of the top bar (language, pilot), rendered by the server.
 */
export function AppShell({ topBar, children }: { topBar: ReactNode; children: ReactNode }) {
  const t = useTranslations("Site");
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="flex min-h-screen flex-col bg-bg pt-13 lg:pl-60">
      <nav className="fixed inset-x-0 top-0 z-30 flex h-13 items-center gap-1 border-b border-line bg-surface px-3 text-sm lg:pl-63">
        <button
          type="button"
          className={`${buttonClass("ghost")} lg:hidden`}
          onClick={() => setMenuOpen(true)}
          aria-label={t("openMenu")}
        >
          <MenuIcon size={22} aria-hidden="true" />
        </button>
        <div className="ml-auto flex items-center gap-1">{topBar}</div>
      </nav>
      <AsideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-[rgb(5_8_15/.6)] lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
