"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "../i18n/navigation.ts";
import { DepartureIcon } from "../ui/icons.ts";
import { isCurrentPage } from "./current-page.ts";

/**
 * Page Boarding beside the live counter, in the same pill (Greg, 13/11), in amber (accent-2) like
 * the boards. Phones: the icon alone (the page is also in the menu).
 */
export function BoardingLink() {
  const t = useTranslations("Site");
  const current = isCurrentPage(usePathname(), "/boarding");
  return (
    <Link
      href="/boarding"
      aria-current={current ? "page" : undefined}
      className={`inline-flex h-9 items-center gap-2 rounded-control bg-accent-2/12 px-3 text-[13.5px] font-medium whitespace-nowrap text-ink transition-colors hover:bg-accent-2/20 max-sm:px-2.5 ${
        current ? "ring-1 ring-accent-2/60" : ""
      }`}
    >
      <DepartureIcon size={16} aria-hidden="true" className="text-accent-2" />
      <span className="max-sm:sr-only">{t("nav.boarding")}</span>
    </Link>
  );
}
