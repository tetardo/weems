import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Brand } from "./brand.tsx";

interface Props {
  /** The links group after the logo (mr-auto: the right side stays at the end). */
  nav: ReactNode;
  /** Right side: the way in or the pilot's menu, the theme, the language, the phone menu. */
  account: ReactNode;
}

/** Translucent bar floating above the page (decision 003), without inner frames (bar A, 13/11). */
export function FloatingBar({ nav, account }: Props) {
  const t = useTranslations("Site");
  return (
    <header className="glass sticky top-3 z-30 mx-3 mt-3 flex h-15 items-center gap-2 rounded-panel pr-2 pl-3 sm:mx-6 xl:mx-auto xl:w-[1152px]">
      <Brand name={t("name")} />
      {nav}
      <div className="ml-auto flex items-center gap-1.5 md:ml-0">{account}</div>
    </header>
  );
}
