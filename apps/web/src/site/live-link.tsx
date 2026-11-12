"use client";

import { useTranslations } from "next-intl";
import { buttonClass } from "@weems/ui";
import { Link, usePathname } from "../i18n/navigation.ts";
import { isCurrentPage } from "./current-page.ts";

/** « Vols en direct » beside the way in (large screens), with a pulsing dot: something is live. */
export function LiveLink() {
  const t = useTranslations("Site.nav");
  const current = isCurrentPage(usePathname(), "/live");
  return (
    <Link
      href="/live"
      aria-current={current ? "page" : undefined}
      className={`${buttonClass("ghost")} border border-line text-sm max-md:hidden ${current ? "bg-surface text-ink shadow-raised" : "text-muted hover:text-ink"}`}
    >
      <span aria-hidden="true" className="relative flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:animate-none" />
        <span className="relative inline-flex size-2.5 rounded-full bg-success" />
      </span>
      {t("live")}
    </Link>
  );
}
