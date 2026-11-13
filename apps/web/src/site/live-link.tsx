"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "../i18n/navigation.ts";
import { isCurrentPage } from "./current-page.ts";

/**
 * Live flights beside the way in, as a living counter (« ● 12 en vol », bar A of 13/11): a pulsing
 * dot and the number of flights on the live map. Without the number (API down), its plain name.
 * Phones show the dot and the number only.
 */
export function LiveLink({ count }: { count: number | null }) {
  const t = useTranslations("Site");
  const current = isCurrentPage(usePathname(), "/live");
  return (
    <Link
      href="/live"
      aria-current={current ? "page" : undefined}
      aria-label={count === null ? undefined : t("liveCount", { count })}
      className={`inline-flex h-9 items-center gap-2.5 rounded-control bg-success/12 px-3 text-[13.5px] font-medium whitespace-nowrap text-ink transition-colors hover:bg-success/20 ${
        current ? "ring-1 ring-success/50" : ""
      }`}
    >
      <span aria-hidden="true" className="relative flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:animate-none" />
        <span className="relative inline-flex size-2.5 rounded-full bg-success" />
      </span>
      {count === null ? (
        <span className="max-sm:hidden">{t("nav.live")}</span>
      ) : (
        <span aria-hidden="true">
          <b className="font-mono font-semibold text-success">{count}</b>
          <span className="max-sm:hidden"> {t("airborne")}</span>
        </span>
      )}
    </Link>
  );
}
