"use client";

import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "../i18n/navigation.ts";
import type { Locale } from "../i18n/routing.ts";
import { buttonClass } from "../ui/button.tsx";
import { LanguageIcon } from "../ui/icons.ts";

/** Same page, same filters, in the other language. */
export function LanguageSwitch({ other, label }: { other: Locale; label: string }) {
  const pathname = usePathname();
  const query = Object.fromEntries(useSearchParams());
  return (
    <Link href={{ pathname, query }} locale={other} className={buttonClass("ghost")}>
      <LanguageIcon size={20} aria-hidden="true" />
      {label}
    </Link>
  );
}
