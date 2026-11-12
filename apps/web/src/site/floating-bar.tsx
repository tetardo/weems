import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Brand } from "./brand.tsx";
import { ThemeToggle } from "./theme-toggle.tsx";

/**
 * Translucent bar floating above the page: brand, tabs (`nav`, pilot pages only), theme switch,
 * then `account` (the pilot's menu, or the way in on public pages).
 */
export function FloatingBar({ nav, account }: { nav?: ReactNode; account: ReactNode }) {
  const t = useTranslations("Site");
  return (
    <header className="glass sticky top-3 z-30 mx-3 mt-3 flex h-15 items-center gap-2 rounded-[18px] pr-2 pl-3 sm:mx-6 xl:mx-auto xl:w-[1152px]">
      <Brand name={t("name")} />
      {nav}
      <div className={`ml-auto flex items-center gap-1 ${nav ? "md:ml-0" : ""}`}>
        <ThemeToggle />
        {account}
      </div>
    </header>
  );
}
