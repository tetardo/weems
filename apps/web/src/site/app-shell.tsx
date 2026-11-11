import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Brand } from "./brand.tsx";
import { MainNav } from "./main-nav.tsx";

/**
 * Frame of the pages of a logged-in pilot (GameLab look): a single 52 px top bar with the
 * name, the pages and, on the right, `topBar` (language, pilot), rendered by the server.
 */
export function AppShell({ topBar, children }: { topBar: ReactNode; children: ReactNode }) {
  const t = useTranslations("Site");
  return (
    <div className="flex min-h-screen flex-col bg-bg pt-13">
      <nav className="fixed inset-x-0 top-0 z-30 flex h-13 items-center gap-1.5 border-b border-line bg-surface px-3 text-sm">
        <Brand name={t("name")} />
        <span className="mx-1 h-6 w-px bg-line max-sm:hidden" />
        <MainNav />
        <div className="ml-auto flex items-center gap-1">{topBar}</div>
      </nav>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
