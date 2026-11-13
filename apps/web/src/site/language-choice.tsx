"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { buttonClass } from "@weems/ui";
import { Link, usePathname } from "../i18n/navigation.ts";
import { routing } from "../i18n/routing.ts";
import { LanguageIcon } from "../ui/icons.ts";
import { nextLocale } from "./next-locale.ts";

function Switch({ className }: { className: string }) {
  const t = useTranslations("Site");
  const current = useLocale();
  const pathname = usePathname();
  const query = Object.fromEntries(useSearchParams());
  const target = nextLocale(routing.locales, current);
  const label = t("switchLanguage", { name: t(`languageNames.${target}`) });
  return (
    <Link
      href={{ pathname, query }}
      locale={target}
      aria-label={label}
      title={label}
      className={`${buttonClass("ghost")} gap-1.5 px-2.5 text-[13px] font-semibold text-muted uppercase hover:text-ink ${className}`}
    >
      <LanguageIcon size={17} aria-hidden="true" />
      {current}
    </Link>
  );
}

/** One button for the language (bar A, 13/11): shows the current one, opens the same page in the next. */
export function LanguageChoice({ className = "" }: { className?: string }) {
  return (
    <Suspense>
      <Switch className={className} />
    </Suspense>
  );
}
