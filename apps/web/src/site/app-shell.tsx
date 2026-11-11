"use client";

import { mdiMenu } from "@mdi/js";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { Icon } from "../ui/icon.tsx";
import { AsideMenu } from "./aside-menu.tsx";

/**
 * Frame of the pages of a logged-in pilot (Admin One layout): side menu, top bar, content.
 * `topBar`: right side of the top bar (language, pilot), rendered by the server.
 */
export function AppShell({ topBar, children }: { topBar: ReactNode; children: ReactNode }) {
  const t = useTranslations("Site");
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pt-14 xl:pl-60">
      <nav className="fixed inset-x-0 top-0 z-30 flex h-14 items-stretch bg-gray-50 xl:pl-60">
        <button
          type="button"
          className="flex items-center px-3 xl:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label={t("openMenu")}
        >
          <Icon path={mdiMenu} size={24} />
        </button>
        <div className="ml-auto flex items-stretch">{topBar}</div>
      </nav>
      <AsideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/60 xl:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
