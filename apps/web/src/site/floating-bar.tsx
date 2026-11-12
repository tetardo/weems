import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Brand } from "./brand.tsx";

interface Props {
  /**
   * Pilot pages: the tabs, centred (mx-auto). Public pages: the links group after the logo
   * (mr-auto). Either way it takes the free space: the right side stays at the end.
   */
  nav?: ReactNode;
  /** Right side: the pilot's menu, or the way in and the settings of public pages. */
  account: ReactNode;
  /** Home page: the bar floats over the full-screen image instead of pushing it down. */
  overlay?: boolean;
}

/** Translucent bar floating above the page (decision 003). */
export function FloatingBar({ nav, account, overlay = false }: Props) {
  const t = useTranslations("Site");
  const position = overlay ? "fixed inset-x-0 top-3" : "sticky top-3 mt-3";
  return (
    <header
      className={`glass ${position} z-30 mx-3 flex h-15 items-center gap-2 rounded-[18px] pr-2 pl-3 sm:mx-6 xl:mx-auto xl:w-[1152px]`}
    >
      <Brand name={t("name")} />
      {nav}
      <div className={`ml-auto flex items-center gap-1 ${nav ? "md:ml-0" : ""}`}>{account}</div>
    </header>
  );
}
