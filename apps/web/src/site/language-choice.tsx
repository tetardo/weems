"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Link, usePathname } from "../i18n/navigation.ts";
import { routing } from "../i18n/routing.ts";

function Choices() {
  const t = useTranslations("Site");
  const current = useLocale();
  const pathname = usePathname();
  const query = Object.fromEntries(useSearchParams());
  return (
    <nav aria-label={t("languages")} className="flex gap-0.5 rounded-xl border border-line p-[3px]">
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href={{ pathname, query }}
          locale={locale}
          aria-current={locale === current ? "true" : undefined}
          className={`grid h-9 min-w-9 place-items-center rounded-[9px] px-2 text-[13px] font-semibold uppercase ${
            locale === current ? "bg-surface text-ink shadow-raised" : "text-muted hover:text-ink"
          }`}
        >
          {locale}
        </Link>
      ))}
    </nav>
  );
}

/** FR | EN in the public bar: same page, same filters, in the chosen language. */
export function LanguageChoice() {
  return (
    <Suspense>
      <Choices />
    </Suspense>
  );
}
